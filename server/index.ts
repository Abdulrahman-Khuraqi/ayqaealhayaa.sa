import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import Stripe from 'stripe';
import {
  attachStripeSession,
  createPendingOrder,
  ensureStoreSchema,
  getOrder,
  getProductsByIds,
  listProducts,
  markCheckoutComplete,
  markPaymentIntentOutcome,
  recordCheckoutProcessing,
  type OrderLine,
} from './db';

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const previewOrigin = 'https://8328-i2m5rjw3er9df5jaa4mp8-9cd5dfdf.us5.manus.computer';

function resolveCheckoutOrigin(originHeader: string | undefined): string {
  const configuredOrigins = (process.env.APP_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && configuredOrigins.length === 0) {
    throw new Error('يلزم ضبط APP_ORIGIN قبل تفعيل الدفع في الإنتاج.');
  }
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [previewOrigin];
  if (!originHeader || !allowedOrigins.includes(originHeader)) {
    throw new Error('مصدر طلب الدفع غير معتمد.');
  }
  return originHeader;
}

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const signature = request.headers['stripe-signature'];
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || typeof signature !== 'string') {
    response.status(400).send('Stripe webhook is not configured.');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(request.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    response.status(400).send('Webhook signature verification failed.');
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.client_reference_id || session.metadata?.order_id;
      if (!orderId) throw new Error('Checkout session is missing an order reference.');
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
      if (session.payment_status === 'paid') {
        await markCheckoutComplete({
          eventId: event.id,
          eventType: event.type,
          orderId,
          sessionId: session.id,
          paymentIntentId,
          email: session.customer_details?.email || null,
          name: session.customer_details?.name || null,
          amountTotal: (session.amount_total || 0) / 100,
        });
      } else {
        await recordCheckoutProcessing({
          eventId: event.id,
          eventType: event.type,
          orderId,
          sessionId: session.id,
          paymentIntentId,
          email: session.customer_details?.email || null,
          name: session.customer_details?.name || null,
          amountTotal: (session.amount_total || 0) / 100,
        });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markPaymentIntentOutcome({ eventId: event.id, eventType: event.type, paymentIntentId: intent.id, status: 'paid', amountTotal: intent.amount_received / 100 });
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markPaymentIntentOutcome({ eventId: event.id, eventType: event.type, paymentIntentId: intent.id, status: 'failed' });
    }
    response.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    response.status(500).json({ error: 'تعذرت معالجة إشعار الدفع.' });
  }
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_request, response) => {
  const databaseReady = await ensureStoreSchema().catch(() => false);
  response.json({ ok: true, databaseReady, paymentsConfigured: Boolean(stripe) });
});

app.get('/api/products', async (request, response) => {
  try {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    const category = typeof request.query.category === 'string' ? request.query.category.trim() : '';
    const products = await listProducts(query, category);
    const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, 'ar'));
    response.json({ products, categories });
  } catch (error) {
    console.error('Catalog query failed', error);
    response.status(500).json({ error: 'تعذر تحميل الكتالوج حاليًا.' });
  }
});

app.get('/api/orders/:orderId', async (request, response) => {
  try {
    const order = await getOrder(request.params.orderId);
    if (!order) {
      response.status(404).json({ error: 'لم يتم العثور على الطلب.' });
      return;
    }
    response.json({ order });
  } catch (error) {
    console.error('Order lookup failed', error);
    response.status(500).json({ error: 'تعذر تحميل حالة الطلب.' });
  }
});

app.post('/api/checkout', async (request, response) => {
  if (!stripe) {
    response.status(503).json({ error: 'بوابة الدفع لم تُجهّز بعد.' });
    return;
  }

  const lines = Array.isArray(request.body?.items) ? request.body.items : [];
  if (lines.length === 0) {
    response.status(400).json({ error: 'بيانات السلة غير صالحة.' });
    return;
  }

  const requested = new Map<string, number>();
  for (const line of lines) {
    const id = String(line?.id || '');
    const quantity = Number(line?.quantity || 0);
    if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) continue;
    requested.set(id, quantity);
  }
  if (requested.size === 0) {
    response.status(400).json({ error: 'لا توجد منتجات صالحة في السلة.' });
    return;
  }

  let checkoutOrigin: string;
  try {
    checkoutOrigin = resolveCheckoutOrigin(request.get('origin'));
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'مصدر طلب الدفع غير معتمد.' });
    return;
  }

  try {
    const products = await getProductsByIds([...requested.keys()]);
    const selected = products.filter((product) => product.available && requested.has(product.id));
    if (selected.length !== requested.size) {
      response.status(409).json({ error: 'أحد المنتجات غير متاح حاليًا. حدّث السلة وحاول مرة أخرى.' });
      return;
    }

    const orderId = crypto.randomUUID();
    const items: OrderLine[] = selected.map((product) => ({
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity: requested.get(product.id) || 1,
    }));
    const amountTotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    await createPendingOrder(orderId, items, amountTotal);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'sar',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['SA'] },
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'sar',
          product_data: { name: item.name, images: item.image ? [item.image] : undefined },
          unit_amount: Math.round(item.unitPrice * 100),
        },
      })),
      success_url: `${checkoutOrigin}/checkout/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${checkoutOrigin}/?checkout=cancelled`,
    });

    if (!session.url) throw new Error('Stripe did not return a checkout URL.');
    await attachStripeSession(orderId, session.id);
    response.json({ checkoutUrl: session.url, orderId });
  } catch (error) {
    console.error('Checkout creation failed', error);
    response.status(500).json({ error: 'تعذر فتح صفحة الدفع الآمن. حاول مرة أخرى.' });
  }
});

async function start(): Promise<void> {
  await ensureStoreSchema().catch((error) => console.error('Database initialization skipped', error));

  if (process.env.NODE_ENV === 'production') {
    const staticPath = path.resolve(__dirname, '../dist');
    app.use(express.static(staticPath));
    app.use((request, response, next) => {
      if (request.method === 'GET' && !request.path.startsWith('/api/')) {
        response.sendFile(path.join(staticPath, 'index.html'));
        return;
      }
      next();
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`إيقاع الحياة للتقنية يعمل على المنفذ ${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

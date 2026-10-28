import mysql from 'mysql2/promise';
import { catalogProducts, type CatalogProduct } from '../data/catalog';

export type StoreProduct = CatalogProduct;

export type OrderLine = {
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
};

let pool: mysql.Pool | null = null;
let schemaReady = false;

function mapProduct(row: Record<string, unknown>): StoreProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    details: String(row.details),
    price: Number(row.price),
    compareAt: row.compare_at === null ? null : Number(row.compare_at),
    image: String(row.image),
    category: String(row.category),
    sku: String(row.sku),
    available: Boolean(row.available),
    sourceUrl: String(row.source_url),
  };
}

async function getPool(): Promise<mysql.Pool | null> {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 6,
      enableKeepAlive: true,
    });
  }
  return pool;
}

export async function ensureStoreSchema(): Promise<boolean> {
  if (schemaReady) return true;
  const connection = await getPool();
  if (!connection) return false;

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(40) PRIMARY KEY,
      name VARCHAR(500) NOT NULL,
      description TEXT NOT NULL,
      details MEDIUMTEXT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      compare_at DECIMAL(12,2) NULL,
      image TEXT NOT NULL,
      category VARCHAR(255) NOT NULL,
      sku VARCHAR(255) NOT NULL,
      available TINYINT(1) NOT NULL DEFAULT 1,
      source_url TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_products_category (category),
      INDEX idx_products_available (available)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id CHAR(36) PRIMARY KEY,
      stripe_session_id VARCHAR(255) NULL UNIQUE,
      stripe_payment_intent_id VARCHAR(255) NULL,
      buyer_email VARCHAR(320) NULL,
      buyer_name VARCHAR(255) NULL,
      currency CHAR(3) NOT NULL DEFAULT 'sar',
      amount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
      status VARCHAR(40) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_orders_session (stripe_session_id),
      INDEX idx_orders_email (buyer_email)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id CHAR(36) NOT NULL,
      product_id VARCHAR(40) NOT NULL,
      product_name VARCHAR(500) NOT NULL,
      product_image TEXT NOT NULL,
      unit_price DECIMAL(12,2) NOT NULL,
      quantity INT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      INDEX idx_order_items_order (order_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS processed_stripe_events (
      event_id VARCHAR(255) PRIMARY KEY,
      event_type VARCHAR(255) NOT NULL,
      processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const product of catalogProducts) {
    await connection.execute(
      `INSERT INTO products
       (id, name, description, details, price, compare_at, image, category, sku, available, source_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         details = VALUES(details),
         price = VALUES(price),
         compare_at = VALUES(compare_at),
         image = VALUES(image),
         category = VALUES(category),
         sku = VALUES(sku),
         available = VALUES(available),
         source_url = VALUES(source_url)`,
      [
        product.id,
        product.name,
        product.description,
        product.details,
        product.price,
        product.compareAt,
        product.image,
        product.category,
        product.sku,
        product.available ? 1 : 0,
        product.sourceUrl,
      ],
    );
  }

  schemaReady = true;
  return true;
}

export async function listProducts(query?: string, category?: string): Promise<StoreProduct[]> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) {
    return catalogProducts.filter((product) => {
      const matchedQuery = !query || `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase());
      const matchedCategory = !category || product.category === category;
      return matchedQuery && matchedCategory;
    });
  }

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: string[] = [];
  if (query) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR sku LIKE ?)';
    const needle = `%${query}%`;
    params.push(needle, needle, needle);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY available DESC, created_at ASC';
  const [rows] = await connection.query(sql, params);
  return (rows as Record<string, unknown>[]).map(mapProduct);
}

export async function getProductsByIds(ids: string[]): Promise<StoreProduct[]> {
  if (ids.length === 0) return [];
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) {
    return catalogProducts.filter((product) => ids.includes(product.id));
  }
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await connection.query(`SELECT * FROM products WHERE id IN (${placeholders})`, ids);
  return (rows as Record<string, unknown>[]).map(mapProduct);
}

export async function createPendingOrder(orderId: string, items: OrderLine[], amountTotal: number): Promise<void> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) throw new Error('قاعدة البيانات غير متاحة حاليًا.');

  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    await db.execute(
      'INSERT INTO orders (id, amount_total, status) VALUES (?, ?, ?)',
      [orderId, amountTotal, 'pending'],
    );
    for (const item of items) {
      await db.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.name, item.image, item.unitPrice, item.quantity],
      );
    }
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function attachStripeSession(orderId: string, sessionId: string): Promise<void> {
  const connection = await getPool();
  if (!connection) throw new Error('قاعدة البيانات غير متاحة حاليًا.');
  await connection.execute('UPDATE orders SET stripe_session_id = ? WHERE id = ?', [sessionId, orderId]);
}

export async function markCheckoutComplete(input: {
  eventId: string;
  eventType: string;
  orderId: string;
  sessionId: string;
  paymentIntentId: string | null;
  email: string | null;
  name: string | null;
  amountTotal: number;
}): Promise<void> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) {
    throw new Error('لا يمكن تأكيد الدفع دون قاعدة بيانات جاهزة.');
  }
  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    const [known] = await db.execute('SELECT event_id FROM processed_stripe_events WHERE event_id = ?', [input.eventId]);
    if ((known as unknown[]).length > 0) {
      await db.commit();
      return;
    }
    const [updateResult] = await db.execute(
      `UPDATE orders
       SET stripe_session_id = ?, stripe_payment_intent_id = ?, buyer_email = ?, buyer_name = ?, amount_total = ?, status = 'paid'
       WHERE id = ?`,
      [input.sessionId, input.paymentIntentId, input.email, input.name, input.amountTotal, input.orderId],
    );
    if ((updateResult as mysql.ResultSetHeader).affectedRows !== 1) {
      throw new Error(`تعذر العثور على الطلب ${input.orderId} لتأكيد الدفع.`);
    }
    await db.execute('INSERT INTO processed_stripe_events (event_id, event_type) VALUES (?, ?)', [input.eventId, input.eventType]);
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function recordCheckoutProcessing(input: {
  eventId: string;
  eventType: string;
  orderId: string;
  sessionId: string;
  paymentIntentId: string | null;
  email: string | null;
  name: string | null;
  amountTotal: number;
}): Promise<void> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) {
    throw new Error('لا يمكن حفظ حالة الدفع المعلّق دون قاعدة بيانات جاهزة.');
  }
  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    const [known] = await db.execute('SELECT event_id FROM processed_stripe_events WHERE event_id = ?', [input.eventId]);
    if ((known as unknown[]).length > 0) {
      await db.commit();
      return;
    }
    const [updateResult] = await db.execute(
      `UPDATE orders
       SET stripe_session_id = ?, stripe_payment_intent_id = ?, buyer_email = ?, buyer_name = ?, amount_total = ?,
           status = CASE WHEN status = 'paid' THEN 'paid' ELSE 'processing' END
       WHERE id = ?`,
      [input.sessionId, input.paymentIntentId, input.email, input.name, input.amountTotal, input.orderId],
    );
    if ((updateResult as mysql.ResultSetHeader).affectedRows !== 1) {
      throw new Error(`تعذر العثور على الطلب ${input.orderId} لحفظ حالة الدفع.`);
    }
    await db.execute('INSERT INTO processed_stripe_events (event_id, event_type) VALUES (?, ?)', [input.eventId, input.eventType]);
    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function markPaymentIntentOutcome(input: {
  eventId: string;
  eventType: string;
  paymentIntentId: string;
  status: 'paid' | 'failed';
  amountTotal?: number;
}): Promise<boolean> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) {
    throw new Error('لا يمكن حفظ نتيجة الدفع دون قاعدة بيانات جاهزة.');
  }
  const db = await connection.getConnection();
  try {
    await db.beginTransaction();
    const [known] = await db.execute('SELECT event_id FROM processed_stripe_events WHERE event_id = ?', [input.eventId]);
    if ((known as unknown[]).length > 0) {
      await db.commit();
      return true;
    }
    const [updateResult] = await db.execute(
      `UPDATE orders
       SET status = CASE WHEN status = 'paid' THEN 'paid' ELSE ? END,
           amount_total = COALESCE(?, amount_total)
       WHERE stripe_payment_intent_id = ?`,
      [input.status, input.amountTotal ?? null, input.paymentIntentId],
    );
    if ((updateResult as mysql.ResultSetHeader).affectedRows === 0) {
      await db.commit();
      return false;
    }
    await db.execute('INSERT INTO processed_stripe_events (event_id, event_type) VALUES (?, ?)', [input.eventId, input.eventType]);
    await db.commit();
    return true;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

export async function getOrder(orderId: string): Promise<{ id: string; status: string; amountTotal: number; items: OrderLine[] } | null> {
  const connection = await getPool();
  if (!connection || !(await ensureStoreSchema())) return null;
  const [orders] = await connection.execute('SELECT id, status, amount_total FROM orders WHERE id = ?', [orderId]);
  const order = (orders as Array<Record<string, unknown>>)[0];
  if (!order) return null;
  const [items] = await connection.execute(
    'SELECT product_id, product_name, product_image, unit_price, quantity FROM order_items WHERE order_id = ?',
    [orderId],
  );
  return {
    id: String(order.id),
    status: String(order.status),
    amountTotal: Number(order.amount_total),
    items: (items as Array<Record<string, unknown>>).map((item) => ({
      productId: String(item.product_id),
      name: String(item.product_name),
      image: String(item.product_image),
      unitPrice: Number(item.unit_price),
      quantity: Number(item.quantity),
    })),
  };
}

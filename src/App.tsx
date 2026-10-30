import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Camera,
  ChevronLeft,
  Headphones,
  Heart,
  LockKeyhole,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { mainStoreCategories } from '../data/main-categories';

type Product = {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  compareAt: number | null;
  image: string;
  category: string;
  sku: string;
  available: boolean;
};

type CartLine = { id: string; quantity: number };
type Order = { id: string; status: string; amountTotal: number; items: Array<{ productId: string; name: string; image: string; unitPrice: number; quantity: number }> };

const formatter = new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 });
const formatPrice = (value: number) => formatter.format(value);
const OFFER_BANNERS = [
  '/banners/offer-1.webp',
  '/banners/offer-2.webp',
  '/banners/offer-3.webp',
  '/banners/offer-4.webp',
  '/banners/offer-5.webp',
];

function useStoredCart(): [CartLine[], (items: CartLine[]) => void] {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('iqaa-cart') || '[]');
    } catch {
      return [];
    }
  });
  const save = (items: CartLine[]) => {
    setCart(items);
    localStorage.setItem('iqaa-cart', JSON.stringify(items));
  };
  return [cart, save];
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="إيقاع الحياة للتقنية">
      <span className="brand-mark"><span /></span>
      {!compact && <span className="brand-copy"><strong>إيقاع الحياة</strong><em>للتقنية</em></span>}
    </div>
  );
}

function ProductCard({ product, onAdd, onOpen }: { product: Product; onAdd: (p: Product) => void; onOpen: (p: Product) => void }) {
  const discount = product.compareAt && product.compareAt > product.price ? Math.round((1 - product.price / product.compareAt) * 100) : null;
  return (
    <article className="product-card">
      <button className="product-visual" onClick={() => onOpen(product)} aria-label={`عرض ${product.name}`}>
        {discount && <span className="discount-badge">وفر {discount}%</span>}
        <img src={product.image || '/logo-mark.svg'} alt={product.name} loading="lazy" />
        <span className="quick-view">عرض التفاصيل <ArrowLeft size={14} /></span>
      </button>
      <div className="product-info">
        <span className="product-category">{product.category.split(',')[0]}</span>
        <button className="product-name" onClick={() => onOpen(product)}>{product.name}</button>
        <p>{product.description || 'مواصفات المنتج متاحة في التفاصيل.'}</p>
        <div className="product-bottom">
          <div className="price-block">
            <strong>{formatPrice(product.price)}</strong>
            {product.compareAt && product.compareAt > product.price && <del>{formatPrice(product.compareAt)}</del>}
          </div>
          <button className="add-button" disabled={!product.available} onClick={() => onAdd(product)}>
            <Plus size={18} /> {product.available ? 'أضف' : 'نفدت'}
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({ products, cart, setCart, open, onClose, checkout, checkingOut }: {
  products: Product[]; cart: CartLine[]; setCart: (items: CartLine[]) => void; open: boolean; onClose: () => void; checkout: () => void; checkingOut: boolean;
}) {
  const items = cart.flatMap((line) => {
    const product = products.find((p) => p.id === line.id);
    return product ? [{ product, quantity: line.quantity }] : [];
  });
  const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  const update = (id: string, quantity: number) => setCart(quantity > 0 ? cart.map((line) => line.id === id ? { ...line, quantity } : line) : cart.filter((line) => line.id !== id));

  return (
    <>
      <div className={`drawer-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="drawer-head"><div><span className="eyebrow">سلة المشتريات</span><h2>اختياراتك الذكية</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
        {items.length === 0 ? (
          <div className="empty-cart"><ShoppingBag size={34} /><h3>السلة بانتظارك</h3><p>أضف المنتجات المناسبة لمساحتك، ثم أتمم الطلب بدفع آمن.</p></div>
        ) : (
          <>
            <div className="cart-lines">
              {items.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <img src={product.image || '/logo-mark.svg'} alt="" />
                  <div><strong>{product.name}</strong><span>{formatPrice(product.price)}</span><div className="quantity"><button onClick={() => update(product.id, quantity - 1)}><Minus size={14} /></button><b>{quantity}</b><button onClick={() => update(product.id, quantity + 1)}><Plus size={14} /></button></div></div>
                </div>
              ))}
            </div>
            <div className="cart-total"><span>الإجمالي</span><strong>{formatPrice(total)}</strong></div>
            <button className="checkout-button" onClick={checkout} disabled={checkingOut}>{checkingOut ? 'جاري تجهيز الدفع...' : 'إتمام الدفع الآمن'} <LockKeyhole size={18} /></button>
            <p className="secure-note"><ShieldCheck size={15} /> الدفع يتم عبر صفحة Stripe الآمنة. تظهر قيمة الشحن عند إتمام الطلب.</p>
          </>
        )}
      </aside>
    </>
  );
}

function ProductModal({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (product: Product) => void }) {
  if (!product) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-label={product.name} onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose}><X /></button>
        <div className="modal-image"><img src={product.image || '/logo-mark.svg'} alt={product.name} /></div>
        <div className="modal-copy">
          <span className="eyebrow">{product.category}</span><h2>{product.name}</h2>
          <div className="modal-price">{formatPrice(product.price)} {product.compareAt && product.compareAt > product.price && <del>{formatPrice(product.compareAt)}</del>}</div>
          <p className="description">{product.description}</p>
          <div className="spec-box"><span>المواصفات والتفاصيل</span><p>{product.details || product.description}</p></div>
          <div className="modal-actions"><button className="checkout-button" disabled={!product.available} onClick={() => { onAdd(product); onClose(); }}>{product.available ? 'أضف إلى السلة' : 'نفدت الكمية'} <ShoppingBag size={18} /></button><span>رقم المنتج: {product.sku || product.id}</span></div>
        </div>
      </section>
    </div>
  );
}

function SuccessPage({ orderId }: { orderId: string | null }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`).then((res) => res.ok ? res.json() : Promise.reject()).then((data) => setOrder(data.order)).catch(() => undefined).finally(() => setLoading(false));
  }, [orderId]);
  return <main className="success-page"><BrandMark /><section><PackageCheck size={54} /><span className="eyebrow">تم استلام الطلب</span><h1>شكرًا لاختيارك إيقاع الحياة</h1><p>{loading ? 'نتحقق من حالة الدفع الآن...' : order?.status === 'paid' ? 'تم تأكيد الدفع وسيتم التواصل معك لترتيب تنفيذ الطلب.' : 'وصلنا طلبك، وتظهر حالة الدفع النهائية خلال لحظات.'}</p>{order && <div className="success-order"><span>رقم الطلب</span><strong>{order.id.slice(0, 8).toUpperCase()}</strong><b>{formatPrice(order.amountTotal)}</b></div>}<a className="checkout-button inline-link" href="/">العودة إلى المتجر <ChevronLeft size={18} /></a></section></main>;
}

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let orderIds: string[] = [];
    try { orderIds = JSON.parse(localStorage.getItem('iqaa-order-history') || '[]'); } catch { orderIds = []; }
    Promise.all(orderIds.map((id) => fetch(`/api/orders/${id}`).then((res) => res.ok ? res.json() : null)))
      .then((results) => setOrders(results.flatMap((result) => result?.order ? [result.order as Order] : [])))
      .finally(() => setLoading(false));
  }, []);
  return <main className="orders-page"><header><a href="/"><BrandMark /></a><a className="text-link dark" href="/">العودة للتسوّق <ChevronLeft size={17} /></a></header><section><span className="eyebrow">متابعة الطلبات</span><h1>طلباتي</h1><p>تظهر هنا الطلبات التي أنشأتها من هذا الجهاز.</p>{loading ? <div className="order-empty">جارٍ تحميل سجل الطلبات...</div> : orders.length === 0 ? <div className="order-empty"><ShoppingBag size={30} /><h3>لا توجد طلبات بعد</h3><p>بعد إتمام أول عملية شراء، ستظهر حالة الطلب وتفاصيله هنا.</p><a className="primary-link" href="/">تسوّق الآن <ArrowLeft size={18} /></a></div> : <div className="order-list">{orders.map((order) => <article key={order.id} className="order-card"><div><span>طلب #{order.id.slice(0, 8).toUpperCase()}</span><strong className={order.status === 'paid' ? 'paid' : ''}>{order.status === 'paid' ? 'تم الدفع' : 'قيد تأكيد الدفع'}</strong></div><ul>{order.items.map((item) => <li key={item.productId}>{item.name} <b>× {item.quantity}</b></li>)}</ul><footer><span>{order.items.length} منتج</span><b>{formatPrice(order.amountTotal)}</b></footer></article>)}</div>}</section></main>;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useStoredCart();
  const [toast, setToast] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [shownProductCount, setShownProductCount] = useState(24);
  const searchParams = new URLSearchParams(window.location.search);
  const isSuccess = window.location.pathname === '/checkout/success';
  const isOrders = window.location.pathname === '/orders';

  useEffect(() => {
    fetch('/api/products').then((res) => res.json()).then((data) => setProducts(data.products || [])).catch(() => setToast('تعذر تحميل الكتالوج. حاول تحديث الصفحة.'));
    if (searchParams.get('checkout') === 'cancelled') setToast('تم إلغاء عملية الدفع، وما زالت منتجاتك محفوظة في السلة.');
  }, []);

  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 3600); return () => window.clearTimeout(timeout); }, [toast]);
  useEffect(() => { setShownProductCount(24); }, [query, activeCategory]);

  const activeProductIds = useMemo(() => {
    if (activeCategory === 'الكل') return null;
    return new Set(mainStoreCategories.find((category) => category.name === activeCategory)?.productIds || []);
  }, [activeCategory]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = !activeProductIds || activeProductIds.has(product.id);
    const source = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && source.includes(query.trim().toLowerCase());
  }), [products, query, activeProductIds]);
  const displayedProducts = visibleProducts.slice(0, shownProductCount);
  const availableProductCount = products.filter((product) => product.available).length;
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const featured = products.find((product) => product.name.includes('كاميرا')) || products[0];

  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((line) => line.id === product.id);
    setCart(existing ? cart.map((line) => line.id === product.id ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...cart, { id: product.id, quantity: 1 }]);
    setToast('أُضيف المنتج إلى السلة.');
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart }) });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'تعذر بدء الدفع.');
      localStorage.setItem('iqaa-last-order', data.orderId);
      const history = JSON.parse(localStorage.getItem('iqaa-order-history') || '[]') as string[];
      localStorage.setItem('iqaa-order-history', JSON.stringify([data.orderId, ...history.filter((id) => id !== data.orderId)].slice(0, 10)));
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'تعذر بدء الدفع.');
      setCheckingOut(false);
    }
  };

  if (isSuccess) return <SuccessPage orderId={searchParams.get('order_id')} />;
  if (isOrders) return <OrdersPage />;

  return (
    <div className="app-shell">
      <div className="announcement"><Award size={15} /> شركة إيقاع الحياة موزع معتمد من مزودي خدمات الاتصالات — تقنية موثوقة ودفع آمن.</div>
      <header className="site-header">
        <a href="/" className="brand-link"><BrandMark /></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}><a href="#products" onClick={() => setMenuOpen(false)}>المنتجات</a><a href="#solutions" onClick={() => setMenuOpen(false)}>حلولنا</a><a href="#trust" onClick={() => setMenuOpen(false)}>لماذا نحن</a><a href="/orders">طلباتي</a><div className="mobile-category-list"><span>الفئات الرئيسية</span><div>{mainStoreCategories.map((category) => <button type="button" key={category.name} className={activeCategory === category.name ? 'active' : ''} onClick={() => selectCategory(category.name)}>{category.name}</button>)}</div></div></nav>
        <div className="header-actions"><button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu /></button><button className="cart-trigger" onClick={() => setCartOpen(true)}><ShoppingBag size={20} /><span>السلة</span>{cartCount > 0 && <b>{cartCount}</b>}</button></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow light"><Zap size={15} /> حلول ذكية لإيقاع يومك</span><h1>تقنية تحمي <i>حياتك</i><br />وتواكبها.</h1><p>اختيار واضح لكاميرات المراقبة، شرائح الاتصال، وحلول التقنية اليومية؛ بأسعار شفافة وتجربة شراء آمنة.</p><div className="hero-actions"><a className="primary-link" href="#products">تصفّح المنتجات <ArrowLeft size={18} /></a><button className="text-link" onClick={() => featured && setSelectedProduct(featured)}>اكتشف المنتج المميز</button></div><div className="hero-stats"><span><b>{availableProductCount || '…'}</b> منتج متاح</span><span><b>{products.length || '…'}</b> في الكتالوج</span><span><b>SSL</b> دفع آمن</span></div></div>
          <div className="hero-product">{featured && <><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="signal-card"><Wifi size={18} /><span>اتصال ذكي<br /><b>يناسب يومك</b></span></div><img src={featured.image || '/logo-mark.svg'} alt={featured.name} /><div className="hero-label"><span>مختار لك</span><strong>{featured.name}</strong><b>{formatPrice(featured.price)}</b></div></>}</div>
        </section>

        <section className="category-rail" aria-label="الفئات الرئيسية للمنتجات"><div className="section-mini"><span>الفئات الرئيسية</span><SlidersHorizontal size={18} /></div><div className="category-chips"><button className={activeCategory === 'الكل' ? 'active' : ''} onClick={() => selectCategory('الكل')}>كل المنتجات</button>{mainStoreCategories.map((category) => <button key={category.name} className={activeCategory === category.name ? 'active' : ''} onClick={() => selectCategory(category.name)}>{category.name}</button>)}</div></section>

        <section className="distributor-band" aria-label="اعتماد الشركة"><div className="distributor-icon"><Award size={30} /></div><div className="distributor-copy"><span className="eyebrow">اعتماد رسمي</span><h2>شركة إيقاع الحياة موزع معتمد من مزودي خدمات الاتصالات</h2><p>نوفر شرائح وباقات الاتصال والبيانات عبر قنوات توزيع معتمدة، لتحصل على منتج أصلي وخدمة موثوقة.</p></div><span className="distributor-seal"><BadgeCheck size={18} /> موزع معتمد</span></section>

        <section className="offer-banner-section" aria-label="بنرات العروض"><div className="offer-banner-head"><div><span className="eyebrow">عروض موسمية</span><h2>عروض مختارة</h2></div><span>تسوّق العرض المناسب لك</span></div><div className="offer-banner-track">{OFFER_BANNERS.map((banner, index) => <article className="offer-banner" key={banner}><img src={banner} alt={`بنر عروض ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} /></article>)}</div></section>

        <section id="products" className="catalog-section"><div className="section-head"><div><span className="eyebrow">الكتالوج الكامل</span><h2>كل ما تحتاجه، بسعر واضح.</h2></div><div className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم المنتج أو الفئة" /></div></div><div className="catalog-summary"><span>{visibleProducts.length} منتج</span><span className="line" /> <span>الأسعار تشمل ضريبة القيمة المضافة عند عرضها من المصدر</span></div><div className="product-grid">{displayedProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={setSelectedProduct} />)}</div>{visibleProducts.length > displayedProducts.length && <div className="load-more-wrap"><span>عرض {displayedProducts.length} من {visibleProducts.length} منتج</span><button className="load-more" onClick={() => setShownProductCount((count) => Math.min(count + 24, visibleProducts.length))}>عرض منتجات إضافية <ChevronLeft size={17} /></button></div>}{visibleProducts.length === 0 && <div className="no-results"><Search size={28} /><p>لم نجد منتجًا مطابقًا. جرّب مصطلحًا آخر أو اختر «الكل».</p></div>}</section>

        <section id="solutions" className="solution-section"><div className="solution-intro"><span className="eyebrow light">من الفكرة إلى الاستخدام</span><h2>حلول تقنية تبدأ من احتياجك، لا من تعقيد المنتج.</h2></div><div className="solution-cards"><article><Camera /><h3>مراقبة بوضوح</h3><p>اختَر كاميرا داخلية أو خارجية مع تفاصيل تساعدك على المقارنة قبل القرار.</p></article><article><Wifi /><h3>اتصال بلا انقطاع</h3><p>شرائح بيانات وحلول اتصال بتفاصيل الصلاحية والسعة كما هي موضحة للمنتج.</p></article><article><Headphones /><h3>دعم قريب</h3><p>خبرة واضحة وتواصل مباشر لمساعدتك قبل الشراء وبعده.</p></article></div></section>

        <section id="trust" className="trust-section"><div><span className="eyebrow">ثقة من أول نقرة</span><h2>لماذا إيقاع الحياة؟</h2></div><div className="trust-list"><span><Award /> موزع معتمد من مزودي خدمات الاتصالات</span><span><BadgeCheck /> أسعار ظاهرة قبل الدفع</span><span><ShieldCheck /> دفع مشفّر عبر Stripe</span><span><Heart /> اختيار مبني على الاحتياج</span><span><PackageCheck /> طلبات محفوظة وقابلة للمتابعة</span></div></section>
      </main>
      <footer><BrandMark /><div className="footer-company"><strong>شركة إيقاع الحياة</strong><p>إيقاع الحياة للتقنية — حلول تقنية تواكب يومك.</p><p className="footer-authorized"><Award size={14} /> موزع معتمد من مزودي خدمات الاتصالات</p></div><div className="business-details" aria-label="بيانات المنشأة"><span>السجل التجاري <b dir="ltr">7033944427</b></span><span>الرقم الضريبي <b dir="ltr">311685924700003</b></span></div><span className="copyright">جميع الحقوق محفوظة © 2026</span><figure className="payment-trust-image"><img src="/images/payment-trust.png" alt="صورة وسائل الدفع والتوثيق المقدمة من شركة إيقاع الحياة" /></figure></footer>
      <CartDrawer products={products} cart={cart} setCart={setCart} open={cartOpen} onClose={() => setCartOpen(false)} checkout={checkout} checkingOut={checkingOut} />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />
      {toast && <div className="toast"><BadgeCheck size={17} />{toast}</div>}
    </div>
  );
}

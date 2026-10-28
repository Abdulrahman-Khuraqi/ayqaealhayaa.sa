import { catalogProducts, type CatalogProduct } from '@/data/catalog';
import { mainStoreCategories } from '@/data/main-categories';

/** نسخة خفيفة من المنتج تُرسل لواجهة التصفح بدل التفاصيل الكاملة. */
export type ProductLite = {
  id: string;
  name: string;
  summary: string;
  price: number;
  compareAt: number | null;
  image: string;
  available: boolean;
  brand: string | null;
  discount: number | null;
};

export type StoreCategory = {
  slug: string;
  name: string;
  blurb: string;
  productIds: string[];
};

/** أسماء وروابط عربية مرتبة للفئات الرئيسية المستوردة من V2. */
const categoryMeta: Record<string, { slug: string; name: string; blurb: string }> = {
  'عروض تخفيضات': { slug: 'offers', name: 'عروض وتخفيضات', blurb: 'أفضل الأسعار على الكاميرات والشبكات والشرائح لفترة محدودة.' },
  'كاميرات المراقبة': { slug: 'cctv', name: 'كاميرات المراقبة', blurb: 'كاميرات داخلية وخارجية بدقة عالية ورؤية ليلية.' },
  'كاميرات واي فاي - Wifi': { slug: 'wifi-cameras', name: 'كاميرات واي فاي', blurb: 'تركيب سهل ومراقبة مباشرة من الجوال بدون تمديدات.' },
  'كاميرات الطاقة الشمسية': { slug: 'solar-cameras', name: 'كاميرات الطاقة الشمسية', blurb: 'مراقبة للمواقع البعيدة والمزارع بدون كهرباء.' },
  'أجهزة التسجيل': { slug: 'recorders', name: 'أجهزة التسجيل', blurb: 'أجهزة NVR وXVR لحفظ التسجيلات وإدارتها.' },
  'بكجات كاميرات المراقبة': { slug: 'camera-kits', name: 'بكجات الكاميرات', blurb: 'حزم جاهزة متكاملة لمنزلك أو منشأتك.' },
  'ملحقات و اكسسورات الكاميرات': { slug: 'accessories', name: 'ملحقات الكاميرات', blurb: 'كيابل، محولات، وحدات تخزين وكل ما يكمل نظامك.' },
  'داش كام': { slug: 'dash-cam', name: 'داش كام', blurb: 'كاميرات سيارات توثق طريقك بوضوح.' },
  'منتجات المنزل الذكي': { slug: 'smart-home', name: 'المنزل الذكي', blurb: 'أقفال وشاشات وأجهزة ذكية تتحكم بها من جوالك.' },
  'انتركوم': { slug: 'intercom', name: 'الانتركوم', blurb: 'أنظمة اتصال مرئي للمداخل والفلل والمباني.' },
  'الشبكات': { slug: 'networking', name: 'الشبكات', blurb: 'راوترات ومقويات وسويتشات لتغطية أقوى.' },
  'شرائح انترنت': { slug: 'sim-cards', name: 'شرائح الإنترنت', blurb: 'باقات بيانات مسبقة الدفع من مشغلين معتمدين.' },
  'بيع بالجملة للمؤسسات و الشركات': { slug: 'wholesale', name: 'مبيعات الجملة', blurb: 'كميات وأسعار خاصة للمؤسسات والشركات.' },
};

const installationIds = catalogProducts.filter((p) => p.category.includes('تركيب')).map((p) => p.id);

export const storeCategories: StoreCategory[] = [
  ...mainStoreCategories.flatMap((category) => {
    const meta = categoryMeta[category.name];
    return meta && category.productIds.length > 0 ? [{ ...meta, productIds: [...category.productIds] }] : [];
  }),
  { slug: 'installation', name: 'خدمات التركيب', blurb: 'تركيب وبرمجة الكاميرات والشبكات والانتركوم بأيدي فنيين.', productIds: installationIds },
];

const brandRules: Array<[string, RegExp]> = [
  ['داهوا', /dahua|داهوا|\bDH[-I]/i],
  ['إيمو', /imou|ايمو|إيمو/i],
  ['إزفيز', /ezviz|ازفيز|إزفيز/i],
  ['هيكفيجن', /hikvision|هيكفيجن|هيك فيجن/i],
  ['Reyee', /reyee|\bRG-/i],
  ['STC', /\bstc\b|اس تي سي/i],
  ['سلام', /سلام/],
  ['موبايلي', /موبايلي|mobily/i],
  ['زين', /\bزين\b|zain/i],
  ['TP-Link', /tp-?link|tapo/i],
];

function detectBrand(product: CatalogProduct) {
  const text = `${product.name} ${product.description.slice(0, 120)}`;
  return brandRules.find(([, rule]) => rule.test(text))?.[0] ?? null;
}

export const discountOf = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;

function toLite(product: CatalogProduct): ProductLite {
  return {
    id: product.id,
    name: product.name,
    summary: product.description.slice(0, 150),
    price: product.price,
    compareAt: product.compareAt,
    image: product.image,
    available: product.available,
    brand: detectBrand(product),
    discount: discountOf(product.price, product.compareAt),
  };
}

export const allProducts = catalogProducts;
export const allProductsLite = catalogProducts.map(toLite);

/** ترتيب صفحة «كل المنتجات»: حسب ترتيب الأقسام (الكاميرات أولًا) بدل ترتيب الاستيراد. */
export function productsByCategoryOrder() {
  const order = ['cctv', 'wifi-cameras', 'solar-cameras', 'camera-kits', 'recorders', 'intercom', 'smart-home', 'networking', 'dash-cam', 'accessories', 'installation', 'sim-cards', 'wholesale'];
  const rank = (id: string) => {
    const index = order.findIndex((slug) => getCategory(slug)?.productIds.includes(id));
    return index === -1 ? order.length : index;
  };
  return [...allProductsLite].sort((a, b) => rank(a.id) - rank(b.id));
}

const liteById = new Map(allProductsLite.map((p) => [p.id, p]));
const productById = new Map(catalogProducts.map((p) => [p.id, p]));

export const getProduct = (id: string) => productById.get(id);
export const getCategory = (slug: string) => storeCategories.find((c) => c.slug === slug);

export function productsIn(category: StoreCategory) {
  return category.productIds.flatMap((id) => liteById.get(id) ?? []);
}

export function categoryOf(productId: string) {
  return storeCategories.find((c) => c.slug !== 'offers' && c.productIds.includes(productId))
    ?? storeCategories.find((c) => c.productIds.includes(productId));
}

export function relatedProducts(productId: string, limit = 4) {
  const category = categoryOf(productId);
  if (!category) return [];
  return productsIn(category).filter((p) => p.id !== productId && p.available).slice(0, limit);
}

export function topOffers(limit = 8) {
  return allProductsLite
    .filter((p) => p.available && p.discount && p.image)
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    .slice(0, limit);
}

/** صورة تمثيلية لكل فئة: أول منتج متوفر له صورة. */
export function categoryCover(category: StoreCategory) {
  return productsIn(category).find((p) => p.available && p.image)?.image ?? '';
}

export const maxOfferDiscount = Math.max(...allProductsLite.map((p) => p.discount ?? 0));
export const productCount = catalogProducts.length;

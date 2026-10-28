import Link from 'next/link';
import {
  ArrowLeft, BadgePercent, Camera, Code2, Headset, MessageCircle, PackageCheck, Receipt, Server, ShieldCheck, Sparkles, Truck, Wand2,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import { categoryCover, getCategory, maxOfferDiscount, productCount, productsIn, storeCategories, topOffers } from '@/lib/catalog';
import { websitePackages } from '@/data/services';
import { hostingFamilies } from '@/data/hosting';
import { digitalProducts } from '@/data/digital';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';

const minPrice = (values: number[]) => Math.min(...values);

export default function HomePage() {
  const offers = topOffers(8);
  const tileCategories = storeCategories.filter((c) => c.slug !== 'offers' && c.slug !== 'wholesale');
  const installCategory = getCategory('installation');
  const installFrom = installCategory ? minPrice(productsIn(installCategory).filter((p) => p.price > 1).map((p) => p.price)) : 0;
  const simCategory = getCategory('sim-cards');
  const simFrom = simCategory ? minPrice(productsIn(simCategory).filter((p) => p.available).map((p) => p.price)) : 0;
  const hostingFrom = minPrice(hostingFamilies[0].plans.map((p) => p.monthly));
  const digitalFrom = minPrice(digitalProducts.map((p) => p.price));
  const heroProduct = offers[0];

  const pillars = [
    { href: '/store/', icon: Camera, title: 'الأجهزة الأمنية والذكية', copy: 'كاميرات مراقبة، انتركوم، شبكات، منزل ذكي وشرائح إنترنت من ماركات موثوقة.', from: `${productCount} منتجًا`, label: 'تصفح المتجر' },
    { href: '/programming/', icon: Code2, title: 'البرمجة والتطوير', copy: 'مواقع، متاجر، تطبيقات جوال وأنظمة مخصصة بتقنيات حديثة وتسليم موثق.', from: `من ${formatPrice(websitePackages[0].price)}`, label: 'الخدمات' },
    { href: '/hosting/', icon: Server, title: 'الاستضافة والنطاقات', copy: 'استضافة مواقع، ووردبريس مُدارة، خوادم VPS وبريد أعمال باسم نطاقك.', from: `من ${formatPrice(hostingFrom)} شهريًا`, label: 'الخطط' },
    { href: '/digital/', icon: Wand2, title: 'المنتجات الرقمية', copy: 'شهادات SSL، قوالب جاهزة، أنظمة سحابية ومخططات كاميرات تُسلَّم إلكترونيًا.', from: `من ${formatPrice(digitalFrom)}`, label: 'المنتجات' },
  ];

  return (
    <>
      <section className="hero on-dark">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow-pill"><Sparkles size={15} aria-hidden="true" /> شركة سعودية للتقنية والحلول الرقمية</span>
            <h1>تقنية تحمي <em>يومك</em>، وحلول رقمية تبني <em>أعمالك</em>.</h1>
            <p className="hero-copy">أجهزة مراقبة وشبكات ومنزل ذكي بأسعار واضحة، إلى جانب برمجة المواقع والتطبيقات واستضافتها. كل ذلك من جهة واحدة تعرفك وتتابع معك.</p>
            <div className="hero-ctas">
              <Link href="/store/" className="btn btn-primary">تسوّق الأجهزة <ArrowLeft size={18} aria-hidden="true" /></Link>
              <Link href="/programming/" className="btn btn-ghost">اطلب خدمة برمجية <Code2 size={18} aria-hidden="true" /></Link>
            </div>
            <div className="hero-stats">
              <div><strong>{productCount}+</strong><span>منتج في المتجر</span></div>
              <div><strong>{maxOfferDiscount}%</strong><span>أعلى خصم حالي</span></div>
              <div><strong>{site.returnDays} أيام</strong><span>للاستبدال والاسترجاع</span></div>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-ring" />
            <div className="hero-ring r2" />
            <div className="hero-logo"><img src="/logo.webp" alt="" /></div>
            <div className="float-card f1"><Truck size={22} /><div><b>شحن مجاني</b><span>لكل مدن المملكة</span></div></div>
            <div className="float-card f2"><ShieldCheck size={22} /><div><b>دفع آمن</b><span>مدى · Apple Pay</span></div></div>
            {heroProduct && <div className="float-card f3"><BadgePercent size={22} /><div><b>وفّر {heroProduct.discount}%</b><span>على عروض مختارة</span></div></div>}
          </div>
        </div>
      </section>

      <section className="intro-band" aria-label="مزايا الشراء">
        <div className="container">
          <ul>
            <li><Truck size={18} aria-hidden="true" /> {site.shippingNotice}</li>
            <li><Receipt size={18} aria-hidden="true" /> فاتورة ضريبية لكل طلب</li>
            <li><PackageCheck size={18} aria-hidden="true" /> استرجاع خلال {site.returnDays} أيام</li>
            <li><Headset size={18} aria-hidden="true" /> دعم فني بالعربي</li>
          </ul>
        </div>
      </section>

      <section className="section section-dark on-dark">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">ماذا نقدم</p>
              <h2>أربعة مسارات، <em>وجهة واحدة</em>.</h2>
            </div>
            <p>ابدأ من المسار الذي يناسبك؛ كثير من عملائنا يجمعون بين الأجهزة والخدمات الرقمية في طلب واحد.</p>
          </div>
          <div className="pillars">
            {pillars.map(({ href, icon: PillarIcon, title, copy, from, label }) => (
              <Link key={href} href={href} className="pillar">
                <span className="pillar-icon"><PillarIcon size={24} strokeWidth={1.6} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{copy}</p>
                <span className="pillar-foot"><span><b>{from}</b></span><span className="text-link">{label} <ArrowLeft size={16} aria-hidden="true" /></span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight section-sand" aria-label="عروض مختارة">
        <div className="container promo-row">
          <Link href="/store/offers/" className="promo p-bronze">
            <div>
              <small>عروض وتخفيضات</small>
              <h3>خصومات تصل إلى</h3>
              <span className="big">{maxOfferDiscount}%</span>
            </div>
            <span className="text-link">تسوّق العروض <ArrowLeft size={16} aria-hidden="true" /></span>
          </Link>
          <Link href="/store/installation/" className="promo">
            <div>
              <small>خدمات التركيب</small>
              <h3>تركيب الكاميرات يبدأ من {formatPrice(installFrom)}</h3>
            </div>
            <span className="text-link">احجز التركيب <ArrowLeft size={16} aria-hidden="true" /></span>
          </Link>
          <Link href="/store/sim-cards/" className="promo">
            <div>
              <small>شرائح الإنترنت</small>
              <h3>باقات بيانات تبدأ من {formatPrice(simFrom)}</h3>
            </div>
            <span className="text-link">اختر باقتك <ArrowLeft size={16} aria-hidden="true" /></span>
          </Link>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">أقسام المتجر</p>
              <h2>اختر الحل المناسب <em>لمساحتك</em>.</h2>
            </div>
            <Link href="/store/" className="text-link">كل المنتجات <ArrowLeft size={16} aria-hidden="true" /></Link>
          </div>
          <div className="category-grid">
            {tileCategories.map((category) => (
              <Link key={category.slug} href={`/store/${category.slug}/`} className="category-tile">
                <span className="tile-img"><ProductImage src={categoryCover(category)} alt="" /></span>
                <span className="tile-body"><h3>{category.name}</h3><span>{category.productIds.length} منتج</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">الأعلى خصمًا الآن</p>
              <h2>عروض <em>لا تتكرر</em> كثيرًا.</h2>
            </div>
            <Link href="/store/offers/" className="text-link">كل العروض <ArrowLeft size={16} aria-hidden="true" /></Link>
          </div>
          <div className="product-grid">
            {offers.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="section section-dark on-dark">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">باقات المواقع</p>
              <h2>موقعك جاهز <em>بسعر معلن</em>.</h2>
            </div>
            <Link href="/programming/" className="text-link">كل الخدمات البرمجية <ArrowLeft size={16} aria-hidden="true" /></Link>
          </div>
          <div className="tiers">
            {websitePackages.map((pkg) => (
              <article key={pkg.id} className={`tier ${pkg.featured ? 'featured' : ''}`}>
                {pkg.featured && <span className="tier-flag">الأكثر اختيارًا</span>}
                <h3>{pkg.name}</h3>
                <p className="tier-pitch">{pkg.pitch}</p>
                <div className="tier-price"><span className="from">يبدأ من</span><strong>{formatPrice(pkg.price)}</strong></div>
                <div className="tier-meta"><span>{pkg.delivery}</span><span>{pkg.support}</span></div>
                <Link href={`/programming/#${pkg.id}`} className={`btn ${pkg.featured ? 'btn-primary' : 'btn-ghost'}`}>تفاصيل الباقة <ArrowLeft size={18} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-darker on-dark">
        <div className="container process">
          <div className="process-side">
            <p className="kicker">كيف نعمل</p>
            <h2>اتجاه واضح. <em>تنفيذ أدق</em>.</h2>
            <p>سواء طلبت كاميرا أو نظامًا برمجيًا، نتبع المسار نفسه: نفهم، نقترح، ننفذ، ثم نبقى معك.</p>
            <a href={whatsappLink('مرحبًا، أحتاج استشارة لاختيار الحل المناسب.')} target="_blank" rel="noreferrer" className="btn btn-ghost">استشارة مجانية عبر واتساب <MessageCircle size={18} aria-hidden="true" /></a>
          </div>
          <ol className="process-list">
            <li><div><h3>نفهم احتياجك</h3><p>محادثة قصيرة عن المساحة أو المشروع والميزانية والأولويات.</p></div></li>
            <li><div><h3>نقترح الحل والسعر</h3><p>عرض واضح بالأجهزة أو نطاق العمل، والسعر شامل الضريبة دون مفاجآت.</p></div></li>
            <li><div><h3>ننفذ ونسلّم</h3><p>شحن مجاني أو تركيب ميداني، أو تسليم برمجي على مراحل معتمدة.</p></div></li>
            <li><div><h3>نتابع بعد التسليم</h3><p>ضمان ودعم فني وخطط صيانة تبقي كل شيء يعمل كما يجب.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="kicker">أسئلة شائعة</p>
              <h2>قبل أن <em>تطلب</em>.</h2>
            </div>
          </div>
          <div className="faq">
            <details><summary>هل الأسعار شاملة الضريبة؟</summary><p>نعم، جميع الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة 15%، ونصدر فاتورة ضريبية باسم {site.legalName} لكل طلب.</p></details>
            <details><summary>كيف أدفع؟</summary><p>بعد إرسال الطلب نؤكده معك ونرسل رابط دفع آمن يدعم مدى وفيزا وماستركارد وApple Pay، أو نوفر بيانات التحويل البنكي الرسمي. لا نطلب بيانات بطاقتك أبدًا عبر المحادثة.</p></details>
            <details><summary>كم يستغرق التوصيل؟</summary><p>الرياض خلال 1–3 أيام عمل، والمدن الرئيسية 2–5 أيام عمل، والشحن مجاني لجميع مدن المملكة. التفاصيل في <Link className="text-link" href="/legal/shipping/">سياسة الشحن</Link>.</p></details>
            <details><summary>هل تقدمون التركيب؟</summary><p>نعم، لدينا خدمات تركيب الكاميرات والانتركوم وأجهزة الشبكات مع ضمان على أعمال التركيب 3 أشهر. اختر الخدمة من قسم خدمات التركيب أو تواصل معنا لمشروع منشأة.</p></details>
            <details><summary>هل أملك الكود المصدري لموقعي؟</summary><p>نعم، تنتقل ملكية التصاميم والكود المخصص إليك بعد سداد كامل المستحقات، وفق <Link className="text-link" href="/legal/services-terms/">شروط الخدمات البرمجية</Link>.</p></details>
          </div>
          <div className="cta-band mt-lg">
            <div>
              <h2>لم تجد ما تبحث عنه؟</h2>
              <p>أخبرنا بما تحتاجه، وسنقترح عليك الجهاز أو الخدمة المناسبة مع عرض سعر واضح خلال يوم عمل.</p>
            </div>
            <div className="actions">
              <a className="btn btn-dark" href={whatsappLink('مرحبًا، أبحث عن منتج أو خدمة غير موجودة في الموقع.')} target="_blank" rel="noreferrer">راسلنا عبر واتساب <MessageCircle size={18} aria-hidden="true" /></a>
              <Link className="btn btn-ghost" href="/contact/">نموذج التواصل</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

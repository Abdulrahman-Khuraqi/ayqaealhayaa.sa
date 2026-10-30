import Link from 'next/link';
import {
  ArrowLeft, Award, BadgeCheck, Headset, MessageCircle, PackageCheck, Receipt, RotateCcw, ShieldCheck, Truck,
} from 'lucide-react';
import Faq from '@/components/Faq';
import HeroScene from '@/components/HeroScene';
import ProductImage from '@/components/ProductImage';
import ProductShowcase, { type ShowcaseTab } from '@/components/ProductShowcase';
import { categoryCover, getCategory, maxOfferDiscount, productCount, productsIn, storeCategories, topOffers } from '@/lib/catalog';
import { homeFaq } from '@/data/faq';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';

const minPrice = (values: number[]) => Math.min(...values);

function showcaseTabs(): ShowcaseTab[] {
  const pick = (slug: string, label: string): ShowcaseTab | null => {
    const category = getCategory(slug);
    if (!category) return null;
    const products = productsIn(category).filter((p) => p.available && p.image).slice(0, 8);
    return products.length ? { id: slug, label, href: `/store/${slug}/`, products } : null;
  };
  return [
    { id: 'offers', label: 'الأعلى خصمًا', href: '/store/offers/', products: topOffers(8) },
    pick('cctv', 'كاميرات المراقبة'),
    pick('wifi-cameras', 'كاميرات واي فاي'),
    pick('smart-home', 'المنزل الذكي'),
    pick('networking', 'الشبكات'),
  ].filter((t): t is ShowcaseTab => Boolean(t));
}

export default function HomePage() {
  const tileCategories = storeCategories.filter((c) => c.slug !== 'offers' && c.slug !== 'wholesale');
  const installCategory = getCategory('installation');
  const installFrom = installCategory ? minPrice(productsIn(installCategory).filter((p) => p.price > 1).map((p) => p.price)) : 0;
  const simCategory = getCategory('sim-cards');
  const simFrom = simCategory ? minPrice(productsIn(simCategory).filter((p) => p.available).map((p) => p.price)) : 0;
  const perks = [
    { icon: Award, text: site.authorizedDistributor },
    { icon: Truck, text: site.shippingNotice },
    { icon: Receipt, text: 'فاتورة ضريبية لكل طلب' },
    { icon: RotateCcw, text: `استرجاع خلال ${site.returnDays} أيام` },
    { icon: ShieldCheck, text: 'ضمان الوكيل على الأجهزة' },
    { icon: Headset, text: 'دعم فني بالعربي' },
    { icon: PackageCheck, text: 'تركيب واستلام موثق' },
  ];

  return (
    <>
      <HeroScene productCount={productCount} maxDiscount={maxOfferDiscount} returnDays={site.returnDays} />

      <section className="perk-band" aria-label="مزايا الشراء">
        <div className="perk-track" data-marquee="1">
          {[...perks, ...perks].map(({ icon: PerkIcon, text }, i) => (
            <span key={i}><PerkIcon size={18} aria-hidden="true" /> {text}</span>
          ))}
        </div>
      </section>

      <section className="section-tight section-sand distributor-section" aria-label="اعتماد الشركة">
        <div className="container">
          <div className="distributor-band" data-reveal>
            <span className="distributor-icon"><Award size={30} aria-hidden="true" /></span>
            <div className="distributor-copy">
              <p className="kicker">اعتماد رسمي</p>
              <h2>{site.legalName} {site.authorizedDistributor}</h2>
              <p>نوفر شرائح وباقات الاتصال والبيانات عبر قنوات توزيع معتمدة، لتحصل على منتج أصلي وخدمة موثوقة.</p>
            </div>
            <span className="distributor-seal"><BadgeCheck size={18} aria-hidden="true" /> موزع معتمد</span>
          </div>
        </div>
      </section>

      <section className="section-tight section-sand" aria-label="عروض مختارة">
        <div className="container promo-row" data-stagger>
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

      <section className="section section-sand showcase-section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">من المتجر</p>
              <h2>منتجات مختارة <em>بعناية</em>.</h2>
            </div>
            <p>أسعار شاملة الضريبة، شحن مجاني، وضمان الوكيل. بدّل بين المجموعات لتجد ما يناسبك.</p>
          </div>
          <ProductShowcase tabs={showcaseTabs()} />
        </div>
      </section>

      <section className="big-type" aria-hidden="true">
        <div className="big-row" data-marquee="1"><span>كاميرات مراقبة</span><i /><span>شبكات</span><i /><span>منزل ذكي</span><i /><span>انتركوم</span><i /><span>كاميرات مراقبة</span><i /><span>شبكات</span></div>
        <div className="big-row outline" data-marquee="-1"><span>برمجة</span><i /><span>استضافة</span><i /><span>متاجر إلكترونية</span><i /><span>تطبيقات</span><i /><span>برمجة</span><i /><span>استضافة</span></div>
      </section>

      <section className="section section-paper">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <p className="kicker">أقسام المتجر</p>
              <h2>اختر الحل المناسب <em>لمساحتك</em>.</h2>
            </div>
            <Link href="/store/" className="text-link">كل المنتجات <ArrowLeft size={16} aria-hidden="true" /></Link>
          </div>
          <div className="category-grid" data-tilt-in>
            {tileCategories.map((category) => (
              <Link key={category.slug} href={`/store/${category.slug}/`} className="category-tile">
                <span className="tile-img"><ProductImage src={categoryCover(category)} alt="" /></span>
                <span className="tile-body"><h3>{category.name}</h3><span>{category.productIds.length} منتج <ArrowLeft size={14} aria-hidden="true" /></span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-darker on-dark process-section">
        <div className="glow-orb right" data-parallax="0.5" aria-hidden="true" />
        <div className="container process">
          <div className="process-side" data-reveal>
            <p className="kicker">كيف نعمل</p>
            <h2>اتجاه واضح. <em>تنفيذ أدق</em>.</h2>
            <p>سواء طلبت كاميرا أو نظامًا برمجيًا، نتبع المسار نفسه: نفهم، نقترح، ننفذ، ثم نبقى معك.</p>
            <a href={whatsappLink('مرحبًا، أحتاج استشارة لاختيار الحل المناسب.')} target="_blank" rel="noreferrer" className="btn btn-ghost">استشارة مجانية عبر واتساب <MessageCircle size={18} aria-hidden="true" /></a>
          </div>
          <ol className="process-list" data-stagger>
            <li><div><h3>نفهم احتياجك</h3><p>محادثة قصيرة عن المساحة أو المشروع والميزانية والأولويات.</p></div></li>
            <li><div><h3>نقترح الحل والسعر</h3><p>عرض واضح بالأجهزة أو نطاق العمل، والسعر شامل الضريبة دون مفاجآت.</p></div></li>
            <li><div><h3>ننفذ ونسلّم</h3><p>شحن مجاني أو تركيب ميداني، أو تسليم برمجي على مراحل معتمدة.</p></div></li>
            <li><div><h3>نتابع بعد التسليم</h3><p>ضمان ودعم فني وخطط صيانة تبقي كل شيء يعمل كما يجب.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <Faq groups={homeFaq} title={<>كل ما تريد معرفته <em>قبل أن تطلب</em>.</>} intro="جمعنا أكثر الأسئلة التي تصلنا عن الطلب والشحن والخدمات الرقمية. اختر التصنيف ثم السؤال." />
          <div className="cta-band mt-xl" data-zoom-in>
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

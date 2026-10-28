import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Check, Gauge, Languages, LockKeyhole, MessageCircle, Smartphone } from 'lucide-react';
import AddToCart from '@/components/AddToCart';
import OfferCard from '@/components/OfferCard';
import PageHero from '@/components/PageHero';
import { serviceGroups, websitePackages } from '@/data/services';
import { formatPrice } from '@/lib/format';
import { whatsappLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'البرمجة والتطوير',
  description: 'تصميم وبرمجة المواقع والمتاجر الإلكترونية وتطبيقات الجوال والأنظمة المخصصة في السعودية، مع ربط بوابات الدفع والفوترة الإلكترونية. باقات بأسعار معلنة.',
  alternates: { canonical: '/programming/' },
};

export default function ProgrammingPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'البرمجة والتطوير' }]}
        kicker="البرمجة والتطوير"
        title={<>نبني منتجك الرقمي <em>بخطة وسعر واضحين</em>.</>}
        copy="مواقع ومتاجر وتطبيقات وأنظمة تُبنى بتقنيات حديثة، وتُسلَّم بكود مصدري موثق. اختر باقة جاهزة أو اطلب عرض سعر لمشروعك."
      >
        <div className="hero-ctas">
          <a href="#packages" className="btn btn-primary">باقات المواقع <ArrowLeft size={18} aria-hidden="true" /></a>
          <a href={whatsappLink('مرحبًا، أرغب في عرض سعر لمشروع برمجي.')} target="_blank" rel="noreferrer" className="btn btn-ghost">اطلب عرض سعر <MessageCircle size={18} aria-hidden="true" /></a>
        </div>
      </PageHero>

      <section className="section section-sand" id="packages">
        <div className="container">
          <div className="section-head">
            <div><p className="kicker">باقات المواقع</p><h2>ثلاث باقات تغطي <em>أغلب الاحتياجات</em>.</h2></div>
            <p>كل الباقات تشمل تصميمًا متجاوبًا، شهادة SSL، وتسليم بيانات الدخول كاملة. الأسعار شاملة الضريبة.</p>
          </div>
          <div className="tiers light-tiers">
            {websitePackages.map((pkg) => (
              <article key={pkg.id} id={pkg.id} className={`tier ${pkg.featured ? 'featured' : ''}`}>
                {pkg.featured && <span className="tier-flag">الأكثر اختيارًا</span>}
                <h3>باقة {pkg.name}</h3>
                <p className="tier-pitch">{pkg.pitch}</p>
                <div className="tier-price"><span className="from">يبدأ من</span><strong>{formatPrice(pkg.price)}</strong></div>
                <div className="tier-meta"><span>{pkg.delivery}</span><span>{pkg.support}</span></div>
                <ul>{pkg.features.map((f) => <li key={f}><Check size={16} aria-hidden="true" />{f}</li>)}</ul>
                <AddToCart
                  label="اطلب الباقة"
                  variant={pkg.featured ? 'solid' : 'outline'}
                  item={{ key: `service:${pkg.id}`, kind: 'service', name: `باقة موقع — ${pkg.name}`, price: pkg.price, href: `/programming/#${pkg.id}`, note: 'سعر ابتدائي — يُعتمد بعرض سعر' }}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="container">
          <div className="section-head">
            <div><p className="kicker">كل الخدمات</p><h2>من المتجر إلى <em>النظام المخصص</em>.</h2></div>
            <p>السعر الموضح هو نقطة البداية، ونرسل لك عرضًا نهائيًا مكتوبًا بعد مكالمة قصيرة لفهم المتطلبات.</p>
          </div>
          {serviceGroups.map((group) => (
            <div key={group.id} className="group-block" id={group.id}>
              <div className="group-head"><h2>{group.title}</h2><p>{group.intro}</p></div>
              <div className="offer-grid">
                {group.services.map((service) => (
                  <OfferCard
                    key={service.id}
                    id={service.id}
                    kind="service"
                    name={service.name}
                    summary={service.summary}
                    points={service.features}
                    price={service.price}
                    unit={service.unit}
                    delivery={service.delivery}
                    icon={service.icon}
                    href={`/programming/#${service.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-dark on-dark">
        <div className="container">
          <div className="section-head">
            <div><p className="kicker">معاييرنا</p><h2>ما تحصل عليه <em>في كل مشروع</em>.</h2></div>
          </div>
          <div className="feature-strip">
            <div><Languages size={24} aria-hidden="true" /><h3>عربي أولًا</h3><p>واجهات من اليمين لليسار بخطوط عربية واضحة، مع دعم الإنجليزية.</p></div>
            <div><Smartphone size={24} aria-hidden="true" /><h3>الجوال أولًا</h3><p>أغلب عملائك على الجوال؛ نصمم له قبل الشاشات الكبيرة.</p></div>
            <div><Gauge size={24} aria-hidden="true" /><h3>سرعة مقاسة</h3><p>نختبر الأداء بمؤشرات Core Web Vitals قبل التسليم.</p></div>
            <div><LockKeyhole size={24} aria-hidden="true" /><h3>أمان وملكية</h3><p>تشفير، نسخ احتياطي، وتسليم الكود والحسابات باسمك.</p></div>
          </div>
        </div>
      </section>

      <section className="section section-darker on-dark">
        <div className="container process">
          <div className="process-side">
            <p className="kicker">مسار المشروع</p>
            <h2>من الفكرة إلى <em>الإطلاق</em>.</h2>
            <p>دفعات مرتبطة بمراحل معتمدة، وتواصل أسبوعي يوضح أين وصل العمل.</p>
            <Link href="/legal/services-terms/" className="btn btn-ghost">شروط الخدمات البرمجية</Link>
          </div>
          <ol className="process-list">
            <li><div><h3>تحليل المتطلبات</h3><p>جلسة لفهم أهدافك وجمهورك، ثم وثيقة نطاق وعرض سعر نهائي.</p></div></li>
            <li><div><h3>التصميم والاعتماد</h3><p>نماذج واجهات تفاعلية وجولتا مراجعة قبل كتابة سطر برمجي.</p></div></li>
            <li><div><h3>التطوير والاختبار</h3><p>بيئة تجريبية تتابع عليها التقدم، واختبار على الأجهزة الشائعة.</p></div></li>
            <li><div><h3>الإطلاق والدعم</h3><p>نشر على استضافتك أو استضافتنا، وتدريب، وفترة دعم مجانية.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <div className="section-head"><div><p className="kicker">أسئلة شائعة</p><h2>عن المشاريع البرمجية</h2></div></div>
          <div className="faq">
            <details><summary>لماذا السعر «يبدأ من»؟</summary><p>لأن كل مشروع يختلف في عدد الصفحات والتكاملات. السعر المعلن هو الحد الأدنى لنطاق الباقة، ونرسل لك عرضًا مكتوبًا قبل أي دفعة.</p></details>
            <details><summary>كيف تتم الدفعات؟</summary><p>للمشاريع حتى 6,000 ر.س: 50% عند البدء و50% عند التسليم. للمشاريع الأكبر: 40% / 30% / 30% مرتبطة بالمراحل، مع فاتورة ضريبية لكل دفعة.</p></details>
            <details><summary>هل يمكنكم تطوير موقعي الحالي؟</summary><p>نعم. نبدأ بتدقيق السرعة والأمان ({formatPrice(900)}) لتعرف الأولويات، ثم نقترح خطة التطوير.</p></details>
            <details><summary>هل تربطون الفوترة الإلكترونية؟</summary><p>نعم، نربط نظامك تقنيًا بمنصة «فاتورة» التابعة لهيئة الزكاة والضريبة والجمارك، ونختبر الربط في بيئة المحاكاة قبل الإنتاج.</p></details>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Building2, Clock3, FileBadge2, Mail, MapPin, MessageCircle, Receipt, Truck } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { productCount } from '@/lib/catalog';
import { site, whatsappLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'من نحن',
  description: `${site.legalName}: متجر سعودي للأجهزة الأمنية والذكية وبيت برمجي للمواقع والتطبيقات والاستضافة. السجل التجاري ${site.commercialRegistration}.`,
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  const facts = [
    { icon: Building2, label: 'الاسم التجاري', value: site.legalName },
    { icon: FileBadge2, label: 'السجل التجاري', value: site.commercialRegistration, ltr: true },
    { icon: Receipt, label: 'الرقم الضريبي', value: site.vatNumber, ltr: true },
    { icon: MapPin, label: 'العنوان', value: site.address },
    { icon: Clock3, label: 'أوقات العمل', value: site.hours },
    { icon: Truck, label: 'الشحن', value: site.shippingNotice },
    { icon: Mail, label: 'البريد', value: site.email, href: `mailto:${site.email}` },
    { icon: MessageCircle, label: 'واتساب', value: site.phone, href: whatsappLink(), ltr: true },
  ];

  return (
    <>
      <PageHero
        crumbs={[{ label: 'من نحن' }]}
        kicker="من نحن"
        title={<>تقنية بإيقاع <em>حياتك</em>.</>}
        copy="شركة سعودية من الرياض، نجمع بين متجر للأجهزة الأمنية والذكية وفريق برمجي يبني ويستضيف الحلول الرقمية للأفراد والمنشآت."
      />
      <section className="section section-sand">
        <div className="container split">
          <div className="prose">
            <h2>ما الذي نقدمه</h2>
            <p>بدأت {site.name} بفكرة بسيطة: أن يكون اختيار التقنية واضحًا ومطمئنًا. لذلك نعرض أكثر من {productCount} منتجًا من كاميرات المراقبة والانتركوم والشبكات والمنزل الذكي بأسعار معلنة شاملة الضريبة، ونرافقها بخدمات التركيب والضمان.</p>
            <p>ومع توسع احتياجات عملائنا من المنشآت، أضفنا مسارًا رقميًا كاملًا: تصميم وبرمجة المواقع والمتاجر وتطبيقات الجوال، والاستضافة والنطاقات، ومنتجات رقمية جاهزة. فيستطيع صاحب المحل أن يركّب كاميراته ويطلق متجره الإلكتروني ويستضيفه من جهة واحدة تعرفه.</p>
            <p>نؤمن أن الثقة تُبنى بالوضوح: سعر معلن، فاتورة ضريبية، سياسات مكتوبة، ودعم يرد عليك بالعربي.</p>
            <div className="hero-ctas">
              <Link className="btn btn-primary" href="/store/">تصفح المتجر <ArrowLeft size={18} aria-hidden="true" /></Link>
              <Link className="btn btn-outline-dark" href="/contact/">تواصل معنا</Link>
            </div>
          </div>
          <dl data-reveal className="facts" aria-label="بيانات المنشأة">
            {facts.map(({ icon: FactIcon, label, value, href, ltr }) => (
              <div key={label}>
                <dt><FactIcon size={17} aria-hidden="true" /> {label}</dt>
                <dd>{href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{ltr ? <bdi dir="ltr">{value}</bdi> : value}</a> : ltr ? <bdi dir="ltr">{value}</bdi> : value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="section section-darker on-dark">
        <div className="container process">
          <div className="process-side">
            <p className="kicker">قيمنا</p>
            <h2>وضوح. التزام. <em>متابعة</em>.</h2>
            <p>ثلاث كلمات نقيس بها كل طلب، من شريحة إنترنت إلى نظام برمجي متكامل.</p>
          </div>
          <ol className="process-list" data-stagger>
            <li><div><h3>الوضوح</h3><p>أسعار شاملة الضريبة، ومواصفات مكتوبة، وعرض سعر قبل أي التزام.</p></div></li>
            <li><div><h3>الالتزام</h3><p>مواعيد تسليم معلنة، وإبلاغ مسبق بأي تأخير، وسياسات تحفظ حقك.</p></div></li>
            <li><div><h3>المتابعة</h3><p>ضمان ودعم بعد البيع، لأن العلاقة لا تنتهي عند الدفع.</p></div></li>
          </ol>
        </div>
      </section>
    </>
  );
}

/**
 * صفحة من نحن: تعريف موجز بالعلامة وبيانات الثقة المعتمدة ومسار العمل، من دون ادعاءات غير موثقة.
 */
import { Link } from "wouter";
import { ArrowLeft, Clock3, Mail, MapPin, MessageCircle, PackageCheck, ReceiptText } from "lucide-react";
import SiteLayout, { PageHero } from "@/components/SiteLayout";
import { CtaBand, ProcessSteps } from "@/components/SiteSections";
import { useSiteData } from "@/lib/siteData";

export default function AboutPage() {
  const { content, contactEmail, contactPhone, whatsappUrl, shippingNotice, businessAddress, commercialRegistration } = useSiteData();
  const facts = [
    { icon: MapPin, label: content.business_address_label || "العنوان التجاري", value: businessAddress },
    { icon: ReceiptText, label: content.commercial_registration_label || "السجل التجاري", value: commercialRegistration },
    { icon: PackageCheck, label: "الشحن", value: shippingNotice },
    { icon: Clock3, label: content.contact_hours_label || "أوقات العمل", value: content.contact_hours || "السبت–الخميس، 9 ص–9 م" },
    { icon: Mail, label: content.contact_email_label || "البريد الإلكتروني", value: contactEmail },
    { icon: MessageCircle, label: content.contact_whatsapp_label || "واتساب", value: contactPhone, href: whatsappUrl },
  ];

  return (
    <SiteLayout>
      <PageHero
        kicker={content.about_kicker || "من نحن"}
        title={content.about_title || "منصة تسويقية سعودية بصوت واضح."}
        copy={content.about_copy || content.footer_copy || "خدمات تسويقية وحلول عرض تساعد مشروعك على الظهور بوضوح واتساق."}
      />

      <section className="about-section section-frame tight-top">
        <div className="about-story">
          <h2>{content.about_story_title || "ما الذي نقدمه"}</h2>
          <p>{content.hero_copy || "نصمم الحملات، نبني الهوية، ونصنع حلول عرض تسويقية تمنح مشروعك واجهة تعمل بوضوح وثقة."}</p>
          <p>{content.intro_copy || "من أول فكرة إلى آخر نقطة اتصال، نصنع حضورًا بصريًا محسوبًا يليق بمشروعك."}</p>
          <div className="about-links">
            <Link className="primary-link" href="/services">{content.services_all || "كل الخدمات"} <ArrowLeft size={18} /></Link>
            <Link className="outline-link" href="/products">{content.products_all || "كل المنتجات"} <ArrowLeft size={17} /></Link>
          </div>
        </div>
        <dl className="about-facts">
          {facts.map(({ icon: Icon, label, value, href }) => (
            <div key={label}>
              <dt><Icon size={17} /> {label}</dt>
              <dd>{href ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="process-section section-frame" aria-labelledby="process-title">
        <div className="process-side"><p className="kicker">{content.process_kicker || "مسار العمل"}</p><h2 id="process-title">{content.process_title || "اتجاه واضح. تنفيذ أدق."}</h2><p>{content.process_copy || "نبدأ بفهم المطلوب، ثم نرتب الأولويات ونصنع مخرجًا يخدم الهدف الفعلي لمشروعك."}</p></div>
        <ProcessSteps />
      </section>

      <CtaBand />
    </SiteLayout>
  );
}

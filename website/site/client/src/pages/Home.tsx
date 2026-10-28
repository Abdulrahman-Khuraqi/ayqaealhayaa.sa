/**
 * اتجاه الملف: صفحة رئيسية غير متماثلة لهوية «الحِرفة التسويقية الداكنة»؛
 * تتقدم الرسالة العربية على يسار المشهد البصري، وتقود كل شريحة إلى صفحتها الكاملة.
 */
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, Sparkles } from "lucide-react";
import SiteLayout from "@/components/SiteLayout";
import { CtaBand, ProcessSteps, ProductsShowcase, ServicesList } from "@/components/SiteSections";
import { HERO, useSiteData } from "@/lib/siteData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { content } = useSiteData();
  const stamp = (content.hero_stamp || "12 خدمة تحت سقف واحد").split(" ");

  return (
    <SiteLayout>
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-media" aria-hidden="true"><img src={HERO} alt="" /></div>
        <div className="hero-grid" />
        <motion.div className="hero-content" initial="hidden" animate="show" transition={{ staggerChildren: 0.08 }}>
          <motion.p variants={fadeUp} className="eyebrow"><Sparkles size={15} /> {content.hero_eyebrow || "إيقاع الحياة"}</motion.p>
          <motion.h1 variants={fadeUp} id="hero-title">{content.hero_title || "الفكرة الواضحة تستحق حضورًا لا يُنسى."}</motion.h1>
          <motion.p variants={fadeUp} className="hero-copy">{content.hero_copy || "نصمم الحملات، نبني الهوية، ونصنع حلول عرض تسويقية تمنح مشروعك واجهة تعمل بوضوح وثقة."}</motion.p>
          <motion.div variants={fadeUp} className="hero-ctas">
            <Link className="primary-link" href="/contact">{content.hero_cta_start || "ابدأ مشروعك"} <ArrowLeft size={18} /></Link>
            <Link className="text-link" href="/products">{content.hero_cta_browse || "تصفح المنتجات"} <ChevronDown size={17} /></Link>
          </motion.div>
        </motion.div>
        <motion.div className="hero-stamp" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.32 }}>
          <span>{stamp[0]}</span><p>{stamp.slice(1).join(" ")}</p>
        </motion.div>
        <Link href="/services" className="scroll-cue" aria-label="الانتقال إلى الخدمات"><span /> {content.hero_cta_discover || "اكتشف المزيد"}</Link>
      </section>

      <section className="intro-band">
        <p>{content.intro_copy || "من أول فكرة إلى آخر نقطة اتصال، نصنع حضورًا بصريًا محسوبًا يليق بمشروعك."}</p>
        <div>{(content.intro_tags || "إبداع · تنفيذ · أثر").split("·").map((tag, index, values) => <span key={`${tag}-${index}`}>{tag.trim()}{index < values.length - 1 && <i />}</span>)}</div>
      </section>

      <section className="services-section section-frame" aria-labelledby="services-title">
        <div className="section-heading split-heading">
          <div><p className="kicker">{content.services_kicker || "خدماتنا"}</p><h2 id="services-title">{content.services_title || "تسويق يبني حضورًا لا مجرد انطباع."}</h2></div>
          <p>{content.services_intro || "نرتب العناصر التي تصنع فرقًا حقيقيًا في حضور مشروعك؛ من الرسالة والهوية إلى القنوات ووسائل العرض."}</p>
        </div>
        <ServicesList limit={3} />
        <Link className="more-link" href="/services">{content.services_all || "كل الخدمات"} <ArrowLeft size={17} /></Link>
      </section>

      <section className="products-section section-frame" aria-labelledby="products-title">
        <div className="products-topline"><p className="kicker">{content.products_kicker || "منتجات مختارة"}</p><div className="line" /><span>{content.products_support || "حلول عرض حاضرة طوال اليوم"}</span></div>
        <div className="section-heading product-heading"><h2 id="products-title">{content.products_title || "كل واجهة تستحق أن تتكلم بثقة."}</h2><p>{content.products_intro || "شاشات العرض والستاندات التسويقية تمنح رسالتك مكانًا واضحًا في لحظة القرار."}</p></div>
        <ProductsShowcase limit={3} />
        <Link className="more-link dark" href="/products">{content.products_all || "كل المنتجات"} <ArrowLeft size={17} /></Link>
      </section>

      <section className="process-section section-frame" aria-labelledby="process-title">
        <div className="process-side"><p className="kicker">{content.process_kicker || "مسار العمل"}</p><h2 id="process-title">{content.process_title || "اتجاه واضح. تنفيذ أدق."}</h2><p>{content.process_copy || "نبدأ بفهم المطلوب، ثم نرتب الأولويات ونصنع مخرجًا يخدم الهدف الفعلي لمشروعك."}</p><Link className="outline-link" href="/contact">{content.process_cta || "حدثنا عن فكرتك"} <ArrowLeft size={17} /></Link></div>
        <ProcessSteps />
      </section>

      <CtaBand />
    </SiteLayout>
  );
}

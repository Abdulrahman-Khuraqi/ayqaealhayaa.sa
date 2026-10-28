/**
 * أقسام قابلة لإعادة الاستخدام بين الرئيسية وصفحاتها الداخلية: الخدمات، المنتجات، مسار العمل، ودعوة التواصل.
 */
import { Link } from "wouter";
import { ArrowLeft, Monitor, PackageCheck, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { STAND, canBuy, useSiteData } from "@/lib/siteData";

export function ServicesList({ limit }: { limit?: number }) {
  const { content, services } = useSiteData();
  const { addToCart } = useCart();
  const shown = limit ? services.slice(0, limit) : services;
  return (
    <div className="services-list">
      {shown.map((service, index) => canBuy(service) ? (
        <div className="service-row" key={service.id}>
          <span className="service-no">0{index + 1}</span>
          <h3>{service.name}</h3>
          <span className="service-buy"><strong>{service.price}</strong><button onClick={() => addToCart(service)} aria-label={`إضافة ${service.name} إلى السلة`}><Plus size={17} /> {content.add_to_cart || "أضف للسلة"}</button></span>
        </div>
      ) : (
        <Link href="/contact" className="service-row" key={service.id}>
          <span className="service-no">0{index + 1}</span>
          <h3>{service.name}</h3>
          <span className="service-arrow"><ArrowLeft size={21} /></span>
        </Link>
      ))}
    </div>
  );
}

export function ProductsShowcase({ limit }: { limit?: number }) {
  const { content, products } = useSiteData();
  const { addToCart } = useCart();
  const featured = products[0];
  const rest = products.slice(1, limit ? limit : undefined);
  return (
    <div className="product-layout">
      <article className="featured-product">
        <div className="featured-image">
          <img src={featured?.image || STAND} alt={featured?.name || "استاند شاشة عروض تسويقية"} />
          <span>{content.featured_badge || "الأكثر حضورًا"}</span>
        </div>
        <div className="featured-info">
          <div><p>{featured?.type || "شاشات العروض"}</p><h3>{featured?.name || "استاندات عرض تتكلم عن علامتك."}</h3></div>
          {featured && canBuy(featured)
            ? <div className="featured-buy"><strong>{featured.price}</strong><button onClick={() => addToCart(featured)} aria-label={`إضافة ${featured.name} إلى السلة`}><Plus /></button></div>
            : <Link href="/contact" aria-label="الاستفسار عن المنتج"><ArrowLeft /></Link>}
        </div>
      </article>
      <div className="product-stack">
        {rest.map((product) => (
          <article className="product-card" key={product.id}>
            {product.image ? <img src={product.image} alt={product.name} /> : <div className="product-icon"><Monitor size={37} /></div>}
            <div className="product-card-info">
              <p>{product.type}</p>
              <h3>{product.name}</h3>
              <div>
                <strong>{product.price}</strong>
                {canBuy(product)
                  ? <button onClick={() => addToCart(product)} aria-label={`إضافة ${product.name} إلى السلة`}><Plus size={18} /></button>
                  : <Link href="/contact" aria-label={`طلب عرض سعر لـ ${product.name}`}><ArrowLeft size={16} /></Link>}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ProductNote() {
  const { content } = useSiteData();
  return (
    <div className="product-note">
      <PackageCheck size={20} />
      <span>{content.product_note || "للطلبات الخاصة والمقاسات غير المعروضة، تواصل معنا للحصول على عرض مناسب."}</span>
      <Link href="/contact">{content.product_note_cta || "اطلب عرضًا"} <ArrowLeft size={16} /></Link>
    </div>
  );
}

export function ProcessSteps() {
  const { content } = useSiteData();
  return (
    <div className="process-list">
      <div><span>01</span><h3>{content.process_step_1_title || "نستمع"}</h3><p>{content.process_step_1_copy || "نفهم المشروع والهدف والجمهور قبل اقتراح أي حل."}</p></div>
      <div><span>02</span><h3>{content.process_step_2_title || "نصمم الاتجاه"}</h3><p>{content.process_step_2_copy || "نبني تصورًا بصريًا وتسويقيًا قابلًا للتنفيذ والقياس."}</p></div>
      <div><span>03</span><h3>{content.process_step_3_title || "ننفّذ ونُسلّم"}</h3><p>{content.process_step_3_copy || "نحوّل التصور إلى مخرجات واضحة ضمن نطاق العمل المتفق عليه."}</p></div>
    </div>
  );
}

export function CtaBand() {
  const { content } = useSiteData();
  return (
    <section className="cta-band section-frame">
      <div>
        <p className="kicker">{content.contact_kicker || "تواصل معنا"}</p>
        <h2>{content.contact_title || "لنحوّل واجهتك إلى رسالة تعمل طوال اليوم."}</h2>
      </div>
      <Link className="primary-link" href="/contact">{content.hero_cta_start || "ابدأ مشروعك"} <ArrowLeft size={18} /></Link>
    </section>
  );
}

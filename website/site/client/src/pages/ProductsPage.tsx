/**
 * صفحة المنتجات: كل شاشات العرض والستاندات والخدمات القابلة للشراء مع سلة الطلب.
 */
import SiteLayout, { PageHero } from "@/components/SiteLayout";
import { CtaBand, ProductNote, ProductsShowcase } from "@/components/SiteSections";
import { useSiteData } from "@/lib/siteData";

export default function ProductsPage() {
  const { content } = useSiteData();
  return (
    <SiteLayout>
      <PageHero
        kicker={content.products_kicker || "منتجات مختارة"}
        title={content.products_title || "كل واجهة تستحق أن تتكلم بثقة."}
        copy={content.products_intro || "شاشات العرض والستاندات التسويقية تمنح رسالتك مكانًا واضحًا في لحظة القرار."}
      />
      <section className="products-section section-frame tight-top" aria-label="قائمة المنتجات">
        <ProductsShowcase />
        <ProductNote />
      </section>
      <CtaBand />
    </SiteLayout>
  );
}

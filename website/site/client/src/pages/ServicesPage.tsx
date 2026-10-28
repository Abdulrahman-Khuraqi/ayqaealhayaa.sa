/**
 * صفحة الخدمات: القائمة الكاملة للخدمات مع الأسعار المعلنة وطلب عرض لما يُسعَّر حسب الطلب.
 */
import SiteLayout, { PageHero } from "@/components/SiteLayout";
import { CtaBand, ServicesList } from "@/components/SiteSections";
import { useSiteData } from "@/lib/siteData";

export default function ServicesPage() {
  const { content } = useSiteData();
  return (
    <SiteLayout>
      <PageHero
        kicker={content.services_kicker || "خدماتنا"}
        title={content.services_title || "تسويق يبني حضورًا لا مجرد انطباع."}
        copy={content.services_intro || "نرتب العناصر التي تصنع فرقًا حقيقيًا في حضور مشروعك؛ من الرسالة والهوية إلى القنوات ووسائل العرض."}
      />
      <section className="services-section section-frame tight-top" aria-label="قائمة الخدمات">
        <ServicesList />
      </section>
      <CtaBand />
    </SiteLayout>
  );
}

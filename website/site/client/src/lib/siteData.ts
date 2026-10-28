/**
 * بيانات الموقع المشتركة بين الصفحات: الكتالوج والمحتوى المُدار وبيانات التواصل،
 * مع قيم احتياطية عندما لا تتوفر بيانات من لوحة الإدارة.
 */
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export const LOGO = "/manus-storage/ayqae-logo-mark_dc786b30.png";
export const HERO = "/manus-storage/ayqae-hero-reference_49faf11f.jpg";
export const STAND = "/manus-storage/ayqae-display-stand_6a943072.jpg";
export const CLOCK = "/manus-storage/ayqae-display-clock_15eece1b.jpg";

export type Product = {
  id: number;
  name: string;
  price: string;
  type: string;
  image?: string;
  // Only items with a fixed price can be paid online; the rest are quoted over WhatsApp.
  priceHalalas?: number | null;
};

export type CartItem = Product & { quantity: number };

export const formatSar = (halalas: number) => `${(halalas / 100).toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`;
export const canBuy = (item: Product) => !!item.priceHalalas && item.priceHalalas > 0;

// Mirrors what https://ayqaealhayaa.sa/ lists today (8 services, same order).
const fallbackServices = [
  "تصميم إعلانات للسوشل ميديا",
  "تصميم شعار وهوية مختصرة",
  "تصميم الإعلانات والحملات",
  "فتح ورعاية المتاجر الإلكترونية",
  "تصميم الهوية البصرية",
  "إدارة السوشل ميديا",
  "دراسات الجدوى للمشاريع",
  "تسجيل العلامات التجارية",
];

const fallbackProducts: Product[] = [
  { id: 1, name: "استاند عروض تسويقية للمطاعم والمحلات", price: "السعر عند الطلب", type: "شاشات العروض", image: STAND },
  { id: 2, name: "تحفة فنية + شاشة عرض 32 إنش", price: "٧٬٠٠٠ ر.س", type: "شاشات العروض", image: CLOCK },
  { id: 3, name: "شاشة عرض تسويقية مقاس 32 إنش", price: "٥٬٥٠٠ ر.س", type: "شاشات العروض", image: STAND },
  { id: 4, name: "شاشات عروض بمقاسات خاصة", price: "السعر عند الطلب", type: "حلول مخصصة" },
];

export function useSiteData() {
  const catalogQuery = trpc.store.publicCatalog.useQuery();
  const contentQuery = trpc.store.publicContent.useQuery();
  const content = contentQuery.data ?? {};

  const contactPhone = content.contact_phone || "0570070539";
  const contactEmail = content.contact_email || "cs@ayqaealhayaa.sa";
  const whatsappUrl = `https://wa.me/966${contactPhone.replace(/\D/g, "").replace(/^0/, "")}`;
  const shippingNotice = content.shipping_notice || "شحن مجاني داخل المملكة العربية السعودية";
  const businessAddress = content.business_address || "الرياض، حي السلي";
  const commercialRegistration = content.commercial_registration || "7033944427";

  const { products, services } = useMemo(() => {
    const toProduct = (item: NonNullable<typeof catalogQuery.data>[number]): Product => ({
      id: item.id,
      name: item.name,
      price: item.price == null ? (item.priceLabel || "السعر عند الطلب") : `${item.price.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`,
      type: item.category,
      image: item.imageUrl || undefined,
      priceHalalas: item.priceHalalas,
    });
    const all = catalogQuery.data ?? [];
    const managedProducts = all.filter(item => item.kind === "product").map(toProduct);
    const managedServices = all.filter(item => item.kind === "service").map(toProduct);
    return {
      products: managedProducts.length ? managedProducts : fallbackProducts,
      services: managedServices.length
        ? managedServices
        : fallbackServices.map((name, index): Product => ({ id: -(index + 1), name, price: "", type: "" })),
    };
  }, [catalogQuery.data]);

  return { content, contactPhone, contactEmail, whatsappUrl, shippingNotice, businessAddress, commercialRegistration, products, services };
}

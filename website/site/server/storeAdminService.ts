import crypto from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { catalogItems, type CatalogItem, type StoreOrder, storeContent, storeOrders } from "../drizzle/schema";
import { storagePut } from "./storage";
import { getDb } from "./db";

export type CatalogInput = {
  kind: "product" | "service";
  name: string;
  category: string;
  description?: string;
  priceHalalas?: number | null;
  priceLabel?: string;
  imageUrl?: string;
  imageKey?: string;
  featured?: boolean;
  active?: boolean;
  sortOrder?: number;
};

export const storeContentDefaults: Record<string, string> = {
  hero_eyebrow: "إيقاع الحياة",
  hero_title: "الفكرة الواضحة تستحق حضورًا لا يُنسى.",
  hero_copy: "نصمم الحملات، نبني الهوية، ونصنع حلول عرض تسويقية تمنح مشروعك واجهة تعمل بوضوح وثقة.",
  hero_stamp: "12 خدمة تحت سقف واحد",
  nav_services: "خدماتنا",
  nav_products: "المنتجات",
  nav_process: "كيف نعمل",
  nav_contact: "تواصل معنا",
  nav_order: "الطلب",
  legal_terms_label: "الشروط والأحكام",
  legal_privacy_refund_label: "الخصوصية والاسترداد",
  legal_privacy_label: "سياسة الخصوصية",
  legal_refund_label: "سياسة الاسترداد",
  hero_cta_start: "ابدأ مشروعك",
  hero_cta_browse: "تصفح المنتجات",
  hero_cta_discover: "اكتشف المزيد",
  intro_copy: "من أول فكرة إلى آخر نقطة اتصال، نصنع حضورًا بصريًا محسوبًا يليق بمشروعك.",
  intro_tags: "إبداع · تنفيذ · أثر",
  services_kicker: "خدماتنا",
  services_title: "تسويق يبني حضورًا لا مجرد انطباع.",
  services_intro: "نرتب العناصر التي تصنع فرقًا حقيقيًا في حضور مشروعك؛ من الرسالة والهوية إلى القنوات ووسائل العرض.",
  products_kicker: "منتجات مختارة",
  products_support: "حلول عرض حاضرة طوال اليوم",
  products_title: "كل واجهة تستحق أن تتكلم بثقة.",
  products_intro: "شاشات العرض والستاندات التسويقية تمنح رسالتك مكانًا واضحًا في لحظة القرار.",
  featured_badge: "الأكثر حضورًا",
  product_note: "للطلبات الخاصة والمقاسات غير المعروضة، تواصل معنا للحصول على عرض مناسب.",
  product_note_cta: "اطلب عرضًا",
  process_kicker: "مسار العمل",
  process_title: "اتجاه واضح. تنفيذ أدق.",
  process_copy: "نبدأ بفهم المطلوب، ثم نرتب الأولويات ونصنع مخرجًا يخدم الهدف الفعلي لمشروعك.",
  process_cta: "حدثنا عن فكرتك",
  process_step_1_title: "نستمع",
  process_step_1_copy: "نفهم المشروع والهدف والجمهور قبل اقتراح أي حل.",
  process_step_2_title: "نصمم الاتجاه",
  process_step_2_copy: "نبني تصورًا بصريًا وتسويقيًا قابلًا للتنفيذ والقياس.",
  process_step_3_title: "ننفيذ ونُسلّم",
  process_step_3_copy: "نحوّل التصور إلى مخرجات واضحة ضمن نطاق العمل المتفق عليه.",
  contact_kicker: "تواصل معنا",
  contact_title: "لنحوّل واجهتك إلى رسالة تعمل طوال اليوم.",
  contact_copy: "شاركنا ما تحتاجه، وسنرتب معك الخطوة التالية عبر البريد أو واتساب.",
  contact_form_title: "أرسل طلبك",
  contact_form_help: "سننتقل بك إلى واتساب لإتمام التواصل.",
  contact_name_label: "الاسم",
  contact_phone_label: "رقم الجوال",
  contact_message_label: "تفاصيل الطلب",
  contact_name_placeholder: "اسمك الكريم",
  contact_phone_placeholder: "05xxxxxxxx",
  contact_message_placeholder: "ما الذي تخطط له؟",
  contact_submit: "إرسال عبر واتساب",
  contact_legal_prefix: "بإرسال الطلب، تقر باطلاعك على",
  contact_email_label: "البريد الإلكتروني",
  contact_whatsapp_label: "واتساب",
  contact_hours_label: "أوقات العمل",
  cart_title: "سلة الطلب",
  cart_empty_title: "سلتك هادئة الآن.",
  cart_empty_copy: "أضف ما يناسب مشروعك، ثم أرسل طلبك عبر واتساب.",
  cart_notice: "الطلب والتأكيد عبر واتساب",
  cart_checkout: "إتمام الطلب",
  // Online payment through pay.ayqaealhayaa.sa
  add_to_cart: "أضف للسلة",
  cart_total: "الإجمالي",
  cart_notice_pay: "دفع آمن بالبطاقة عبر PayOne (مدى، فيزا، ماستركارد)",
  cart_checkout_pay: "إتمام الطلب والدفع",
  cart_whatsapp: "أو أرسل الطلب عبر واتساب",
  cart_empty_copy_pay: "أضف ما يناسب مشروعك، ثم أتمم الطلب وادفع بأمان.",
  cart_open_aria: "فتح سلة الطلب",
  cart_close_aria: "إغلاق السلة",
  footer_nav_heading: "تصفح",
  footer_legal_heading: "روابط قانونية",
  footer_help: "للاستفسارات والطلبات",
  footer_rights: "© 2026 إيقاع الحياة. جميع الحقوق محفوظة.",
  footer_country: "المملكة العربية السعودية",
  contact_email: "cs@ayqaealhayaa.sa",
  contact_phone: "0570070539",
  contact_hours: "السبت–الخميس، 9 ص–9 م",
  shipping_notice: "شحن مجاني داخل المملكة العربية السعودية",
  business_address_label: "العنوان التجاري",
  business_address: "الرياض، حي السلي",
  commercial_registration_label: "السجل التجاري",
  commercial_registration: "7033944427",
  footer_copy: "خدمات تسويقية وحلول عرض تساعد مشروعك على الظهور بوضوح واتساق.",
  terms_summary: "تسري الشروط والأحكام على استخدام متجر إيقاع الحياة وطلب خدماته ومنتجاته.",
  privacy_summary: "توضح هذه السياسة كيفية جمع بيانات العملاء واستخدامها وحمايتها.",
  refund_summary: "يمكن طلب الاستبدال أو الاسترداد وفق حالة الطلب والسياسة المعلنة في المتجر.",
  terms_full: "تنظم هذه الشروط استخدام متجر إيقاع الحياة وطلب المنتجات والخدمات المعروضة فيه. باستخدام الموقع أو إرسال طلب، فإنك تقر باطلاعك على هذه الشروط وعلى سياسة الخصوصية والاسترداد.\n\nيعرض المتجر منتجات وخدمات قد تختلف مواصفاتها ومدد تنفيذها بحسب نطاق العمل المتفق عليه. تظهر الأسعار بالريال السعودي أو عبارة السعر عند الطلب، ويُؤكد السعر النهائي وطريقة الدفع والتنفيذ قبل إتمام التعاقد.\n\nالشحن مجاني داخل المملكة العربية السعودية. يحدد موعد التسليم وفق نوع المنتج أو الخدمة ومكان التسليم بعد تأكيد الطلب.\n\nتتم متابعة الطلبات والتأكيد حاليًا عبر واتساب أو روابط الدفع المعتمدة. لا تطلب إيقاع الحياة معلومات البطاقات المصرفية عبر واتساب.\n\nالعنوان التجاري: الرياض، حي السلي. السجل التجاري: 7033944427.\n\nتظل حقوق العلامة والنصوص والتصاميم والصور والمحتوى لإيقاع الحياة أو لأصحاب الحقوق فيها، ولا يجوز نسخها أو إعادة استخدامها دون موافقة خطية. تخضع هذه الشروط للأنظمة النافذة في المملكة العربية السعودية.",
  privacy_full: "تحترم إيقاع الحياة خصوصية زوار الموقع وعملائه. قد نجمع الاسم ورقم الجوال والبريد الإلكتروني ومحتوى الرسالة وتفاصيل المنتج أو الخدمة المطلوبة، واي بيانات لازمة لتنفيذ طلب مؤكد.\n\nنستخدم البيانات للرد على الاستفسارات وتأكيد وتنفيذ الطلبات والدعم والوفاء بالالتزامات النظامية وحماية الموقع. لا نبيع البيانات الشخصية.\n\nقد نشارك الحد الأدنى اللازم من البيانات مع مزودي الاستضافة أو الشحن أو الدفع عند تفعيله، أو مع الجهات التي يلزمها النظام، بالقدر الضروري لتشغيل الخدمة وتنفيذ الطلب. يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو طلب إتلافها عند انتفاء الحاجة عبر وسائل التواصل المنشورة.",
  refund_full: "يلتزم المتجر بحقوق المستهلك المقررة نظامًا. يمكن طلب الاستبدال أو الاسترجاع خلال 10 أيام من استلام المنتج متى لم يستخدم وكان بحالته الأصلية مع ملحقاته وتغليفه المناسب لطبيعة المنتج.\n\nيُقبل الطلب عند وصول منتج معيب أو غير مطابق أو عند وجود خطأ في المنتج المرسل أو استيفاء شروط الإرجاع خلال المدة المحددة. لا ينطبق الاسترداد عادة على المنتجات المصنوعة أو المخصصة بطلب العميل إلا عند العيب أو عدم المطابقة، ولا على الخدمة التي بدأ تنفيذها أو استفاد منها العميل.\n\nقد يتحمل العميل تكلفة الإرجاع أو الإلغاء ما لم يكن السبب عيبًا أو خطأً من المتجر أو يوجد اتفاق مختلف. لبدء طلب الاسترداد أو الاستبدال، تواصل معنا وأرفق وصفًا واضحًا وصورًا عند توفرها.",
};

export const currentCatalogDefaults: CatalogInput[] = [
  { kind: "product", name: "استاند عروض تسويقية للمطاعم والمحلات", category: "شاشات العروض", priceHalalas: 1_000_000, imageUrl: "/manus-storage/ayqae-display-stand_6a943072.jpg", featured: true, sortOrder: 1 },
  { kind: "product", name: "تحفة فنية + شاشة عرض 32 إنش", category: "شاشات العروض", priceHalalas: 700_000, imageUrl: "/manus-storage/ayqae-display-clock_15eece1b.jpg", sortOrder: 2 },
  { kind: "product", name: "شاشة عرض تسويقية مقاس 32 إنش", category: "شاشات العروض", priceHalalas: 550_000, imageUrl: "/manus-storage/ayqae-display-stand_6a943072.jpg", sortOrder: 3 },
  { kind: "service", name: "تصميم إعلانات للسوشل ميديا", category: "خدمة تصميم", priceHalalas: 5_000, sortOrder: 4 },
  { kind: "service", name: "تصميم شعار وهوية مختصرة", category: "خدمة تصميم", priceHalalas: 10_000, sortOrder: 5 },
  { kind: "product", name: "شاشات عروض بمقاسات خاصة", category: "حلول مخصصة", priceLabel: "السعر عند الطلب", sortOrder: 6 },
  { kind: "service", name: "تصميم الإعلانات والحملات", category: "خدمات تسويقية", sortOrder: 10 },
  { kind: "service", name: "فتح ورعاية المتاجر الإلكترونية", category: "خدمات تسويقية", sortOrder: 11 },
  { kind: "service", name: "تصميم الهوية البصرية", category: "خدمات تسويقية", sortOrder: 12 },
  { kind: "service", name: "إدارة السوشل ميديا", category: "خدمات تسويقية", sortOrder: 13 },
  { kind: "service", name: "دراسات الجدوى للمشاريع", category: "خدمات تسويقية", sortOrder: 14 },
  { kind: "service", name: "تسجيل العلامات التجارية", category: "خدمات تسويقية", sortOrder: 15 },
];

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new Error("قاعدة بيانات المتجر غير متاحة");
  return db;
}

export function toHalalas(amount: number | null | undefined) {
  return amount == null ? null : Math.round(amount * 100);
}

export function toMoney(amountHalalas: number | null) {
  return amountHalalas == null ? null : amountHalalas / 100;
}

export function createOrderReference(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `ORD-${date}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function listCatalogItems(includeInactive = false) {
  const db = requireDb(await getDb());
  const where = includeInactive ? undefined : eq(catalogItems.active, true);
  return db.select().from(catalogItems).where(where).orderBy(asc(catalogItems.sortOrder), desc(catalogItems.createdAt));
}

export async function getCatalogItem(id: number) {
  const db = requireDb(await getDb());
  const rows = await db.select().from(catalogItems).where(eq(catalogItems.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCatalogItem(input: CatalogInput, createdBy: number) {
  const db = requireDb(await getDb());
  const values = {
    ...input,
    description: input.description || null,
    priceHalalas: input.priceHalalas ?? null,
    priceLabel: input.priceLabel || null,
    imageUrl: input.imageUrl || null,
    imageKey: input.imageKey || null,
    featured: input.featured ?? false,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
    createdBy,
  };
  const result = await db.insert(catalogItems).values(values);
  return getCatalogItem(Number(result[0].insertId));
}

export async function updateCatalogItem(id: number, input: CatalogInput) {
  const db = requireDb(await getDb());
  await db.update(catalogItems).set({
    ...input,
    description: input.description || null,
    priceHalalas: input.priceHalalas ?? null,
    priceLabel: input.priceLabel || null,
    imageUrl: input.imageUrl || null,
    imageKey: input.imageKey || null,
    featured: input.featured ?? false,
    active: input.active ?? true,
    sortOrder: input.sortOrder ?? 0,
  }).where(eq(catalogItems.id, id));
  return getCatalogItem(id);
}

export async function archiveCatalogItem(id: number) {
  const db = requireDb(await getDb());
  await db.update(catalogItems).set({ active: false }).where(eq(catalogItems.id, id));
  return { success: true };
}

export async function listStoreContent() {
  const db = requireDb(await getDb());
  const rows = await db.select().from(storeContent);
  return rows.reduce<Record<string, string>>((output, item) => ({ ...output, [item.key]: item.value }), { ...storeContentDefaults });
}

export async function upsertStoreContent(entries: Record<string, string>, updatedBy: number) {
  const db = requireDb(await getDb());
  const safeEntries = Object.entries(entries).filter(([key, value]) => key in storeContentDefaults && typeof value === "string");
  for (const [key, value] of safeEntries) {
    await db.insert(storeContent).values({ key, value: value.trim(), updatedBy }).onDuplicateKeyUpdate({ set: { value: value.trim(), updatedBy } });
  }
  return listStoreContent();
}

export async function bootstrapCurrentStoreContent(createdBy: number) {
  const db = requireDb(await getDb());
  const existing = await db.select({ id: catalogItems.id }).from(catalogItems).limit(1);
  if (!existing.length) {
    await db.insert(catalogItems).values(currentCatalogDefaults.map(item => ({
      ...item,
      description: item.description || null,
      priceHalalas: item.priceHalalas ?? null,
      priceLabel: item.priceLabel || null,
      imageUrl: item.imageUrl || null,
      imageKey: null,
      featured: item.featured ?? false,
      active: true,
      sortOrder: item.sortOrder ?? 0,
      createdBy,
    })));
  }
  await upsertStoreContent(storeContentDefaults, createdBy);
  return { imported: !existing.length };
}

export async function listOrders() {
  const db = requireDb(await getDb());
  return db.select().from(storeOrders).orderBy(desc(storeOrders.createdAt));
}

export async function createStoreOrder(input: {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  summary: string;
  notes?: string;
  amountHalalas?: number | null;
  createdBy: number;
}) {
  const db = requireDb(await getDb());
  const reference = createOrderReference();
  const result = await db.insert(storeOrders).values({
    reference,
    customerName: input.customerName,
    customerEmail: input.customerEmail || null,
    customerPhone: input.customerPhone || null,
    summary: input.summary,
    notes: input.notes || null,
    amountHalalas: input.amountHalalas ?? null,
    createdBy: input.createdBy,
  });
  const rows = await db.select().from(storeOrders).where(eq(storeOrders.id, Number(result[0].insertId))).limit(1);
  return rows[0] ?? null;
}

export async function updateStoreOrder(id: number, input: { status: "new" | "contacted" | "quoted" | "in_progress" | "completed" | "cancelled"; notes?: string; amountHalalas?: number | null; invoiceId?: number | null }) {
  const db = requireDb(await getDb());
  await db.update(storeOrders).set({
    status: input.status,
    notes: input.notes || null,
    amountHalalas: input.amountHalalas ?? null,
    invoiceId: input.invoiceId ?? null,
  }).where(eq(storeOrders.id, id));
  const rows = await db.select().from(storeOrders).where(eq(storeOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function uploadCatalogImage(dataUrl: string, uploadedBy: number) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("صيغة الصورة غير مدعومة");
  const [, contentType, base64] = match;
  const file = Buffer.from(base64, "base64");
  if (!file.length || file.length > 4 * 1024 * 1024) throw new Error("يجب ألا يتجاوز حجم الصورة 4 ميغابايت");
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const stored = await storagePut(`store/${uploadedBy}/catalog/${crypto.randomUUID()}.${extension}`, file, contentType);
  return stored;
}

export function serializeCatalogItem(item: CatalogItem) {
  return { ...item, price: toMoney(item.priceHalalas) };
}

export function serializeOrder(order: StoreOrder) {
  return { ...order, amount: toMoney(order.amountHalalas) };
}

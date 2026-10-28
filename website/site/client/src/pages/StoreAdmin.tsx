import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Archive, ClipboardList, CreditCard, FileText, ImagePlus, Loader2, PackagePlus, Pencil, Plus, Save, Settings2, ShoppingBag, X } from "lucide-react";
import CCAvenueSettingsPanel from "@/components/CCAvenueSettingsPanel";
import NeoleapSettingsPanel from "@/components/NeoleapSettingsPanel";
import { ChangeEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type CatalogDraft = {
  id?: number;
  kind: "product" | "service";
  name: string;
  category: string;
  description: string;
  price: string;
  priceLabel: string;
  imageUrl: string;
  imageKey: string;
  featured: boolean;
  active: boolean;
  sortOrder: string;
};

const emptyCatalogDraft: CatalogDraft = { kind: "product", name: "", category: "", description: "", price: "", priceLabel: "", imageUrl: "", imageKey: "", featured: false, active: true, sortOrder: "0" };
const contentFields = [
  ["hero_eyebrow", "العبارة الصغيرة في البطل"], ["hero_title", "عنوان الصفحة الرئيسية"], ["hero_copy", "وصف البطل"],
  ["hero_stamp", "شارة البطل"], ["nav_services", "تنقل: الخدمات"], ["nav_products", "تنقل: المنتجات"], ["nav_process", "تنقل: كيف نعمل"], ["nav_contact", "تنقل: التواصل"], ["nav_order", "تنقل: زر الطلب"], ["legal_terms_label", "تسمية الشروط"], ["legal_privacy_refund_label", "تسمية الخصوصية والاسترداد"], ["legal_privacy_label", "تسمية سياسة الخصوصية"], ["legal_refund_label", "تسمية سياسة الاسترداد"], ["hero_cta_start", "زر البطل الأول"], ["hero_cta_browse", "زر البطل الثاني"], ["hero_cta_discover", "دعوة الاكتشاف"], ["intro_copy", "نص الشريط التعريفي"], ["intro_tags", "وسوم الشريط التعريفي"],
  ["services_kicker", "ترويسة الخدمات"], ["services_title", "عنوان الخدمات"], ["services_intro", "وصف الخدمات"],
  ["products_kicker", "ترويسة المنتجات"], ["products_support", "نص مساند للمنتجات"], ["products_title", "عنوان المنتجات"], ["products_intro", "وصف المنتجات"], ["featured_badge", "شارة المنتج المميز"], ["product_note", "تنبيه المنتجات"], ["product_note_cta", "دعوة إجراء المنتجات"],
  ["process_kicker", "ترويسة مسار العمل"], ["process_title", "عنوان مسار العمل"], ["process_copy", "وصف مسار العمل"], ["process_cta", "دعوة إجراء مسار العمل"],
  ["process_step_1_title", "عنوان الخطوة 1"], ["process_step_1_copy", "وصف الخطوة 1"], ["process_step_2_title", "عنوان الخطوة 2"], ["process_step_2_copy", "وصف الخطوة 2"], ["process_step_3_title", "عنوان الخطوة 3"], ["process_step_3_copy", "وصف الخطوة 3"],
  ["contact_kicker", "ترويسة التواصل"], ["contact_title", "عنوان التواصل"], ["contact_copy", "وصف التواصل"], ["contact_form_title", "عنوان نموذج التواصل"], ["contact_form_help", "مساعدة نموذج التواصل"], ["contact_name_label", "نص حقل الاسم"], ["contact_phone_label", "نص حقل الجوال"], ["contact_message_label", "نص حقل التفاصيل"], ["contact_name_placeholder", "مثال الاسم"], ["contact_phone_placeholder", "مثال الجوال"], ["contact_message_placeholder", "مثال التفاصيل"], ["contact_submit", "نص زر التواصل"], ["contact_legal_prefix", "بادئة إقرار النموذج"], ["contact_email", "بريد التواصل"],
  ["contact_phone", "رقم واتساب"], ["contact_hours", "أوقات العمل"], ["contact_email_label", "تسمية البريد"], ["contact_whatsapp_label", "تسمية واتساب"], ["contact_hours_label", "تسمية أوقات العمل"], ["shipping_notice", "عبارة الشحن"], ["business_address_label", "تسمية العنوان التجاري"], ["business_address", "العنوان التجاري"], ["commercial_registration_label", "تسمية السجل التجاري"], ["commercial_registration", "رقم السجل التجاري"], ["cart_title", "عنوان السلة"], ["cart_empty_title", "عنوان السلة الفارغة"], ["cart_empty_copy", "وصف السلة الفارغة"], ["cart_notice", "تنبيه السلة"], ["cart_checkout", "زر السلة"], ["cart_open_aria", "تسمية فتح السلة"], ["cart_close_aria", "تسمية إغلاق السلة"], ["footer_nav_heading", "عنوان تنقل التذييل"], ["footer_legal_heading", "عنوان قانوني التذييل"], ["footer_help", "وصف تذييل التواصل"], ["footer_rights", "حقوق التذييل"], ["footer_country", "بلد التذييل"], ["footer_copy", "وصف التذييل"],
  ["terms_summary", "ملخص الشروط والأحكام"], ["privacy_summary", "ملخص سياسة الخصوصية"], ["refund_summary", "ملخص سياسة الاسترداد"],
  ["terms_full", "النص الكامل للشروط والأحكام"], ["privacy_full", "النص الكامل لسياسة الخصوصية"], ["refund_full", "النص الكامل لسياسة الاسترداد"],
] as const;

function formatMoney(value: number | null) {
  return value == null ? "السعر عند الطلب" : `${value.toLocaleString("ar-SA", { maximumFractionDigits: 2 })} ر.س`;
}

function dataUrlFromFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الصورة"));
    reader.onerror = () => reject(new Error("تعذر رفع الصورة"));
    reader.readAsDataURL(file);
  });
}

export default function StoreAdmin() {
  const { user, loading, isAuthenticated } = useAuth();
  const billingAdminQuery = trpc.billingAuth.me.useQuery();
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<"catalog" | "orders" | "content" | "payments">("catalog");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogDraft>(emptyCatalogDraft);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState({ customerName: "", customerPhone: "", customerEmail: "", summary: "", notes: "", amount: "" });
  const catalogQuery = trpc.store.catalog.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const ordersQuery = trpc.store.orders.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const contentQuery = trpc.store.content.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const invoicesQuery = trpc.invoices.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const [contentDraft, setContentDraft] = useState<Record<string, string> | null>(null);
  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const content = contentDraft ?? contentQuery.data ?? {};
  const bootstrap = trpc.store.bootstrapCurrent.useMutation({ onSuccess: async () => { await Promise.all([utils.store.catalog.list.invalidate(), utils.store.content.list.invalidate()]); toast.success("تم استيراد المحتوى الحالي إلى لوحة الإدارة"); } });
  const saveCatalog = trpc.store.catalog.create.useMutation({ onSuccess: async () => { await utils.store.catalog.list.invalidate(); toast.success("تم حفظ العنصر"); setCatalogOpen(false); setDraft(emptyCatalogDraft); } });
  const editCatalog = trpc.store.catalog.update.useMutation({ onSuccess: async () => { await utils.store.catalog.list.invalidate(); toast.success("تم تحديث العنصر"); setCatalogOpen(false); setDraft(emptyCatalogDraft); } });
  const archiveCatalog = trpc.store.catalog.archive.useMutation({ onSuccess: async () => { await utils.store.catalog.list.invalidate(); toast.success("تم إخفاء العنصر من واجهة العملاء"); } });
  const uploadImage = trpc.store.catalog.uploadImage.useMutation({ onError: error => toast.error(error.message || "تعذر رفع الصورة") });
  const createOrder = trpc.store.orders.create.useMutation({ onSuccess: async () => { await utils.store.orders.list.invalidate(); toast.success("تم إنشاء الطلب"); setOrderOpen(false); setOrderDraft({ customerName: "", customerPhone: "", customerEmail: "", summary: "", notes: "", amount: "" }); } });
  const updateOrder = trpc.store.orders.update.useMutation({ onSuccess: async () => { await utils.store.orders.list.invalidate(); toast.success("تم تحديث حالة الطلب"); } });
  const createInvoiceFromOrder = trpc.invoices.create.useMutation();
  const updateContent = trpc.store.content.update.useMutation({ onSuccess: data => { setContentDraft(data); toast.success("تم حفظ محتوى المتجر"); } });

  if (loading) return <div className="billing-gate"><Loader2 className="animate-spin" /> جاري فتح الإدارة…</div>;
  if (!isAuthenticated || user?.role !== "admin" || !billingAdminQuery.data?.email) return <div className="billing-gate"><Settings2 size={38} /><h1>إدارة المتجر</h1><p>هذه المساحة مخصصة لمالك المتجر فقط.</p><Link href="/admin/login" className="billing-login-link">دخول الإدارة</Link><Link href="/">العودة إلى المتجر</Link></div>;

  const openCreateCatalog = (kind: "product" | "service" = "product") => { setDraft({ ...emptyCatalogDraft, kind, sortOrder: String(catalog.length + 1) }); setCatalogOpen(true); };
  const openEditCatalog = (item: typeof catalog[number]) => { setDraft({ id: item.id, kind: item.kind, name: item.name, category: item.category, description: item.description ?? "", price: item.price?.toString() ?? "", priceLabel: item.priceLabel ?? "", imageUrl: item.imageUrl ?? "", imageKey: item.imageKey ?? "", featured: item.featured, active: item.active, sortOrder: String(item.sortOrder) }); setCatalogOpen(true); };
  const saveCatalogDraft = () => {
    if (!draft.name.trim() || !draft.category.trim()) return toast.error("أدخل الاسم والتصنيف أولًا");
    const data = { kind: draft.kind, name: draft.name.trim(), category: draft.category.trim(), description: draft.description.trim() || undefined, price: draft.price ? Number(draft.price) : null, priceLabel: draft.priceLabel.trim() || undefined, imageUrl: draft.imageUrl.trim() || undefined, imageKey: draft.imageKey.trim() || undefined, featured: draft.featured, active: draft.active, sortOrder: Number(draft.sortOrder) || 0 };
    if (data.price != null && (!Number.isFinite(data.price) || data.price <= 0)) return toast.error("أدخل سعرًا صحيحًا أو اتركه فارغًا");
    if (draft.id) editCatalog.mutate({ id: draft.id, data }); else saveCatalog.mutate(data);
  };
  const handleImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("اختر ملف صورة فقط");
    if (file.size > 4 * 1024 * 1024) return toast.error("يجب ألا يتجاوز حجم الصورة 4 ميغابايت");
    try { const upload = await uploadImage.mutateAsync({ dataUrl: await dataUrlFromFile(file) }); setDraft(current => ({ ...current, imageUrl: upload.url, imageKey: upload.key })); toast.success("تم رفع الصورة"); } catch { /* feedback handled above */ }
  };
  const createLinkedInvoice = async (order: typeof orders[number]) => {
    if (!order.amount) return toast.error("أضف مبلغًا إلى الطلب قبل إنشاء الفاتورة");
    try {
      const invoice = await createInvoiceFromOrder.mutateAsync({ customerName: order.customerName, customerEmail: order.customerEmail || undefined, customerPhone: order.customerPhone || undefined, description: order.summary, amount: order.amount, expiresInDays: 7 });
      await updateOrder.mutateAsync({ id: order.id, status: order.status, notes: order.notes || undefined, amount: order.amount, invoiceId: invoice.id });
      await utils.invoices.list.invalidate();
      toast.success("تم إنشاء الفاتورة وربطها بالطلب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إنشاء الفاتورة للطلب");
    }
  };

  return <DashboardLayout><div className="store-admin" dir="rtl"><header className="store-admin-head"><div><p className="kicker">إيقاع الحياة · الإدارة الكاملة</p><h1>إدارة المتجر</h1><p>أدر الكتالوج والطلبات والمحتوى من مكان واحد. لا تظهر هذه الأدوات للعملاء.</p></div><div className="store-admin-actions"><Button variant="outline" onClick={() => bootstrap.mutate()} disabled={bootstrap.isPending || catalog.length > 0}>{bootstrap.isPending ? <Loader2 className="animate-spin" /> : <PackagePlus size={16} />} استيراد المحتوى الحالي</Button><Link href="/" className="billing-store-link">عرض المتجر</Link></div></header>
    <nav className="store-tabs" aria-label="أقسام إدارة المتجر"><button className={tab === "catalog" ? "active" : ""} onClick={() => setTab("catalog")}><ShoppingBag size={17} /> الكتالوج</button><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}><ClipboardList size={17} /> الطلبات</button><button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}><FileText size={17} /> المحتوى</button><button className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}><CreditCard size={17} /> الدفع</button></nav>
    {tab === "catalog" && <section className="store-panel"><div className="store-panel-head"><div><p>المنتجات والخدمات</p><h2>الكتالوج المعروض</h2></div><div><Button variant="outline" onClick={() => openCreateCatalog("service")}><Plus size={16} /> خدمة</Button><Button onClick={() => openCreateCatalog("product")}><Plus size={16} /> منتج</Button></div></div>{catalogQuery.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ تحميل الكتالوج…</div> : catalog.length === 0 ? <div className="store-empty"><PackagePlus size={34} /><h3>الكتالوج فارغ داخل الإدارة</h3><p>اضغط «استيراد المحتوى الحالي» لإدارة العناصر المعروضة حاليًا، أو أضف أول منتج أو خدمة يدويًا.</p></div> : <div className="catalog-grid">{catalog.map(item => <article className={`catalog-admin-card ${!item.active ? "is-hidden" : ""}`} key={item.id}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="catalog-image-placeholder"><ShoppingBag size={24} /></div>}<div className="catalog-admin-copy"><span>{item.kind === "product" ? "منتج" : "خدمة"} · {item.category}</span><h3>{item.name}</h3><p>{item.description || "بدون وصف"}</p><strong>{formatMoney(item.price)}</strong></div><div className="catalog-admin-actions"><button onClick={() => openEditCatalog(item)}><Pencil size={15} /> تعديل</button>{item.active && <button className="danger" onClick={() => archiveCatalog.mutate({ id: item.id })}><Archive size={15} /> إخفاء</button>}</div></article>)}</div>}</section>}
    {tab === "orders" && <section className="store-panel"><div className="store-panel-head"><div><p>العملاء والتنفيذ</p><h2>طلبات المتجر</h2></div><Button onClick={() => setOrderOpen(true)}><Plus size={16} /> طلب جديد</Button></div>{ordersQuery.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ تحميل الطلبات…</div> : orders.length === 0 ? <div className="store-empty"><ClipboardList size={34} /><h3>لا توجد طلبات محفوظة بعد</h3><p>ستظهر طلبات التواصل من المتجر هنا، ويمكنك أيضًا تسجيل طلب يدويًا.</p></div> : <div className="order-list">{orders.map(order => { const linkedInvoice = (invoicesQuery.data ?? []).find(invoice => invoice.id === order.invoiceId); const updateOrderValue = (overrides: Partial<{ status: "new" | "contacted" | "quoted" | "in_progress" | "completed" | "cancelled"; invoiceId: number | null }>) => updateOrder.mutate({ id: order.id, status: overrides.status ?? order.status, notes: order.notes || undefined, amount: order.amount, invoiceId: overrides.invoiceId ?? order.invoiceId ?? null }); return <article className="order-row" key={order.id}><div><strong>{order.reference}</strong><span>{order.customerName} · {order.customerPhone || order.customerEmail || "بيانات تواصل غير مكتملة"}</span><p>{order.summary}</p><small>{new Date(order.createdAt).toLocaleDateString("ar-SA")}</small></div><div><strong>{formatMoney(order.amount)}</strong><select value={order.status} onChange={event => updateOrderValue({ status: event.target.value as "new" | "contacted" | "quoted" | "in_progress" | "completed" | "cancelled" })}><option value="new">جديد</option><option value="contacted">تم التواصل</option><option value="quoted">تم إرسال عرض</option><option value="in_progress">قيد التنفيذ</option><option value="completed">مكتمل</option><option value="cancelled">ملغي</option></select><select value={order.invoiceId?.toString() || ""} onChange={event => updateOrderValue({ invoiceId: event.target.value ? Number(event.target.value) : null })}><option value="">ربط فاتورة موجودة</option>{(invoicesQuery.data ?? []).map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.reference} · {invoice.status}</option>)}</select>{linkedInvoice ? <small className="linked-invoice">فاتورة مرتبطة: {linkedInvoice.reference} · {linkedInvoice.status}</small> : <button className="order-invoice-button" disabled={!order.amount || createInvoiceFromOrder.isPending} onClick={() => createLinkedInvoice(order)}>إنشاء فاتورة للطلب</button>}</div></article>; })}</div>}</section>}
    {tab === "content" && <section className="store-panel"><div className="store-panel-head"><div><p>الواجهة والقانوني</p><h2>محتوى المتجر وبياناته</h2></div><Button onClick={() => updateContent.mutate(content)} disabled={updateContent.isPending}>{updateContent.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />} حفظ التغييرات</Button></div><div className="content-grid">{contentFields.map(([key, label]) => <label key={key} className={key.endsWith("_full") ? "content-full" : ""}>{label}{key.includes("copy") || key.includes("summary") || key.includes("title") || key.endsWith("_full") ? <Textarea value={content[key] ?? ""} rows={key.endsWith("_full") ? 11 : key.includes("summary") ? 4 : 2} onChange={event => setContentDraft(current => ({ ...(current ?? content), [key]: event.target.value }))} /> : <Input value={content[key] ?? ""} onChange={event => setContentDraft(current => ({ ...(current ?? content), [key]: event.target.value }))} />}</label>)}</div></section>}
    {tab === "payments" && <><NeoleapSettingsPanel /><CCAvenueSettingsPanel /></>}
    {catalogOpen && <div className="billing-modal-backdrop" onMouseDown={() => setCatalogOpen(false)}><section className="billing-modal store-modal" onMouseDown={event => event.stopPropagation()}><div className="billing-modal-head"><div><p>{draft.id ? "تعديل العنصر" : "عنصر جديد"}</p><h2>{draft.kind === "product" ? "منتج" : "خدمة"}</h2></div><button onClick={() => setCatalogOpen(false)} aria-label="إغلاق"><X /></button></div><div className="billing-form-grid"><label>النوع<select value={draft.kind} onChange={event => setDraft(value => ({ ...value, kind: event.target.value as CatalogDraft["kind"] }))}><option value="product">منتج</option><option value="service">خدمة</option></select></label><label>الاسم<Input value={draft.name} onChange={event => setDraft(value => ({ ...value, name: event.target.value }))} required /></label><label>التصنيف<Input value={draft.category} onChange={event => setDraft(value => ({ ...value, category: event.target.value }))} required /></label><label>السعر (ر.س)<Input value={draft.price} onChange={event => setDraft(value => ({ ...value, price: event.target.value }))} type="number" min="0" step="0.01" placeholder="اتركه فارغًا عند الطلب" /></label><label>عبارة سعر بديلة<Input value={draft.priceLabel} onChange={event => setDraft(value => ({ ...value, priceLabel: event.target.value }))} placeholder="مثال: السعر عند الطلب" /></label><label>ترتيب الظهور<Input value={draft.sortOrder} onChange={event => setDraft(value => ({ ...value, sortOrder: event.target.value }))} type="number" min="0" /></label></div><label>الوصف<Textarea value={draft.description} rows={3} onChange={event => setDraft(value => ({ ...value, description: event.target.value }))} /></label><div className="catalog-image-upload"><div>{draft.imageUrl ? <img src={draft.imageUrl} alt="معاينة المنتج" /> : <ImagePlus size={27} />}<span>{draft.imageUrl ? "صورة المنتج جاهزة" : "أضف صورة المنتج"}</span></div><label className="image-upload-control"><ImagePlus size={16} /> رفع صورة<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} /></label></div><div className="catalog-checks"><label><input type="checkbox" checked={draft.featured} onChange={event => setDraft(value => ({ ...value, featured: event.target.checked }))} /> عنصر مميز</label><label><input type="checkbox" checked={draft.active} onChange={event => setDraft(value => ({ ...value, active: event.target.checked }))} /> ظاهر للعملاء</label></div><div className="billing-modal-actions"><Button variant="outline" onClick={() => setCatalogOpen(false)}>إلغاء</Button><Button onClick={saveCatalogDraft} disabled={saveCatalog.isPending || editCatalog.isPending}>{saveCatalog.isPending || editCatalog.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />} حفظ</Button></div></section></div>}
    {orderOpen && <div className="billing-modal-backdrop" onMouseDown={() => setOrderOpen(false)}><section className="billing-modal store-modal" onMouseDown={event => event.stopPropagation()}><div className="billing-modal-head"><div><p>طلب جديد</p><h2>تسجيل طلب يدويًا</h2></div><button onClick={() => setOrderOpen(false)} aria-label="إغلاق"><X /></button></div><div className="billing-form-grid"><label>اسم العميل<Input value={orderDraft.customerName} onChange={event => setOrderDraft(value => ({ ...value, customerName: event.target.value }))} /></label><label>رقم الجوال<Input value={orderDraft.customerPhone} onChange={event => setOrderDraft(value => ({ ...value, customerPhone: event.target.value }))} /></label><label>البريد الإلكتروني<Input value={orderDraft.customerEmail} onChange={event => setOrderDraft(value => ({ ...value, customerEmail: event.target.value }))} /></label><label>المبلغ (اختياري)<Input value={orderDraft.amount} onChange={event => setOrderDraft(value => ({ ...value, amount: event.target.value }))} type="number" step="0.01" /></label></div><label>ملخص الطلب<Textarea rows={3} value={orderDraft.summary} onChange={event => setOrderDraft(value => ({ ...value, summary: event.target.value }))} /></label><label>ملاحظات داخلية<Textarea rows={2} value={orderDraft.notes} onChange={event => setOrderDraft(value => ({ ...value, notes: event.target.value }))} /></label><div className="billing-modal-actions"><Button variant="outline" onClick={() => setOrderOpen(false)}>إلغاء</Button><Button onClick={() => { if (!orderDraft.customerName.trim() || !orderDraft.summary.trim()) return toast.error("أدخل اسم العميل وملخص الطلب"); createOrder.mutate({ customerName: orderDraft.customerName.trim(), customerPhone: orderDraft.customerPhone.trim() || undefined, customerEmail: orderDraft.customerEmail.trim() || undefined, summary: orderDraft.summary.trim(), notes: orderDraft.notes.trim() || undefined, amount: orderDraft.amount ? Number(orderDraft.amount) : null }); }} disabled={createOrder.isPending}>{createOrder.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />} حفظ الطلب</Button></div></section></div>}
  </div></DashboardLayout>;
}

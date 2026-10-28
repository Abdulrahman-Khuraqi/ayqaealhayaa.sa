import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Copy, ExternalLink, KeyRound, Link2, Loader2, Plus, ReceiptText, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "قيد الإعداد",
  pending: "بانتظار السداد",
  paid: "مدفوعة",
  expired: "منتهية",
  cancelled: "ملغاة",
  failed: "تعذر السداد",
};

const formatMoney = (halalas: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 2 }).format(halalas / 100);

const copyText = async (value: string, label: string) => {
  await navigator.clipboard.writeText(value);
  toast.success(`تم نسخ ${label}`);
};

function InvoiceWorkspace() {
  const { user, loading, isAuthenticated } = useAuth();
  const billingAdminQuery = trpc.billingAuth.me.useQuery();
  const isAdmin = user?.role === "admin" && Boolean(billingAdminQuery.data?.email);
  const utils = trpc.useUtils();
  const invoicesQuery = trpc.invoices.list.useQuery(undefined, { enabled: isAdmin });
  const keysQuery = trpc.apiKeys.list.useQuery(undefined, { enabled: isAdmin });
  const [formOpen, setFormOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [revealedKey, setRevealedKey] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [integrationName, setIntegrationName] = useState("");

  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: async invoice => {
      const link = `${window.location.origin}/pay/${invoice.publicId}`;
      setCreatedLink(link);
      setFormOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setDescription("");
      setAmount("");
      await utils.invoices.list.invalidate();
      toast.success("أُنشئت الفاتورة ورابط السداد");
    },
    onError: () => toast.error("تعذر إنشاء الفاتورة، راجع الحقول وحاول مجددًا"),
  });

  const createKey = trpc.apiKeys.create.useMutation({
    onSuccess: async result => {
      setRevealedKey(result.secret);
      setIntegrationName("");
      setKeyOpen(false);
      await utils.apiKeys.list.invalidate();
      toast.success("تم إنشاء مفتاح الربط؛ انسخه الآن لأنه لن يظهر ثانيةً");
    },
    onError: () => toast.error("تعذر إنشاء مفتاح الربط"),
  });

  const revokeKey = trpc.apiKeys.revoke.useMutation({
    onSuccess: async () => {
      await utils.apiKeys.list.invalidate();
      toast.success("تم إيقاف مفتاح الربط");
    },
    onError: () => toast.error("تعذر إيقاف مفتاح الربط"),
  });

  const updateStatus = trpc.invoices.updateStatus.useMutation({
    onSuccess: async () => {
      await utils.invoices.list.invalidate();
      toast.success("تم تحديث حالة الفاتورة وتسجيل الحدث في السجل");
    },
    onError: () => toast.error("تعذر تحديث حالة الفاتورة"),
  });

  const activateCCAvenue = trpc.invoices.activateCCAvenue.useMutation({
    onSuccess: async () => {
      await utils.invoices.list.invalidate();
      toast.success("تم تجهيز رابط CCAvenue للفاتورة. افتح رابط الفاتورة للانتقال الآمن.");
    },
    onError: error => toast.error(error.message || "تعذر تجهيز رابط CCAvenue"),
  });

  const requestStatusChange = (id: number, status: "pending" | "paid" | "cancelled", question: string) => {
    if (window.confirm(question)) updateStatus.mutate({ id, status });
  };

  if (loading) {
    return <div className="billing-gate"><Loader2 className="animate-spin" /> جاري فتح إدارة الفواتير…</div>;
  }

  if (!isAuthenticated) {
    return <div className="billing-gate"><ReceiptText size={38} /><h1>إدارة الفواتير</h1><p>سجّل الدخول بحساب إدارة المتجر للوصول إلى لوحة الفواتير وروابط السداد.</p><Link href="/admin/login" className="billing-login-link">دخول الإدارة</Link><Link href="/">العودة إلى المتجر</Link></div>;
  }

  if (!isAdmin) {
    return <div className="billing-gate"><ShieldCheck size={38} /><h1>صلاحية مطلوبة</h1><p>هذه المساحة مخصصة لمالك متجر إيقاع الحياة فقط.</p><Link href="/admin/login" className="billing-login-link">دخول الإدارة</Link><Link href="/">العودة إلى المتجر</Link></div>;
  }

  return (
    <DashboardLayout>
      <div className="billing-admin" dir="rtl">
        <header className="billing-admin-head">
          <div><p className="kicker">إيقاع الحياة · إدارة المتجر</p><h1>الفواتير وروابط السداد</h1><p>أنشئ رابط فاتورة، أرسله للعميل، واربط أي نظام جديد عبر مفاتيح وصول مستقلة.</p></div>
          <div className="billing-actions"><Link href="/" className="billing-store-link">عرض المتجر <ExternalLink size={16} /></Link><Button onClick={() => setFormOpen(true)}><Plus size={17} /> فاتورة جديدة</Button></div>
        </header>

        <section className="billing-notice"><ShieldCheck size={18} /><p><strong>التكامل المحايد جاهز.</strong> لا تُخزّن المنصة أرقام بطاقات العملاء. ستتحول الفاتورة تلقائيًا إلى صفحة الدفع المستضافة عند ربط شركة التشغيل ومفاتيحها.</p></section>

        {createdLink && <section className="billing-created-link"><div><Link2 size={19} /><span><strong>رابط الفاتورة جاهز</strong><small>{createdLink}</small></span></div><Button variant="outline" onClick={() => copyText(createdLink, "رابط الفاتورة")}><Copy size={16} /> نسخ الرابط</Button><button onClick={() => setCreatedLink("")} aria-label="إغلاق"> <X size={18} /></button></section>}

        <section className="billing-panel">
          <div className="billing-panel-head"><div><p>السجل</p><h2>الفواتير الأخيرة</h2></div><span>{invoices.length} فاتورة</span></div>
          {invoicesQuery.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ تحميل الفواتير…</div> : invoices.length === 0 ? <div className="billing-empty"><ReceiptText size={32} /><h3>لا توجد فواتير بعد</h3><p>أنشئ أول فاتورة وسيظهر رابط السداد هنا لمشاركته مع العميل.</p></div> : <div className="invoice-list">{invoices.map(invoice => {
            const link = `${window.location.origin}/pay/${invoice.publicId}`;
            return <article className="invoice-row" key={invoice.id}><div className="invoice-row-icon"><ReceiptText size={19} /></div><div className="invoice-row-main"><div><strong>{invoice.reference}</strong><span className={`invoice-status is-${invoice.status}`}>{statusLabels[invoice.status] ?? invoice.status}</span></div><p>{invoice.customerName} · {invoice.description}</p><small>أنشئت {new Date(invoice.createdAt).toLocaleDateString("ar-SA")}</small></div><div className="invoice-row-money"><strong>{formatMoney(invoice.amountHalalas)}</strong><button onClick={() => copyText(link, "رابط الفاتورة")}><Copy size={15} /> نسخ الرابط</button><div className="invoice-row-actions">{invoice.status === "draft" && <button onClick={() => activateCCAvenue.mutate({ id: invoice.id })} disabled={activateCCAvenue.isPending}>إرسال إلى CCAvenue</button>}{invoice.status === "pending" && <button onClick={() => requestStatusChange(invoice.id, "paid", "تأكيد: هل تم استلام مبلغ هذه الفاتورة خارج البوابة؟")}>تسجيل سداد يدوي</button>}{["draft", "pending", "failed"].includes(invoice.status) && <button className="cancel-status" onClick={() => requestStatusChange(invoice.id, "cancelled", "تأكيد: هل تريد إلغاء الفاتورة؟ لا يمكن التراجع عن الإلغاء من اللوحة.")}>إلغاء</button>}</div></div></article>;
          })}</div>}
        </section>

        <section className="billing-panel integration-panel">
          <div className="billing-panel-head"><div><p>الربط الخارجي</p><h2>مفاتيح الأنظمة الجديدة</h2></div><Button variant="outline" onClick={() => setKeyOpen(true)}><KeyRound size={16} /> مفتاح جديد</Button></div>
          <p className="integration-copy">تستخدم الأنظمة الأخرى مفتاحًا خاصًا لإنشاء فاتورة أو قراءة حالتها. عنوان الواجهة: <code>/api/payment-links/v1/invoices</code>.</p>
          {keysQuery.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ تحميل المفاتيح…</div> : <div className="key-list">{(keysQuery.data ?? []).length === 0 ? <p className="key-empty">لم يتم إنشاء أي مفتاح ربط بعد.</p> : (keysQuery.data ?? []).map(key => <div className="key-row" key={key.id}><div><KeyRound size={17} /><span><strong>{key.name}</strong><small>{key.keyPrefix}… · {key.status === "active" ? "نشط" : "موقوف"}</small></span></div>{key.status === "active" ? <Button variant="outline" size="sm" onClick={() => revokeKey.mutate({ id: key.id })}>إيقاف</Button> : <span className="key-revoked">موقوف</span>}</div>)}</div>}
        </section>

        {formOpen && <div className="billing-modal-backdrop" onMouseDown={() => setFormOpen(false)}><section className="billing-modal" onMouseDown={event => event.stopPropagation()}><div className="billing-modal-head"><div><p>فاتورة جديدة</p><h2>إنشاء رابط سداد</h2></div><button onClick={() => setFormOpen(false)} aria-label="إغلاق"><X /></button></div><form onSubmit={event => { event.preventDefault(); createInvoice.mutate({ customerName, customerEmail: customerEmail || undefined, customerPhone: customerPhone || undefined, description, amount: Number(amount), expiresInDays: Number(expiresInDays) }); }}><div className="billing-form-grid"><label>اسم العميل<Input value={customerName} onChange={event => setCustomerName(event.target.value)} required placeholder="اسم العميل" /></label><label>رقم الجوال<Input value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} inputMode="tel" placeholder="05xxxxxxxx" /></label><label>البريد الإلكتروني<Input value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} type="email" placeholder="name@example.com" /></label><label>قيمة الفاتورة (ر.س)<Input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="0.01" step="0.01" required placeholder="0.00" /></label></div><label>وصف الفاتورة<Textarea value={description} onChange={event => setDescription(event.target.value)} required minLength={3} rows={3} placeholder="مثال: شاشة عرض تسويقية مقاس 32 إنش" /></label><label>صلاحية الرابط<SelectDays value={expiresInDays} onChange={setExpiresInDays} /></label><div className="billing-modal-actions"><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>إلغاء</Button><Button type="submit" disabled={createInvoice.isPending}>{createInvoice.isPending ? <Loader2 className="animate-spin" /> : <Link2 size={17} />} إنشاء الرابط</Button></div></form></section></div>}

        {keyOpen && <div className="billing-modal-backdrop" onMouseDown={() => setKeyOpen(false)}><section className="billing-modal billing-key-modal" onMouseDown={event => event.stopPropagation()}><div className="billing-modal-head"><div><p>ربط نظام جديد</p><h2>إنشاء مفتاح وصول</h2></div><button onClick={() => setKeyOpen(false)} aria-label="إغلاق"><X /></button></div><p>سمِّ النظام الذي سيستخدم واجهة إنشاء الفواتير. يظهر المفتاح مرة واحدة فقط بعد الإنشاء.</p><form onSubmit={event => { event.preventDefault(); createKey.mutate({ name: integrationName }); }}><label>اسم النظام<Input value={integrationName} onChange={event => setIntegrationName(event.target.value)} required minLength={2} placeholder="مثال: نظام المبيعات" /></label><div className="billing-modal-actions"><Button type="button" variant="outline" onClick={() => setKeyOpen(false)}>إلغاء</Button><Button type="submit" disabled={createKey.isPending}>{createKey.isPending ? <Loader2 className="animate-spin" /> : <KeyRound size={17} />} إنشاء المفتاح</Button></div></form></section></div>}

        {revealedKey && <div className="billing-modal-backdrop"><section className="billing-modal billing-key-modal"><div className="billing-modal-head"><div><p>انسخ المفتاح الآن</p><h2>مفتاح الربط الجديد</h2></div></div><p>لن نعرض هذه القيمة مرة أخرى. خزّنها في بيئة النظام الخارجي ولا تشاركها في رسائل عامة.</p><code className="revealed-key">{revealedKey}</code><div className="billing-modal-actions"><Button variant="outline" onClick={() => copyText(revealedKey, "مفتاح الربط")}> <Copy size={16} /> نسخ المفتاح</Button><Button onClick={() => setRevealedKey("")}>تم الحفظ</Button></div></section></div>}
      </div>
    </DashboardLayout>
  );
}

function SelectDays({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <select className="billing-select" value={value} onChange={event => onChange(event.target.value)}><option value="1">يوم واحد</option><option value="3">3 أيام</option><option value="7">7 أيام</option><option value="14">14 يومًا</option><option value="30">30 يومًا</option></select>;
}

export default function InvoiceAdmin() {
  return <InvoiceWorkspace />;
}

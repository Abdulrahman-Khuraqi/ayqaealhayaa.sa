import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CircleAlert, Clock3, Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import { Link, useParams } from "wouter";

const labels: Record<string, string> = {
  draft: "بانتظار تفعيل الدفع",
  pending: "بانتظار السداد",
  paid: "تم السداد",
  expired: "انتهت صلاحية الرابط",
  cancelled: "أُلغيت الفاتورة",
  failed: "تعذر إتمام السداد",
};

export default function InvoicePayment() {
  const { publicId = "" } = useParams<{ publicId: string }>();
  const invoiceQuery = trpc.invoices.getPublic.useQuery({ publicId }, { enabled: Boolean(publicId) });

  if (invoiceQuery.isLoading) return <main className="payment-shell"><Loader2 className="animate-spin" /> جاري تحميل الفاتورة…</main>;
  const invoice = invoiceQuery.data;
  if (!invoice) return <main className="payment-shell"><CircleAlert size={36} /><h1>فاتورة غير متاحة</h1><p>تحقق من الرابط أو تواصل مع إيقاع الحياة للحصول على رابط جديد.</p><Link href="/" className="payment-back">العودة إلى المتجر <ArrowRight size={16} /></Link></main>;

  const amount = new Intl.NumberFormat("ar-SA", { style: "currency", currency: invoice.currency, maximumFractionDigits: 2 }).format(invoice.amountHalalas / 100);
  const isPaid = invoice.status === "paid";
  const canPay = Boolean(invoice.providerPaymentUrl) && !["paid", "expired", "cancelled"].includes(invoice.status);

  return <main className="payment-shell"><section className="payment-card" dir="rtl"><div className="payment-brand"><ReceiptText size={20} /><span>إيقاع الحياة</span></div><div className="payment-title"><p>فاتورة إلكترونية</p><h1>{invoice.reference}</h1><span className={`payment-status is-${invoice.status}`}>{labels[invoice.status] ?? invoice.status}</span></div><div className="payment-summary"><div><span>وصف الفاتورة</span><strong>{invoice.description}</strong></div><div><span>إجمالي المبلغ</span><strong className="payment-amount">{amount}</strong></div>{invoice.expiresAt && <div><span>صلاحية الرابط</span><strong><Clock3 size={15} /> {new Date(invoice.expiresAt).toLocaleDateString("ar-SA")}</strong></div>}</div>{isPaid ? <div className="payment-success"><ShieldCheck size={21} /><div><strong>تم تسجيل السداد</strong><p>شكرًا لك. سيُتابع فريق إيقاع الحياة طلبك.</p></div></div> : canPay ? <a href={invoice.providerPaymentUrl!} className="payment-action">المتابعة إلى الدفع</a> : <div className="payment-awaiting"><Clock3 size={19} /><div><strong>رابط الدفع قيد التجهيز</strong><p>أُنشئت الفاتورة بنجاح، وسيتم تفعيل الدفع فور ربط شركة التشغيل المرخّصة. لا تدخل أي بيانات بطاقة عبر واتساب.</p></div></div>}<div className="payment-foot"><ShieldCheck size={15} /> تتم معالجة البطاقات فقط عبر صفحة الدفع الآمنة لشركة التشغيل المرخّصة.</div><Link href="/" className="payment-back">العودة إلى المتجر <ArrowRight size={16} /></Link></section></main>;
}

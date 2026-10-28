import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CreditCard, Loader2, LockKeyhole, Save, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CredentialsDraft = { gatewayId: string; gatewayPassword: string; deviceResourceKey: string };

const emptyDraft: CredentialsDraft = { gatewayId: "", gatewayPassword: "", deviceResourceKey: "" };

export default function NeoleapSettingsPanel() {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<CredentialsDraft>(emptyDraft);
  const status = trpc.neoleapAdmin.status.useQuery();
  const save = trpc.neoleapAdmin.saveCredentials.useMutation({
    onSuccess: async () => {
      setDraft(emptyDraft);
      await utils.neoleapAdmin.status.invalidate();
      toast.success("حُفظت بيانات Neoleap المشفرة. بيئة الاختبار فقط هي المفعلة.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ إعدادات Neoleap"),
  });

  const update = (field: keyof CredentialsDraft, value: string) => setDraft(current => ({ ...current, [field]: value }));
  const submit = () => {
    if (!draft.gatewayId.trim() || !draft.gatewayPassword.trim() || !draft.deviceResourceKey.trim()) {
      toast.error("أدخل معرّف البوابة وكلمة المرور ومفتاح مورد الجهاز أولًا");
      return;
    }
    save.mutate({ gatewayId: draft.gatewayId.trim(), gatewayPassword: draft.gatewayPassword.trim(), deviceResourceKey: draft.deviceResourceKey.trim() });
  };

  return <section className="store-panel ccavenue-settings-panel" aria-labelledby="neoleap-settings-title">
    <div className="store-panel-head"><div><p>بوابة الدفع البديلة</p><h2 id="neoleap-settings-title">إعداد Neoleap</h2></div><CreditCard size={26} aria-hidden="true" /></div>
    <div className="ccavenue-security-note"><LockKeyhole size={18} /><p>هذه الحقول متاحة للمالك فقط. تُرسل عبر HTTPS، وتحفظ مشفرة خادميًا، ولا تظهر مرة أخرى بعد الحفظ.</p></div>
    {status.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ التحقق من حالة إعداد Neoleap…</div> : <div className={`ccavenue-status ${status.data?.configured ? "ready" : "pending"}`}>
      <strong>{status.data?.configured ? "بيانات Neoleap الاختبارية محفوظة" : "بيانات Neoleap غير محفوظة"}</strong>
      <span>الوضع الحالي: بيئة الاختبار فقط. لا توجد عملية تحصيل أو تفعيل حي في هذا التبويب.</span>
    </div>}
    <div className="billing-form-grid">
      <label>معرّف البوابة (Gateway ID)<Input value={draft.gatewayId} onChange={event => update("gatewayId", event.target.value)} autoComplete="off" spellCheck={false} /></label>
      <label>كلمة مرور البوابة<Input value={draft.gatewayPassword} onChange={event => update("gatewayPassword", event.target.value)} type="password" autoComplete="new-password" spellCheck={false} /></label>
      <label>مفتاح مورد الجهاز (Device Resource Key)<Input value={draft.deviceResourceKey} onChange={event => update("deviceResourceKey", event.target.value)} type="password" autoComplete="new-password" spellCheck={false} /></label>
    </div>
    <div className="store-admin-actions"><Button onClick={submit} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />} حفظ بيانات Neoleap بأمان</Button></div>
    <div className="ccavenue-live-control"><div><ShieldAlert size={18} aria-hidden="true" /><span><strong>لا تفعيل حي بعد</strong><small>ينتظر المتجر مواصفات التكامل الرسمية لاختبار انتقال البوابة المستضافة والتحقق من نتيجة الدفع بشكل موثوق.</small></span></div></div>
  </section>;
}

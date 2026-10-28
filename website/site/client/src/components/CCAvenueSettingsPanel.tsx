import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CreditCard, Loader2, LockKeyhole, Power, Save, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type CredentialsDraft = { merchantId: string; accessCode: string; encryptionKey: string };

const emptyDraft: CredentialsDraft = { merchantId: "", accessCode: "", encryptionKey: "" };

export default function CCAvenueSettingsPanel() {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<CredentialsDraft>(emptyDraft);
  const [pendingLiveChange, setPendingLiveChange] = useState<boolean | null>(null);
  const status = trpc.ccavenueAdmin.status.useQuery();
  const save = trpc.ccavenueAdmin.saveCredentials.useMutation({
    onSuccess: async () => {
      setDraft(emptyDraft);
      await utils.ccavenueAdmin.status.invalidate();
      toast.success("حُفظت بيانات CCAvenue المشفرة. لم يُفعّل الدفع الحي.");
    },
    onError: error => toast.error(error.message || "تعذر حفظ إعدادات CCAvenue"),
  });
  const setLiveEnabled = trpc.ccavenueAdmin.setLiveEnabled.useMutation({
    onSuccess: async data => {
      setPendingLiveChange(null);
      await utils.ccavenueAdmin.status.invalidate();
      toast.success(data.liveEnabled ? "تم تفعيل الدفع الحي. أوقفه بعد اكتمال الاختبار." : "تم تعطيل الدفع الحي.");
    },
    onError: error => toast.error(error.message || "تعذر تحديث حالة الدفع الحي"),
  });

  const update = (field: keyof CredentialsDraft, value: string) => setDraft(current => ({ ...current, [field]: value }));
  const submit = () => {
    if (!draft.merchantId.trim() || !draft.accessCode.trim() || !draft.encryptionKey.trim()) {
      toast.error("أدخل Merchant ID وAccess Code ومفتاح التشفير أولًا");
      return;
    }
    save.mutate({ merchantId: draft.merchantId.trim(), accessCode: draft.accessCode.trim(), encryptionKey: draft.encryptionKey.trim() });
  };

  return <section className="store-panel ccavenue-settings-panel">
    <div className="store-panel-head"><div><p>الدفع الإلكتروني</p><h2>إعداد CCAvenue</h2></div><CreditCard size={26} aria-hidden="true" /></div>
    <div className="ccavenue-security-note"><LockKeyhole size={18} /><p>هذه الحقول مخصصة للمالك فقط. تُنقل عبر HTTPS وتحفظ مشفرة خادميًا، ولا تظهر مرة أخرى بعد الحفظ.</p></div>
    {status.isLoading ? <div className="billing-loading"><Loader2 className="animate-spin" /> جارٍ التحقق من حالة الإعداد…</div> : <div className={`ccavenue-status ${status.data?.configured ? "ready" : "pending"}`}>
      <strong>{status.data?.configured ? "بيانات التاجر محفوظة" : "بيانات التاجر غير محفوظة"}</strong>
      <span>{status.data?.liveEnabled ? "الدفع الحي مفعّل" : "الدفع الحي غير مفعّل — يلزم اختبار ثم تأكيد مستقل."}</span>
    </div>}
    <div className="billing-form-grid">
      <label>Merchant ID<Input value={draft.merchantId} onChange={event => update("merchantId", event.target.value)} autoComplete="off" spellCheck={false} /></label>
      <label>Access Code<Input value={draft.accessCode} onChange={event => update("accessCode", event.target.value)} type="password" autoComplete="new-password" spellCheck={false} /></label>
      <label>Encryption Key<Input value={draft.encryptionKey} onChange={event => update("encryptionKey", event.target.value)} type="password" autoComplete="new-password" spellCheck={false} /></label>
    </div>
    <div className="store-admin-actions"><Button onClick={submit} disabled={save.isPending}>{save.isPending ? <Loader2 className="animate-spin" /> : <Save size={16} />} حفظ بيانات CCAvenue بأمان</Button></div>
    <div className="ccavenue-live-control">
      <div><ShieldAlert size={18} aria-hidden="true" /><span><strong>التحصيل الحي</strong><small>لا تفعّله إلا للاختبار المصّرح به أو عند جاهزية استقبال المدفوعات من العملاء.</small></span></div>
      <Button variant={status.data?.liveEnabled ? "outline" : "default"} onClick={() => setPendingLiveChange(!status.data?.liveEnabled)} disabled={!status.data?.configured || setLiveEnabled.isPending || pendingLiveChange !== null}>
        {setLiveEnabled.isPending ? <Loader2 className="animate-spin" /> : <Power size={16} />}{status.data?.liveEnabled ? "تعطيل الدفع الحي" : "تفعيل الدفع الحي"}
      </Button>
    </div>
    {pendingLiveChange !== null && <div className="ccavenue-live-confirm">
      <p>{pendingLiveChange ? "سيصبح CCAvenue متاحًا للتحويلات الحية. أكّد التفعيل فقط للاختبار المصرّح به أو عند جاهزية استقبال مدفوعات العملاء." : "سيتم إيقاف التحويلات الحية الجديدة عبر CCAvenue."}</p>
      <div><Button onClick={() => setLiveEnabled.mutate({ enabled: pendingLiveChange })} disabled={setLiveEnabled.isPending}>{setLiveEnabled.isPending ? <Loader2 className="animate-spin" /> : "تأكيد"}</Button><Button variant="outline" onClick={() => setPendingLiveChange(null)} disabled={setLiveEnabled.isPending}>إلغاء</Button></div>
    </div>}
  </section>;
}

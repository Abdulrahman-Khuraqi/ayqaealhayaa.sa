import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ADMIN_HOME_PATH } from "../lib/adminPaths";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, ReceiptText, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function BillingLogin() {
  const [email, setEmail] = useState("mohammed@ayqaealhayaa.sa");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.billingAuth.login.useMutation({
    onSuccess: () => {
      window.location.assign(ADMIN_HOME_PATH);
    },
    onError: error => toast.error(error.message || "تعذر تسجيل الدخول"),
  });

  return <main className="billing-login-shell" dir="rtl"><section className="billing-login-card"><div className="billing-login-brand"><ReceiptText size={20} /><span>إيقاع الحياة</span></div><div className="billing-login-title"><div className="billing-login-icon"><LockKeyhole size={23} /></div><p>مساحة خاصة</p><h1>إدارة المتجر</h1><span>ادخل بحساب الإدارة لإدارة المنتجات والطلبات والمحتوى والفواتير من مكان واحد.</span></div><form onSubmit={event => { event.preventDefault(); login.mutate({ email, password }); }}><label>البريد الإلكتروني<Input value={email} onChange={event => setEmail(event.target.value)} type="email" required autoComplete="username" /></label><label>كلمة المرور<div className="billing-password-field"><Input value={password} onChange={event => setPassword(event.target.value)} type={showPassword ? "text" : "password"} required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><Button type="submit" disabled={login.isPending}>{login.isPending ? <Loader2 className="animate-spin" /> : <LockKeyhole size={17} />} دخول الإدارة</Button></form><div className="billing-login-safety"><ShieldCheck size={16} /><span>تُحفظ جلسة الدخول في ملف آمن داخل المتصفح، ولا تظهر كلمة المرور في لوحة الإدارة.</span></div><Link href="/" className="payment-back">العودة إلى المتجر <ArrowRight size={16} /></Link></section></main>;
}

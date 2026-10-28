/**
 * صفحة التواصل: وسائل التواصل وبيانات الثقة ونموذج الطلب الذي ينتقل إلى واتساب.
 */
import { useState } from "react";
import { Link } from "wouter";
import { Clock3, Mail, MapPin, MessageCircle, PackageCheck, Send } from "lucide-react";
import { toast } from "sonner";
import SiteLayout, { PageHero } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useSiteData } from "@/lib/siteData";

export default function ContactPage() {
  const { content, contactPhone, contactEmail, whatsappUrl, shippingNotice, businessAddress } = useSiteData();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const createRequest = trpc.store.submitRequest.useMutation();

  const sendContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error("فضلاً أكمل الاسم ورقم الجوال وتفاصيل الطلب");
      return;
    }
    createRequest.mutate({ customerName: name.trim(), customerPhone: phone.trim(), summary: message.trim() });
    const text = `مرحبًا، أنا ${name}.%0Aرقم الجوال: ${phone}%0A%0Aتفاصيل الطلب:%0A${message}`;
    window.open(`${whatsappUrl}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <SiteLayout>
      <PageHero
        kicker={content.contact_kicker || "تواصل معنا"}
        title={content.contact_title || "لنحوّل واجهتك إلى رسالة تعمل طوال اليوم."}
        copy={content.contact_copy || "شاركنا ما تحتاجه، وسنرتب معك الخطوة التالية عبر البريد أو واتساب."}
      />
      <section className="contact-section section-frame" aria-label="بيانات التواصل ونموذج الطلب">
        <div className="contact-content">
          <div className="contact-methods">
            <a href={`mailto:${contactEmail}`}><Mail size={18} /><span>{content.contact_email_label || "البريد الإلكتروني"}<strong>{contactEmail}</strong></span></a>
            <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /><span>{content.contact_whatsapp_label || "واتساب"}<strong>{contactPhone}</strong></span></a>
            <span><Clock3 size={18} /><span>{content.contact_hours_label || "أوقات العمل"}<strong className="detail-value">{content.contact_hours || "السبت–الخميس، 9 ص–9 م"}</strong></span></span>
            <span><PackageCheck size={18} /><span>الشحن<strong className="detail-value">{shippingNotice}</strong></span></span>
            <span><MapPin size={18} /><span>{content.business_address_label || "العنوان التجاري"}<strong className="detail-value">{businessAddress}</strong></span></span>
          </div>
        </div>
        <form className="contact-form" onSubmit={sendContact}>
          <div className="form-head"><span>{content.contact_form_title || "أرسل طلبك"}</span><small>{content.contact_form_help || "سننتقل بك إلى واتساب لإتمام التواصل."}</small></div>
          <label>{content.contact_name_label || "الاسم"}<Input value={name} onChange={(event) => setName(event.target.value)} placeholder={content.contact_name_placeholder || "اسمك الكريم"} /></label>
          <label>{content.contact_phone_label || "رقم الجوال"}<Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder={content.contact_phone_placeholder || "05xxxxxxxx"} /></label>
          <label>{content.contact_message_label || "تفاصيل الطلب"}<Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={content.contact_message_placeholder || "ما الذي تخطط له؟"} rows={4} /></label>
          <Button type="submit" className="send-button">{content.contact_submit || "إرسال عبر واتساب"} <Send size={17} /></Button>
          <p className="form-legal">{content.contact_legal_prefix || "بإرسال الطلب، تقر باطلاعك على"} <Link href="/terms">الشروط والأحكام</Link> و<Link href="/privacy-refund">سياسة الخصوصية والاسترداد</Link>.</p>
        </form>
      </section>
    </SiteLayout>
  );
}

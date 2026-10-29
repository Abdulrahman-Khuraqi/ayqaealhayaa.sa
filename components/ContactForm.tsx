'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';
import { PHONE } from '@/lib/format';
import { whatsappLink } from '@/lib/site';

const topics = ['استفسار عن منتج', 'خدمة تركيب', 'مشروع برمجي', 'استضافة أو نطاق', 'منتج رقمي', 'مبيعات الجملة للشركات', 'ضمان أو استرجاع', 'أخرى'];

export default function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').replace(/[\s\-()]/g, '');
    const topic = String(data.get('topic') || '');
    const message = String(data.get('message') || '').trim();
    const next: Record<string, string> = {};
    if (name.length < 2) next.name = 'اكتب اسمك من فضلك';
    if (!PHONE.test(phone)) next.phone = 'اكتب رقم جوال صحيحًا';
    if (message.length < 5) next.message = 'اكتب تفاصيل طلبك باختصار';
    setErrors(next);
    if (Object.keys(next).length) return;
    const text = `مرحبًا، أنا ${name}\nالجوال: ${phone}\nالموضوع: ${topic}\n\n${message}`;
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer');
  };

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2>أرسل طلبك</h2>
      <p className="hint">سننقلك إلى واتساب برسالة جاهزة؛ نرد خلال أوقات العمل.</p>
      <div className="field-row">
        <label className="field"><span className="field-label">الاسم<span className="req" aria-hidden="true">*</span></span>
          <input name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} placeholder="اسمك الكريم" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field"><span className="field-label">رقم الجوال<span className="req" aria-hidden="true">*</span></span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>
      </div>
      <label className="field">الموضوع
        <select name="topic" defaultValue={topics[0]}>{topics.map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="field"><span className="field-label">التفاصيل<span className="req" aria-hidden="true">*</span></span>
        <textarea name="message" aria-invalid={Boolean(errors.message)} placeholder="ما الذي تحتاجه؟ اذكر المدينة إن كان الطلب تركيبًا." />
        {errors.message && <span className="field-error">{errors.message}</span>}
      </label>
      <button type="submit" className="btn btn-primary btn-block">إرسال عبر واتساب <Send size={18} aria-hidden="true" /></button>
      <p className="form-note"><ShieldCheck size={16} aria-hidden="true" /> <span>بإرسال الطلب توافق على <Link href="/legal/terms/">الشروط</Link> و<Link href="/legal/privacy/">سياسة الخصوصية</Link>. لا ترسل بيانات بطاقتك المصرفية في المحادثة.</span></p>
    </form>
  );
}

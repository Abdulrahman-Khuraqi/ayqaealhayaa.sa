'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Code2, Globe, Info, Lock, MessageCircle, Minus, Plus, Server, ShoppingBag, Trash2, Wand2 } from 'lucide-react';
import { useCart, type CartKind, type CartLine } from './CartProvider';
import { PHONE, formatPrice, vatPortion } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';

const kindLabel: Record<CartKind, string> = { product: 'منتج', service: 'خدمة برمجية', hosting: 'استضافة', digital: 'منتج رقمي', domain: 'نطاق' };
const kindIcon: Record<Exclude<CartKind, 'product'>, React.ReactNode> = {
  service: <Code2 size={28} />, hosting: <Server size={28} />, digital: <Wand2 size={28} />, domain: <Globe size={28} />,
};
const cities = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'الظهران', 'الأحساء', 'القصيم', 'أبها', 'خميس مشيط', 'تبوك', 'حائل', 'جازان', 'نجران', 'الطائف', 'الجبيل', 'ينبع', 'أخرى'];

/** رقم مرجعي للسلة يمنع إنشاء الطلب مرتين إذا أُرسلت السلة نفسها مرة أخرى. */
function cartRef() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `WEB-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** ينقل العميل إلى موقع الدفع ومعه السلة والمبلغ وبياناته (نموذج POST لأن السلة قد تكون طويلة). */
function goToPayment(lines: CartLine[], customer: Record<string, string>) {
  const items = lines.map((line) => ({
    id: Number(line.key.split(':')[1]),
    name: line.name.slice(0, 180),
    qty: line.quantity,
    price: Math.round(line.price * 100),
  }));
  const cart = { v: 1, ref: cartRef(), currency: 'SAR', lang: 'ar', items, total: items.reduce((sum, i) => sum + i.price * i.qty, 0), customer };
  const form = document.createElement('form');
  form.method = 'post';
  form.action = `${site.payUrl}/checkout`;
  const field = document.createElement('input');
  field.type = 'hidden';
  field.name = 'cart';
  field.value = JSON.stringify(cart);
  form.appendChild(field);
  document.body.appendChild(form);
  form.submit();
}

export default function CartView() {
  const { lines, total, ready, setQuantity, remove } = useCart();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const hasPhysical = lines.some((line) => line.kind === 'product');
  const hasQuoted = lines.some((line) => line.note?.startsWith('سعر ابتدائي'));

  if (!ready) return <div className="empty-state" aria-busy="true"><ShoppingBag size={40} aria-hidden="true" /><p>جارٍ تحميل السلة…</p></div>;

  if (lines.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingBag size={44} aria-hidden="true" />
        <h3>السلة فارغة</h3>
        <p>ابدأ من المتجر وأضف المنتجات التي تحتاجها، ثم أكمل الدفع بأمان.</p>
        <div className="hero-ctas">
          <Link className="btn btn-primary" href="/store/">تصفح المتجر</Link>
        </div>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const customer = Object.fromEntries(['name', 'phone', 'email', 'city', 'address', 'notes'].map((k) => [k, String(data.get(k) || '').trim()]));
    customer.phone = customer.phone.replace(/[\s\-()]/g, '');
    const next: Record<string, string> = {};
    if (customer.name.length < 2) next.name = 'اكتب الاسم الكامل';
    if (!PHONE.test(customer.phone)) next.phone = 'اكتب رقم جوال صحيحًا';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) next.email = 'اكتب بريدًا إلكترونيًا صحيحًا لإرسال تأكيد الطلب';
    if (hasPhysical && customer.address.length < 6) next.address = 'أضف الحي واسم الشارع أو العنوان الوطني';
    if (!data.get('agree')) next.agree = 'يلزم الموافقة على الشروط والسياسات';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSending(true);
    goToPayment(lines, customer);
  };

  return (
    <div className="cart-layout">
      <div>
        <div className="cart-lines">
          {lines.map((line) => (
            <article key={line.key} className="cart-line">
              <div className="cart-thumb">{line.image ? <img src={line.image} alt="" /> : line.kind === 'product' ? <ShoppingBag size={28} /> : kindIcon[line.kind]}</div>
              <div>
                <h3>{line.href ? <Link href={line.href}>{line.name}</Link> : line.name}</h3>
                <div className="meta"><span className="kind">{kindLabel[line.kind]}</span>{line.note && <span>{line.note}</span>}<span>{formatPrice(line.price)} للوحدة</span></div>
              </div>
              <div className="cart-line-end">
                <div className="qty" aria-label={`كمية ${line.name}`}>
                  <button type="button" onClick={() => setQuantity(line.key, line.quantity + 1)} aria-label="زيادة"><Plus size={15} /></button>
                  <output>{line.quantity}</output>
                  <button type="button" onClick={() => setQuantity(line.key, line.quantity - 1)} aria-label="إنقاص"><Minus size={15} /></button>
                </div>
                <strong>{formatPrice(line.price * line.quantity)}</strong>
                <button type="button" className="remove-btn" onClick={() => remove(line.key)}><Trash2 size={14} aria-hidden="true" /> حذف</button>
              </div>
            </article>
          ))}
        </div>
        {hasQuoted && (
          <div className="notice mt-lg">
            <Info size={18} aria-hidden="true" />
            <p>بعض الخدمات في سلتك بسعر ابتدائي. سنرسل لك عرض سعر نهائيًا مكتوبًا قبل طلب أي دفعة.</p>
          </div>
        )}
      </div>

      <div className="summary">
        <div className="summary-box">
          <h2>ملخص الطلب</h2>
          <div className="summary-row"><span>المجموع قبل الضريبة</span><span>{formatPrice(Math.round((total - vatPortion(total)) * 100) / 100)}</span></div>
          <div className="summary-row"><span>ضريبة القيمة المضافة 15%</span><span>{formatPrice(vatPortion(total))}</span></div>
          <div className="summary-row"><span>الشحن</span>{hasPhysical ? <span className="free">مجاني</span> : <span>لا يوجد</span>}</div>
          <div className="summary-row total"><span>الإجمالي</span><strong>{formatPrice(total)}</strong></div>
        </div>

        <form className="form-card" onSubmit={onSubmit} noValidate>
          <h2>بيانات الطلب</h2>
          <p className="hint">بعد تعبئة البيانات ننقلك إلى صفحة الدفع الآمنة (مدى، فيزا، ماستركارد) بالمبلغ جاهزًا.</p>
          <label className="field">الاسم الكامل <span className="req" aria-hidden="true">*</span>
            <input name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <div className="field-row">
            <label className="field">رقم الجوال <span className="req" aria-hidden="true">*</span>
              <input name="phone" type="tel" inputMode="tel" dir="ltr" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </label>
            <label className="field">البريد الإلكتروني <span className="req" aria-hidden="true">*</span>
              <input name="email" type="email" dir="ltr" autoComplete="email" aria-invalid={Boolean(errors.email)} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </label>
          </div>
          <label className="field">المدينة
            <select name="city" defaultValue={site.city}>{cities.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          {hasPhysical && (
            <label className="field">عنوان التوصيل <span className="req" aria-hidden="true">*</span>
              <input name="address" autoComplete="street-address" placeholder="الحي، الشارع، أو العنوان الوطني المختصر" aria-invalid={Boolean(errors.address)} />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </label>
          )}
          <label className="field">ملاحظات
            <textarea name="notes" maxLength={500} placeholder="وقت مناسب للتوصيل أو التواصل…" aria-invalid={Boolean(errors.notes)} />
            {errors.notes && <span className="field-error">{errors.notes}</span>}
          </label>
          <label className="check">
            <input type="checkbox" name="agree" />
            <span>أوافق على <Link href="/legal/terms/">الشروط والأحكام</Link> و<Link href="/legal/returns/">سياسة الاسترجاع</Link> و<Link href="/legal/privacy/">سياسة الخصوصية</Link>. <span className="req" aria-hidden="true">*</span></span>
          </label>
          {errors.agree && <span className="field-error">{errors.agree}</span>}
          <button type="submit" className="btn btn-primary btn-block" disabled={sending}>{sending ? 'جارٍ تحويلك إلى صفحة الدفع…' : <>إتمام الطلب والدفع · {formatPrice(total)} <Lock size={18} aria-hidden="true" /></>}</button>
          <a className="text-link wa-alt" href={whatsappLink(`مرحبًا، أرغب بطلب:\n${lines.map((l) => `- ${l.name} × ${l.quantity}`).join('\n')}\nالإجمالي: ${formatPrice(total)}`)} target="_blank" rel="noreferrer">أو أرسل الطلب عبر واتساب <MessageCircle size={16} aria-hidden="true" /></a>
        </form>
      </div>
    </div>
  );
}

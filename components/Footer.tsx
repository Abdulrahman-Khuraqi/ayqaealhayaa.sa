import Link from 'next/link';
import { Clock3, Mail, MapPin, MessageCircle } from 'lucide-react';
import Logo from './Logo';
import { legalDocs } from '@/data/legal';
import { storeCategories } from '@/lib/catalog';
import { site, whatsappLink } from '@/lib/site';

const paymentMethods = ['مدى', 'Visa', 'Mastercard', 'Apple Pay', 'STC Pay', 'تحويل بنكي'];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Logo />
          <p>متجر سعودي للأجهزة الأمنية والذكية، وبيت برمجي يبني المواقع والتطبيقات ويستضيفها. نختار معك الحل المناسب، ونسلمه بسعر واضح.</p>
          <ul className="footer-contact">
            <li><MessageCircle size={16} aria-hidden="true" /><a href={whatsappLink()} target="_blank" rel="noreferrer"><bdi dir="ltr">{site.phone}</bdi></a></li>
            <li><Mail size={16} aria-hidden="true" /><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><MapPin size={16} aria-hidden="true" />{site.address}</li>
            <li><Clock3 size={16} aria-hidden="true" />{site.hours}</li>
          </ul>
        </div>
        <div>
          <h3>المتجر</h3>
          {storeCategories.slice(0, 7).map((category) => <Link key={category.slug} href={`/store/${category.slug}/`}>{category.name}</Link>)}
        </div>
        <div>
          <h3>الحلول الرقمية</h3>
          <Link href="/programming/">البرمجة والتطوير</Link>
          <Link href="/programming/#packages">باقات المواقع</Link>
          <Link href="/hosting/">الاستضافة والخوادم</Link>
          <Link href="/hosting/#domains">النطاقات</Link>
          <Link href="/digital/">المنتجات الرقمية</Link>
          <Link href="/about/">من نحن</Link>
          <Link href="/contact/">تواصل معنا</Link>
        </div>
        <div>
          <h3>السياسات</h3>
          {legalDocs.map((doc) => <Link key={doc.slug} href={`/legal/${doc.slug}/`}>{doc.nav}</Link>)}
        </div>
      </div>

      <div className="footer-trust">
        <dl className="footer-ids">
          <div><dt>الاسم التجاري</dt><dd>{site.legalName}</dd></div>
          <div><dt>السجل التجاري</dt><dd dir="ltr">{site.commercialRegistration}</dd></div>
          <div><dt>الرقم الضريبي</dt><dd dir="ltr">{site.vatNumber}</dd></div>
        </dl>
        <ul className="payment-list" aria-label="وسائل الدفع المتاحة">
          {paymentMethods.map((method) => <li key={method}>{method}</li>)}
        </ul>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {site.legalName}. جميع الحقوق محفوظة.</span>
        <span>جميع الأسعار بالريال السعودي وشاملة ضريبة القيمة المضافة 15%.</span>
      </div>
    </footer>
  );
}

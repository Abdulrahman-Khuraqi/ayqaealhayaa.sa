import type { Metadata } from 'next';
import Link from 'next/link';
import { ArchiveRestore, Headset, Info, LockKeyhole, Zap } from 'lucide-react';
import AddToCart from '@/components/AddToCart';
import HostingPlans from '@/components/HostingPlans';
import PageHero from '@/components/PageHero';
import { domains } from '@/data/hosting';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = {
  title: 'الاستضافة والنطاقات',
  description: 'استضافة مواقع، ووردبريس مُدارة، خوادم سحابية VPS، بريد أعمال، وتسجيل نطاقات .sa و.com بأسعار شاملة الضريبة ودعم فني بالعربي.',
  alternates: { canonical: '/hosting/' },
};

export default function HostingPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'الاستضافة والنطاقات' }]}
        kicker="الاستضافة"
        title={<>استضافة سريعة <em>ودعم يفهمك</em>.</>}
        copy="أقراص NVMe، شهادات SSL مجانية، ونسخ احتياطي منتظم. ابدأ بخطة صغيرة وارتقِ متى احتجت دون نقل أو انقطاع."
      />

      <section className="section section-sand">
        <div className="container">
          <HostingPlans />
          <div className="notice mt-lg">
            <Info size={18} aria-hidden="true" />
            <p>ضمان استرداد خلال 14 يومًا لاستضافة المواقع وووردبريس المُدارة عند أول اشتراك. التفاصيل في <Link className="text-link" href="/legal/hosting-terms/">شروط الاستضافة</Link>.</p>
          </div>
        </div>
      </section>

      <section className="section section-dark on-dark">
        <div className="container">
          <div className="section-head" data-reveal><div><p className="kicker">في كل الخطط</p><h2>أساسيات <em>لا تُباع منفصلة</em>.</h2></div></div>
          <div className="feature-strip" data-stagger>
            <div><Zap size={24} aria-hidden="true" /><h3>أقراص NVMe</h3><p>تحميل أسرع للصفحات وقواعد البيانات مقارنة بالأقراص التقليدية.</p></div>
            <div><LockKeyhole size={24} aria-hidden="true" /><h3>SSL مجاني</h3><p>تفعيل تلقائي وتجديد دون تدخل منك.</p></div>
            <div><ArchiveRestore size={24} aria-hidden="true" /><h3>نسخ احتياطي</h3><p>نسخ دورية واسترجاع بطلب بسيط للدعم.</p></div>
            <div><Headset size={24} aria-hidden="true" /><h3>دعم بالعربي</h3><p>واتساب وبريد في أوقات العمل، وننقل موقعك الحالي مجانًا.</p></div>
          </div>
        </div>
      </section>

      <section className="section section-paper" id="domains">
        <div className="container">
          <div className="section-head">
            <div><p className="kicker">النطاقات</p><h2>احجز اسمك <em>قبل غيرك</em>.</h2></div>
            <p>نسجل النطاق باسمك أنت، ونسلمك رمز النقل متى طلبته. أرسل لنا الاسم المطلوب مع الطلب ونتحقق من توفره.</p>
          </div>
          <div className="table-wrap" data-reveal>
            <table className="data-table">
              <thead><tr><th>الامتداد</th><th>التسجيل (سنة)</th><th>التجديد</th><th><span className="sr-only">إضافة</span></th></tr></thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id}>
                    <td><bdi dir="ltr" className="tld">{domain.tld}</bdi>{domain.note && <small>{domain.note}</small>}</td>
                    <td><b>{formatPrice(domain.price)}</b></td>
                    <td>{formatPrice(domain.renewal)}</td>
                    <td>
                      <AddToCart
                        variant="outline"
                        label="أضف"
                        item={{ key: `domain:${domain.id}`, kind: 'domain', name: `تسجيل نطاق ${domain.tld}`, price: domain.price, href: '/hosting/#domains', note: 'سنة واحدة — اكتب اسم النطاق في ملاحظات الطلب' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

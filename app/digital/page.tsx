import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';
import OfferCard from '@/components/OfferCard';
import PageHero from '@/components/PageHero';
import { digitalProducts, type DigitalProduct } from '@/data/digital';

export const metadata: Metadata = {
  title: 'المنتجات الرقمية',
  description: 'شهادات SSL، قوالب مواقع عربية، منيو رقمي QR، نظام حجوزات، ومخططات توزيع كاميرات تُسلَّم إلكترونيًا بأسعار شاملة الضريبة.',
  alternates: { canonical: '/digital/' },
};

const order: DigitalProduct['category'][] = ['الأمان', 'القوالب', 'الأنظمة السحابية', 'أدلة ومخططات'];
const intros: Record<DigitalProduct['category'], string> = {
  'الأمان': 'شهادات تشفير لمواقعك وأنظمتك، مع التثبيت والتذكير بالتجديد.',
  'القوالب': 'ابدأ بتصميم جاهز احترافي وعدّله بهويتك.',
  'الأنظمة السحابية': 'أنظمة جاهزة باشتراك شهري، تفعّل خلال يوم وتلغيها متى شئت.',
  'أدلة ومخططات': 'ملفات عملية تساعدك على اختيار أنظمة المراقبة وتشغيلها.',
};

export default function DigitalPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'المنتجات الرقمية' }]}
        kicker="المنتجات الرقمية"
        title={<>أدوات جاهزة، <em>تسليم فوري</em>.</>}
        copy="منتجات تُسلَّم إلكترونيًا عبر البريد أو واتساب بعد تأكيد الدفع، مع فاتورة ضريبية ودعم في الإعداد."
      />
      <section className="section section-sand">
        <div className="container">
          {order.map((category) => (
            <div key={category} className="group-block">
              <div className="group-head"><h2>{category}</h2><p>{intros[category]}</p></div>
              <div className="offer-grid" data-stagger>
                {digitalProducts.filter((p) => p.category === category).map((product) => (
                  <OfferCard
                    key={product.id}
                    id={product.id}
                    kind="digital"
                    name={product.name}
                    summary={product.summary}
                    points={product.includes}
                    price={product.price}
                    unit={product.unit}
                    delivery={product.delivery}
                    icon={product.icon}
                    tag={product.badge}
                    href={`/digital/#${product.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
          <div className="notice mt-lg">
            <Info size={18} aria-hidden="true" />
            <p>المنتجات الرقمية لا تُسترجع بعد التحميل أو إصدار الشهادة أو تسليم الترخيص، إلا إذا كانت معيبة أو غير مطابقة للوصف. راجع <Link className="text-link" href="/legal/returns/">سياسة الاستبدال والاسترجاع</Link>.</p>
          </div>
        </div>
      </section>
    </>
  );
}

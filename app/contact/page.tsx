import type { Metadata } from 'next';
import { Clock3, Mail, MapPin, MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import PageHero from '@/components/PageHero';
import { site, whatsappLink } from '@/lib/site';

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: `تواصل مع ${site.name} عبر واتساب ${site.phone} أو البريد ${site.email}. ${site.address}.`,
  alternates: { canonical: '/contact/' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'تواصل معنا' }]}
        kicker="تواصل معنا"
        title={<>كيف نقدر <em>نخدمك</em>؟</>}
        copy="استفسار عن جهاز، موعد تركيب، أو مشروع برمجي؛ اختر الطريقة الأنسب لك."
      />
      <section className="section section-sand">
        <div className="container split">
          <div className="stack-sm">
            <div className="contact-cards">
              <a className="contact-card" href={whatsappLink()} target="_blank" rel="noreferrer"><span className="offer-icon"><MessageCircle size={20} aria-hidden="true" /></span><span><small>واتساب (الأسرع)</small><b><bdi dir="ltr">{site.phone}</bdi></b></span></a>
              <a className="contact-card" href={`mailto:${site.email}`}><span className="offer-icon"><Mail size={20} aria-hidden="true" /></span><span><small>البريد الإلكتروني</small><b>{site.email}</b></span></a>
              <div className="contact-card"><span className="offer-icon"><Clock3 size={20} aria-hidden="true" /></span><span><small>أوقات العمل</small><b>{site.hours}</b></span></div>
              <div className="contact-card"><span className="offer-icon"><MapPin size={20} aria-hidden="true" /></span><span><small>العنوان</small><b>{site.address}</b></span></div>
            </div>
            <dl className="facts">
              <div><dt>الاسم التجاري</dt><dd>{site.legalName}</dd></div>
              <div><dt>السجل التجاري</dt><dd><bdi dir="ltr">{site.commercialRegistration}</bdi></dd></div>
              <div><dt>الرقم الضريبي</dt><dd><bdi dir="ltr">{site.vatNumber}</bdi></dd></div>
            </dl>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

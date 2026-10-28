import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, MessageCircle } from 'lucide-react';
import PageHero from '@/components/PageHero';
import { getLegalDoc, legalDocs } from '@/data/legal';
import { site, whatsappLink } from '@/lib/site';

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => legalDocs.map((doc) => ({ slug: doc.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const doc = getLegalDoc((await params).slug);
  if (!doc) return {};
  return { title: doc.title, description: doc.intro.slice(0, 160), alternates: { canonical: `/legal/${doc.slug}/` } };
}

const pad = (n: number) => String(n).padStart(2, '0');

export default async function LegalPage({ params }: Params) {
  const doc = getLegalDoc((await params).slug);
  if (!doc) notFound();

  return (
    <>
      <PageHero crumbs={[{ label: 'السياسات' }, { label: doc.title }]} kicker="السياسات والأحكام" title={doc.title}>
        <div className="legal-meta">
          <span>آخر تحديث: {site.legalUpdatedAt}</span>
          <span>{site.legalName} — س.ت <bdi dir="ltr">{site.commercialRegistration}</bdi></span>
        </div>
      </PageHero>
      <section className="section section-sand">
        <div className="container legal-layout">
          <nav className="legal-nav" aria-label="السياسات">
            <p>كل السياسات</p>
            {legalDocs.map((d) => <Link key={d.slug} href={`/legal/${d.slug}/`} aria-current={d.slug === doc.slug ? 'page' : undefined}>{d.nav}</Link>)}
          </nav>
          <article className="legal-doc">
            <p className="legal-lead">{doc.intro}</p>
            <ol className="legal-toc" aria-label="محتويات الصفحة">
              {doc.sections.map((section, i) => <li key={section.title}><a href={`#s${i + 1}`}>{section.title}</a></li>)}
            </ol>
            {doc.sections.map((section, i) => (
              <section key={section.title} id={`s${i + 1}`} className="legal-section">
                <span>{pad(i + 1)}</span>
                <div>
                  <h2>{section.title}</h2>
                  {section.body?.map((paragraph) => <p key={paragraph.slice(0, 40)}>{paragraph}</p>)}
                  {section.list && <ul>{section.list.map((item) => <li key={item.slice(0, 40)}>{item}</li>)}</ul>}
                </div>
              </section>
            ))}
            <div className="cta-band mt-lg">
              <div>
                <h2>لديك سؤال عن هذه السياسة؟</h2>
                <p>نرد على استفسارات الخصوصية والاسترجاع والضمان خلال يوم عمل.</p>
              </div>
              <div className="actions">
                <a className="btn btn-dark" href={whatsappLink(`استفسار بخصوص: ${doc.title}`)} target="_blank" rel="noreferrer">واتساب <MessageCircle size={18} aria-hidden="true" /></a>
                <a className="btn btn-ghost" href={`mailto:${site.email}`}>البريد <Mail size={18} aria-hidden="true" /></a>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

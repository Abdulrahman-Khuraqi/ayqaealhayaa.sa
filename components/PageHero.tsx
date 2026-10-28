import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type Crumb = { href?: string; label: string };

export default function PageHero({ kicker, title, copy, crumbs, children }: { kicker?: string; title: React.ReactNode; copy?: string; crumbs?: Crumb[]; children?: React.ReactNode }) {
  return (
    <section className="page-hero">
      <div className="page-hero-bg" data-scale-bg aria-hidden="true" />
      <div className="container" data-stagger>
        {crumbs && (
          <nav className="crumbs" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            {crumbs.map((crumb) => (
              <span key={crumb.label}>
                <ChevronLeft size={14} aria-hidden="true" />
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              </span>
            ))}
          </nav>
        )}
        {kicker && <p className="kicker">{kicker}</p>}
        <h1>{title}</h1>
        {copy && <p className="page-hero-copy">{copy}</p>}
        {children}
      </div>
    </section>
  );
}

import type { Metadata } from 'next';
import CartView from '@/components/CartView';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = { title: 'السلة', robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageHero crumbs={[{ label: 'السلة' }]} kicker="سلة المشتريات" title="راجع طلبك وأرسله" />
      <section className="section-tight section-sand">
        <div className="container"><CartView /></div>
      </section>
    </>
  );
}

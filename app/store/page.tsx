import type { Metadata } from 'next';
import CatalogBrowser from '@/components/CatalogBrowser';
import PageHero from '@/components/PageHero';
import { productCount, productsByCategoryOrder, storeCategories } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'المتجر',
  description: 'تسوّق كاميرات المراقبة وكاميرات الواي فاي والانتركوم والشبكات وأجهزة المنزل الذكي وشرائح الإنترنت بأسعار شاملة الضريبة وشحن مجاني.',
  alternates: { canonical: '/store/' },
};

export default function StorePage() {
  return (
    <>
      <PageHero
        crumbs={[{ label: 'المتجر' }]}
        kicker="المتجر"
        title={<>كل ما تحتاجه، <em>بسعر واضح</em>.</>}
        copy={`${productCount} منتجًا من كاميرات المراقبة والشبكات والمنزل الذكي والشرائح. ابحث، قارن، وأضف إلى السلة.`}
      />
      <section className="section-tight section-sand">
        <div className="container">
          <CatalogBrowser products={productsByCategoryOrder()} categories={storeCategories.map((c) => ({ slug: c.slug, name: c.name, count: c.productIds.length }))} active={null} />
        </div>
      </section>
    </>
  );
}

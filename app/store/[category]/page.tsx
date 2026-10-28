import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CatalogBrowser from '@/components/CatalogBrowser';
import PageHero from '@/components/PageHero';
import { getCategory, productsIn, storeCategories } from '@/lib/catalog';

type Params = { params: Promise<{ category: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => storeCategories.map((c) => ({ category: c.slug }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = getCategory((await params).category);
  if (!category) return {};
  return { title: category.name, description: category.blurb, alternates: { canonical: `/store/${category.slug}/` } };
}

export default async function CategoryPage({ params }: Params) {
  const category = getCategory((await params).category);
  if (!category) notFound();
  return (
    <>
      <PageHero
        crumbs={[{ href: '/store/', label: 'المتجر' }, { label: category.name }]}
        kicker={`${category.productIds.length} منتج`}
        title={category.name}
        copy={category.blurb}
      />
      <section className="section-tight section-sand">
        <div className="container">
          <CatalogBrowser products={productsIn(category)} categories={storeCategories.map((c) => ({ slug: c.slug, name: c.name, count: c.productIds.length }))} active={category.slug} />
        </div>
      </section>
    </>
  );
}

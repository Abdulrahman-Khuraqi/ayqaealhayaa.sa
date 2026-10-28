import type { MetadataRoute } from 'next';
import { legalDocs } from '@/data/legal';
import { allProducts, storeCategories } from '@/lib/catalog';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', 'store/', 'programming/', 'hosting/', 'digital/', 'about/', 'contact/'];
  return [
    ...pages.map((path) => ({ url: `${site.url}/${path}`, changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.8 })),
    ...storeCategories.map((c) => ({ url: `${site.url}/store/${c.slug}/`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...allProducts.map((p) => ({ url: `${site.url}/product/${p.id}/`, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...legalDocs.map((d) => ({ url: `${site.url}/legal/${d.slug}/`, changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}

'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PackageSearch, Search, X } from 'lucide-react';
import ProductCard from './ProductCard';
import { normalizeArabic } from '@/lib/format';
import type { ProductLite } from '@/lib/catalog';

type Sort = 'default' | 'price-asc' | 'price-desc' | 'discount';
const PAGE = 24;

export default function CatalogBrowser({ products, categories, active }: {
  products: ProductLite[];
  categories: Array<{ slug: string; name: string; count: number }>;
  active: string | null;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('default');
  const [inStock, setInStock] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => p.brand && counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1));
    return [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const results = useMemo(() => {
    const terms = normalizeArabic(query).split(/\s+/).filter(Boolean);
    const filtered = products.filter((p) => {
      if (inStock && !p.available) return false;
      if (brand && p.brand !== brand) return false;
      if (!terms.length) return true;
      const haystack = normalizeArabic(`${p.name} ${p.brand ?? ''} ${p.summary}`);
      return terms.every((term) => haystack.includes(term));
    });
    const sorted = [...filtered];
    if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'discount') sorted.sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    // المنتجات المتوفرة أولًا دائمًا حتى لا يصطدم العميل بما نفد.
    return sorted.sort((a, b) => Number(b.available) - Number(a.available));
  }, [products, query, sort, inStock, brand]);

  const resetPaging = () => setShown(PAGE);
  const hasFilters = Boolean(query || inStock || brand || sort !== 'default');

  return (
    <div className="catalog">
      <nav className="category-rail" aria-label="أقسام المتجر">
        <Link href="/store/" className={active === null ? 'active' : ''} aria-current={active === null ? 'page' : undefined}>كل المنتجات</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/store/${c.slug}/`} className={active === c.slug ? 'active' : ''} aria-current={active === c.slug ? 'page' : undefined}>
            {c.name} <small>{c.count}</small>
          </Link>
        ))}
      </nav>

      <div className="catalog-toolbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">ابحث في المنتجات</span>
          <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); resetPaging(); }} placeholder="ابحث عن منتج أو ماركة…" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="مسح البحث"><X size={16} /></button>}
        </label>
        <label className="select-field">
          <span className="sr-only">ترتيب النتائج</span>
          <select value={sort} onChange={(e) => { setSort(e.target.value as Sort); resetPaging(); }}>
            <option value="default">الترتيب المقترح</option>
            <option value="price-asc">السعر: من الأقل</option>
            <option value="price-desc">السعر: من الأعلى</option>
            <option value="discount">الأعلى خصمًا</option>
          </select>
        </label>
        <label className="toggle-field">
          <input type="checkbox" checked={inStock} onChange={(e) => { setInStock(e.target.checked); resetPaging(); }} />
          <span>المتوفر فقط</span>
        </label>
      </div>

      {brands.length > 1 && (
        <div className="brand-filter" role="group" aria-label="تصفية حسب الماركة">
          <button type="button" className={brand === null ? 'active' : ''} onClick={() => { setBrand(null); resetPaging(); }}>كل الماركات</button>
          {brands.map(([name, n]) => (
            <button type="button" key={name} className={brand === name ? 'active' : ''} aria-pressed={brand === name} onClick={() => { setBrand(brand === name ? null : name); resetPaging(); }}>
              {name} <small>{n}</small>
            </button>
          ))}
        </div>
      )}

      <div className="catalog-summary" aria-live="polite">
        <span><b>{results.length}</b> منتج</span>
        {hasFilters && <button type="button" onClick={() => { setQuery(''); setSort('default'); setInStock(false); setBrand(null); resetPaging(); }}>مسح عوامل التصفية</button>}
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <PackageSearch size={40} aria-hidden="true" />
          <h3>لم نجد منتجًا مطابقًا</h3>
          <p>جرّب كلمة أبسط، أو تواصل معنا ونوفر لك المنتج المناسب.</p>
          <Link className="btn btn-outline-dark" href="/contact/">اطلب منتجًا غير موجود</Link>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {results.slice(0, shown).map((product, index) => <ProductCard key={product.id} product={product} eager={index < 4} />)}
          </div>
          {shown < results.length && (
            <div className="load-more">
              <p>عرض {Math.min(shown, results.length)} من {results.length}</p>
              <button type="button" className="btn btn-outline-dark" onClick={() => setShown((s) => s + PAGE)}>عرض المزيد</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

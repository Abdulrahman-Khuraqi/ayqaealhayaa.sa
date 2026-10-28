import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, ChevronLeft, MessageCircle, RotateCcw, ShieldCheck, Truck, XCircle } from 'lucide-react';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import ProductImage from '@/components/ProductImage';
import { allProducts, categoryOf, discountOf, getProduct, relatedProducts } from '@/lib/catalog';
import { formatPrice } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => allProducts.map((p) => ({ id: p.id }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = getProduct((await params).id);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/product/${product.id}/` },
    openGraph: { images: product.image ? [product.image] : ['/logo-256.png'] },
  };
}

/** نص المواصفات المستورد كتلة واحدة؛ نقسمه إلى فقرات قصيرة لتسهيل القراءة. */
function toParagraphs(text: string, size = 380) {
  const words = text.split(/\s+/).filter(Boolean);
  const paragraphs: string[] = [];
  let current = '';
  for (const word of words) {
    current = current ? `${current} ${word}` : word;
    if (current.length >= size && /[.!؟:،]$/.test(word)) {
      paragraphs.push(current);
      current = '';
    } else if (current.length >= size * 1.6) {
      paragraphs.push(current);
      current = '';
    }
  }
  if (current) paragraphs.push(current);
  return paragraphs;
}

export default async function ProductPage({ params }: Params) {
  const product = getProduct((await params).id);
  if (!product) notFound();

  const category = categoryOf(product.id);
  const discount = discountOf(product.price, product.compareAt);
  const related = relatedProducts(product.id, 4);
  const paragraphs = toParagraphs(product.details || product.description);
  const [lead, ...rest] = paragraphs;
  const href = `/product/${product.id}/`;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image || `${site.url}/logo-256.png`,
    description: product.description,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'SAR',
      price: product.price,
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${site.url}${href}`,
      seller: { '@type': 'Organization', name: site.legalName },
    },
  };

  return (
    <>
      <section className="section-tight section-sand">
        <div className="container">
          <nav className="crumbs light" aria-label="مسار التنقل">
            <Link href="/">الرئيسية</Link>
            <span><ChevronLeft size={14} aria-hidden="true" /><Link href="/store/">المتجر</Link></span>
            {category && <span><ChevronLeft size={14} aria-hidden="true" /><Link href={`/store/${category.slug}/`}>{category.name}</Link></span>}
          </nav>

          <div className="product-page">
            <div className="product-gallery">
              <ProductImage src={product.image} alt={product.name} eager />
              {discount ? <span className="badge badge-sale">خصم {discount}%</span> : null}
            </div>

            <div className="product-info">
              <h1>{product.name}</h1>
              <div className="product-meta">
                {product.available
                  ? <span className="stock in"><CheckCircle2 size={16} aria-hidden="true" /> متوفر</span>
                  : <span className="stock out"><XCircle size={16} aria-hidden="true" /> نفدت الكمية</span>}
                <span>رمز المنتج: <bdi dir="ltr">{product.sku || product.id}</bdi></span>
              </div>

              <div className="price-lg">
                <strong>{formatPrice(product.price)}</strong>
                {discount ? <><del>{formatPrice(product.compareAt!)}</del><span className="save">وفّر {formatPrice(Math.round((product.compareAt! - product.price) * 100) / 100)}</span></> : null}
                <small>السعر شامل ضريبة القيمة المضافة 15%</small>
              </div>

              <div className="buy-row">
                <AddToCart
                  withQuantity
                  disabled={!product.available}
                  item={{ key: `product:${product.id}`, kind: 'product', name: product.name, price: product.price, image: product.image, href }}
                />
                <a className="btn btn-outline-dark" href={whatsappLink(`مرحبًا، أستفسر عن المنتج: ${product.name}\n${site.url}${href}`)} target="_blank" rel="noreferrer">
                  {product.available ? 'استفسر' : 'أبلغني عند التوفر'} <MessageCircle size={18} aria-hidden="true" />
                </a>
              </div>

              <ul className="perks">
                <li><Truck size={18} aria-hidden="true" /><span><b>شحن مجاني</b>لكل مدن المملكة</span></li>
                <li><RotateCcw size={18} aria-hidden="true" /><span><b>استرجاع {site.returnDays} أيام</b>وفق <Link href="/legal/returns/">السياسة</Link></span></li>
                <li><ShieldCheck size={18} aria-hidden="true" /><span><b>ضمان الوكيل</b>حسب <Link href="/legal/warranty/">سياسة الضمان</Link></span></li>
              </ul>

              <div className="details-block">
                <h2>الوصف والمواصفات</h2>
                {lead && <p>{lead}</p>}
                {rest.length > 0 && (
                  <details>
                    <summary>اقرأ التفاصيل الكاملة</summary>
                    <div className="stack-sm">{rest.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section-paper">
          <div className="container">
            <div className="section-head">
              <div><p className="kicker">قد يعجبك أيضًا</p><h2>من نفس القسم</h2></div>
              {category && <Link className="text-link" href={`/store/${category.slug}/`}>كل {category.name}</Link>}
            </div>
            <div className="product-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd).replace(/</g, '\\u003c') }} />
    </>
  );
}

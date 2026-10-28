import Link from 'next/link';
import { ArrowUpLeft } from 'lucide-react';
import AddToCart from './AddToCart';
import ProductImage from './ProductImage';
import { formatPrice } from '@/lib/format';
import type { ProductLite } from '@/lib/catalog';

export default function ProductCard({ product, eager = false }: { product: ProductLite; eager?: boolean }) {
  const href = `/product/${product.id}/`;
  const saving = product.discount && product.compareAt ? Math.round((product.compareAt - product.price) * 100) / 100 : 0;
  return (
    <article className={`product-card ${product.available ? '' : 'is-out'}`}>
      <Link href={href} className="product-media" tabIndex={-1} aria-hidden="true">
        <span className="product-media-bg" />
        <ProductImage src={product.image} alt="" eager={eager} />
        <span className="product-chips">
          {product.discount ? <span className="chip chip-sale">-{product.discount}%</span> : null}
          {!product.available && <span className="chip chip-muted">نفدت الكمية</span>}
        </span>
        <span className="product-peek">عرض التفاصيل <ArrowUpLeft size={14} /></span>
      </Link>
      <div className="product-body">
        <div className="product-top">
          {product.brand ? <span className="product-brand">{product.brand}</span> : <span />}
          {product.available && <span className="product-stock">متوفر</span>}
        </div>
        <h3><Link href={href}>{product.name}</Link></h3>
        <div className="price">
          <strong>{formatPrice(product.price)}</strong>
          {saving ? <del>{formatPrice(product.compareAt!)}</del> : null}
        </div>
        {saving ? <span className="product-save">توفّر {formatPrice(saving)}</span> : <span className="product-save muted">شامل الضريبة</span>}
        <AddToCart
          variant="card"
          label="أضف للسلة"
          disabled={!product.available}
          item={{ key: `product:${product.id}`, kind: 'product', name: product.name, price: product.price, image: product.image, href }}
        />
      </div>
    </article>
  );
}

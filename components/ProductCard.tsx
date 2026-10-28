import Link from 'next/link';
import AddToCart from './AddToCart';
import ProductImage from './ProductImage';
import { formatPrice } from '@/lib/format';
import type { ProductLite } from '@/lib/catalog';

export default function ProductCard({ product, eager = false }: { product: ProductLite; eager?: boolean }) {
  const href = `/product/${product.id}/`;
  return (
    <article className={`product-card ${product.available ? '' : 'is-out'}`}>
      <Link href={href} className="product-media" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.image} alt="" eager={eager} />
        {product.discount ? <span className="badge badge-sale">خصم {product.discount}%</span> : null}
        {!product.available && <span className="badge badge-muted">نفدت الكمية</span>}
      </Link>
      <div className="product-body">
        {product.brand && <span className="product-brand">{product.brand}</span>}
        <h3><Link href={href}>{product.name}</Link></h3>
        <div className="product-foot">
          <div className="price">
            <strong>{formatPrice(product.price)}</strong>
            {product.discount ? <del>{formatPrice(product.compareAt!)}</del> : null}
          </div>
          <AddToCart
            variant="icon"
            disabled={!product.available}
            item={{ key: `product:${product.id}`, kind: 'product', name: product.name, price: product.price, image: product.image, href }}
          />
        </div>
      </div>
    </article>
  );
}

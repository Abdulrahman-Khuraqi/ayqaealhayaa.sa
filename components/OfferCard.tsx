import { Check, Clock3 } from 'lucide-react';
import AddToCart from './AddToCart';
import Icon from './Icon';
import type { CartKind } from './CartProvider';
import type { IconKey } from '@/data/services';
import { formatPrice } from '@/lib/format';

type Props = {
  id: string;
  kind: CartKind;
  name: string;
  summary: string;
  points: string[];
  price: number;
  unit: string;
  delivery: string;
  icon: IconKey;
  tag?: string;
  href: string;
};

/** بطاقة موحدة للخدمات البرمجية والمنتجات الرقمية. */
export default function OfferCard({ id, kind, name, summary, points, price, unit, delivery, icon, tag, href }: Props) {
  const isFrom = unit === 'يبدأ من';
  return (
    <article className="offer-card" id={id}>
      <div className="offer-top">
        <span className="offer-icon"><Icon name={icon} /></span>
        {tag && <span className="offer-tag">{tag}</span>}
      </div>
      <h3>{name}</h3>
      <p>{summary}</p>
      <ul>{points.map((point) => <li key={point}><Check size={15} aria-hidden="true" />{point}</li>)}</ul>
      <span className="offer-meta"><Clock3 size={14} aria-hidden="true" /> {delivery}</span>
      <div className="offer-price">
        <div>
          {isFrom && <small>يبدأ من</small>}
          <strong>{formatPrice(price)}{!isFrom && <span> {unit}</span>}</strong>
        </div>
        <AddToCart
          label={kind === 'service' ? 'اطلب' : 'أضف'}
          item={{ key: `${kind}:${id}`, kind, name, price, href, note: isFrom ? 'سعر ابتدائي — يُعتمد بعرض سعر' : unit }}
        />
      </div>
    </article>
  );
}

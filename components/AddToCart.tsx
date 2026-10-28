'use client';

import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useCart, type CartLine } from './CartProvider';

type Props = {
  item: Omit<CartLine, 'quantity'>;
  label?: string;
  disabled?: boolean;
  disabledLabel?: string;
  variant?: 'solid' | 'outline' | 'icon' | 'card';
  withQuantity?: boolean;
  className?: string;
};

export default function AddToCart({ item, label = 'أضف إلى السلة', disabled, disabledLabel = 'نفدت الكمية', variant = 'solid', withQuantity, className = '' }: Props) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    add(item, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  if (variant === 'card') {
    return (
      <button type="button" className={`card-add ${added ? 'is-added' : ''} ${className}`} onClick={onAdd} disabled={disabled} aria-label={disabled ? disabledLabel : `${label}: ${item.name}`}>
        <span>{disabled ? disabledLabel : added ? 'تمت الإضافة' : label}</span>
        <i aria-hidden="true">{added ? <Check size={16} /> : <ShoppingBag size={16} />}</i>
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button type="button" className={`icon-add ${added ? 'is-added' : ''} ${className}`} onClick={onAdd} disabled={disabled} aria-label={disabled ? disabledLabel : `${label}: ${item.name}`}>
        {added ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  }

  return (
    <div className={`add-to-cart ${className}`}>
      {withQuantity && !disabled && (
        <div className="qty" aria-label="الكمية">
          <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="زيادة الكمية"><Plus size={16} /></button>
          <output aria-live="polite">{quantity}</output>
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="إنقاص الكمية"><Minus size={16} /></button>
        </div>
      )}
      <button type="button" className={`btn ${variant === 'solid' ? 'btn-primary' : 'btn-outline'} ${added ? 'is-added' : ''}`} onClick={onAdd} disabled={disabled}>
        {disabled ? disabledLabel : added ? <>تمت الإضافة <Check size={18} /></> : <>{label} <ShoppingBag size={18} /></>}
      </button>
    </div>
  );
}

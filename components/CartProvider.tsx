'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartKind = 'product' | 'service' | 'hosting' | 'digital' | 'domain';

export type CartLine = {
  key: string;
  kind: CartKind;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  href?: string;
  /** وصف قصير مثل «اشتراك سنوي» أو «يبدأ من». */
  note?: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  ready: boolean;
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  notice: string;
};

const STORAGE_KEY = 'ayqae-cart-v3';
const MAX_QTY = 20;
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) setLines(stored);
    } catch {
      // سلة تالفة أو تخزين محجوب: نبدأ بسلة فارغة.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // التخزين غير متاح (تصفح خاص)؛ تبقى السلة في الذاكرة.
    }
  }, [lines, ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const add = useCallback<CartContextValue['add']>((line, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((item) => item.key === line.key);
      if (existing) {
        return current.map((item) => item.key === line.key ? { ...item, quantity: Math.min(MAX_QTY, item.quantity + quantity) } : item);
      }
      return [...current, { ...line, quantity: Math.min(MAX_QTY, quantity) }];
    });
    setNotice(`أُضيف «${line.name.slice(0, 40)}${line.name.length > 40 ? '…' : ''}» إلى السلة`);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) => quantity <= 0
      ? current.filter((item) => item.key !== key)
      : current.map((item) => item.key === key ? { ...item, quantity: Math.min(MAX_QTY, quantity) } : item));
  }, []);

  const remove = useCallback((key: string) => setLines((current) => current.filter((item) => item.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => ({
    lines,
    ready,
    notice,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100,
    add,
    setQuantity,
    remove,
    clear,
  }), [lines, ready, notice, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}

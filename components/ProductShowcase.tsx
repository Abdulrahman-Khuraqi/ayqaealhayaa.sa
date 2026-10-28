'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import ProductCard from './ProductCard';
import type { ProductLite } from '@/lib/catalog';

export type ShowcaseTab = { id: string; label: string; href: string; products: ProductLite[] };

/** قسم المنتجات في الرئيسية: تبويبات بمؤشر منزلق وانتقال سلس بين المجموعات. */
export default function ProductShowcase({ tabs }: { tabs: ShowcaseTab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="showcase">
      <div className="showcase-bar">
        <div className="showcase-tabs" role="tablist" aria-label="مجموعات المنتجات">
          {tabs.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={t.id === active} onClick={() => setActive(t.id)}>
              {t.id === active && <motion.span layoutId="showcase-pill" className="showcase-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span className="showcase-label">{t.label}</span>
            </button>
          ))}
        </div>
        <Link href={tab.href} className="text-link">عرض الكل <ArrowLeft size={16} aria-hidden="true" /></Link>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab.id}
          role="tabpanel"
          className="product-grid showcase-grid"
          initial="hidden"
          animate="show"
          exit="exit"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, y: -12, transition: { duration: 0.2 } } }}
        >
          {tab.products.map((product) => (
            <motion.div
              key={product.id}
              variants={{ hidden: { opacity: 0, y: 40, rotateX: 18, scale: 0.96 }, show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { type: 'spring', stiffness: 160, damping: 22 } } }}
              style={{ transformPerspective: 1200 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

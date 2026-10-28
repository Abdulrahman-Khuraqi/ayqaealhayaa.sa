'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, Plus } from 'lucide-react';
import type { FaqGroup } from '@/data/faq';
import { site, whatsappLink } from '@/lib/site';

/** الأسئلة الشائعة: عمود جانبي ثابت للعنوان والمساعدة، وأكورديون متحرك بتصنيفات. */
export default function Faq({ groups, title, intro }: { groups: FaqGroup[]; title: React.ReactNode; intro: string }) {
  const [groupId, setGroupId] = useState(groups[0].id);
  const [open, setOpen] = useState<number | null>(0);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  return (
    <div className="faq-layout">
      <aside className="faq-side" data-reveal>
        <p className="kicker">أسئلة شائعة</p>
        <h2>{title}</h2>
        <p className="faq-intro">{intro}</p>
        <div className="faq-help">
          <span className="faq-help-icon"><MessageCircle size={22} aria-hidden="true" /></span>
          <div>
            <b>لم تجد إجابتك؟</b>
            <span>فريقنا يرد عليك بالعربي، {site.hours}.</span>
          </div>
          <a className="btn btn-primary btn-sm" href={whatsappLink('مرحبًا، لدي سؤال.')} target="_blank" rel="noreferrer">اسألنا</a>
        </div>
      </aside>

      <div className="faq-main">
        {groups.length > 1 && (
          <div className="faq-tabs" role="tablist" aria-label="تصنيفات الأسئلة">
            {groups.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={g.id === groupId} onClick={() => { setGroupId(g.id); setOpen(0); }}>
                {g.id === groupId && <motion.span layoutId="faq-pill" className="faq-pill" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={group.id} className="faq-list" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            {group.items.map((item, index) => {
              const isOpen = open === index;
              const id = `${group.id}-${index}`;
              return (
                <li key={id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button type="button" className="faq-q" aria-expanded={isOpen} aria-controls={`faq-${id}`} onClick={() => setOpen(isOpen ? null : index)}>
                    <span className="faq-num">{String(index + 1).padStart(2, '0')}</span>
                    <span className="faq-text">{item.q}</span>
                    <motion.span className="faq-icon" animate={{ rotate: isOpen ? 135 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}><Plus size={18} aria-hidden="true" /></motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-${id}`}
                        className="faq-a"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}

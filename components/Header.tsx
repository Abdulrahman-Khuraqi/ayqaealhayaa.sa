'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Menu, MessageCircle, ShoppingBag, Truck, X } from 'lucide-react';
import Logo from './Logo';
import { useCart } from './CartProvider';
import { mainNav, site, whatsappLink } from '@/lib/site';

export default function Header({ categories }: { categories: Array<{ slug: string; name: string }> }) {
  const pathname = usePathname();
  const { count, ready, notice } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href.replace(/\/$/, '')));

  return (
    <>
      <div className="topbar">
        <span><Truck size={15} aria-hidden="true" /> <span className="long">{site.shippingNotice}</span><span className="short">شحن مجاني لكل المملكة</span></span>
        <span className="topbar-sep" aria-hidden="true" />
        <span className="hide-sm">الأسعار شاملة ضريبة القيمة المضافة</span>
        <a href={whatsappLink()} target="_blank" rel="noreferrer" className="topbar-wa"><MessageCircle size={15} aria-hidden="true" /> <bdi dir="ltr">{site.phone}</bdi></a>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="القائمة الرئيسية">
            {mainNav.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''} aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/cart/" className="cart-trigger" aria-label={`السلة${ready && count ? `، ${count} عناصر` : ''}`}>
              <ShoppingBag size={19} aria-hidden="true" />
              <span className="hide-sm">السلة</span>
              {ready && count > 0 && <b>{count}</b>}
            </Link>
            <button type="button" className="menu-trigger" onClick={() => setOpen(true)} aria-label="فتح القائمة" aria-expanded={open}><Menu size={22} /></button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="القائمة" onClick={() => setOpen(false)}>
          <div className="mobile-menu-card" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-menu-head">
              <Logo />
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="إغلاق القائمة"><X size={22} /></button>
            </div>
            <nav aria-label="القائمة الرئيسية للجوال">
              <Link href="/">الرئيسية</Link>
              {mainNav.map((item) => <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : ''}>{item.label}</Link>)}
              <Link href="/cart/">السلة {ready && count > 0 ? `(${count})` : ''}</Link>
            </nav>
            <p className="mobile-menu-label">أقسام المتجر</p>
            <div className="mobile-chips">
              {categories.map((category) => <Link key={category.slug} href={`/store/${category.slug}/`}>{category.name}</Link>)}
            </div>
            <a className="btn btn-primary btn-block" href={whatsappLink('مرحبًا، أحتاج مساعدة في اختيار المنتج أو الخدمة المناسبة.')} target="_blank" rel="noreferrer">تحدث معنا عبر واتساب <MessageCircle size={18} /></a>
          </div>
        </div>
      )}

      <div className={`toast ${notice ? 'show' : ''}`} role="status" aria-live="polite">
        {notice && <><CheckCircle2 size={18} aria-hidden="true" /> <span>{notice}</span> <Link href="/cart/">عرض السلة</Link></>}
      </div>
    </>
  );
}

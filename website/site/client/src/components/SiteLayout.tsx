/**
 * إطار الصفحات المشترك: الرأس والتنقل والتذييل ودرج السلة، مع تمييز الصفحة الحالية.
 */
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CreditCard, Headphones, Menu, MessageCircle, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { LOGO, formatSar, useSiteData } from "@/lib/siteData";
import { useState } from "react";

export function BrandMark() {
  return (
    <Link href="/" className="brand-mark" aria-label="العودة إلى الصفحة الرئيسية">
      <img src={LOGO} alt="علامة إيقاع الحياة" />
      <span>
        <strong>إيقاع</strong>
        <small>الحياة</small>
      </span>
    </Link>
  );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart, cartOpen, setCartOpen, itemCount, cartTotal, paying, changeQuantity, checkout, orderByWhatsapp } = useCart();
  const { content, contactPhone, contactEmail, whatsappUrl, shippingNotice, businessAddress, commercialRegistration } = useSiteData();

  const navItems = [
    { href: "/services", label: content.nav_services || "خدماتنا" },
    { href: "/products", label: content.nav_products || "المنتجات" },
    { href: "/about", label: content.nav_about || "من نحن" },
    { href: "/contact", label: content.nav_contact || "تواصل معنا" },
  ];

  // A new page always starts at the top; the mobile menu closes on navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [location]);

  const isActive = (href: string) => location === href;

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="التنقل الرئيسي">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(item.href) ? "active" : undefined} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button className="cart-trigger" onClick={() => setCartOpen(true)} aria-label={content.cart_open_aria || "فتح سلة الطلب"}>
              <ShoppingBag size={20} />
              <span>{content.nav_order || "الطلب"}</span>
              {itemCount > 0 && <b>{itemCount}</b>}
            </button>
            <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة">
              <Menu size={23} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mobile-menu-card">
              <button className="icon-close" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة"><X /></button>
              <BrandMark />
              <Link href="/">{content.nav_home || "الرئيسية"} <ArrowLeft size={17} /></Link>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>{item.label} <ArrowLeft size={17} /></Link>
              ))}
              <Link href="/terms">{content.legal_terms_label || "الشروط والأحكام"} <ArrowLeft size={17} /></Link>
              <Link href="/privacy-refund">{content.legal_privacy_refund_label || "الخصوصية والاسترداد"} <ArrowLeft size={17} /></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <BrandMark />
            <p>{content.footer_copy || "خدمات تسويقية وحلول عرض تساعد مشروعك على الظهور بوضوح واتساق."}</p>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          <div>
            <h3>{content.footer_nav_heading || "تصفح"}</h3>
            <Link href="/">{content.nav_home || "الرئيسية"}</Link>
            {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </div>
          <div>
            <h3>{content.footer_legal_heading || "روابط قانونية"}</h3>
            <Link href="/terms">{content.legal_terms_label || "الشروط والأحكام"}</Link>
            <Link href="/privacy-refund">{content.legal_privacy_label || "سياسة الخصوصية"}</Link>
            <Link href="/privacy-refund#refund">{content.legal_refund_label || "سياسة الاسترداد"}</Link>
          </div>
          <div className="footer-call">
            <Headphones size={31} />
            <p>{content.footer_help || "للاستفسارات والطلبات"}</p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">{contactPhone} <ArrowLeft size={16} /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{content.footer_rights || "© 2026 إيقاع الحياة. جميع الحقوق محفوظة."}</span>
          <span>{shippingNotice}</span>
          <span>{content.business_address_label || "العنوان التجاري"}: {businessAddress} · {content.commercial_registration_label || "السجل التجاري"}: {commercialRegistration}</span>
          <span>{content.footer_country || "المملكة العربية السعودية"}</span>
        </div>
      </footer>

      <AnimatePresence>
        {cartOpen && (
          <motion.div className="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setCartOpen(false)}>
            <motion.aside className="cart-drawer" initial={{ x: -48, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -48, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 280 }} onMouseDown={(event) => event.stopPropagation()} aria-label="سلة الطلب">
              <div className="drawer-head"><div><ShoppingBag size={21} /><h2>{content.cart_title || "سلة الطلب"}</h2></div><button onClick={() => setCartOpen(false)} aria-label={content.cart_close_aria || "إغلاق السلة"}><X /></button></div>
              {!cart.length ? (
                <div className="empty-cart"><ShoppingBag size={40} /><p>{content.cart_empty_title || "سلتك هادئة الآن."}</p><span>{content.cart_empty_copy_pay || "أضف ما يناسب مشروعك، ثم أتمم الطلب وادفع بأمان."}</span></div>
              ) : (
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div><p>{item.type}</p><h3>{item.name}</h3><strong>{item.price}</strong></div>
                      <div className="quantity">
                        <button onClick={() => changeQuantity(item.id, 1)} aria-label="زيادة الكمية"><Plus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => changeQuantity(item.id, -1)} aria-label="تقليل الكمية"><Minus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="drawer-foot">
                {cart.length > 0 && <div className="cart-total"><span>{content.cart_total || "الإجمالي"}</span><strong>{formatSar(cartTotal)}</strong></div>}
                <p><ShieldCheck size={16} /> {content.cart_notice_pay || "دفع آمن بالبطاقة عبر PayOne (مدى، فيزا، ماستركارد)"}</p>
                <p><PackageCheck size={16} /> {shippingNotice}</p>
                <Button onClick={checkout} disabled={paying || !cart.length} className="checkout-button">{paying ? "جاري التحويل إلى صفحة الدفع…" : (content.cart_checkout_pay || "إتمام الطلب والدفع")} <CreditCard size={18} /></Button>
                {cart.length > 0 && <button type="button" className="cart-whatsapp" onClick={() => orderByWhatsapp(whatsappUrl)}><MessageCircle size={15} /> {content.cart_whatsapp || "أو أرسل الطلب عبر واتساب"}</button>}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** ترويسة الصفحات الداخلية (الخدمات، المنتجات، من نحن، التواصل). */
export function PageHero({ kicker, title, copy }: { kicker: string; title: string; copy?: string }) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="page-hero-inner">
        <p className="kicker">{kicker}</p>
        <h1 id="page-title">{title}</h1>
        {copy && <p>{copy}</p>}
      </div>
    </section>
  );
}

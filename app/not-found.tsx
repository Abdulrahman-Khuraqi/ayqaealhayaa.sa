import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section-sand">
      <div className="container not-found">
        <strong>404</strong>
        <h1>الصفحة غير موجودة</h1>
        <p>ربما تغير الرابط أو أُزيل المنتج. جرّب المتجر أو تواصل معنا.</p>
        <div className="hero-ctas">
          <Link className="btn btn-primary" href="/store/">المتجر</Link>
          <Link className="btn btn-outline-dark" href="/">الرئيسية</Link>
        </div>
      </div>
    </section>
  );
}

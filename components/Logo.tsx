import Link from 'next/link';

export default function Logo({ sub = 'للتقنية والحلول الرقمية' }: { sub?: string }) {
  return (
    <Link href="/" className="brand" aria-label="إيقاع الحياة — الصفحة الرئيسية">
      <img src="/logo.webp" alt="" width={44} height={44} />
      <span>
        <strong>إيقاع الحياة</strong>
        <small>{sub}</small>
      </span>
    </Link>
  );
}

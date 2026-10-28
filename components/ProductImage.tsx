'use client';

import { useEffect, useRef, useState } from 'react';

/** صور المنتجات مستضافة خارجيًا؛ عند تعذر تحميلها نعرض شعار إيقاع الحياة بدلًا منها. */
export default function ProductImage({ src, alt, eager = false }: { src: string; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState(!src);
  const ref = useRef<HTMLImageElement>(null);

  // قد تفشل الصورة قبل اكتمال التهيئة فلا يصل حدث onError؛ نتحقق يدويًا.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return <span className="img-fallback" role="img" aria-label={alt}><img src="/logo.webp" alt="" /></span>;
  }
  return <img ref={ref} src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}

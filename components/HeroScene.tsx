'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, BadgePercent, ChevronDown, Sparkles, Truck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = { productCount: number; maxDiscount: number; returnDays: number };

const line1 = ['تقنية', 'تحمي'];
const line2 = ['وحلول', 'رقمية', 'تبني'];

/**
 * المشهد الافتتاحي: يثبت أثناء التمرير، فتكبر الخلفية، وتميل الشبكة لتصبح أرضية ثلاثية الأبعاد،
 * ويدور الشعار ويقترب من المشاهد، بينما يبتعد النص.
 */
export default function HeroScene({ productCount, maxDiscount, returnDays }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const q = gsap.utils.selector(root);

    // دخول الصفحة: الكلمات تصعد من خلف قناع، ثم الشعار والبطاقات.
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
      .from(q('.hero-word > span'), { yPercent: 110, rotate: 4, duration: 1.3, stagger: 0.07 })
      .from(q('.hero-reveal'), { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, '-=0.9')
      .from(q('.hero-logo-3d'), { scale: 0.6, rotationY: -70, opacity: 0, duration: 1.8 }, 0.1)
      .from(q('.hero-ring'), { scale: 0.4, opacity: 0, duration: 1.6, stagger: 0.12 }, 0.2)
      .from(q('.float-card'), { y: 40, opacity: 0, scale: 0.9, duration: 1, stagger: 0.12 }, 0.7);

    // حركة الشعار مع مؤشر الفأرة.
    const tiltY = gsap.quickTo(q('.hero-tilt')[0], 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const tiltX = gsap.quickTo(q('.hero-tilt')[0], 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      tiltY(x * 26);
      tiltX(-y * 18);
    };
    window.addEventListener('pointermove', onMove);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      const visual = q('.hero-scroll')[0] as HTMLElement;
      const toCenter = () => {
        const r = visual.getBoundingClientRect();
        return window.innerWidth / 2 - (r.left + r.width / 2);
      };
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: '+=160%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
      tl.to(q('.hero-glow'), { scale: 2.8, left: '50%', opacity: 1, ease: 'none', duration: 1 }, 0)
        .to(q('.hero-floor'), { rotationX: 64, scale: 2.3, yPercent: 16, opacity: 0.95, ease: 'none', duration: 1 }, 0)
        .to(q('.hero-copy-col'), { y: -140, opacity: 0, filter: 'blur(10px)', ease: 'power1.in', duration: 0.45 }, 0)
        .to(q('.hero-ring'), { scale: 2.2, opacity: 0, stagger: 0.05, ease: 'none', duration: 0.6 }, 0)
        .to(q('.float-card.f1'), { x: 280, y: -200, z: 320, rotationY: 25, opacity: 0, ease: 'none', duration: 0.5 }, 0)
        .to(q('.float-card.f3'), { x: -240, y: 220, z: 280, rotationY: -25, opacity: 0, ease: 'none', duration: 0.5 }, 0)
        .to(q('.hero-scroll-cue'), { opacity: 0, duration: 0.1 }, 0)
        .to(visual, { x: toCenter, scale: 1.35, rotationY: 340, rotationX: 10, ease: 'power2.inOut', duration: 0.75 }, 0)
        .to(visual, { scale: 0.62, y: -120, rotationY: 360, rotationX: 0, ease: 'power2.inOut', duration: 0.35 }, 0.72)
        .fromTo(q('.hero-statement'), { opacity: 0, scale: 0.7, y: 80, filter: 'blur(12px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', ease: 'power3.out', duration: 0.35 }, 0.75);
    });
    mm.add('(max-width: 899px)', () => {
      gsap.to(q('.hero-scroll'), { scale: 1.25, rotationY: -20, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to(q('.hero-glow'), { scale: 2, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
    });

    return () => {
      window.removeEventListener('pointermove', onMove);
      mm.revert();
    };
  }, { scope: root });

  return (
    <section className="hero on-dark" ref={root}>
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-floor-wrap" aria-hidden="true"><div className="hero-floor" /></div>
      <div className="container hero-inner">
        <div className="hero-copy-col">
          <span className="eyebrow-pill hero-reveal"><Sparkles size={15} aria-hidden="true" /> شركة سعودية للتقنية والحلول الرقمية</span>
          <h1 aria-label="تقنية تحمي يومك، وحلول رقمية تبني أعمالك.">
            <span aria-hidden="true">
              {line1.map((w) => <span key={w} className="hero-word"><span>{w}</span></span>)}
              <span className="hero-word"><span><em>يومك،</em></span></span>
              <br />
              {line2.map((w) => <span key={w} className="hero-word"><span>{w}</span></span>)}
              <span className="hero-word"><span><em>أعمالك.</em></span></span>
            </span>
          </h1>
          <p className="hero-copy hero-reveal">أجهزة مراقبة وشبكات ومنزل ذكي بأسعار واضحة، إلى جانب برمجة المواقع والتطبيقات واستضافتها. كل ذلك من جهة واحدة تعرفك وتتابع معك.</p>
          <div className="hero-ctas hero-reveal">
            <Link href="/store/" className="btn btn-primary btn-lg">تسوّق الأجهزة <ArrowLeft size={18} aria-hidden="true" /></Link>
          </div>
          <div className="hero-stats hero-reveal">
            <div><strong>{productCount}+</strong><span>منتج في المتجر</span></div>
            <div><strong>{maxDiscount}%</strong><span>أعلى خصم حالي</span></div>
            <div><strong>{returnDays} أيام</strong><span>للاستبدال والاسترجاع</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-ring" />
          <div className="hero-ring r2" />
          <div className="hero-scroll">
            <div className="hero-tilt">
              <div className="hero-logo-3d"><img src="/logo.webp" alt="" /></div>
            </div>
          </div>
          <div className="float-card f1"><Truck size={22} /><div><b>شحن مجاني</b><span>لكل مدن المملكة</span></div></div>
          <div className="float-card f3"><BadgePercent size={22} /><div><b>وفّر حتى {maxDiscount}%</b><span>على عروض مختارة</span></div></div>
        </div>
      </div>
      <div className="hero-statement" aria-hidden="true">
        <p>متجر <i /> برمجة <i /> استضافة</p>
        <strong>كل ما تحتاجه تقنيًا، <em>من جهة واحدة</em>.</strong>
      </div>
      <span className="hero-scroll-cue" aria-hidden="true"><ChevronDown size={18} /> مرّر للاستكشاف</span>
    </section>
  );
}

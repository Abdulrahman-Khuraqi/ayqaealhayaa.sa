'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * التمرير الناعم (Lenis) مربوط بـ ScrollTrigger، ومؤثرات تُفعَّل بسمات HTML
 * حتى تبقى الصفحات مكونات خادم:
 *  data-reveal         ظهور ناعم للأعلى
 *  data-stagger        ظهور أبناء العنصر بالتتابع
 *  data-tilt-in        دخول ثلاثي الأبعاد (دوران حول X) مرتبط بالتمرير
 *  data-zoom           قسم يبدأ بطاقة ويتمدد لكامل العرض
 *  data-zoom-in        تكبير تدريجي للعنصر عند الاقتراب
 *  data-parallax="n"   إزاحة عمودية بمقدار n
 *  data-scale-bg       خلفية تكبر مع التمرير
 *  data-marquee="n"    نص يتحرك أفقيًا مع التمرير
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (reduced()) return;
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    (window as unknown as { __lenis?: Lenis }).__lenis?.scrollTo(0, { immediate: true });
    if (reduced()) return;

    const ctx = gsap.context(() => {
      gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, { y: 48, opacity: 0, filter: 'blur(6px)', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      });

      gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((el) => {
        gsap.from(el.children, { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });

      gsap.utils.toArray<HTMLElement>('[data-tilt-in]').forEach((el) => {
        gsap.fromTo(el.children,
          { rotationX: 38, y: 120, z: -160, opacity: 0, transformPerspective: 1400, transformOrigin: '50% 100%' },
          { rotationX: 0, y: 0, z: 0, opacity: 1, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 35%', scrub: 1 } });
      });

      gsap.utils.toArray<HTMLElement>('[data-zoom]').forEach((el) => {
        const inner = el.querySelector('[data-zoom-content]');
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 15%', scrub: 1 } });
        tl.fromTo(el, { clipPath: 'inset(7% 6% 7% 6% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' });
        if (inner) tl.fromTo(inner, { scale: 0.86, y: 60 }, { scale: 1, y: 0, ease: 'none' }, 0);
      });

      gsap.utils.toArray<HTMLElement>('[data-zoom-in]').forEach((el) => {
        gsap.fromTo(el, { scale: 0.82, rotationX: 12, transformPerspective: 1200, opacity: 0.4 }, { scale: 1, rotationX: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 100%', end: 'top 40%', scrub: 1 } });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const amount = Number(el.dataset.parallax || 0.2);
        gsap.fromTo(el, { yPercent: -amount * 100 }, { yPercent: amount * 100, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>('[data-scale-bg]').forEach((el) => {
        gsap.to(el, { scale: 1.9, rotate: 8, opacity: 0.55, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top top', end: 'bottom top', scrub: true } });
      });

      gsap.utils.toArray<HTMLElement>('[data-marquee]').forEach((el) => {
        const dir = Number(el.dataset.marquee || 1);
        // الصفحة من اليمين لليسار: الشريط ملتصق باليمين ويمتد يسارًا، فنحركه بقيم موجبة فقط.
        gsap.fromTo(el, { xPercent: dir > 0 ? 0 : 22 }, { xPercent: dir > 0 ? 22 : 0, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
      });
    });

    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pathname]);

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      {children}
    </>
  );
}

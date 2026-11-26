import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';

interface PromoSlide {
  image: string;
  badge: string;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
  old_price?: string;
  background: string; // gradient class
}

interface CaffeinePromoSliderData {
  slides: PromoSlide[];
  position?: number;
  auto_play?: boolean;
  animation_duration?: number;
  show_controls?: boolean;
  [key: string]: unknown;
}

export interface CaffeinePromoSliderProps {
  data: CaffeinePromoSliderData;
}

const SLIDE_WIDTHS = [640, 828, 1080, 1280, 1920] as const;

function slideImage(src: string | undefined) {
  return {
    src: getCdnImageUrl(src, { width: 1280 }) ?? src,
    srcSet: SLIDE_WIDTHS.map(w => `${getCdnImageUrl(src, { width: w })} ${w}w`).join(', '),
    sizes: '100vw',
  };
}

function SlideContent({ slide, isActive }: { slide: PromoSlide; isActive: boolean }) {
  const baseTransition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  
  return (
    <div className="lg:col-span-6 p-7 sm:p-12 space-y-5 text-white" style={{
      opacity: isActive ? 1 : 0,
      transform: isActive ? 'translateY(0)' : 'translateY(20px)',
      transition: baseTransition,
      transitionDelay: isActive ? '0.1s' : '0s'
    }}>
      <span className="inline-block px-3.5 py-1 rounded-full bg-brand-orange text-white text-xs font-extrabold" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(-10px) scale(0.9)', transition: baseTransition, transitionDelay: '0.1s' }}>
        {slide.badge}
      </span>
      <h3 className="text-2xl sm:text-4xl font-black leading-tight" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: baseTransition, transitionDelay: '0.2s' }}>
        {slide.title}
      </h3>
      <p className="text-sm sm:text-base text-brand-ivory/80 leading-relaxed" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: baseTransition, transitionDelay: '0.3s' }}>
        {slide.description}
      </p>
      <div className="flex flex-wrap items-center gap-4 pt-1" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: baseTransition, transitionDelay: '0.4s' }}>
        <Link to={slide.cta_url} className="px-7 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-extrabold text-sm shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)] transition-all">
          {slide.cta_text}
        </Link>
        {slide.old_price && <span className="text-sm text-brand-peach line-through font-semibold">{slide.old_price}</span>}
      </div>
    </div>
  );
}

export const CaffeinePromoSlider = memo(function CaffeinePromoSlider({ data }: CaffeinePromoSliderProps) {
  const slides = data.slides || [];
  const position = data.position ?? 1;
  const hasMultipleSlides = slides.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const { t } = useTranslation();

  // Auto-play
  useEffect(() => {
    if (!hasMultipleSlides || data.auto_play === false) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, data.animation_duration || 6000);
    return () => clearInterval(interval);
  }, [hasMultipleSlides, data.auto_play, slides.length, data.animation_duration]);

  // Move track with transform
  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${activeIndex * 100}%)`;
    }
  }, [activeIndex]);

  if (!slides.length) return null;

  return (
    <div className="relative rounded-[2rem] overflow-hidden border border-brand-border shadow-[0_20px_50px_-15px_rgba(28,18,13,0.14)] bg-brand-dark min-h-[360px] sm:min-h-[420px]">
      <div id={`promo-slider-track-${position}`} ref={trackRef} className="promo-slider-track h-full" style={{ width: `${slides.length * 100}%` }}>
        {slides.map((slide, index) => (
          <div key={index} className="promo-slide grid lg:grid-cols-12 items-center min-h-[360px] sm:min-h-[420px]" style={{ width: `${100 / slides.length}%`, background: slide.background }}>
            <SlideContent slide={slide} isActive={index === activeIndex} />
            <div className="lg:col-span-6 h-64 sm:h-80 lg:h-[420px] relative overflow-hidden bg-brand-cream">
              <img {...slideImage(slide.image)} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" style={{ animation: 'kenBurns 20s ease-in-out infinite', transformOrigin: 'center center' }} />
            </div>
          </div>
        ))}
      </div>

      {hasMultipleSlides && data.show_controls !== false && (
        <div className="absolute bottom-4 right-7 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button key={index} type="button" className={`slider-dot h-2.5 transition-all ${index === activeIndex ? 'w-8 rounded-full bg-brand-orange' : 'w-2.5 rounded-full bg-white/40 hover:bg-white'}`} aria-label={`${t('blocks.home.slider_page', 'Slide')} ${index + 1}`} onClick={() => setActiveIndex(index)} />
          ))}
        </div>
      )}
    </div>
  );
});
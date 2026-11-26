import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';

interface HeroSlide {
  image: string;
  video?: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_url?: string;
}

interface CaffeineHeroSliderData {
  slides: HeroSlide[];
  position?: number;
  auto_play?: boolean;
  animation_duration?: number;
  [key: string]: unknown;
}

export interface CaffeineHeroSliderProps {
  data: CaffeineHeroSliderData;
}

const SLIDE_WIDTHS = [640, 828, 1080, 1280, 1920] as const;

function slideImage(src: string | undefined) {
  return {
    src: getCdnImageUrl(src, { width: 1280 }) ?? src,
    srcSet: getCdnImageSrcSet(src, SLIDE_WIDTHS),
    sizes: '100vw',
  };
}

function getCdnImageSrcSet(src: string | undefined, widths: readonly number[]) {
  if (!src) return '';
  return widths.map(w => `${getCdnImageUrl(src, { width: w })} ${w}w`).join(', ');
}

function parseSlideVideo(url?: string) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (match) return { kind: 'youtube', id: match[1] };
  }
  return { kind: 'file', src: url };
}

function YouTubeBackground({ id }: { id: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<'loading' | 'playing' | 'failed'>('loading');

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let heard = false;
    let tries = 0;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow) return;
      let data: { event?: string; info?: unknown } | null = null;
      try {
        data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      } catch { return; }
      if (!data || typeof data !== 'object') return;
      heard = true;
      if (data.event === 'onError') return setState('failed');
      const playerState = data.event === 'onStateChange' ? data.info : (data.info as { playerState?: unknown } | null)?.playerState;
      if (playerState === 1) setState('playing');
    };
    let timer: number | undefined;
    const send = () => {
      if (heard || tries >= 20) return window.clearInterval(timer);
      tries += 1;
      frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), 'https://www.youtube-nocookie.com');
    };
    const listen = () => { window.clearInterval(timer); tries = 0; send(); timer = window.setInterval(send, 500); };
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', listen);
    return () => { window.clearInterval(timer); window.removeEventListener('message', onMessage); frame.removeEventListener('load', listen); };
  }, [id]);

  if (state === 'failed') return null;
  return (
    <iframe ref={ref} className="caffeine-hero__video caffeine-hero__video--embed" data-state={state} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&enablejsapi=1&origin=${window.location.origin}`} title="" loading="lazy" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" aria-hidden="true" tabIndex={-1} />
  );
}

function SlideVideo({ url, poster }: { url?: string; poster?: string }) {
  const video = parseSlideVideo(url);
  if (!video) return null;
  if (video.kind === 'youtube') return <YouTubeBackground id={video.id} />;
  return (
    <video className="caffeine-hero__video" src={video.src} poster={poster} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1} />
  );
}

function SlideContent({ slide, isActive }: { slide: HeroSlide; isActive: boolean }) {
  return (
    <div className="caffeine-hero__content flex-center container py-16 sm:py-0 relative h-full">
      <div className="w-full md:w-7/12 lg:w-5/12 text-white text-right">
        {slide.title && (
          <h1 data-swiper-parallax="-500" className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.18] tracking-tight mb-6 last:mb-0" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: '0.2s' }}>
            {slide.title}
          </h1>
        )}
        {slide.subtitle && (
          <p data-swiper-parallax="-300" className="text-base sm:text-lg text-brand-ivory/85 max-w-2xl leading-relaxed font-normal mb-8" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: '0.3s' }}>
            {slide.subtitle}
          </p>
        )}
        {slide.cta_text && slide.cta_url && (
          <Link to={slide.cta_url} data-swiper-parallax="-100" className="inline-flex items-center justify-center gap-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)]" style={{ opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: '0.4s' }}>
            {slide.cta_text}
            <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        )}
      </div>
    </div>
  );
}

export const CaffeineHeroSlider = memo(function CaffeineHeroSlider({ data }: CaffeineHeroSliderProps) {
  const slides = data.slides || [];
  const position = data.position ?? 1;
  const hasMultipleSlides = slides.length > 1;
  const firstImage = slides[0]?.image;
  const [showPoster, setShowPoster] = useState(Boolean(data.priority && firstImage));
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const motionAllowed = useMotionAllowed();
  const hasVideo = motionAllowed && slides.some((slide) => parseSlideVideo(slide.video));

  const hidePoster = useCallback(() => {
    if (!firstImage) return;
    const image = new Image();
    const { src, srcSet, sizes } = slideImage(firstImage);
    image.sizes = sizes;
    if (srcSet) image.srcset = srcSet;
    image.src = src ?? '';
    Promise.resolve(image.decode?.()).catch(() => undefined).then(() => setShowPoster(false));
  }, [firstImage]);

  // Auto-play logic
  useEffect(() => {
    if (!hasMultipleSlides || data.auto_play === false) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, data.animation_duration || 6000);
    return () => clearInterval(interval);
  }, [hasMultipleSlides, data.auto_play, slides.length, data.animation_duration]);

  if (!slides.length) return null;

  return (
    <div className="caffeine-hero relative min-h-[86vh] flex items-center overflow-hidden bg-brand-dark text-brand-ivory" ref={root}>
      <div className="absolute inset-0 bg-gradient-to-l from-[#1c120d]/95 via-[#1c120d]/75 to-[#9a3b12]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1c120d] via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 w-full">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Content - Static, always visible */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-brand-orange/40 text-xs sm:text-sm font-semibold text-brand-ivory">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping" />
              <span>Exploring the rich depth of every bean • محمصة كافيين سيب</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.18] tracking-tight text-white">
              أول رشفة من <span className="text-brand-orange">كافيين سيب</span>...<br className="hidden sm:block" />وتنسى كل قهوة جرّبتها قبلها.
            </h1>
            <p className="text-base sm:text-lg text-brand-ivory/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              ننتقي أجود محاصيل البن من أفضل المناشئ العالمية بتحميص احترافي يكشف ثراء النكهات ويبرز التوازن والحلاوة في كل حبة قهوة — <strong className="text-brand-peach">ابدأ بـ بوكس اثيوبيات أو بوكس كلاسيك بخصم يصل إلى 34%!</strong>
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link to="https://caffeinesip.store/ethiopian-box/p448705895" className="inline-flex items-center justify-center gap-2.5 bg-brand-orange hover:bg-brand-orange-dark text-white px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)]">
                اطلب بوكس اثيوبيات الآن — 129 ر.س
                <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
              <button type="button" className="inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/25 px-6 py-4 rounded-2xl font-bold text-sm sm:text-base transition-all">
                <span className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-current mr-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </span>
                <span>شاهد فيديو الاستخلاص</span>
              </button>
            </div>
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs sm:text-sm text-brand-ivory/80">
              <span className="inline-flex items-center gap-1.5"><span className="text-brand-orange text-base">★★★★★</span><strong className="text-white">4.9/5</strong> تقييم العملاء</span>
              <span className="text-white/30">|</span>
              <span>✅ محاصيل طازجة 250g و 1kg</span>
              <span className="text-white/30">|</span>
              <span>⚡ مدى، Apple Pay، وتمارا</span>
            </div>
          </div>

          {/* Right Side - Image/Video Slider */}
          <div className="lg:col-span-5">
            <div className="relative bg-brand-ivory/95 backdrop-blur-xl text-brand-dark rounded-[2rem] p-5 sm:p-6 border border-brand-orange/30 shadow-[0_20px_50px_-15px_rgba(28,18,13,0.14)]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange text-white text-xs font-extrabold">🔥 المحصول الأشهر في المتجر</span>
                <span className="text-xs font-bold text-brand-terracotta bg-brand-peach/25 px-2.5 py-1 rounded-lg">متوفر للشحن الفوري</span>
              </div>

              {/* Hero Media Slider */}
              <div className="relative rounded-2xl overflow-hidden bg-brand-cream aspect-[16/11] mb-4 border border-brand-border">
                {slides.map((slide, index) => (
                  <div key={index} className={`caffeine-hero-slide absolute inset-0 transition-all duration-700 ease-out ${index === activeIndex ? 'translate-x-0 opacity-100 z-10' : index < activeIndex ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}>
                    {slide.image && (
                      <img {...slideImage(slide.image)} alt="" className="w-full h-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
                    )}
                    {motionAllowed && <SlideVideo url={slide.video} poster={slide.image} />}
                    <div className="absolute bottom-3 right-3 bg-brand-dark/85 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                      ارتفاع 2100م • مجففة • 250 جم
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider Indicators */}
              {hasMultipleSlides && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {slides.map((_, index) => (
                    <button key={index} type="button" className={`w-2.5 h-2.5 rounded-full transition-all ${index === activeIndex ? 'bg-brand-orange' : 'bg-white/50 hover:bg-white'}`} aria-label={index === 0 ? 'الصورة' : 'الفيديو'} onClick={() => setActiveIndex(index)} />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-brand-dark">أثيوبيا قوجي — Guji</h2>
                    <p className="text-xs text-brand-charcoal mt-0.5">فواكه مجففة • توت • زبيب • حلاوة وقوام ممتلئ</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-2xl font-black text-brand-orange">60 <span className="text-xs font-bold text-brand-dark">ر.س</span></span>
                  </div>
                </div>
                <div className="grid grid-cols-1 text-xs">
                  <button type="button" className="py-2 rounded-xl border-2 border-brand-orange bg-brand-orange/10 text-brand-terracotta font-bold">حبوب كاملة</button>
                </div>
                <button type="button" className="w-full py-3.5 rounded-xl bg-brand-dark hover:bg-brand-orange text-white font-extrabold text-sm transition-colors flex items-center justify-center gap-2">
                  <span>أضف أثيوبيا قوجي للسلة — 60 ر.س</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
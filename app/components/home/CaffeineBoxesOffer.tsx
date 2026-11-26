import { memo, useEffect, useState } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';

interface BoxData {
  id: string;
  name: string;
  badge: string;
  image: string;
  description: string;
  features: string[];
  old_price: number;
  price: number;
  cta_text: string;
  cta_url: string;
  is_bestseller: boolean;
}

interface CaffeineBoxesOfferData {
  title: string;
  subtitle: string;
  countdown_hours: number;
  countdown_minutes: number;
  countdown_seconds: number;
  boxes: BoxData[];
  position?: number;
  [key: string]: unknown;
}

export interface CaffeineBoxesOfferProps {
  data: CaffeineBoxesOfferData;
}

export const CaffeineBoxesOffer = memo(function CaffeineBoxesOffer({ data }: CaffeineBoxesOfferProps) {
  const { t } = useTranslation();
  const boxes = data.boxes || [];
  const [timeLeft, setTimeLeft] = useState({
    hours: data.countdown_hours || 3,
    minutes: data.countdown_minutes || 44,
    seconds: data.countdown_seconds || 59,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds;
        if (totalSeconds > 0) totalSeconds--;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return { hours: h, minutes: m, seconds: s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!boxes.length) return null;

  return (
    <section id="boxes-offer" className="scroll-mt-24 py-16 sm:py-24 bg-gradient-to-br from-brand-dark via-[#2b150c] to-brand-terracotta text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(https://caffeinesip.store/assets/brand-pattern.png)', backgroundSize: '520px auto', backgroundRepeat: 'repeat' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-dark/70 border border-brand-orange/40 px-4 py-1.5 rounded-full text-xs font-bold">
            <span>⏳ {t('blocks.home.offer_ends', 'ينتهي خصم البوكسات خلال:')}</span>
            <span className="text-brand-orange font-mono text-sm" dir="ltr">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">{data.title || t('blocks.home.boxes_title', 'وفّر أكثر مع بوكسات كافيين سيب')}</h2>
          <p className="text-sm sm:text-base text-brand-ivory/80">{data.subtitle || t('blocks.home.boxes_subtitle', 'اختر البوكس الذي يناسب ذائقتك واحصل على 3 محاصيل مختارة بأقوى خصم في المتجر.')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {boxes.map((box, index) => (
            <Link key={box.id} to={box.cta_url} className={`bg-brand-ivory text-brand-dark rounded-[2rem] p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(28,18,13,0.14)] flex flex-col justify-between relative ${index === 0 ? 'border-2 border-brand-orange' : 'border border-brand-border'}`}>
              <span className={`absolute -top-3.5 right-6 text-xs font-black px-4 py-1 rounded-full shadow-lg ${index === 0 ? 'bg-brand-orange text-white' : 'bg-brand-dark text-white'}`}>
                {box.badge}
              </span>
              <div>
                <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-brand-cream mb-5 border border-brand-border">
                  <img {...{ src: getCdnImageUrl(box.image, { width: 800 }) ?? box.image, alt: box.name, className: "w-full h-full object-cover" }} />
                </div>
                <h3 className="text-2xl font-black text-brand-dark">{box.name}</h3>
                <p className="text-sm text-brand-charcoal mt-1.5">{box.description}</p>
                <ul className="mt-4 space-y-2 text-xs sm:text-sm font-semibold text-brand-dark bg-brand-cream p-4 rounded-2xl border border-brand-border">
                  {box.features.map((feature, i) => <li key={i}>{feature}</li>)}
                </ul>
              </div>
              <div className="pt-6 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-brand-charcoal line-through block">{box.old_price} ر.س</span>
                  <span className={`text-3xl font-black ${index === 0 ? 'text-brand-orange' : 'text-brand-dark'}`}>{box.price} <span className="text-xs font-bold">{index === 0 ? 'ر.س' : 'ر.س'}</span></span>
                </div>
                <span className={`flex-1 py-3.5 px-5 rounded-xl font-black text-sm transition-all ${index === 0 ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)]' : 'bg-brand-dark hover:bg-brand-orange text-white'}`}>
                  {box.cta_text}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});
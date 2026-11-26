import { memo } from 'react';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';

interface VideoCard {
  id: string;
  video: string;
  title: string;
  description: string;
  poster: string;
  cta_text: string;
  cta_product_id: string;
  cta_option?: string;
  border_color?: string;
  badge?: string;
}

interface CaffeineVideoExperienceData {
  title: string;
  subtitle: string;
  cards: VideoCard[];
  position?: number;
  [key: string]: unknown;
}

export interface CaffeineVideoExperienceProps {
  data: CaffeineVideoExperienceData;
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
      try { data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
      if (!data || typeof data !== 'object') return;
      heard = true;
      if (data.event === 'onError') return setState('failed');
      const playerState = data.event === 'onStateChange' ? data.info : (data.info as { playerState?: unknown } | null)?.playerState;
      if (playerState === 1) setState('playing');
    };
    let timer: number | undefined;
    const send = () => { if (heard || tries >= 20) return window.clearInterval(timer); tries += 1; frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id, channel: 'widget' }), 'https://www.youtube-nocookie.com'); };
    const listen = () => { window.clearInterval(timer); tries = 0; send(); timer = window.setInterval(send, 500); };
    window.addEventListener('message', onMessage);
    frame.addEventListener('load', listen);
    return () => { window.clearInterval(timer); window.removeEventListener('message', onMessage); frame.removeEventListener('load', listen); };
  }, [id]);

  if (state === 'failed') return null;
  return <iframe ref={ref} className="video-exp__video video-exp__video--embed" data-state={state} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&enablejsapi=1&origin=${window.location.origin}`} title="" loading="lazy" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" aria-hidden="true" tabIndex={-1} />;
}

function SlideVideo({ url, poster }: { url?: string; poster?: string }) {
  const video = parseSlideVideo(url);
  if (!video) return null;
  if (video.kind === 'youtube') return <YouTubeBackground id={video.id} />;
  return <video className="video-exp__video" src={video.src} poster={poster} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1} />;
}

export const CaffeineVideoExperience = memo(function CaffeineVideoExperience({ data }: CaffeineVideoExperienceProps) {
  const cards = data.cards || [];
  const motionAllowed = useMotionAllowed();
  const { t } = useTranslation();

  if (!cards.length) return null;

  return (
    <section id="video-experience" className="scroll-mt-24 py-14 sm:py-20 bg-brand-dark text-brand-ivory relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">{t('blocks.home.video_quality', 'جودة تشاهدها بعينك قبل أن تتذوقها')}</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">{data.title || t('blocks.home.video_title', 'عيش لحظة التحضير — فيديو حقيقي بجودة HD')}</h2>
          </div>
          <p className="text-sm text-brand-ivory/70 max-w-md">{data.subtitle || t('blocks.home.video_subtitle', 'اضغط على أي فيديو لتشغيله كاملاً أو أضف المنتج مباشرة لسلتك.')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="group relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-[0_20px_50px_-15px_rgba(28,18,13,0.14)]" style={{ borderColor: card.border_color || 'transparent' }}>
              <div className="relative aspect-[4/5] overflow-hidden cursor-pointer" onClick={() => window.openVideoModal?.(card.video, card.title)}>
                <div className="absolute inset-0">
                  <video className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" autoPlay muted loop playsInline poster={card.poster}>
                    <source src={card.video} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c120d] via-[#1c120d]/25 to-transparent" />
                </div>
                <div className="absolute bottom-0 inset-x-0 p-5 space-y-2.5">
                  <h3 className="text-lg font-extrabold text-white">{card.title}</h3>
                  <p className="text-xs text-brand-ivory/80">{card.description}</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); window.addToCart?.(card.cta_product_id, card.cta_option); }} className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-colors ${card.cta_text.includes('60') || card.cta_text.includes('59') ? 'bg-brand-orange hover:bg-brand-orange-dark text-white shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)]' : 'bg-white/15 hover:bg-brand-orange backdrop-blur-md text-white border border-white/20'}`}>
                    {card.cta_text}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});
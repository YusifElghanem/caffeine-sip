import { memo, useEffect, useRef, useState } from 'react';
import { Link } from '@salla.sa/twilight-theme-engine/common';
import { getCdnImageUrl } from '@salla.sa/twilight-theme-engine/utils/cdn-image';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { useMotionAllowed } from '../../hooks/useMotionAllowed';

interface VideoBanner {
  id: string;
  video: string;
  title: string;
  poster: string;
  cta_text: string;
  cta_product_id: string;
}

interface CaffeineVideoBannersData {
  banners: VideoBanner[];
  position?: number;
  auto_play?: boolean;
  [key: string]: unknown;
}

export interface CaffeineVideoBannersProps {
  data: CaffeineVideoBannersData;
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
  return <iframe ref={ref} className="video-banner__video video-banner__video--embed" data-state={state} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&enablejsapi=1&origin=${window.location.origin}`} title="" loading="lazy" allow="autoplay; encrypted-media" referrerPolicy="strict-origin-when-cross-origin" aria-hidden="true" tabIndex={-1} />;
}

function SlideVideo({ url, poster }: { url?: string; poster?: string }) {
  const video = parseSlideVideo(url);
  if (!video) return null;
  if (video.kind === 'youtube') return <YouTubeBackground id={video.id} />;
  return <video className="video-banner__video" src={video.src} poster={poster} muted loop playsInline preload="none" disablePictureInPicture aria-hidden="true" tabIndex={-1} />;
}

export const CaffeineVideoBanners = memo(function CaffeineVideoBanners({ data }: CaffeineVideoBannersProps) {
  const banners = data.banners || [];
  const motionAllowed = useMotionAllowed();
  const { t } = useTranslation();

  if (!banners.length) return null;

  return (
    <div className="space-y-7">
      {banners.map((banner, index) => (
        <div key={banner.id} className="relative rounded-3xl overflow-hidden bg-black border border-brand-orange/30 shadow-[0_20px_50px_-15px_rgba(28,18,13,0.14)] aspect-video md:aspect-[16/5] cursor-pointer" onClick={() => window.openVideoModal?.(banner.video, banner.title)}>
          <div className="absolute inset-0">
            <video className="w-full h-full object-cover" autoPlay muted loop playsInline poster={banner.poster}>
              <source src={banner.video} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1c120d]/95 via-[#1c120d]/40 to-transparent" />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">{banner.title}</h3>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); window.addToCart?.(banner.cta_product_id); }} className="whitespace-nowrap py-3 px-6 rounded-xl bg-brand-orange hover:bg-brand-orange-dark text-white font-extrabold text-sm transition-colors shadow-[0_12px_35px_-8px_rgba(240,102,12,0.45)]">
                {banner.cta_text}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
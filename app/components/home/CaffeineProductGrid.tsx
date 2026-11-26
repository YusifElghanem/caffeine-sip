import { memo, useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import type { Product } from '@salla.sa/twilight-theme-engine/types';
import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import { product, type ProductsListSource } from '@salla.sa/twilight-theme-engine/api/product';
import { ProductCard } from '../product';
import { useProductCardLayout } from '../../hooks/useProductCardLayout';
import { SallaProductsList, ProductsListSkeleton, ProductCardSkeleton } from '@salla.sa/twilight-components-react';

const TYPE_TO_SOURCE: Record<string, ProductsListSource> = {
  category: 'categories',
  most_sales: 'sales',
  latest_products: 'latest',
  chosen_products: 'selected',
  top_rated_products: 'top-rated',
  tag: 'tags',
  random_products: 'latest',
};

const RANDOM_TYPE = 'random_products';
const RANDOM_POOL = 32;

export interface ProductGridSection {
  name?: string;
  label?: string;
  title?: string;
  type?: string | string[] | { value?: unknown; key?: unknown; id?: unknown } | null;
  category?: string | string[] | { value?: unknown; key?: unknown; id?: unknown } | null;
  tag?: string | string[] | { value?: unknown; key?: unknown; id?: unknown } | null;
  chosen_products?: string | string[] | { source_value?: unknown[] } | null;
  products?: Array<{ id?: unknown }>;
  [key: string]: unknown;
}

export interface CaffeineProductGridData {
  view_style?: string | null;
  is_slider?: boolean;
  position?: number;
  title?: string;
  items?: ProductGridSection[];
  video_banners_enabled?: boolean;
  video_banners?: Array<{
    id: string;
    video: string;
    title: string;
    poster: string;
    cta_text: string;
    cta_product_id: string;
  }>;
  [key: string]: unknown;
}

interface Tab {
  key: string;
  label: string;
  source?: ProductsListSource;
  sourceValue?: number[];
  random?: boolean;
}

type TabSource = Required<Pick<Tab, 'source'>> & Pick<Tab, 'sourceValue' | 'random'>;

async function loadTab({ source, sourceValue, random }: TabSource, perPage: number) {
  if (!random) return product.list({ source, sourceValue, perPage });
  const pool = await product.list({ source, sourceValue, perPage: RANDOM_POOL });
  return { ...pool, items: pool.items.sort(() => Math.random() - 0.5).slice(0, perPage), next: null };
}

const scalar = (v: unknown): string => {
  if (Array.isArray(v)) return scalar(v[0]);
  if (v && typeof v === 'object') {
    const o = v as { value?: unknown; key?: unknown; id?: unknown };
    return scalar(o.value ?? o.key ?? o.id);
  }
  return v === null || v === undefined ? '' : String(v);
};

const toIds = (v: unknown): number[] => {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'source_value' in v) {
    return toIds((v as { source_value?: unknown }).source_value);
  }
  return (Array.isArray(v) ? v : v === null || v === undefined || v === '' ? [] : [v])
    .map((x) => Number(scalar(x)))
    .filter((id) => Number.isFinite(id) && id > 0);
};

function resolveTab(section: ProductGridSection): Pick<Tab, 'source' | 'sourceValue' | 'random'> {
  if (Array.isArray(section.products)) {
    return { source: 'selected', sourceValue: toIds(section.products.map((p) => p?.id)) };
  }
  const type = scalar(section.type);
  const source = TYPE_TO_SOURCE[type];
  if (!source) return {};
  if (type === RANDOM_TYPE) return { source, random: true };
  if (source === 'selected') return { source, sourceValue: toIds(section.chosen_products) };
  if (source === 'categories') return { source, sourceValue: toIds(section.category) };
  if (source === 'tags') return { source, sourceValue: toIds(section.tag) };
  return { source };
}

const needsValue = (source: ProductsListSource) => source === 'selected' || source === 'categories' || source === 'tags';

const isValidTab = (tab: Tab) => !!tab.source && (!needsValue(tab.source) || !!tab.sourceValue?.length);

function tabLabel(section: ProductGridSection, index: number, t: ReturnType<typeof useTranslation>['t']): string {
  const explicit = (section.name || section.label || section.title || '').trim();
  return explicit || `${t('blocks.home.featured_products_tab', 'Products')} ${index + 1}`;
}

function TabTriggers({ tabs, active, onSelect, className = '' }: { tabs: Tab[]; active: string; onSelect: (key: string) => void; className?: string }) {
  return (
    <div className={`tabs hide-scroll ${className}`}>
      {tabs.map((tab) => (
        <button key={tab.key} type="button" aria-pressed={active === tab.key} onClick={() => onSelect(tab.key)} className={`tab-trigger ${active === tab.key ? 'is-active' : ''}`}>
          <span className="s-button-text">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProductsListWrapper({ source, sourceValue, random, perPage, className, skeleton }: { source?: ProductsListSource; sourceValue?: number[]; random?: boolean; perPage: number; className?: string; skeleton: React.ReactNode }) {
  if (!source) return <div className={className} />;
  return (
    <SallaProductsList
      source={source}
      sourceValue={sourceValue}
      perPage={perPage}
      mode="once"
      className={className}
      skeleton={skeleton}
      random={random}
    />
  );
}

function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export const CaffeineProductGrid = memo(function CaffeineProductGrid({ data }: { data: CaffeineProductGridData }) {
  const { t } = useTranslation();
  const sections = data.items || [];
  const videoBanners = data.video_banners || [];
  const videoBannersEnabled = data.video_banners_enabled !== false;
  const { cardLayout } = useProductCardLayout();
  const perPage = cardLayout === 'horizontal' ? 6 : 12;

  // Build tabs from sections
  const tabs = sections
    .map((section, index) => ({ ...resolveTab(section), key: `tab-${index}`, label: tabLabel(section, index, t) }))
    .filter(isValidTab);

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const loadProducts = useCallback(async () => {
    const tab = tabs.find(t => t.key === activeTab);
    if (!tab?.source) { setProducts([]); setHasMore(false); return; }
    setLoading(true);
    try {
      const result = await loadTab(tab, perPage);
      setProducts(result.items || []);
      setHasMore(!!result.next);
    } catch {
      setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeTab, tabs, perPage]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  if (!tabs.length) return null;

  const skeleton = <ProductGridSkeleton count={perPage} />;

  return (
    <section id="shop" className="scroll-mt-24 py-14 sm:py-20 bg-brand-cream relative" style={{ backgroundImage: 'url(https://caffeinesip.store/assets/brand-pattern.png)', backgroundSize: '520px auto', backgroundRepeat: 'repeat', opacity: 0.03 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">{t('blocks.home.catalog_title', 'كتالوج caffeinesip.store الحقيقي')}</span>
            <h2 className="text-2xl sm:text-4xl font-black text-brand-dark mt-1">{data.title || t('blocks.home.all_products', 'جميع منتجات محمصة كافيين سيب')}</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-brand-dark text-white'
                    : 'bg-white text-brand-charcoal border border-brand-border hover:border-brand-orange'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Suspense fallback={skeleton}>{skeleton}</Suspense>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7" id="shop-grid">
              {products.map((p, index) => (
                <React.Fragment key={p.id}>
                  <ProductCard product={p} />
                  {/* Insert video banner after every 4th product */}
                  {videoBannersEnabled && videoBanners.length > 0 && (index + 1) % 4 === 0 && index < products.length - 1 && (
                    <div key={`video-banner-${index}`} className="col-span-full" style={{ gridColumn: '1 / -1' }}>
                      <CaffeineVideoBanners data={{ banners: videoBanners, position: index }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button className="px-8 py-3 rounded-xl bg-brand-dark hover:bg-brand-orange text-white font-bold transition-colors">
                  {t('blocks.home.load_more', 'تحميل المزيد')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});

// Need to import CaffeineVideoBanners
import { CaffeineVideoBanners } from './CaffeineVideoBanners';
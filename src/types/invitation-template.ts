export interface Discount {
  enabled: boolean;
  percent: number;
  originalPrice: number;
  endDate: string | null;
}

export type SupportedCurrency = 'USD' | 'CAD' | 'EUR';

export interface Pricing {
  price?: number;
  currency?: string;
  defaultCurrency: SupportedCurrency;
  prices: Partial<Record<SupportedCurrency, number>>;
  isFree: boolean;
  discount?: Discount;
  freeUntil?: string | null;
}

export interface EffectivePrice {
  price: number;
  currency: SupportedCurrency;
  isFree: boolean;
  hasDiscount: boolean;
  originalPrice?: number;
  discountPercent?: number;
  discountEndDate?: string;
  freeUntilDate?: string;
}

export interface Position {
  x: number;
  y: number;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TemplateElement {
  name: string;
  content: string;
  position: Position;
  font: string;
  font_size: number;
  font_weight?: number;
  color: string;
  align: TextAlign;
  stroke_color?: string;
  stroke_width?: number;
  remark?: string;
  max_width?: number;
  line_height?: number;
}

export interface QRCodeConfig {
  position: Position;
  size: number;
  darkColor?: string;
  lightColor?: string;
}

export interface TemplateConfig {
  template: string;
  canvas_size: [number, number];
  pricing: Pricing;
  elements: TemplateElement[];
  qr_code?: QRCodeConfig;
  backgroundColor?: string;
  borderColor?: string;
  accentColor?: string;
}

export interface ThemeMetadata {
  name: {
    zh: string;
    en: string;
  };
  description?: {
    zh: string;
    en: string;
  };
  icon?: string;
  order?: number;
}

export interface InvitationTemplate {
  id: string;
  theme: string;
  name: string;
  imageUrl: string;
  config: TemplateConfig;
  effectivePrice: EffectivePrice;
}

export interface Theme {
  id: string;
  name: {
    zh: string;
    en: string;
  };
  description?: {
    zh: string;
    en: string;
  };
  icon: string;
  templates: InvitationTemplate[];
  templateCount: number;
}

export interface TemplatesApiResponse {
  themes: Theme[];
  totalTemplates: number;
}

export interface PartyData {
  childName: string;
  childAge: number;
  eventDatetime: string;
  eventEndDatetime?: string;
  location: string;
  theme?: string;
  notes?: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ['USD', 'CAD', 'EUR'];

export function normalizePricing(pricing: Pricing): Pricing {
  const legacyCurrency = ((pricing.currency || 'USD').toUpperCase() as SupportedCurrency);
  const defaultCurrency = ((pricing.defaultCurrency || legacyCurrency || 'USD').toUpperCase() as SupportedCurrency);
  const prices = { ...(pricing.prices || {}) } as Partial<Record<SupportedCurrency, number>>;

  if (typeof pricing.price === 'number' && !prices[legacyCurrency]) {
    prices[legacyCurrency] = pricing.price;
  }

  if (!prices[defaultCurrency]) {
    prices[defaultCurrency] = typeof pricing.price === 'number' ? pricing.price : 0;
  }

  return {
    ...pricing,
    defaultCurrency,
    prices,
  };
}

export function resolvePricingCurrency(pricing: Pricing, requestedCurrency?: string | null): SupportedCurrency {
  const normalized = normalizePricing(pricing);
  const candidate = ((requestedCurrency || normalized.defaultCurrency).toUpperCase() as SupportedCurrency);

  if (typeof normalized.prices[candidate] === 'number') {
    return candidate;
  }

  return normalized.defaultCurrency;
}

export function getEffectivePrice(pricing: Pricing, requestedCurrency?: string | null): EffectivePrice {
  const normalized = normalizePricing(pricing);
  const currency = resolvePricingCurrency(normalized, requestedCurrency);
  const now = new Date();
  const basePrice = normalized.prices[currency] ?? normalized.prices[normalized.defaultCurrency] ?? 0;

  if (normalized.isFree) {
    return { price: 0, currency, isFree: true, hasDiscount: false };
  }

  if (normalized.freeUntil) {
    const freeUntilDate = new Date(normalized.freeUntil);
    if (freeUntilDate > now) {
      return {
        price: 0,
        currency,
        isFree: true,
        hasDiscount: false,
        freeUntilDate: normalized.freeUntil,
      };
    }
  }

  if (normalized.discount?.enabled && normalized.discount.endDate) {
    const discountEndDate = new Date(normalized.discount.endDate);
    if (discountEndDate > now) {
      return {
        price: basePrice,
        currency,
        isFree: false,
        hasDiscount: true,
        originalPrice: normalized.discount.originalPrice,
        discountPercent: normalized.discount.percent,
        discountEndDate: normalized.discount.endDate,
      };
    }
  }

  return { price: basePrice, currency, isFree: false, hasDiscount: false };
}

export function formatPrice(price: number, currency: string, locale: string): string {
  if (price === 0) {
    return locale === 'zh' ? '免费' : 'Free';
  }

  if (currency === 'USD') {
    return `$${price.toFixed(2)}`;
  }
  if (currency === 'CAD') {
    return `CA$${price.toFixed(2)}`;
  }
  if (currency === 'EUR') {
    return `€${price.toFixed(2)}`;
  }

  return `${price.toFixed(2)} ${currency}`;
}

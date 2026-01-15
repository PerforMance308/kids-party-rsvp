// 价格折扣配置
export interface Discount {
  enabled: boolean;
  percent: number;           // 折扣百分比，如30表示7折
  originalPrice: number;     // 原价
  endDate: string | null;    // 折扣截止时间 ISO格式
}

// 价格配置
export interface Pricing {
  price: number;             // 当前价格
  currency: string;          // 货币类型 USD/CNY
  isFree: boolean;           // 是否永久免费
  discount?: Discount;       // 折扣配置
  freeUntil?: string | null; // 限时免费截止时间 ISO格式
}

// 计算后的有效价格
export interface EffectivePrice {
  price: number;
  isFree: boolean;
  hasDiscount: boolean;
  originalPrice?: number;
  discountPercent?: number;
  discountEndDate?: string;
  freeUntilDate?: string;
}

// 文字元素位置
export interface Position {
  x: number;
  y: number;
}

// 文字对齐方式
export type TextAlign = 'left' | 'center' | 'right';

// 单个文字元素配置
export interface TemplateElement {
  name: string;              // 元素标识符
  content: string;           // 默认显示内容（占位符）
  position: Position;
  font: string;              // 字体名称
  font_size: number;
  color: string;             // 十六进制颜色
  align: TextAlign;
  stroke_color?: string;     // 描边颜色
  stroke_width?: number;     // 描边宽度
  remark?: string;           // 备注说明
  max_width?: number;        // 最大宽度（自动换行）
  line_height?: number;      // 行高倍数
}

// QR码配置
export interface QRCodeConfig {
  position: Position;
  size: number;
  darkColor?: string;   // 二维码前景色（默认黑色）
  lightColor?: string;  // 二维码背景色（默认白色）
}

// 单个模板的JSON配置
export interface TemplateConfig {
  template: string;                    // 对应的图片文件名
  canvas_size: [number, number];       // [宽, 高] 固定为 [1000, 1400]
  pricing: Pricing;                    // 价格配置
  elements: TemplateElement[];
  qr_code?: QRCodeConfig;              // QR码配置
}

// 主题元数据
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

// 单个模板信息（前端使用）
export interface InvitationTemplate {
  id: string;                          // 唯一标识，格式: theme_number
  theme: string;                       // 主题名称
  name: string;                        // 模板显示名称
  imageUrl: string;                    // 图片URL
  config: TemplateConfig;              // 完整配置
  effectivePrice: EffectivePrice;      // 计算后的有效价格
}

// 主题信息（前端使用）
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

// API响应类型
export interface TemplatesApiResponse {
  themes: Theme[];
  totalTemplates: number;
}

// 派对数据（用于渲染）
export interface PartyData {
  childName: string;
  childAge: number;
  eventDatetime: string;
  eventEndDatetime?: string;
  location: string;
  theme?: string;
  notes?: string;
}

// 计算有效价格的工具函数
export function getEffectivePrice(pricing: Pricing): EffectivePrice {
  const now = new Date();

  // 1. 永久免费
  if (pricing.isFree) {
    return { price: 0, isFree: true, hasDiscount: false };
  }

  // 2. 限时免费
  if (pricing.freeUntil) {
    const freeUntilDate = new Date(pricing.freeUntil);
    if (freeUntilDate > now) {
      return {
        price: 0,
        isFree: true,
        hasDiscount: false,
        freeUntilDate: pricing.freeUntil,
      };
    }
  }

  // 3. 折扣中
  if (pricing.discount?.enabled && pricing.discount.endDate) {
    const discountEndDate = new Date(pricing.discount.endDate);
    if (discountEndDate > now) {
      return {
        price: pricing.price,
        isFree: false,
        hasDiscount: true,
        originalPrice: pricing.discount.originalPrice,
        discountPercent: pricing.discount.percent,
        discountEndDate: pricing.discount.endDate,
      };
    }
  }

  // 4. 正常价格
  return { price: pricing.price, isFree: false, hasDiscount: false };
}

// 格式化价格显示
export function formatPrice(price: number, currency: string, locale: string): string {
  if (price === 0) {
    return locale === 'zh' ? '免费' : 'Free';
  }

  if (currency === 'USD') {
    return `$${price.toFixed(2)}`;
  } else if (currency === 'CNY') {
    return `¥${price.toFixed(2)}`;
  }

  return `${price.toFixed(2)} ${currency}`;
}

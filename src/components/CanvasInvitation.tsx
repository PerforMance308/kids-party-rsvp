'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type {
  InvitationTemplate,
  PartyData,
  TemplateElement,
} from '@/types/invitation-template';
import { useLocale, useTranslations } from '@/contexts/LanguageContext';

// 简洁的日期时间格式：1月15日 14:30 或 Jan 15, 2:30pm
function formatSimpleDateTime(date: Date, locale: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  if (locale === 'zh') {
    return `${month}月${day}日 ${hours}:${minutes}`;
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'pm' : 'am';
    return `${monthNames[date.getMonth()]} ${day}, ${hour12}:${minutes}${ampm}`;
  }
}

// 只格式化日期：1月15日 或 Jan 15, 2026
function formatSimpleDate(date: Date, locale: string): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  if (locale === 'zh') {
    return `${month}月${day}日`;
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
}

// 格式化时间范围：14:30-16:30 或 2:30pm - 4:30pm
function formatTimeRange(startDate: Date, endDate: Date | null, locale: string): string {
  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    if (locale === 'zh') {
      return `${hours}:${minutes}`;
    } else {
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'pm' : 'am';
      return `${hour12}:${minutes}${ampm}`;
    }
  };

  const startTime = formatTime(startDate);
  if (!endDate) {
    return startTime;
  }
  const endTime = formatTime(endDate);
  return `${startTime} - ${endTime}`;
}

interface CanvasInvitationProps {
  template: InvitationTemplate;
  party: PartyData;
  qrCodeUrl?: string;
  scale?: number;
  showControls?: boolean;
  onRenderComplete?: (canvas: HTMLCanvasElement) => void;
}

// 字体映射 - 将配置中的字体名映射到实际可用的字体
const FONT_MAP: Record<string, string> = {
  'LuckiestGuy-Regular': '"Luckiest Guy", "Comic Sans MS", cursive, sans-serif',
  'Arial-Bold': 'Arial, Helvetica, sans-serif',
  'Arial-Black': '"Arial Black", Arial, sans-serif',
  'ComicSansMS': '"Comic Sans MS", cursive, sans-serif',
};

export default function CanvasInvitation({
  template,
  party,
  qrCodeUrl,
  scale = 1,
  showControls = false,
  onRenderComplete,
}: CanvasInvitationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations('templates');

  // Target dimensions (based on dinosaur template)
  const TARGET_WIDTH = 1000;
  const TARGET_HEIGHT = 1400;

  const { config } = template;
  // Calculate stretch factors relative to original config size
  const stretchX = TARGET_WIDTH / config.canvas_size[0];
  const stretchY = TARGET_HEIGHT / config.canvas_size[1];

  // Using strictly the target dimensions for layout
  const canvasWidth = TARGET_WIDTH;
  const canvasHeight = TARGET_HEIGHT;

  // 获取元素的实际内容（只返回动态值，不加前缀，因为图片上已有标签）
  const getElementContent = useCallback(
    (element: TemplateElement): string => {
      const startDate = new Date(party.eventDatetime);
      const endDate = party.eventEndDatetime ? new Date(party.eventEndDatetime) : null;

      switch (element.name) {
        case 'child_name':
          // 只返回名字+'s 或 的
          return locale === 'zh'
            ? `${party.childName}的`
            : `${party.childName}'s`;
        case 'child_age':
          // 只返回年龄
          return locale === 'zh'
            ? `${party.childAge}岁`
            : `${party.childAge}`;
        case 'date_time':
          // 向后兼容：简洁格式：1月15日 14:30 或 Jan 15, 2:30pm
          return formatSimpleDateTime(startDate, locale);
        case 'date':
          // 只显示日期：1月15日 或 Jan 15, 2026
          return formatSimpleDate(startDate, locale);
        case 'time':
          // 显示时间范围：14:30-16:30 或 2:30pm - 4:30pm
          return formatTimeRange(startDate, endDate, locale);
        case 'location':
          // 只返回地点，不加前缀（图片上已有 Location:）
          return party.location;
        case 'notes':
          return party.notes || '';
        case 'theme':
          return party.theme || '';
        default:
          return element.content;
      }
    },
    [party, locale]
  );

  // 渲染Canvas
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);
    setError(null);

    try {
      // 设置Canvas尺寸 (Target size * scale)
      canvas.width = TARGET_WIDTH * scale;
      canvas.height = TARGET_HEIGHT * scale;

      // 应用缩放 (UI Scale)
      ctx.scale(scale, scale);

      // 加载背景图片
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('Failed to load background image'));
        bgImage.src = template.imageUrl;
      });

      // 绘制背景 - Stretch to fill target size
      ctx.drawImage(bgImage, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

      // 绘制文字元素
      for (const element of config.elements) {
        const content = getElementContent(element);
        if (!content) continue;

        // 设置字体 - Create scaled font size
        // We use stretchY primarily to match vertical scale, but could avg
        const scaledFontSize = element.font_size * stretchY;

        const fontFamily = FONT_MAP[element.font] || element.font;
        const fontWeight =
          element.font.includes('Bold') || element.font.includes('Black')
            ? 'bold'
            : 'normal';
        ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;

        // 设置对齐
        ctx.textAlign = element.align;
        ctx.textBaseline = 'top';

        // 计算x,y位置 - Apply stretch factors
        const x = element.position.x * stretchX;
        const y = element.position.y * stretchY;

        // 绘制描边（如果有）
        if (element.stroke_color && element.stroke_width) {
          ctx.strokeStyle = element.stroke_color;
          // Scale stroke width too
          ctx.lineWidth = element.stroke_width * stretchX * 2;
          ctx.lineJoin = 'round';
          ctx.strokeText(content, x, y);
        }

        // 绘制填充
        ctx.fillStyle = element.color;
        ctx.fillText(content, x, y);
      }

      // 绘制QR码（如果有配置且提供了QR码URL）
      if (qrCodeUrl && config.qr_code) {
        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          qrImage.onload = () => resolve();
          qrImage.onerror = () => reject(new Error('Failed to load QR code'));
          qrImage.src = qrCodeUrl;
        });

        const { position, size } = config.qr_code;

        // Scale QR code position and size
        const qrX = position.x * stretchX;
        const qrY = position.y * stretchY;
        const qrSize = size * stretchX; // Square size usually follows X or min scale

        // 绘制白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

        // 绘制QR码
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
      }

      setIsLoading(false);
      onRenderComplete?.(canvas);
    } catch (err) {
      console.error('Canvas render error:', err);
      setError(err instanceof Error ? err.message : 'Render failed');
      setIsLoading(false);
    }
  }, [
    template,
    config,
    qrCodeUrl,
    scale,
    // canvasWidth, canvasHeight are now constants inside
    stretchX,
    stretchY,
    getElementContent,
    onRenderComplete,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 下载功能
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${party.childName}-birthday-invitation.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // 打印功能
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const title = locale === 'zh'
        ? `邀请卡 - ${party.childName}的生日派对`
        : `Invitation - ${party.childName}'s Birthday Party`;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
              @media print {
                img { width: 6in; height: auto; }
              }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL('image/png')}" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      {showControls && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            🖨️ {locale === 'zh' ? '打印' : 'Print'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
            disabled={isLoading}
          >
            📥 {locale === 'zh' ? '下载' : 'Download'}
          </button>
        </div>
      )}

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-lg shadow-lg"
          style={{
            maxWidth: '100%',
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          }}
        />
      </div>
    </div>
  );
}

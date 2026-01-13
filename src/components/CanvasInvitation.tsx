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

  const { config } = template;
  const [canvasWidth, canvasHeight] = config.canvas_size;

  // 获取元素的实际内容（只返回动态值，不加前缀，因为图片上已有标签）
  const getElementContent = useCallback(
    (element: TemplateElement): string => {
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
            : `${party.childAge}${getOrdinalSuffix(party.childAge)}`;
        case 'date_time':
          // 简洁格式：1月15日 14:30 或 Jan 15, 2:30pm
          return formatSimpleDateTime(new Date(party.eventDatetime), locale);
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

  // 获取序数后缀
  function getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // 渲染Canvas
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoading(true);
    setError(null);

    try {
      // 设置Canvas尺寸
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;

      // 应用缩放
      ctx.scale(scale, scale);

      // 加载背景图片
      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        bgImage.onload = () => resolve();
        bgImage.onerror = () => reject(new Error('Failed to load background image'));
        bgImage.src = template.imageUrl;
      });

      // 绘制背景
      ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);

      // 绘制文字元素
      for (const element of config.elements) {
        const content = getElementContent(element);
        if (!content) continue;

        // 设置字体
        const fontFamily = FONT_MAP[element.font] || element.font;
        const fontWeight =
          element.font.includes('Bold') || element.font.includes('Black')
            ? 'bold'
            : 'normal';
        ctx.font = `${fontWeight} ${element.font_size}px ${fontFamily}`;

        // 设置对齐
        ctx.textAlign = element.align;
        ctx.textBaseline = 'top';

        // 计算x位置
        const x = element.position.x;
        const y = element.position.y;

        // 绘制描边（如果有）
        if (element.stroke_color && element.stroke_width) {
          ctx.strokeStyle = element.stroke_color;
          ctx.lineWidth = element.stroke_width * 2;
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

        // 绘制白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(position.x - 5, position.y - 5, size + 10, size + 10);

        // 绘制QR码
        ctx.drawImage(qrImage, position.x, position.y, size, size);
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
    canvasWidth,
    canvasHeight,
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

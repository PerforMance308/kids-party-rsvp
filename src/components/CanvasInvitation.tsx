'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type {
  InvitationTemplate,
  PartyData,
  TemplateElement,
} from '@/types/invitation-template';
import { getCanvasFontFamily } from '@/lib/invitation-fonts';
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
async function ensureCanvasFontsLoaded(template: InvitationTemplate) {
  const fontRequests = new Set<string>()
  for (const element of template.config.elements) {
    const fontFamily = getCanvasFontFamily(element.font)
    const fontWeight = element.font_weight
      || (element.font.includes('Bold') || element.font.includes('Black') ? 700 : 400)
    fontRequests.add(`${fontWeight} ${element.font_size}px ${fontFamily}`)
  }

  await Promise.all(
    Array.from(fontRequests).map((font) => document.fonts.load(font))
  )
  await document.fonts.ready
}

function useCanvasFonts(template: InvitationTemplate) {
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    setFontsReady(false)
    ensureCanvasFontsLoaded(template)
      .then(() => {
        if (!cancelled) setFontsReady(true)
      })
      .catch((error) => {
        console.error('Failed to load invitation fonts:', error)
        if (!cancelled) setFontsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [template])

  return fontsReady
}

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
  const fontsReady = useCanvasFonts(template);
  const t = useTranslations('templates');

  const { config } = template;
  // Use each template's own canvas size — no hardcoded target
  const canvasWidth = config.canvas_size[0];
  const canvasHeight = config.canvas_size[1];

  // 获取元素的实际内容（只返回动态值，不加前缀，因为图片上已有标签）
  const getElementContent = useCallback(
    (element: TemplateElement): string => {
      const startDate = new Date(party.eventDatetime);
      const endDate = party.eventEndDatetime ? new Date(party.eventEndDatetime) : null;

      switch (element.name) {
        case 'child_name':
          return party.childName;
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
      if (!fontsReady) {
        return;
      }
      // Set canvas pixel size from template config
      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;

      ctx.scale(scale, scale);

      if (config.backgroundColor) {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (config.borderColor) {
          ctx.strokeStyle = config.borderColor;
          ctx.lineWidth = 20;
          ctx.strokeRect(40, 40, canvasWidth - 80, canvasHeight - 80);

          ctx.lineWidth = 4;
          ctx.strokeRect(60, 60, canvasWidth - 120, canvasHeight - 120);
        }

        if (config.accentColor) {
          ctx.fillStyle = config.accentColor;
          const dotPositions = [
            [100, 100], [canvasWidth - 100, 100],
            [100, canvasHeight - 100], [canvasWidth - 100, canvasHeight - 100],
            [canvasWidth / 2, 80], [canvasWidth / 2, canvasHeight - 80]
          ];
          dotPositions.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      } else {
        const bgImage = new Image();
        bgImage.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          bgImage.onload = () => resolve();
          bgImage.onerror = () => reject(new Error('Failed to load background image'));
          bgImage.src = template.imageUrl;
        });

        ctx.drawImage(bgImage, 0, 0, canvasWidth, canvasHeight);
      }

      // Draw text elements — coordinates are already in canvas_size space
      for (const element of config.elements) {
        const content = getElementContent(element);
        if (!content) continue;

        const fontFamily = getCanvasFontFamily(element.font);
        const fontWeight = element.font_weight
          || (element.font.includes('Bold') || element.font.includes('Black') ? 700 : 400);
        ctx.font = `${fontWeight} ${element.font_size}px ${fontFamily}`;

        ctx.textAlign = element.align;
        ctx.textBaseline = 'top';

        const x = element.position.x;
        const y = element.position.y;

        // Determine max width for text wrapping
        // For location: use "123 Party Street, City77" as the reference max length
        const LOCATION_REF = '123 Party Street, City77';
        const maxWidth = element.max_width
          || (element.name === 'location'
            ? ctx.measureText(LOCATION_REF).width
            : canvasWidth);

        const lineHeight = element.font_size * (element.line_height || 1.3);

        // Wrap text into lines that fit within maxWidth
        const wrapText = (text: string): string[] => {
          if (ctx.measureText(text).width <= maxWidth) return [text];
          const words = text.split(/(\s+)/);
          const lines: string[] = [];
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine + word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine.trim()) {
              lines.push(currentLine.trim());
              currentLine = word.trimStart();
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine.trim()) lines.push(currentLine.trim());
          // If a single "word" is still too wide, force-break by character
          return lines.flatMap(line => {
            if (ctx.measureText(line).width <= maxWidth) return [line];
            const chars: string[] = [];
            let cur = '';
            for (const ch of line) {
              if (ctx.measureText(cur + ch).width > maxWidth && cur) {
                chars.push(cur);
                cur = ch;
              } else {
                cur += ch;
              }
            }
            if (cur) chars.push(cur);
            return chars;
          });
        };

        const lines = wrapText(content);

        for (let i = 0; i < lines.length; i++) {
          const ly = y + i * lineHeight;

          if (element.stroke_color && element.stroke_width) {
            ctx.strokeStyle = element.stroke_color;
            ctx.lineWidth = element.stroke_width * 2;
            ctx.lineJoin = 'round';
            ctx.strokeText(lines[i], x, ly);
          }

          ctx.fillStyle = element.color;
          ctx.fillText(lines[i], x, ly);
        }
      }

      // Draw QR code
      if (qrCodeUrl && config.qr_code) {
        const qrImage = new Image();
        qrImage.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          qrImage.onload = () => resolve();
          qrImage.onerror = () => reject(new Error('Failed to load QR code'));
          qrImage.src = qrCodeUrl;
        });

        const { position, size } = config.qr_code;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(position.x - 5, position.y - 5, size + 10, size + 10);

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
    canvasWidth,
    canvasHeight,
    qrCodeUrl,
    scale,
    getElementContent,
    onRenderComplete,
    fontsReady,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const createA4FourUpSheet = useCallback((sourceCanvas: HTMLCanvasElement) => {
    const a4Width = 2480;
    const a4Height = 3508;
    const margin = 120;
    const gap = 80;

    const sheet = document.createElement('canvas');
    sheet.width = a4Width;
    sheet.height = a4Height;

    const ctx = sheet.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create A4 sheet');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, a4Width, a4Height);

    const slotWidth = (a4Width - margin * 2 - gap) / 2;
    const slotHeight = (a4Height - margin * 2 - gap) / 2;

    const sourceRatio = sourceCanvas.width / sourceCanvas.height;
    let cardWidth = slotWidth;
    let cardHeight = cardWidth / sourceRatio;

    if (cardHeight > slotHeight) {
      cardHeight = slotHeight;
      cardWidth = cardHeight * sourceRatio;
    }

    const offsetX = (slotWidth - cardWidth) / 2;
    const offsetY = (slotHeight - cardHeight) / 2;

    const slots = [
      [margin, margin],
      [margin + slotWidth + gap, margin],
      [margin, margin + slotHeight + gap],
      [margin + slotWidth + gap, margin + slotHeight + gap],
    ];

    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;

    for (const [x, y] of slots) {
      const drawX = x + offsetX;
      const drawY = y + offsetY;
      ctx.drawImage(sourceCanvas, drawX, drawY, cardWidth, cardHeight);
      ctx.strokeRect(drawX, drawY, cardWidth, cardHeight);
    }

    return sheet;
  }, []);

  // 下载功能
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sheet = createA4FourUpSheet(canvas);
    const link = document.createElement('a');
    link.download = `${party.childName}-birthday-invitation-a4-4up.png`;
    link.href = sheet.toDataURL('image/png');
    link.click();
  };

  // 打印功能
  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sheet = createA4FourUpSheet(canvas);
    const sheetDataUrl = sheet.toDataURL('image/png');

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
              @page { size: A4 portrait; margin: 0; }
              html, body { margin: 0; padding: 0; background: #fff; }
              body { width: 210mm; height: 297mm; }
              img { width: 210mm; height: 297mm; display: block; }
              @media print {
                html, body { width: 210mm; height: 297mm; }
              }
            </style>
          </head>
          <body>
            <img src="${sheetDataUrl}" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
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

import QRCode from 'qrcode'

export interface QRCodeOptions {
  darkColor?: string
  lightColor?: string
}

export async function generateQRCode(url: string, options?: QRCodeOptions): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#FFFFFF',
      },
      width: 512,
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error('QR code generation error:', error)
    throw new Error('Failed to generate QR code')
  }
}
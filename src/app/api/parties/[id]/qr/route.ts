import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { generateQRCode } from '@/lib/qr'
import { getBaseUrl } from '@/lib/utils'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('QR API called for party:', id)

    // 从 URL 参数获取颜色配置（优先级最高）
    const { searchParams } = new URL(request.url)
    let darkColor = searchParams.get('darkColor') || undefined
    let lightColor = searchParams.get('lightColor') || undefined

    const session = await getServerSession(authOptions)
    console.log('QR API session:', { hasSession: !!session, userId: session?.user?.id })

    if (!session || !session.user?.id) {
      console.log('QR API unauthorized - no valid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const party = await prisma.party.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // 如果没有通过 URL 参数指定颜色，尝试从模板配置中获取
    if (!darkColor || !lightColor) {
      let templateId = party.template

      // 如果是 'free' 或空，需要查找第一个免费模板
      if (!templateId || templateId === 'free') {
        // 遍历主题文件夹查找第一个免费模板
        const invitationsDir = path.join(process.cwd(), 'public', 'invitations')
        if (fs.existsSync(invitationsDir)) {
          const themeFolders = fs.readdirSync(invitationsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)

          for (const themeFolder of themeFolders) {
            const themePath = path.join(invitationsDir, themeFolder)
            const jsonFiles = fs.readdirSync(themePath).filter(f => f.endsWith('.json') && f !== 'theme.json')

            for (const jsonFile of jsonFiles) {
              try {
                const config = JSON.parse(fs.readFileSync(path.join(themePath, jsonFile), 'utf-8'))
                if (config.pricing?.isFree) {
                  templateId = jsonFile.replace('.json', '')
                  break
                }
              } catch (err) {
                // ignore
              }
            }
            if (templateId && templateId !== 'free') break
          }
        }
        // 如果仍然没找到，默认使用 dinosaur_1
        if (!templateId || templateId === 'free') {
          templateId = 'dinosaur_1'
        }
      }

      // 从模板ID解析主题名（格式为 theme_number，如 dinosaur_1）
      const themeName = templateId.includes('_')
        ? templateId.split('_').slice(0, -1).join('_')
        : templateId

      const configPath = path.join(process.cwd(), 'public', 'invitations', themeName, `${templateId}.json`)

      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
          if (config.qr_code) {
            darkColor = darkColor || config.qr_code.darkColor
            lightColor = lightColor || config.qr_code.lightColor
          }
        } catch (err) {
          console.warn('Failed to read template config for QR colors:', err)
        }
      }
    }

    const rsvpUrl = `${getBaseUrl()}/rsvp/${party.publicRsvpToken}`
    const qrCodeDataUrl = await generateQRCode(rsvpUrl, { darkColor, lightColor })

    return NextResponse.json({ qrCode: qrCodeDataUrl, rsvpUrl })
  } catch (error) {
    console.error('QR code generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
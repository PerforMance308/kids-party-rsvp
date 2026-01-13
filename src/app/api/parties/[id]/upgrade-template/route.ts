import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'
import Stripe from 'stripe'
import fs from 'fs'
import path from 'path'
import type { TemplateConfig } from '@/types/invitation-template'
import { getEffectivePrice } from '@/types/invitation-template'

// 获取模板配置
function getTemplateConfig(templateId: string): TemplateConfig | null {
  // 从模板ID解析主题名（格式为 theme_number，如 dinosaur_1）
  const parts = templateId.split('_')
  if (parts.length < 2) return null

  const themeName = parts.slice(0, -1).join('_')
  const configPath = path.join(
    process.cwd(),
    'public',
    'invitations',
    themeName,
    `${templateId}.json`
  )

  if (!fs.existsSync(configPath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return null
  }
}

// 格式化响应数据
function formatPartyResponse(party: any) {
  const rsvps = party.guests.map((g: any) => g.rsvp).filter(Boolean)
  const stats = {
    total: party.guests.length,
    attending: rsvps.filter((r: any) => r?.status === 'YES').length,
    notAttending: rsvps.filter((r: any) => r?.status === 'NO').length,
    maybe: rsvps.filter((r: any) => r?.status === 'MAYBE').length,
  }

  const childAge = Math.floor(
    (new Date().getTime() - new Date(party.child.birthDate).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  )

  return {
    id: party.id,
    childName: party.child.name,
    childAge,
    eventDatetime: party.eventDatetime,
    location: party.location,
    theme: party.theme,
    notes: party.notes,
    template: party.template,
    paidTemplates: party.paidTemplates,
    publicRsvpToken: party.publicRsvpToken,
    rsvpUrl: `${getBaseUrl()}/rsvp/${party.publicRsvpToken}`,
    guests: party.guests,
    stats,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-02-24.acacia',
  })

  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template, paymentId } = body

    if (!template) {
      return NextResponse.json({ error: 'Template is required' }, { status: 400 })
    }

    // 验证party所有权
    const party = await prisma.party.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // 获取模板配置
    const templateConfig = getTemplateConfig(template)
    if (!templateConfig) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // 计算有效价格
    const effectivePrice = getEffectivePrice(templateConfig.pricing)

    // 免费模板直接使用
    if (effectivePrice.isFree) {
      const updatedParty = await prisma.party.update({
        where: { id },
        data: { template },
        include: {
          child: true,
          guests: {
            include: {
              rsvp: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Template applied successfully!',
        party: formatPartyResponse(updatedParty),
      })
    }

    // 检查是否已购买
    const alreadyPurchased = (party.paidTemplates || []).includes(template)

    if (alreadyPurchased) {
      // 已购买，直接切换
      const updatedParty = await prisma.party.update({
        where: { id },
        data: { template },
        include: {
          child: true,
          guests: {
            include: {
              rsvp: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Template switched successfully!',
        party: formatPartyResponse(updatedParty),
      })
    }

    // 未购买且需付费，验证支付
    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required for premium templates' },
        { status: 400 }
      )
    }

    console.log('Verifying template payment:', paymentId)

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)

      console.log('Payment data:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      })

      // 验证支付状态
      if (paymentIntent.status !== 'succeeded') {
        console.error('Payment not succeeded:', paymentIntent.status)
        return NextResponse.json(
          {
            error: 'Payment has not been completed',
            status: paymentIntent.status,
          },
          { status: 400 }
        )
      }

      // 验证金额（转换为分）
      const expectedAmountCents = Math.round(effectivePrice.price * 100)
      if (paymentIntent.amount !== expectedAmountCents) {
        console.error('Payment amount mismatch:', {
          expected: expectedAmountCents,
          received: paymentIntent.amount,
        })
        return NextResponse.json(
          { error: 'Payment amount verification failed' },
          { status: 400 }
        )
      }

      // 验证元数据
      if (
        paymentIntent.metadata?.feature !== 'template' ||
        paymentIntent.metadata?.templateId !== template
      ) {
        console.error('Payment metadata mismatch:', paymentIntent.metadata)
        return NextResponse.json(
          { error: 'Payment metadata verification failed' },
          { status: 400 }
        )
      }

      console.log('Payment verified successfully')
    } catch (verificationError) {
      console.error('Payment verification error:', verificationError)

      if (verificationError instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          { error: 'Payment verification failed', details: verificationError.message },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
    }

    // 更新party：添加到已购买列表并切换模板
    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        template,
        paidTemplates: { push: template },
      },
      include: {
        child: true,
        guests: {
          include: {
            rsvp: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Template upgrade successful!',
      party: formatPartyResponse(updatedParty),
    })
  } catch (error) {
    console.error('Template upgrade error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

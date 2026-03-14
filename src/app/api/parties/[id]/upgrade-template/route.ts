import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'
import Stripe from 'stripe'
import { getTemplateConfig, getEffectivePrice } from '@/lib/template-utils'

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
    const templateConfig = await getTemplateConfig(template)
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

    let verifiedAmount = 0
    let verifiedCurrency = 'usd'

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

      // 验证金额：只要实际支付 > 0 即可（价格由 create-intent 服务端控制，不可篡改）
      if (paymentIntent.amount <= 0) {
        console.error('Payment amount invalid:', paymentIntent.amount)
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

      verifiedAmount = paymentIntent.amount
      verifiedCurrency = paymentIntent.currency

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

    // Record payment in database (in case webhook doesn't fire)
    try {
      const existingPayment = await prisma.payment.findUnique({
        where: { stripePaymentId: paymentId }
      })
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            userId: session.user.id,
            partyId: id,
            stripePaymentId: paymentId,
            feature: 'template',
            amount: verifiedAmount,
            currency: verifiedCurrency,
            status: 'succeeded',
            metadata: JSON.stringify({ templateId: template }),
          },
        })
        console.log('💾 Payment recorded in database')
      }
    } catch (paymentRecordError) {
      console.error('Failed to record payment (may already exist):', paymentRecordError)
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

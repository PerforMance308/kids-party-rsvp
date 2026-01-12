import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/utils'
import Stripe from 'stripe'

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

    // Verify the party belongs to the current user
    const party = await prisma.party.findUnique({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if template is premium
    const premiumTemplates = ['premium1', 'premium2', 'premium3', 'premium4']
    if (!premiumTemplates.includes(template)) {
      return NextResponse.json({ error: 'Template is not premium' }, { status: 400 })
    }

    // Check if this template is already purchased
    const alreadyPurchased = (party.paidTemplates || []).includes(template)

    // If already purchased, just switch template
    if (alreadyPurchased) {
      const updatedParty = await prisma.party.update({
        where: { id },
        data: { template },
        include: {
          child: true,
          guests: {
            include: {
              rsvp: true
            }
          }
        }
      })

      // Calculate stats
      const rsvps = updatedParty.guests.map(g => g.rsvp).filter(Boolean)
      const stats = {
        total: updatedParty.guests.length,
        attending: rsvps.filter(r => r?.status === 'YES').length,
        notAttending: rsvps.filter(r => r?.status === 'NO').length,
        maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
      }

      const childAge = Math.floor((new Date().getTime() - new Date(updatedParty.child.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))

      return NextResponse.json({
        success: true,
        message: 'Template switched successfully!',
        party: {
          id: updatedParty.id,
          childName: updatedParty.child.name,
          childAge,
          eventDatetime: updatedParty.eventDatetime,
          location: updatedParty.location,
          theme: updatedParty.theme,
          notes: updatedParty.notes,
          template: updatedParty.template,
          paidTemplates: updatedParty.paidTemplates,
          publicRsvpToken: updatedParty.publicRsvpToken,
          rsvpUrl: `${getBaseUrl()}/rsvp/${updatedParty.publicRsvpToken}`,
          guests: updatedParty.guests,
          stats
        }
      })
    }

    // Verify payment if paymentId is provided
    if (paymentId) {
      console.log('🔍 Verifying template payment:', paymentId)

      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId)

        console.log('📄 Payment data:', {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
        })

        // Check if payment actually succeeded
        if (paymentIntent.status !== 'succeeded') {
          console.error('❌ Payment not succeeded:', paymentIntent.status)
          return NextResponse.json(
            {
              error: 'Payment has not been completed',
              status: paymentIntent.status
            },
            { status: 400 }
          )
        }

        // Verify amount is correct ($1.39 = 139 cents for template)
        const expectedAmount = 139 // $1.39 in cents
        if (paymentIntent.amount !== expectedAmount) {
          console.error('❌ Payment amount mismatch:', {
            expected: expectedAmount,
            received: paymentIntent.amount,
          })
          return NextResponse.json(
            { error: 'Payment amount verification failed' },
            { status: 400 }
          )
        }

        // Verify metadata matches
        if (paymentIntent.metadata?.feature !== 'template' || 
            paymentIntent.metadata?.templateId !== template) {
          console.error('❌ Payment metadata mismatch:', paymentIntent.metadata)
          return NextResponse.json(
            { error: 'Payment metadata verification failed' },
            { status: 400 }
          )
        }

        console.log('✅ Payment verified successfully')
      } catch (verificationError) {
        console.error('💥 Payment verification error:', verificationError)
        
        if (verificationError instanceof Stripe.errors.StripeError) {
          return NextResponse.json(
            { error: 'Payment verification failed', details: verificationError.message },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to verify payment' },
          { status: 500 }
        )
      }
    } else {
      // If no paymentId, return error (payment required)
      return NextResponse.json(
        { error: 'Payment ID is required for premium templates' },
        { status: 400 }
      )
    }

    // Update party: add template to paidTemplates
    const updatedParty = await prisma.party.update({
      where: { id },
      data: {
        template,
        paidTemplates: { push: template }
      },
      include: {
        child: true,
        guests: {
          include: {
            rsvp: true
          }
        }
      }
    })

    // Calculate stats
    const rsvps = updatedParty.guests.map(g => g.rsvp).filter(Boolean)
    const stats = {
      total: updatedParty.guests.length,
      attending: rsvps.filter(r => r?.status === 'YES').length,
      notAttending: rsvps.filter(r => r?.status === 'NO').length,
      maybe: rsvps.filter(r => r?.status === 'MAYBE').length,
    }

    // Calculate child age
    const today = new Date()
    const birthDate = new Date(updatedParty.child.birthDate)
    const childAge = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

    const responseData = {
      id: updatedParty.id,
      childName: updatedParty.child.name,
      childAge,
      eventDatetime: updatedParty.eventDatetime,
      location: updatedParty.location,
      theme: updatedParty.theme,
      notes: updatedParty.notes,
      template: updatedParty.template,
      paidTemplates: updatedParty.paidTemplates,
      publicRsvpToken: updatedParty.publicRsvpToken,
      rsvpUrl: `${getBaseUrl()}/rsvp/${updatedParty.publicRsvpToken}`,
      guests: updatedParty.guests,
      stats
    }

    return NextResponse.json({
      success: true,
      message: 'Template upgrade successful!',
      party: responseData
    })
  } catch (error) {
    console.error('Template upgrade error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

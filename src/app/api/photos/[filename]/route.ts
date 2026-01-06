import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'photos')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id

    // Find photo in database
    const photo = await prisma.photo.findFirst({
      where: { filename },
      include: {
        party: true
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check if user has access to this photo
    const party = photo.party
    const isHost = party.userId === userId

    // If not host, check if user has RSVPed
    if (!isHost) {
      const hasRSVP = await prisma.guest.findFirst({
        where: {
          partyId: party.id,
          userId: userId,
          rsvp: {
            isNot: null
          }
        }
      })

      if (!hasRSVP) {
        return NextResponse.json({ 
          error: 'Access denied' 
        }, { status: 403 })
      }
    }

    // Check if photo sharing is enabled
    if (!party.allowPhotoSharing || !party.photoSharingPaid) {
      return NextResponse.json({ 
        error: 'Photo sharing is not enabled for this party' 
      }, { status: 403 })
    }

    // Read and serve the file
    const filepath = join(UPLOAD_DIR, filename)
    const fileBuffer = await readFile(filepath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': photo.mimeType,
        'Content-Length': photo.fileSize.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Photo access error:', error)
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ error: 'Photo file not found' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Failed to access photo' },
      { status: 500 }
    )
  }
}
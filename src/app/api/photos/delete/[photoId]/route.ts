import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { isValidUUID } from '@/lib/security'
import { unlink } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'photos')

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const { photoId } = await params

    // Validate photo ID format
    if (!isValidUUID(photoId)) {
      return NextResponse.json({ error: 'Invalid photo ID' }, { status: 400 })
    }

    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id

    // Find photo with party info
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        party: true
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check if user has permission to delete
    // Only party host or photo uploader can delete
    const isHost = photo.party.userId === userId
    const isUploader = photo.uploaderId === userId

    if (!isHost && !isUploader) {
      return NextResponse.json({ 
        error: 'You can only delete photos you uploaded or if you are the party host' 
      }, { status: 403 })
    }

    // Delete from database first
    await prisma.photo.delete({
      where: { id: photoId }
    })

    // Try to delete the file from disk (don't fail if file doesn't exist)
    try {
      const filepath = join(UPLOAD_DIR, photo.filename)
      await unlink(filepath)
    } catch (error) {
      // File might already be deleted or not exist, that's okay
      console.warn(`Failed to delete file ${photo.filename}:`, error)
    }

    return NextResponse.json({ 
      message: 'Photo deleted successfully' 
    })
  } catch (error) {
    console.error('Delete photo error:', error)
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
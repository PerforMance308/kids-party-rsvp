import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'photos')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id
    const userName = session.user.name || 'Anonymous'

    const formData = await request.formData()
    const file = formData.get('file') as File
    const partyId = formData.get('partyId') as string
    const caption = formData.get('caption') as string

    if (!file || !partyId) {
      return NextResponse.json({ error: 'File and party ID are required' }, { status: 400 })
    }

    // Validate file type and size
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only JPEG, PNG, and WebP images are allowed' 
      }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size must be less than 5MB' 
      }, { status: 400 })
    }

    // Verify party exists and user has access
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    })

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 })
    }

    // Check if photo sharing is enabled and paid for
    if (!party.allowPhotoSharing || !party.photoSharingPaid) {
      return NextResponse.json({ 
        error: 'Photo sharing is not enabled for this party' 
      }, { status: 403 })
    }

    // Check if user is host or has RSVPed to this party
    const isHost = party.userId === userId
    const hasRSVP = !isHost ? await prisma.guest.findFirst({
      where: {
        partyId: partyId,
        userId: userId,
        rsvp: {
          isNot: null
        }
      }
    }) : null

    if (!isHost && !hasRSVP) {
      return NextResponse.json({ 
        error: 'You must RSVP to this party to upload photos' 
      }, { status: 403 })
    }

    // Create upload directory if it doesn't exist
    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const filename = `${uuidv4()}.${fileExtension}`
    const filepath = join(UPLOAD_DIR, filename)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save photo record to database
    const photo = await prisma.photo.create({
      data: {
        partyId: partyId,
        uploaderId: userId,
        uploaderName: userName,
        filename: filename,
        originalName: file.name,
        caption: caption ? sanitizeInput(caption) : null,
        fileSize: file.size,
        mimeType: file.type
      }
    })

    return NextResponse.json({
      id: photo.id,
      filename: photo.filename,
      originalName: photo.originalName,
      caption: photo.caption,
      uploaderName: photo.uploaderName,
      uploadedAt: photo.uploadedAt
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
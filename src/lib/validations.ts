import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const partySchema = z.object({
  childId: z.string().min(1, 'Child selection is required'),
  eventDatetime: z.date().refine(
    date => date > new Date(),
    'Event must be in the future'
  ),
  rsvpClosesAt: z.date().optional(),
  location: z.string().min(1, 'Location is required'),
  locationFull: z.string().optional(),
  theme: z.string().optional(),
  notes: z.string().optional(),
  targetAge: z.number().min(0).max(99).optional(),
  templateId: z.string().min(1, 'Template selection is required'),
  paymentId: z.string().optional(),
})

// Legacy schema for backward compatibility
export const legacyPartySchema = z.object({
  childName: z.string().min(1, 'Child name is required'),
  childAge: z.number().min(1, 'Age must be at least 1').max(99, 'Invalid age'),
  eventDatetime: z.date().refine(
    date => date > new Date(),
    'Event must be in the future'
  ),
  rsvpClosesAt: z.date().optional(),
  location: z.string().min(1, 'Location is required'),
  locationFull: z.string().optional(),
  theme: z.string().optional(),
  notes: z.string().optional(),
  targetAge: z.number().min(0).max(99).optional(),
  templateId: z.string().min(1, 'Template selection is required'),
  paymentId: z.string().optional(),
})

export const rsvpSchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100, 'Child name is too long'),
  email: z.string().email('Invalid email address').max(254, 'Email is too long'),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  status: z.enum(['YES', 'NO', 'MAYBE']),
  numChildren: z.number().min(0, 'Number of children must be 0 or more').max(20, 'Too many children'),
  parentStaying: z.boolean(),
  allergies: z.string().max(500, 'Allergies text is too long').optional(),
  message: z.string().max(1000, 'Message is too long').optional(),
})

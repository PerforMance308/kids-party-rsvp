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
  childName: z.string().min(1, 'Child name is required'),
  childAge: z.number().min(1, 'Age must be at least 1').max(18, 'Age must be under 18'),
  eventDatetime: z.date().refine(
    date => date > new Date(),
    'Event must be in the future'
  ),
  location: z.string().min(1, 'Location is required'),
  theme: z.string().optional(),
  notes: z.string().optional(),
})

export const rsvpSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required'),
  childName: z.string().min(1, 'Child name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  status: z.enum(['YES', 'NO', 'MAYBE']),
  numChildren: z.number().min(0, 'Number of children must be 0 or more'),
  parentStaying: z.boolean(),
  allergies: z.string().optional(),
  message: z.string().optional(),
})
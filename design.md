AI-EXECUTABLE BUILD SPEC
Project: Kid Party RSVP (North America)
GLOBAL INSTRUCTIONS (VERY IMPORTANT)

You are building a production-quality web application, not a demo.

Strict requirements:

Clean architecture

Readable, maintainable code

Mobile-first UI

High-quality UX

No placeholder UI

No fake data

No external paid APIs required

Assume:

Users are non-technical parents

Guests do NOT create accounts

Privacy and simplicity are critical

TECH STACK (MANDATORY)

Frontend:

Next.js (App Router)

TypeScript

Tailwind CSS

Responsive mobile-first design

Server Components where possible

Backend:

Node.js

Express OR Next.js API routes

SQLite for MVP (use Prisma ORM)

JWT authentication (host only)

Other:

UUIDs for public links

QR Code generation (local library)

Email sending can be mocked or local SMTP

CORE PRODUCT PRINCIPLES

One party = one page

Guests never log in

No social features

No public discovery

Web-first, app later

Paper invitation + QR code is first-class workflow

STEP 0 — PROJECT INITIALIZATION

Tasks:

Initialize Next.js project with TypeScript

Install Tailwind CSS

Set up Prisma with SQLite

Configure environment variables

Enable absolute imports

Set up basic layout shell (Header + Main)

Do NOT:

Add analytics

Add auth UI yet

STEP 1 — DATABASE SCHEMA (CRITICAL)

Create Prisma schema with the following models:

User (Party Host)

Fields:

id (uuid, primary key)

email (unique)

password_hash

created_at

Party

Fields:

id (uuid, primary key)

user_id (foreign key → User)

child_name

child_age

event_datetime

location

theme (nullable)

notes (nullable)

public_rsvp_token (uuid, unique)

created_at

Guest

Fields:

id (uuid)

party_id (foreign key → Party)

parent_name

child_name

email

phone (nullable)

created_at

RSVP

Fields:

id (uuid)

guest_id (foreign key → Guest)

status (enum: YES | NO | MAYBE)

num_children

parent_staying (boolean)

allergies (nullable)

message (nullable)

updated_at

Reminder

Fields:

id (uuid)

party_id

type (enum: SEVEN_DAYS | TWO_DAYS | SAME_DAY)

sent_at (nullable)

Run migrations.

STEP 2 — AUTHENTICATION (HOST ONLY)

Implement:

Email + password registration

Login

JWT session

Middleware for protected routes

Scope:

ONLY hosts authenticate

Guests never authenticate

Pages:

/login

/register

UX:

Minimal

Large inputs

Mobile friendly

STEP 3 — PARTY CREATION FLOW

Page: /party/new

Form fields:

Child name (required)

Child age (required, number)

Date & time picker

Location (free text)

Theme (optional)

Notes (optional)

On submit:

Create Party

Generate public_rsvp_token

Redirect to party dashboard

Validation:

Client + server validation

Clear error messages

STEP 4 — QR CODE & PUBLIC RSVP LINK

For each party:

Generate public URL:
/rsvp/{public_rsvp_token}

Generate:

QR code image

Downloadable / printable

QR requirements:

High contrast

Scannable

Uses only public token

STEP 5 — PUBLIC RSVP PAGE (NO AUTH)

Route:

/rsvp/[token]

Rules:

No navigation

No header

No footer

Single-purpose page

Display:

Child name

Age

Date & time

Location

Notes

RSVP Form:

Parent name

Child name

Email (required)

Attending? (YES / NO / MAYBE)

Number of children attending

Parent staying? (yes/no)

Food allergies

Message

On submit:

Create or reuse Guest by email

Create or update RSVP

Show confirmation screen

STEP 6 — GUEST IDENTITY SYSTEM (IMPORTANT)

Behavior:

Guests are identified by email

No passwords

No login

Logic:

If email exists → reuse Guest profile

Track historical invitations per email

Purpose:

Enable future contact reuse

Enable growth loop

STEP 7 — HOST DASHBOARD

Route:

/party/[id]/dashboard

Display:

Total invited

Attending count

Not attending count

Maybe count

Table:

Parent name

Child name

RSVP status

Allergies

Parent staying

Actions:

Copy reminder message

Export list (CSV)

Live updates:

Revalidate data on RSVP submit

STEP 8 — CONTACT REUSE (KEY DIFFERENTIATOR)

When creating a new party:

Show previously invited guests

Allow selecting guests

Auto-fill guest list

This is required.

STEP 9 — REMINDER SYSTEM (NO PAID APIs)

Implement server-side scheduler:

7 days before event

2 days before

Same day morning

Reminder content:

Plain text email

Friendly tone

No marketing

Sending:

Can log to console or local SMTP

Architecture must support real email later

STEP 10 — UX POLISH (MANDATORY)

Apply:

Consistent spacing

Rounded cards

Soft shadows

Friendly typography

Clear CTA buttons

Mobile UX:

Thumb-friendly

No tiny text

No hover-only actions

Do NOT:

Overuse colors

Add animations that slow down flow

STEP 11 — PRIVACY & SAFETY

Rules:

Guests cannot see other guests

Invite URLs are unguessable

No public index

No tracking pixels

STEP 12 — PROGRESSIVE APP PROMPT (OPTIONAL UI)

Show app download suggestion ONLY when:

Party is within 3 days

RSVP status changes

Message:
"Want automatic reminders and updates?"

Do NOT block web usage.

STEP 13 — QUALITY CHECKLIST (DO NOT SKIP)

The build is NOT complete unless:

Entire flow works on mobile Safari & Chrome

RSVP works without login

QR scan → RSVP in under 60 seconds

No console errors

UI looks production-ready

STEP 14 — DEPLOYMENT READY

Prepare:

ENV configs

Production build

Basic error handling

README for future devs

FINAL INSTRUCTION TO AI

Build this as if:

It will be used by real parents next week

Mistakes cause real stress

Simplicity is more important than features

✅ END OF AI BUILD SPEC
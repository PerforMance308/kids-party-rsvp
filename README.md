# Kid Party RSVP 🎉

A simple, beautiful web application for managing children's party invitations and RSVPs. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **No Guest Logins Required**: Guests can RSVP without creating accounts
- **QR Code Invitations**: Generate scannable QR codes for paper invitations
- **Real-time Dashboard**: Track RSVPs, dietary restrictions, and contact information
- **Contact Reuse**: Easily invite the same group for future parties
- **Smart Reminders**: Automated email reminders (7 days, 2 days, same day)
- **Mobile-First Design**: Optimized for phones and tablets
- **Privacy-Focused**: Parties are completely private and secure

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Authentication**: JWT-based session management
- **Security**: Rate limiting, input sanitization, CSRF protection

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/kidparty.git
   cd kidparty
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration. **IMPORTANT**: Never commit the `.env` file to version control as it contains sensitive information.
   
   Required variables:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="generate-a-secure-random-string"
   NEXTAUTH_SECRET="generate-another-secure-random-string"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   
   For Google OAuth (optional):
   ```
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```
   
   For email functionality (optional):
   ```
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-gmail-app-password"
   SMTP_FROM="Kid Party RSVP <your-email@gmail.com>"
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Prisma Studio

## Usage

### For Party Hosts

1. **Sign Up/Login**: Create an account or sign in
2. **Create a Party**: Fill in party details (date, location, theme, etc.)
3. **Share Invitations**: 
   - Generate QR codes for paper invitations
   - Copy and share the RSVP link directly
4. **Track RSVPs**: Monitor responses in real-time on your dashboard
5. **Manage Guest List**: Export to CSV, view dietary restrictions

### For Guests

1. **Receive Invitation**: Scan QR code or click link
2. **RSVP**: Fill out simple form (no account needed)
3. **Get Reminders**: Receive automatic friendly reminders

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out

### Parties
- `GET /api/parties` - List user's parties
- `POST /api/parties` - Create new party
- `GET /api/parties/[id]` - Get party details
- `GET /api/parties/[id]/qr` - Generate QR code

### RSVPs
- `GET /api/rsvp/[token]` - Get party info by public token
- `POST /api/rsvp/[token]` - Submit RSVP

### Reminders
- `POST /api/reminders/process` - Process pending reminders (cron job)

## Security Features

- **Rate Limiting**: Prevents abuse of API endpoints
- **Input Sanitization**: Cleans user input to prevent XSS
- **CSRF Protection**: Secure cookie configuration
- **Privacy Protection**: Guests cannot see each other's information
- **Secure Headers**: Comprehensive security headers
- **UUID Tokens**: Unguessable invitation links

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

### Self-Hosted

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | Yes |
| `SMTP_HOST` | Email server host | No* |
| `SMTP_PORT` | Email server port | No* |
| `SMTP_USER` | Email username | No* |
| `SMTP_PASS` | Email password | No* |
| `SMTP_FROM` | From email address | No* |

*Email configuration is optional for MVP. Reminders will be logged to console.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to your branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have questions or need help:

1. Check the [Issues](https://github.com/yourusername/kidparty/issues) for existing questions
2. Create a new issue with details about your problem
3. For security issues, please email security@kidparty.app

## Roadmap

- [ ] Email service integration (SendGrid, AWS SES)
- [ ] SMS reminders
- [ ] Multiple party templates
- [ ] Photo sharing
- [ ] Gift registry integration
- [ ] Multi-language support
- [ ] Calendar integration

---

**Built with ❤️ for parents who just want to throw amazing parties without the stress.**
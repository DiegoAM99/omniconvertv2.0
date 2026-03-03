# OmniConvert Web

Next.js 14 frontend application for OmniConvert file conversion platform.

## Features

- Server-side rendering with Next.js App Router
- Responsive design with Tailwind CSS
- File drag-and-drop upload with react-dropzone
- Real-time conversion progress with SSE
- Authentication with NextAuth.js
- Type-safe API client

## Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

The web app will be available at http://localhost:3000

## Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── (auth)/      # Authentication pages (login, signup)
│   ├── dashboard/   # User dashboard
│   ├── pricing/     # Pricing page
│   └── page.tsx     # Homepage
├── components/      # React components
│   ├── ui/         # Reusable UI components
│   └── upload/     # Upload-specific components
├── lib/            # Utilities and configurations
└── styles/         # Global styles
```

## Building for Production

```bash
# Build
npm run build

# Start production server
npm run start
```

## Testing

```bash
# Run unit tests
npm run test

# Run E2E tests with Playwright
npm run test:e2e
```

## Deployment

Deploy to Vercel:

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

Environment variables required:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_URL`
- OAuth credentials (optional)

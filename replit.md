# Overview

This is a full-stack obituary generation and collaboration platform built with modern web technologies. The application allows users to create obituaries through a form-based interface, generate content using AI (Claude and ChatGPT), collaborate on obituary content with feedback systems, and create memorial spaces called "FinalSpaces" for remembrance.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with JSON responses
- **File Handling**: Multer for image and document uploads
- **Document Processing**: Mammoth for DOCX files, pdf-parse for PDF files

## Database Architecture
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **ORM**: Drizzle ORM with Neon serverless connection
- **Schema Location**: `shared/schema.ts` for type-safe database operations
- **Migrations**: Managed through Drizzle Kit

# Key Components

## User Management
- User authentication system with admin/regular user roles
- Session-based authentication for secure access control

## Obituary Management
- Multi-step form for collecting deceased person information
- Support for family relationships, education, career, and personal details
- Image upload capability for memorial photos
- Document upload support (.docx, .pdf) for reference materials

## AI Integration
- **Claude Integration**: Using Anthropic's claude-sonnet-4-20250514 model
- **ChatGPT Integration**: Using OpenAI's gpt-4o model
- Multiple generation versions and revision capabilities
- Customizable prompt templates for different AI providers

## Collaboration System
- Shareable links for obituary collaboration
- Text highlighting and feedback system (liked/disliked selections)
- Real-time collaboration sessions with unique UUIDs
- Collaborator management with email-based invitations

## FinalSpaces (Memorial Pages)
- Public memorial pages for deceased individuals
- Comment system for condolences and memories
- Image galleries for memorial photos
- Social media integration and music playlists

# Data Flow

1. **Obituary Creation**: User fills form → Data stored in obituaries table → AI generates content → Content stored in generated_obituaries table
2. **Collaboration**: Owner invites collaborators → Shareable link generated → Collaborators provide feedback → Feedback stored in text_feedback table
3. **Content Generation**: Form data + prompts → AI APIs → Generated content → Version tracking → Revision capability
4. **Memorial Creation**: Completed obituary → FinalSpace creation → Public memorial page → Community engagement

# External Dependencies

## AI Services
- **Anthropic Claude API**: Primary AI content generation
- **OpenAI GPT API**: Alternative AI content generation
- Environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL hosting
- **Connection**: Via `DATABASE_URL` environment variable

## Email Services
- **SendGrid**: Email delivery for notifications (configured but not fully implemented)
- Environment variable: `SENDGRID_API_KEY`

## File Processing
- **Mammoth**: Microsoft Word document processing
- **pdf-parse**: PDF document text extraction
- **Multer**: File upload handling

# Deployment Strategy

## Development
- **Command**: `npm run dev`
- **Port**: 5000 (configured in .replit)
- **HMR**: Enabled through Vite development server

## Production Build
- **Build Command**: `npm run build`
- **Vite Build**: Compiles client-side assets to `dist/public`
- **ESBuild**: Bundles server code to `dist/index.js`
- **Start Command**: `npm run start`

## Database Management
- **Schema Push**: `npm run db:push`
- **Migrations**: Stored in `./migrations` directory
- **Development**: Auto-migration on schema changes

## Environment Configuration
- **NODE_ENV**: Controls development/production behavior
- **DATABASE_URL**: Required for database connectivity
- **API Keys**: Required for AI service integration

# Changelog
- June 24, 2025: Initial setup
- June 24, 2025: Implemented hierarchical user management system (Admin → Funeral Home → Employee)
- June 24, 2025: Updated project branding to "DeathMatters"
- June 24, 2025: Added authentication system with password-based login
- June 24, 2025: Created team management and account information features for funeral homes

# User Preferences

Preferred communication style: Simple, everyday language.
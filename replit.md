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
- June 24, 2025: Rebuilt user switching system with URL-based state management for clean transitions
- June 24, 2025: Implemented Platform Surveys management system with survey creation, editing, and question building
- June 24, 2025: Fixed authentication flow - login now properly redirects to dashboard with correct user permissions
- June 24, 2025: Added Individual user type to dashboard user switching dropdown with restricted access
- June 24, 2025: Fixed home page header layout - consolidated duplicate headers into single header with user type dropdown
- June 24, 2025: Created persistent global header across all pages with functional user type dropdown and conditional Dashboard button
- June 24, 2025: Restored existing user switching functionality to global header for testing all user types across all pages
- June 24, 2025: Created "Individual Need Assessment Survey" with 80 questions and conditional logic functionality
- June 24, 2025: Implemented ConditionalSurveyForm component with dynamic show/hide questions based on previous answers
- June 24, 2025: Added conditional question fields to database schema (conditionalQuestionId, conditionalValue, conditionalOperator)
- June 24, 2025: Replaced all native browser confirm() dialogs with styled AlertDialog components for consistent UI/UX
- June 24, 2025: Extended session duration to 7 days and added development bypass for persistent login during testing
- June 24, 2025: Updated user permissions system with proper access controls for all user types and added Individual user type with collaboration-only obituary access

# User Management Structure

## User Hierarchy
1. **System Admin**: Full platform access
   - All obituaries across funeral homes
   - Question Management
   - Prompt Templates  
   - Funeral Home Management
   - FinalSpaces

2. **Funeral Home Admin**: Manages funeral home account
   - Team obituaries (own + employees)
   - Team Management (invite/manage up to 5 employees)
   - Account Information
   - FinalSpaces

3. **Employee**: Creates content for funeral home
   - Create obituaries (visible to funeral home admin)
   - Personal account settings
   - FinalSpaces

4. **Individual**: Collaborates on obituaries when invited
   - View/edit only obituaries they are invited to collaborate on
   - FinalSpaces
   - Personal account management with notification preferences

## User Switching
The application supports switching between user types via dropdown for testing:
- Admin User - John Admin (System Admin)
- Funeral Home - Jane Smith (Funeral Home Admin) 
- Employee - Mike Johnson (FH Employee)
- Individual - Sarah Wilson (Individual User)

## Dummy Login Credentials
For testing purposes, use these credentials:
- **Admin**: email: admin@deathmatters.com, password: admin123
- **Funeral Home**: email: funeral@deathmatters.com, password: funeral123  
- **Employee**: email: employee@deathmatters.com, password: employee123
- **Individual**: Individual users can register through the signup form

## Authentication Flow
- Login redirects to /dashboard with proper user type detection
- Session persistence maintains authentication state
- Dashboard dynamically shows menu items based on authenticated user permissions
- User switching dropdown available for testing different permission levels

# User Preferences

Preferred communication style: Simple, everyday language.
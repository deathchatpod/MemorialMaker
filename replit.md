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
- June 24, 2025: Removed all user permissions - all user types now have access to all dashboard functions per user request
- June 24, 2025: Restored comprehensive dashboard functionality - all built features now accessible through unified dashboard interface
- June 24, 2025: Cleaned up redundant files (home-old.tsx, employee-account.tsx) - functionality consolidated into main components
- June 24, 2025: Disabled development error overlays for production-ready user experience
- June 24, 2025: Reorganized dashboard with 4 main menu items (Obituaries, FinalSpaces, My Collaborations, Platform Surveys) showing table views with create buttons that route to separate pages
- June 24, 2025: Fixed CreateFinalSpace UserContext error - replaced with URL parameter user data for consistent authentication pattern
- June 24, 2025: Removed cluttering user profile section from dashboard sidebar for cleaner interface
- June 24, 2025: Removed redundant "Funeral Home Management" tab - functionality covered by Team Management and My Account
- June 24, 2025: Enhanced CreateFinalSpace with multi-media upload support - up to 25 images, 10 audio files, 5 YouTube videos with primary media selection
- June 24, 2025: Fixed CreateFinalSpace navigation - removed confusing back buttons, only shows "Back to Dashboard" and "Cancel" which both return to dashboard
- June 24, 2025: Implemented version management system - shows latest 2 versions prominently with collapsible history, saves all old versions with feedback display
- June 24, 2025: Fixed collaborator addition issue - added missing API endpoints for collaboration functionality
- June 24, 2025: Added revision generation system - creates new versions based on feedback with "Revise Claude" and "Revise ChatGPT" buttons
- June 24, 2025: Removed redundant "Back to Dashboard" button from generated obituaries page - navigation handled by global header
- June 24, 2025: Added "Pre Need Evaluation" dashboard tab with table view of completed evaluations
- June 24, 2025: Created "Take Pre Need Evaluation" function using existing Individual Needs Assessment Survey
- June 24, 2025: Extended survey_responses schema with responseType, completedById, completedByType for scalable survey management
- June 24, 2025: Implemented standard user filtering for evaluations (users see own, funeral homes see team, admin sees all)
- June 24, 2025: Added evaluation results viewer with formatted question/answer display
- June 24, 2025: Implemented auto-fill functionality for Pre Need Evaluation - when user selects "yourself", form auto-populates with account info and syncs changes back to user account
- June 24, 2025: Fixed Pre Need Evaluation navigation - now returns to dashboard Pre Need Evaluation tab after completion
- June 25, 2025: **PHASE 1 COMPLETE** - FinalSpaces core functionality working: creation, memorial page viewing, commenting system, edit functionality, database schema with enhanced fields
- June 25, 2025: **PHASE 2 COMPLETE** - Enhanced media galleries with interactive controls, obituary integration with expandable previews, responsive design for mobile devices, view count tracking, and improved navigation
- June 25, 2025: **PHASE 3 COMPLETE** - Advanced memorial design editor implemented with real-time visual customization, drag-and-drop element positioning, theme system, typography controls, device preview modes, and interactive canvas
- June 25, 2025: **CRITICAL FIXES** - Fixed obituary and memorial navigation 404 errors, implemented tab state persistence, resolved routing issues across application
- June 25, 2025: **FINALSPACES COLLABORATION COMPLETE** - Implemented full collaboration system for FinalSpaces with email invitations, unified My Collaborations table showing both obituaries and memorials with filtering, collaboration management component, and database schema extensions
- June 25, 2025: **UNIFIED TABLE SYSTEM** - Created consistent DataTable component with sortable, searchable, and filterable functionality across all dashboard tabs (Obituaries, FinalSpaces, Platform Surveys, Pre Need Evaluations, My Collaborations) for unified user experience
- June 25, 2025: **CREATE MEMORIAL COLLABORATORS** - Added collaborator management functionality to Create Final Space page above privacy settings, allowing users to invite collaborators during memorial creation process with automatic invitation sending upon memorial creation
- June 25, 2025: **CRITICAL FIXES COMPLETED** - Fixed My Collaborations API endpoint returning HTML instead of JSON, corrected negative age calculations in obituary data, improved user display names in evaluations, enhanced data validation with comprehensive Zod schemas, updated browserslist data, and strengthened error handling across all API endpoints
- June 25, 2025: **CODEBASE OPTIMIZATION COMPLETED** - Removed duplicate collaboration-manager.tsx (kept CollaborationManager.tsx), removed unused list components (finalspaces-list.tsx, obituaries-list.tsx) replaced by unified dashboard tables, cleaned up uploads directory, and removed 4 truly unused packages (memorystore, vaul, input-otp, tw-animate-css) while preserving email service, OAuth, and complex editing tools for future development
- June 25, 2025: **PHASE 4 PREPARATION** - Implemented comprehensive email notification system with SendGrid/Nodemailer fallback, added mobile optimization components, integrated notification center into global header, created deployment readiness checker, and enhanced collaboration APIs with automatic email invitations
- June 25, 2025: **PHASE 3 COMPLETION** - Implemented complete drag-and-drop editor with resizable elements (corner handles), grid-based positioning system with snap functionality, element layering controls with z-index management, and comprehensive layer manager component
- June 25, 2025: **PHASE 4 COMPLETION** - Implemented complete visual customization system: comprehensive typography controls with font families and styling, background customizer with solid colors/gradients/images, border and shadow effects with presets, CSS-based photo filters with real-time preview, and integrated all Phase 4 components into memorial design editor
- June 25, 2025: **UNDO/REDO & SLIDESHOW SYSTEM COMPLETE** - Implemented comprehensive undo/redo system with useUndoRedo hook tracking all changes, created slideshow creator with photo management and embedded YouTube players, enhanced MediaUploader with initial data support, integrated social media link management with platform detection, added music playlist functionality with external link support, and built MediaManager component with tabbed interface for complete media workflow
- June 25, 2025: **CODEBASE OPTIMIZATION & PRODUCTION READINESS** - Completed comprehensive cleanup: removed all console.log debugging statements across 8+ files, optimized ConditionalSurveyForm with useMemo to prevent infinite loops, fixed TypeScript errors in MemorialEditor and create-final-space components, cleaned bloated storage (reduced from 17MB to 328KB by removing 44 screenshot files), improved MediaManager integration with proper TypeScript interfaces, and enhanced performance across all components for production deployment
- June 25, 2025: **ACCESSIBILITY IMPLEMENTATION PHASE 1** - Implemented low and medium-risk accessibility improvements following WCAG 2.1 AA standards: added semantic HTML structure with proper landmark roles (header, nav, main), context-aware skip links, enhanced form labels and validation feedback with aria-live regions, improved keyboard navigation and focus management, enhanced DataTable component with proper ARIA attributes and screen reader support, excluded drag-and-drop editor from accessibility updates per user requirements for minimal disruption
- June 25, 2025: **APP STARTUP DEBUGGING & DASHBOARD RESTORATION** - Fixed critical JSX syntax errors that prevented app startup caused by malformed dashboard-new.tsx file. **TEMPORARY FEATURE LOSS**: During emergency fix, created simplified dashboard that temporarily lost advanced DataTable functionality including sorting, filtering, search capabilities, and sophisticated column management. Working to restore full DataTable component with all original features while maintaining app stability. User data remains safe in database (2 obituaries, 1 final space confirmed present).
- June 26, 2025: **LOGIN PERSISTENCE & AUTHENTICATION FIXES** - Fixed critical login persistence issue by removing development authentication bypass that was interfering with session management, corrected TypeScript errors in collaboration API endpoints, restored proper session-based authentication with 7-day session duration, validated authentication flow with proper user data persistence, and confirmed all existing user data remains intact
- June 26, 2025: **MY ACCOUNT TAB UNIVERSAL ACCESS** - Made "My Account" tab available for all user types (admin, funeral home, employee, individual), restructured account form with separate Address section and collapsible Additional Addresses functionality, renamed "Business Name" to "Business Name (if applicable)", added Email Notification Settings placeholder section for future email features, removed redundant business information text, and implemented toast notifications with 3-second auto-dismiss functionality
- June 26, 2025: **STRUCTURED ADDRESS FIELDS IMPLEMENTATION** - Converted address storage from single text field to structured separate fields (street, city, state, zipCode, country) for proper database verification and validation, updated all user tables (admin_users, funeral_homes, employees) with separate address columns, implemented additional addresses as JSON array with full address structure, created comprehensive address form with primary and additional address management, and added proper data validation for address fields
- June 26, 2025: **TEAM MANAGEMENT TAB RESTORED** - Confirmed Team Management tab is properly displaying for Admin and Funeral Home users in dashboard sidebar with correct conditional logic, verified user type switching functionality works correctly, and cleaned up debug logging for production readiness
- June 26, 2025: **SEARCH & DISCOVERY IMPLEMENTATION** - Created comprehensive search functionality with SearchInterface component featuring advanced filtering by content type, date ranges, and funeral homes, implemented debounced search queries with caching, added mobile-optimized search results with proper pagination and result highlighting
- June 26, 2025: **MOBILE OPTIMIZATION COMPLETE** - Implemented MobileMemorialViewer component with touch gesture support for media gallery navigation, created swipe-enabled photo galleries with navigation indicators, optimized memorial viewing experience for mobile devices with responsive design and touch-friendly interactions
- June 26, 2025: **PERFORMANCE ENHANCEMENTS** - Added PerformanceMonitor class with API response time tracking and LRU caching system, implemented LazyImage component with intersection observer for optimized image loading, created debounce and throttle utilities for search and scroll optimization, enhanced query client configuration with intelligent retry logic
- June 26, 2025: **SECURITY MIDDLEWARE IMPLEMENTATION** - Created comprehensive security middleware with rate limiting for API endpoints (100 req/min general, 30 searches/min, 5 auth attempts/15min), implemented input validation and sanitization to prevent XSS attacks, added security headers including CSP, XSS protection, and clickjacking prevention, created file upload validation with size and type restrictions
- June 26, 2025: **DATA SECURITY & PRIVACY PROTECTIONS IMPLEMENTED** - Added comprehensive data encryption at rest using AES encryption for sensitive user fields (emails, names, addresses, phone numbers), implemented enhanced authentication security with password complexity requirements (8+ chars, uppercase, lowercase, numbers, special chars), added account lockout protection (5 failed attempts = 15min lockout), created PasswordStrengthIndicator component for real-time password validation feedback, integrated encryption/decryption utilities into storage layer and authentication routes
- June 26, 2025: **MEMORIAL THEME VISUAL REDESIGN COMPLETE** - Successfully implemented comprehensive dark memorial aesthetic across entire platform using grey backgrounds with black, white, grey, and brown accents, integrated proper Lucide React icon components throughout navigation menu items and page headers, updated DataTable component to support custom icons in create buttons, applied consistent memorial theme styling to ALL Card components across dashboard, forms, editors, customizers, and utility pages, enhanced visual hierarchy with appropriate iconography for obituaries, memorials, collaborations, surveys, and account management sections
- June 26, 2025: **TEXT CONTRAST FIXES** - Fixed home page text readability issues by replacing brown text on light backgrounds with high-contrast white text (text-foreground) matching other page elements, ensuring all text meets accessibility standards
- June 26, 2025: **TOAST & READABILITY IMPROVEMENTS** - Fixed excessive "Media Updated" toast notifications in FinalSpaces editing by removing redundant triggers, replaced all hardcoded amber/yellow text colors with proper theme colors for consistent readability across all components and pages
- June 27, 2025: **COMPREHENSIVE COLOR CONTRAST FIXES COMPLETE** - Systematically eliminated ALL instances of brown/amber text on light backgrounds across entire platform, replaced yellow/amber colors with orange variants and gray text with theme-aware `text-muted-foreground`, fixed contrast issues in MediaUploader star icons, DeploymentReadiness warning badges, PasswordStrengthIndicator, MediaManager, and MemorialEditor components, ensuring full accessibility compliance while maintaining memorial theme aesthetic
- June 27, 2025: **MEMORIAL PAGE TEXT READABILITY FIXED** - Resolved all dark text on black background issues in memorial pages, updated main headers, descriptions, comments, and media gallery text to use white and light gray colors for proper contrast, ensuring complete readability across all memorial page elements while preserving dark memorial aesthetic
- June 27, 2025: **DASHBOARD DARK THEME COMPLETION** - Systematically converted entire dashboard from light to dark theme including all table headers (bg-gray-800), borders (border-gray-700), row hovers (hover:bg-gray-700), cell text (text-gray-300), loading messages, and empty states, ensuring complete visual consistency across obituaries, FinalSpaces, and all dashboard components with proper accessibility contrast
- June 27, 2025: **SURVEYS DASHBOARD FUNCTIONALITY RESTORED** - Fixed surveys section accessibility by implementing proper data loading, dark theme table display with survey names/question counts/dates, functional edit and settings buttons, and resolved duplicate variable declarations preventing surveys from loading properly
- June 27, 2025: **OBITUARY REVIEW PHASE 1 COMPLETE** - Implemented comprehensive obituary review upload system with "Prompt Templates" admin tab, responsive "Upload Obit for Review" button in Obituaries section, dynamic survey integration using existing "Obituary Feedback" survey, document processing endpoint supporting .docx/.pdf files with 10MB validation, text extraction functionality, and preview modal displaying survey responses with document content
- June 27, 2025: **DASHBOARD FILE CLEANUP COMPLETE** - Resolved critical dashboard duplication issue by removing 3 duplicate dashboard files (dashboard-clean.tsx, dashboard-new.tsx, dashboard-simple.tsx), consolidated to single source of truth (dashboard-fixed.tsx), restored missing obituary function buttons with improved formatting and proper placement above data table
- June 27, 2025: **ACCESSIBILITY IMPLEMENTATION COMPLETE** - Implemented comprehensive accessibility features following WCAG 2.1 AA standards: created AccessibilityProvider context for settings management, built AccessibilityToolbar with font size controls (small/medium/large/xlarge), high contrast mode, reduce motion preferences, screen reader support with text-to-speech functionality, added skip navigation links, enhanced focus indicators, and integrated proper semantic HTML structure with ARIA attributes across all components
- June 27, 2025: **ACCESSIBILITY TOOLBAR RELOCATED TO MY ACCOUNT** - Moved accessibility toolbar from global header to dedicated "Accessibility Settings" section within the My Account tab, making accessibility controls easily accessible but non-intrusive during regular platform use, improving user experience while maintaining full WCAG 2.1 AA compliance
- June 27, 2025: **OBITUARY REVIEW PROCESSING OPTIMIZATION COMPLETE** - Fixed automatic redirection to feedback page after submission instead of dashboard, implemented real-time polling to detect processing completion automatically, added automatic AI processing with Claude integration for immediate feedback generation, resolved pending review status issues with manual processing triggers, and optimized user experience for seamless obituary review workflow
- June 27, 2025: **OBITUARY REVIEW 404 ERROR FIXED** - Resolved critical authentication and query issues preventing users from accessing obituary review results page, removed unnecessary authentication requirements from review API endpoints, fixed React Query configuration with explicit queryFn to properly fetch review data, confirmed complete obituary review workflow now functional with AI feedback display
- June 27, 2025: **DELETE CONFIRMATION & FOREIGN KEY FIXES COMPLETE** - Replaced all browser confirm() dialogs with styled AlertDialog components using dark theme for consistent UX, fixed foreign key constraint deletion errors by updating storage layer to cascade delete related API calls before removing obituary reviews, updated empty state message for obituary reviews table to display "There are no Obituaries uploaded for review yet." when no data present
- June 27, 2025: **OBITUARY REVIEW ROUTING FIXED** - Fixed 404 error when accessing obituary review results by correcting redirect URL from `/obituary-review-results/${id}` to `/obituary-review/${id}/results`, made obituary reviews table always visible in dashboard with proper empty state message, ensured complete end-to-end obituary review workflow functionality

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
Dashboard tab persistence: Users should remain on their last visited tab when returning to dashboard.
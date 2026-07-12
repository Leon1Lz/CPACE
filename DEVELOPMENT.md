# CPACE Learning Portal - Development Guide

## 🛠️ Development Tools

### Next.js 16
Next.js 16 is a React-based full-stack web framework that enables server-side rendering, static site generation, and built-in API route handling. It uses the App Router architecture with file-based routing and supports server components, client components, and dynamic route segments. The developers used Next.js 16 as the primary framework for the CPACE Learning Portal, handling both the frontend dashboard interface and all backend REST API routes within a single unified codebase.

### TypeScript
TypeScript is a strongly typed programming language that builds on JavaScript by adding static type definitions. It helps catch errors at compile time rather than runtime, improving code reliability and developer productivity. The developers used TypeScript throughout the CPACE Learning Portal to enforce type safety across all API routes, Prisma queries, React components, and form handlers.

### React
React is a JavaScript library for building user interfaces through reusable, component-based architecture. It enables efficient rendering of dynamic content and interactive UI elements. The developers used React as the core UI library within Next.js to build all interactive components, pages, dashboards, and views of the CPACE Learning Portal.

### Tailwind CSS
Tailwind CSS is a utility-first CSS framework that enables rapid UI development through predefined classes. It allows developers to build responsive, modern designs directly in the markup without writing custom CSS files. The developers used Tailwind CSS to style and design all pages and components of the CPACE Learning Portal, ensuring a consistent, responsive, and professional user interface across all screen sizes.

### Supabase
Supabase is an open-source cloud-based platform that provides a fully managed PostgreSQL database, real-time capabilities, and file storage. It offers a visual dashboard for managing database tables and users. The developers used Supabase as the cloud database hosting platform for the CPACE Learning Portal, storing all learner records, course information, assessments, enrollment data, exam sessions, and certification records in a reliable and scalable PostgreSQL environment.

### Prisma ORM
Prisma is a modern open-source Object-Relational Mapping (ORM) tool for Node.js and TypeScript that simplifies database access and management. It provides a type-safe query builder, schema definition language, and migration tools. The developers used Prisma as the database ORM for the CPACE Learning Portal to define the full database schema, manage schema changes via `db push`, and perform all type-safe database operations connected to the Supabase PostgreSQL instance.

### NextAuth.js
NextAuth.js is a complete authentication solution designed for Next.js applications. It supports credentials-based login with JWT session tokens and provides secure, server-side session management. The developers used NextAuth.js to implement user authentication, bcrypt password hashing, role-based access control, and session handling for the CPACE Learning Portal across ADMIN, INSTRUCTOR, PROCTOR, and LEARNER roles.

### shadcn/ui
shadcn/ui is a collection of reusable, accessible, and customizable UI components built on top of Radix UI primitives and styled with Tailwind CSS. It provides production-ready components including forms, dialogs, tables, dropdowns, badges, and navigation elements. The developers used shadcn/ui to build the consistent and accessible interface of the CPACE Learning Portal, including the dashboard layout, assessment cards, user management tables, and settings forms.

### Zod
Zod is a TypeScript-first schema validation library used for parsing and validating data at runtime. It provides a concise API for defining schemas and generating TypeScript types from them automatically. The developers used Zod in all API routes of the CPACE Learning Portal to validate incoming request bodies, enforce required fields, and return structured error messages when input data is invalid.

### Visual Studio Code
Visual Studio Code is a lightweight yet powerful source code editor that supports multiple programming languages and development extensions. It is considered an efficient development environment suitable for modern software development due to its flexibility and extensibility (Taylor & Francis, 2023). The developers used Visual Studio Code for coding and managing the development of the CPACE Learning Portal.

### GitHub
GitHub is a cloud-based platform used for code storage, version control, and collaborative software development. GitHub enables developers to track code changes and collaborate efficiently during system development. The developers used GitHub to manage source code versions and support collaborative development of the CPACE Learning Portal.

---

## �� Quick Start

### Prerequisites
- Node.js 18+
- npm
- Supabase account (PostgreSQL database)

### Initial Setup
```bash
# Install dependencies
npm install

# Apply database schema to Supabase
npx prisma db push

# Regenerate Prisma client after schema changes
npx prisma generate

# Start development server
npm run dev
```

### Environment Variables (.env)
```bash
DATABASE_URL="postgresql://postgres.<project>:<password>@<host>:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project>:<password>@<host>:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="<generated-secret>"
NEXTAUTH_URL="http://localhost:3000"
```

## 📁 Project Structure

```
CPACE/
├── app/
│   ├── api/                          # REST API routes
│   │   ├── auth/                     # NextAuth + registration
│   │   ├── assessments/              # Assessment CRUD + submit
│   │   │   └── [id]/
│   │   │       ├── questions/        # Question management
│   │   │       │   └── [qid]/        # Delete individual question
│   │   │       └── submit/           # Submit exam answers
│   │   ├── certificates/             # Certificate listing
│   │   ├── courses/                  # Course CRUD
│   │   ├── dashboard/stats/          # Dashboard stats
│   │   ├── enrollments/              # Enroll / unenroll
│   │   ├── reports/                  # Reporting data
│   │   └── users/                    # User management
│   │       └── me/                   # Profile & password update
│   ├── dashboard/
│   │   ├── assessments/              # Assessment list (grouped by program)
│   │   │   └── [id]/
│   │   │       ├── manage/           # Question management UI
│   │   │       └── take/             # Exam-taking UI
│   │   ├── certificates/             # Certificate viewer
│   │   ├── courses/                  # Course management / learner enrollment
│   │   │   └── create/               # Course creation form
│   │   ├── reports/                  # Analytics & reports
│   │   ├── settings/                 # Profile & password settings
│   │   ├── users/                    # User management (admin)
│   │   └── layout.tsx                # Dashboard layout with sidebar
│   ├── login/                        # Login page
│   ├── register/                     # Registration page
│   └── layout.tsx                    # Root layout with SessionProvider
├── components/
│   ├── ui/                           # shadcn/ui components
│   └── wireframe/
│       └── app-sidebar.tsx           # Role-based sidebar navigation
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── prisma.ts                     # Prisma client singleton
│   └── utils.ts                      # Utility functions
├── prisma/
│   └── schema.prisma                 # Full database schema
├── public/
│   └── logo.svg
└── .env                              # Environment variables (gitignored)
```

## 🎨 Design System

### Color Palette
```css
/* CPACE Brand Colors */
--cpace-600: #006B3F    /* Primary Green */
--cpace-700: #005534    /* Dark Green */
--cpace-500: #2d9f7d    /* Light Green */
--accent-500: #f59e0b    /* Gold/Accent */
--neutral-600: #525252   /* Text Gray */
```

### Components
- **Header**: Professional navigation with logo
- **Hero Section**: Green gradient with grid pattern
- **Split-Screen Auth**: Form left, hero content right
- **Cards**: Program cards with shadows and hover effects

## 🔐 Authentication System

### User Roles
- **ADMIN**: Full system access — user management, course/assessment CRUD, reports, certificates
- **INSTRUCTOR**: Create and manage courses and assessments, view learner progress
- **PROCTOR**: Monitor live exam sessions and flag suspicious activity
- **LEARNER**: Browse and enroll in courses, take assessments, earn certificates

### Auth Flow
1. Registration → `POST /api/auth/register` → bcrypt hash → Database
2. Login → NextAuth CredentialsProvider → JWT session → Dashboard
3. Role-based sidebar and page guards enforce access per role

### Security
- Passwords hashed with `bcrypt` (10 salt rounds)
- `NEXTAUTH_SECRET` is a cryptographically random 32-byte base64 key
- `.env` is excluded from Git via `.gitignore`
- All API routes validate session and check user role before responding

### Key Files
- `lib/auth.ts` - NextAuth configuration with JWT callbacks
- `app/api/auth/register/route.ts` - Registration with Zod validation
- `app/api/users/me/route.ts` - Profile and password update
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler

## 🗄️ Database Schema

### Core Models
```prisma
User {
  id, email, password, firstName, lastName, role (ADMIN|INSTRUCTOR|PROCTOR|LEARNER)
  phone, isActive, createdAt
  → coursesCreated, enrollments, assessmentResults, certificates, examSessions
}

Course {
  id, title, description, category, level, status (DRAFT|PUBLISHED|ARCHIVED)
  price, duration, thumbnail, creatorId, instructorId
  → modules, enrollments, assessments, certificates
}

Assessment {
  id, title, type (REVIEWER|PRACTICE_EXAM|RULES_GUIDELINES|FINAL_EXAM|QUIZ)
  timeLimit, attempts (null = unlimited), passingScore, isPublished
  → questions, results, examSessions
}

Question {
  id, question, type (MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER|ESSAY)
  points, order
  → options (QuestionOption)
}

Enrollment {
  userId, courseId, progress, status (ACTIVE|COMPLETED|DROPPED|SUSPENDED)
}

AssessmentResult {
  userId, assessmentId, score, passed, attempt, startedAt, completedAt
  → answers, examSession
}

ExamSession {
  userId, assessmentId, resultId
  status (IN_PROGRESS|SUBMITTED|ABANDONED|FLAGGED)
  startedAt, submittedAt, flagged, flagReason, ipAddress
}

Certificate {
  userId, courseId, certificateNumber, issuedAt, isValid
}
```

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Create migration
npx prisma migrate dev --name migration-name

# View database
npx prisma studio
```

## 🖥️ Development Commands

### Terminal Live Tracking
```bash
# Start development server with logs
npm run dev

# Start database server
npx prisma dev

# Watch for file changes
npm run dev -- --turbo

# Check types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Multi-Process Development
```bash
# Terminal 1: Development Server
npm run dev

# Terminal 2: Database Server
npx prisma dev

# Terminal 3: Database Studio (optional)
npx prisma studio
```

## 📱 Application URLs

### Pages
| Route | Description | Roles |
|-------|-------------|-------|
| `/` | Landing page | Public |
| `/login` | Login page | Public |
| `/register` | Registration | Public |
| `/dashboard` | Home dashboard | All |
| `/dashboard/courses` | Course management / enrollment | All |
| `/dashboard/assessments` | Assessments grouped by program | All |
| `/dashboard/assessments/[id]/manage` | Question management | Admin/Instructor |
| `/dashboard/assessments/[id]/take` | Take exam | Learner |
| `/dashboard/certificates` | Certificates | All |
| `/dashboard/users` | User management | Admin |
| `/dashboard/reports` | Analytics & reports | Admin/Instructor |
| `/dashboard/settings` | Profile & password | All |

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/PATCH | `/api/users/me` | Get/update own profile |
| GET/PATCH | `/api/users` | List/update users (admin) |
| GET/POST | `/api/courses` | List/create courses |
| GET/POST | `/api/assessments` | List/create assessments |
| GET/POST | `/api/assessments/[id]/questions` | List/add questions |
| DELETE | `/api/assessments/[id]/questions/[qid]` | Delete question |
| POST | `/api/assessments/[id]/submit` | Submit exam answers |
| GET/POST/DELETE | `/api/enrollments` | Manage enrollments |
| GET | `/api/certificates` | List certificates |
| GET | `/api/dashboard/stats` | Dashboard statistics |

### Pagination
All list endpoints support `?page=1&limit=20` query parameters and return:
```json
{ "data": [...], "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
```

## 🎯 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# Test locally
npm run dev

# Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### 2. Database Changes
```bash
# Update schema.prisma
# Generate migration
npx prisma migrate dev --name descriptive-name

# Test migration
npx prisma db push
```

### 3. Component Development
```bash
# Create new component
mkdir components/new-feature
touch components/new-feature/component.tsx

# Import and use in pages
# Test with hot reload
```

## 🚀 Deployment

### Environment Variables
```bash
# .env file
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
```

### Build Commands
```bash
# Build for production
npm run build

# Start production server
npm start

# Export static (if needed)
npm run export
```

## 🔧 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure Prisma dev server is running
2. **Port Conflicts**: Change ports in .env or kill conflicting processes
3. **Build Errors**: Check TypeScript types and imports
4. **Auth Issues**: Verify NEXTAUTH_SECRET and URL configuration

### Debug Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset database
npx prisma migrate reset
```

## ✅ Completed Features

- [x] Role-based authentication (ADMIN, INSTRUCTOR, PROCTOR, LEARNER)
- [x] Course creation and management
- [x] Learner course enrollment flow
- [x] Assessment grouping by program (CFMS, CMMS, COMS)
- [x] Assessment types: Reviewer, Practice Exam, Rules & Guidelines, Final Exam
- [x] Question management UI (Multiple Choice, True/False, Short Answer, Essay)
- [x] Timed exam-taking UI with countdown timer
- [x] Exam submission, scoring, and pass/fail results
- [x] Auto-certificate issuance on Final Exam pass
- [x] Certificate listing page
- [x] User management with role and active status control
- [x] Profile and password settings API
- [x] Pagination on all list API endpoints
- [x] ExamSession model for proctor monitoring
- [x] Secure environment variables (.env gitignored, rotated secrets)

## 📚 Next Development Steps

### Priority 1: Exam Experience
- [ ] Browser Lock — Fullscreen API + tab-switch detection + flag ExamSession
- [ ] Built-in Calculator — floating draggable component inside exam-taking page
- [ ] Forgot Password — PasswordResetToken model + email link + reset form

### Priority 2: Proctor Features
- [ ] Proctor dashboard UI — live exam session monitor
- [ ] Proctor API — `/api/proctor/sessions` for active sessions
- [ ] Real-time chat between learner and proctor (Supabase Realtime)
- [ ] Flag/unflag learner session from proctor view
- [ ] Proctor sidebar navigation and role guards

### Priority 3: Reporting & Notifications
- [ ] Email report after exam submission (Resend / Nodemailer)
- [ ] CSV/XLSX report export for digital transformation forwarding
- [ ] PDF certificate download (@react-pdf/renderer)
- [ ] Advanced analytics dashboard

### Priority 4: Integrations
- [ ] Single active session enforcement (invalidate old JWT on new login)
- [ ] CRM webhook on enrollment/completion (depends on client's CRM)
- [ ] SSO — Azure AD / Okta via NextAuth enterprise provider (needs client IT credentials)

### Priority 5: Production
- [ ] Push pending schema changes (`npx prisma db push` via DIRECT_URL)
- [ ] Deploy to Vercel
- [ ] Set production NEXTAUTH_URL
- [ ] Rate limiting on login endpoint

## 🛠️ Useful VS Code Extensions

- **ES7+ React/Redux/React-Native snippets** - React development
- **Tailwind CSS IntelliSense** - Tailwind autocompletion
- **Prisma** - Database schema highlighting
- **Thunder Client** - API testing
- **GitLens** - Git history and blame

## 📞 Support

For development issues:
1. Check this guide first
2. Review error logs in terminal
3. Test with fresh database (npx prisma migrate reset)
4. Check environment variables
5. Verify Node.js and npm versions

---

**Happy Coding! 🚀**

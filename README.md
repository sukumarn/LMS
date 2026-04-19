# Nova LMS

Nova LMS is a premium, fintech-style learning management system built with `Next.js App Router`, `TypeScript`, `Tailwind CSS`, `shadcn/ui` patterns, `Framer Motion`, `Zustand`, and a Supabase-native backend.

## Architecture overview

- `app/`: App Router routes, layouts, and API endpoints.
- `components/`: Reusable UI primitives and feature modules.
- `lib/`: Shared utilities, session helpers, Supabase server clients, Stripe, Cloudinary, and Mux clients.
- `store/`: Zustand client state for sidebar, offers, and notes.
- `hooks/`: Shared client hooks.
- `api/`: Frontend API helper layer.
- `supabase/`: SQL schema bootstrap and migration files.

## Core surfaces

- Dashboard with KPI cards, activity feed, and analytics charts
- User catalog with registration and course access
- Learning experience backed by database-driven lessons, materials, and quizzes
- Admin panel for course creation, lesson creation, and course inventory management
- Analytics view for revenue and cohort performance
- API routes for course creation, lesson creation, enrollment, analytics, offers, checkout, auth, and upload

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create the schema in Supabase:

Run the SQL file in the Supabase SQL editor:

```text
supabase/migrations/001_lms_core.sql
supabase/migrations/002_quiz_questions.sql
supabase/migrations/003_enrollment_rls.sql
supabase/migrations/004_lesson_status.sql
supabase/migrations/005_quiz_attempts.sql
supabase/migrations/006_multi_tenant_access.sql
```

4. Copy your Supabase environment variables into `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The publishable key powers public reads and future auth/session work.
The service role key is required for server-side admin mutations and enrollment writes.

5. Run the app:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Supabase Design

This project follows a Supabase-native multi-tenant pattern:

- authenticated users are resolved from `NextAuth` or Supabase Auth
- tenant membership is stored in `client_memberships`
- course, lesson, enrollment, and analytics queries are scoped by `client_id`
- admin pages and enrollment APIs use server-side Supabase writes

## Database design

The learning product is backed by these core tables:

- `users`: global identities
- `clients`: tenant workspaces
- `client_memberships`: tenant-scoped roles and membership state
- `platform_roles`: platform-level roles for product administration
- `courses`: tenant-scoped catalog records, pricing, publishing state, instructor, creator
- `lessons`: ordered lesson records under a course
- `lesson_materials`: one material resource per lesson
- `lesson_quizzes`: one quiz configuration per lesson
- `enrollments`: user-course registration and progress state

The tenant upgrade is completed by [supabase/migrations/006_multi_tenant_access.sql](/Users/sukumar/Documents/LMS/supabase/migrations/006_multi_tenant_access.sql).

## Integrations

- `NextAuth`: local credentials flow is included and can be replaced with enterprise SSO when needed.
- `Stripe`: `/app/api/checkout/route.ts` uses live Checkout when `STRIPE_SECRET_KEY` is present.
- `Mux` and `Cloudinary`: `/app/api/upload/route.ts` returns a configuration error until both services are configured.

## Styling system

- CSS variables power dark and light mode.
- Glassmorphism panels use `glass-panel` and `gradient-border`.
- Tailwind theme extends gradients, glow shadows, and motion primitives.
- Reusable shadcn-style components live under `components/ui`.

## Project structure

```text
app/
  (platform)/
    admin/
    analytics/
    dashboard/
    learn/[courseId]/
    learn/
    marketplace/
  api/
    analytics/
    admin/courses/
    admin/lessons/
    auth/[...nextauth]/
    checkout/
    courses/[courseId]/enroll/
    courses/
    offers/
    session/role/
    upload/
components/
  admin/
  analytics/
  course-player/
  dashboard/
  layout/
  marketplace/
  learning/
  ui/
hooks/
lib/
store/
api/
supabase/
```

## Notes

- Catalog, enrollment, course detail, admin creation, dashboard analytics, and quiz analytics are wired to Supabase-backed data.
- If a tenant has no live data yet, the UI renders empty states instead of placeholder metrics.

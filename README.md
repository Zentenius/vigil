# Vigil

Vigil is a real-time hazard alert and response platform that empowers Jamaican communities to report, verify, and act on safety threats instantly. By combining community-powered reporting, AI-driven risk assessment, and augmented reality visualization, Vigil delivers actionable safety guidance when every second counts — closing the critical gap between when dangers strike and when official alerts arrive.

This repository contains the Vigil web client and server code (Next.js + TypeScript + Prisma). It includes features for creating and viewing reports, community confirmations/disputes, a predictive map layer, and a guest mode for casual browsing.

IMPORTANT — Test account
------------------------
You can use the following Google account to sign in and test authenticated flows immediately. This account is provided for development/testing only.

Email: `vigilguest11@gmail.com`

Password: `TestVigil123$`

Please do NOT use this account for production data. Treat these credentials as shared test credentials and rotate them if they become public.


Table of Contents
 - Features
 - Architecture
 - Quick start (development)
 - Important behaviors
   - Guest mode
   - Confirm / Dispute voting
 - File layout highlights
 - Testing and verification
 - Next steps and optional improvements


Features
 - Real-time community report feed and map
 - Report creation UI with location picker, severity slider, tags, and photo placeholders
 - Community verification: Confirm and Dispute controls that update a report's credibility score
 - Guest mode: browse the app without signing in; core actions like submitting reports are restricted to signed-in users
 - Predictive layer and analytics (AI-assisted)


Architecture
 - Next.js (App Router) for routing and serverless API routes
 - Prisma for database access (PostgreSQL)
 - NextAuth for authentication (Google provider configured)
 - React + Tailwind + shadcn UI primitives for components
 - Leaflet for interactive maps (dynamically imported to avoid SSR issues)


Quick start (development)

1. Install dependencies

```powershell
npm install
```

2. Configure environment variables

Create a `.env` file in the project root (copy `.env.example` if provided) and set at minimum:

- DATABASE_URL — your Postgres connection string
- NEXTAUTH_URL — e.g. http://localhost:3000
- AUTH_SECRET — next-auth secret
- AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET — Google OAuth credentials

3. Run database migrations (if any)

If you change the Prisma schema you will need to run the Prisma migrate commands. This project currently uses the `Report` model and `credibility_score` field; please do not change the schema unless you intend to run a migration.

```powershell
npx prisma migrate dev --name init
```

4. Start the dev server

```powershell
npm run dev
```

5. Open http://localhost:3000


Important behaviors

- Guest mode
  - Users can click "Continue as guest" on the home page to browse the site without signing in. Guest mode is stored in localStorage and affects the UI.
  - While in guest mode, the sidebar will show a Sign In prompt below navigation links to encourage authentication.
  - Core operations like submitting a new report are blocked while in guest mode; users will see a message prompting them to sign in.

- Confirm / Dispute voting and Credibility score
  - Confirm and Dispute buttons on a report update the existing `credibility_score` field on the `Report` record.
  - Current server behavior: pressing Confirm applies an optimistic delta of +5 to `credibility_score`; pressing Dispute applies -10. The server clamps the `credibility_score` to the range [0, 100] and persists it.
  - Votes are currently stored client-side to prevent double-clicks (localStorage guard) but are not tracked per user in the database. If you want one vote per user across devices, we will need to add a `ReportVote` model and a migration.


File layout highlights
 - `src/app/page.tsx` — Home / hero and the "Continue as guest" action
 - `src/components/app-sidebar.tsx` — Main app sidebar; shows sign-in prompt for guests
 - `src/components/report-hazard-form.tsx` — Report creation UI; blocked for guests
 - `src/app/dashboard/reports/[id]/page.tsx` — Report details page and viewing map
 - `src/app/api/report/[id]/route.ts` — GET and POST handlers for fetching and updating a report's `credibility_score`
 - `src/hooks/use-guest-mode.tsx` — LocalStorage-backed guest mode hook


Testing & verification
 - Guest mode flow
   1. Start the app and open the home page.
   2. Click "Continue as guest". You should be redirected to `/dashboard` and the app should consider you a guest.
   3. Open the sidebar — you should see a Sign In prompt and an "Exit guest mode" link.
   4. Try to open the report form and submit — the app will block submission and show a message: "Guests cannot submit reports — please sign in".

 - Confirm / Dispute flow
   1. Open a report in the dashboard (e.g. `/dashboard/reports/<id>`).
   2. Click Confirm — the UI will optimistically change the displayed `Credibility` and the server will persist an updated `credibility_score` (+5). Buttons in that browser will be disabled afterwards.
   3. Click Dispute — similar behavior with -10 applied.
   4. Refresh the report page to confirm the persisted `credibility_score` value.


Next steps and optional improvements
 - Persist votes per user: add a `ReportVote` Prisma model, create migrations, and enforce one vote per authenticated user.
 - Make guest mode server-aware (cookie or server session) so middleware and server APIs can react to guests more strictly.
 - Replace alert() fallback with an in-app toast component for consistent UX.
 - Replace fixed +/- deltas with a normalized verification formula (for example, a Bayesian estimator V = (C + 1) / (C + D + 2)) — this requires storing confirm_count and dispute_count in the database.

If you'd like, I can implement any of the optional improvements above. Tell me which one to prioritize.

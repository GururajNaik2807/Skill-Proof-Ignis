# SkillProof

> **Evidence from the work behind the resume.**

SkillProof compares the technical skills claimed on a resume with evidence from the candidate's public GitHub work. Candidates can see which claims are supported, which are partial, and which need more proof. Recruiters can compare candidate evidence against job requirements without relying on resume keywords alone.

## Core Workflows

### Candidate workflow

1. Upload and parse a PDF resume.
2. Validate a GitHub username or profile URL.
3. Scan public repositories for languages, dependencies, tests, Docker, CI, and activity.
4. Review each skill as `PROVEN`, `PARTIAL`, or `CLAIMED-ONLY`.
5. Compare verified evidence with a job description.
6. Generate practical micro-tasks for unsupported or partial skills.

### Recruiter workflow

1. Create or review a job posting.
2. Extract required and preferred technical skills.
3. Import resumes or receive applications through a public job link.
4. Browse candidates in an evidence-focused pipeline.
5. Compare job requirements with stored candidate evidence.
6. Open repositories and inspect the available scanner signals.

## Evidence Model

SkillProof never treats an AI response alone as proof. Statuses are based on persisted GitHub scanner data:

| Status | Meaning |
| --- | --- |
| **PROVEN** | Matching repository signals, recent activity, and detected tests support the claim. |
| **PARTIAL** | Matching code exists, but testing, depth, or recency is limited. |
| **CLAIMED-ONLY** | The skill appears on the resume, but no matching repository evidence was found. |

The scanner currently records repository URLs, languages, detected dependencies, tests, Docker, CI, and commit activity. README content and direct source-file paths are not persisted or presented as evidence.

## Technology Stack

- Next.js 16 App Router with Turbopack
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React
- Supabase PostgreSQL, Auth, Storage, and `@supabase/ssr`
- Google Gemini API with model fallback and deterministic fallbacks
- GitHub REST API
- `unpdf` for PDF text extraction
- Zod validation

## Route Overview

### Public and authentication

- `/` — landing page
- `/login` — login and password reset request
- `/signup` — candidate or recruiter registration
- `/auth/callback` — Supabase session callback
- `/auth/reset-password` — password update flow
- `/v/[slug]` — public candidate evidence report

### Candidate workspace

- `/dashboard` — evidence summary and next action
- `/onboarding` — profile, GitHub validation, and resume upload
- `/matrix` — filterable skills and evidence report
- `/jobs` — candidate job matching
- `/tasks` — evidence-building micro-tasks

### Recruiter workspace

- `/recruiter/dashboard` — recruiter overview, resume intake, candidate pipeline, and comparison
- `/recruiter/jobs` — job management and requirements
- `/recruiter/jobs/create` — create a job posting
- `/recruiter/jobs/[id]` — job pipeline and evidence preview
- `/recruiter/candidates` — applicant pipeline
- `/recruiter/compare` — candidate comparison
- `/recruiter/shortlist` — shortlisted applicants
- `/recruiter/settings` — recruiter profile settings
- `/recruiter/candidate/[id]` — candidate evidence audit

## Authentication and Role Security

User roles are stored in `public.profiles.role` and are limited to:

- `candidate`
- `recruiter`

Middleware refreshes Supabase sessions and redirects users away from unauthorized route groups. Candidate and recruiter layouts repeat the server-side role checks. Recruiter APIs also verify the authenticated recruiter role.

Server-only secrets include:

- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Only the public Supabase URL and anon key are exposed to browser code.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=your-github-token
GEMINI_API_KEY=your-gemini-key
```

Configure the Supabase schema and policies for `profiles`, `resumes`, `resume_skills`, `github_repositories`, `skill_evidence`, `jobs`, `job_applications`, and `micro_tasks`. The `resumes` storage bucket should be private and protected by owner-scoped policies.

Start the development server:

```bash
npm run dev
```

Run the validation commands:

```bash
npm run lint
npm run build
```

## Gemini Resilience

Gemini calls use a shared retry and model-fallback client. Transient `429`, `503`, overload, and quota errors trigger retries and alternate configured models. Resume extraction, job parsing, and micro-task generation also have deterministic fallback behavior so temporary Gemini unavailability does not immediately break the product workflow.

You can override the model order with:

```env
GEMINI_MODEL_FALLBACKS=gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash,gemini-1.5-flash
```

## Design Direction

SkillProof uses an Obsidian and Electric visual system inspired by technical developer tooling:

- True obsidian background: `#050505`
- Elevated surface: `#0A0A0A`
- Primary text: `#EDEDED`
- Muted text: `#8A8F98`
- Electric cyan action accent: `#00E5FF`
- Emerald proven state: `#00E599`
- Amber partial state: `#F59E0B`
- Violet comparison accent: `#8B5CF6`

The interface favors evidence tables, repository rows, restrained borders, compact status indicators, and clear technical hierarchy over decorative cards or generic AI-dashboard patterns.

## Current Limitations

- Bulk resume intake processes files independently, but the current schema does not yet provide a complete recruiter-import-to-candidate linking workflow.
- README evidence and direct source-file paths are not persisted by the scanner.
- Next.js reports a middleware-to-proxy deprecation warning.
- A small number of existing React hook dependency warnings remain.

## Team

**Team Ignis (T07)**

Domain: Edutech

- Gururaj Ashok Naik — IT, Third Year, Universal College of Engineering, Mumbai University
- Roshan Venkatrajam Padala — Data Engineering, Third Year, Universal College of Engineering, Mumbai University
- Nitesh Ratan Narakar — AIML, Third Year, Universal College of Engineering, Mumbai University
- Raut Tejasvi Kesharinath Jagruti — IT, Third Year, Universal College of Engineering, Mumbai University

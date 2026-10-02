# SkillProof

> Evidence from the work behind the resume.

SkillProof compares technical skills claimed on a resume with evidence from public GitHub work. It shows candidates what is supported, what is partial, and what still needs evidence. Recruiters can compare existing candidate evidence against job requirements.

## Product Workflows

### Candidate

`Resume -> Skills -> GitHub -> Evidence -> Job Match -> Skill Gaps -> Tasks`

Candidates can:

- Upload and parse a PDF resume.
- Validate a GitHub username or profile URL.
- Scan public repositories for languages, dependencies, tests, Docker, CI, and activity.
- Review skills as `PROVEN`, `PARTIAL`, or `CLAIMED-ONLY`.
- View job postings and apply to them directly by submitting their parsed resume and evidence.
- Generate practical micro-tasks for unsupported or partial skills.
- Share a public evidence report.

### Recruiter

`Job -> Required Skills -> Candidates -> Evidence`

Recruiters can:

- Create and manage Job Postings with automated skill requirement extraction.
- Share Job Links to receive applications from verified candidates.
- Browse applicants in a dense evidence pipeline dashboard.
- View applicant job match percentages, evidence scores, and statuses.
- Select candidates for side-by-side evidence comparison.
- Open repository links and inspect stored scanner signals.

## Evidence Model

SkillProof does not mark a skill as supported from an AI response alone. Evidence comes from persisted GitHub scanner data:

| Status | Meaning | Color |
| --- | --- | --- |
| `PROVEN` | Matching repository signals, recent activity, and detected tests | Emerald |
| `PARTIAL` | Matching code exists but testing or recency is limited | Amber |
| `CLAIMED-ONLY` | Listed on the resume with no matching repository evidence | Zinc/Gray |

The current scanner persists repository URLs, languages, detected dependencies, tests, Docker, CI, and commit activity. README files and direct source-file paths are not currently persisted and are not presented as evidence.

## Design System

The interface uses a modern, high-end technical design system featuring glassmorphism and subtle glows:

- **Backgrounds**: Deep `zinc-950` and `zinc-900`
- **Borders**: Refined `zinc-800` with subtle glows
- **Primary text**: Crisp `zinc-100` and `zinc-200`
- **Secondary text**: `zinc-400` and `zinc-500`
- **Proven/Success**: `emerald-400` / `emerald-500`
- **Reviewing/Partial**: `cyan-400` / `cyan-500`
- **Warning/Claimed-only**: `amber-400` / `amber-500`
- **Danger**: `rose-500`

Typography relies on sharp, modern sans-serif fonts (like `Inter` or `Geist`) combined with `mono` fonts for data metrics and technical identifiers. The UI favors dense data tables, minimal padding, pill badges, and clean status indicators.

## Technology

- Next.js 16 (App Router + Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React
- Supabase PostgreSQL, Auth, Storage, and `@supabase/ssr`
- Gemini API (Flash) for structured resume and job-description extraction
- GitHub REST API
- `pdf-parse` (with Node.js canvas polyfills) for backend PDF text extraction
- Zod validation

## Route Map

### Public and Auth

- `/` landing page
- `/login` email/password login and password reset request
- `/signup` candidate/recruiter role selection
- `/auth/callback` Supabase session callback
- `/j/[slug]` public job posting and candidate application flow
- `/v/[slug]` public candidate evidence report

### Candidate

- `/dashboard` candidate overview and next action
- `/onboarding` profile, GitHub validation, and resume upload
- `/matrix` filterable skills and evidence report
- `/tasks` evidence-building micro-tasks

### Recruiter

- `/recruiter/dashboard` active jobs summary and candidate pipeline table
- `/recruiter/jobs/create` job requirement extraction and creation
- `/recruiter/jobs` list of active/closed jobs
- `/recruiter/candidates` simplified pipeline and candidate routing
- `/recruiter/compare` side-by-side evidence comparison
- `/recruiter/candidate/[id]` individual candidate evidence audit

## Role Security

Roles are stored in `public.profiles.role` and are limited to `candidate` and `recruiter`. Middleware refreshes sessions and redirects users away from unauthorized route groups. Candidate and recruiter layouts repeat the server-side role check. 

For the hackathon scope, candidate profiles default to `is_public: true` to seamlessly allow recruiters to review applications through the Supabase Admin client on server components, bypassing strict RLS restrictions.

Secrets remain server-side:

- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Only the public Supabase URL and anon key are exposed to the browser.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=your-github-token
GEMINI_API_KEY=your-gemini-key
```

Configure the Supabase database schema, ensuring `profiles`, `resumes`, `resume_skills`, `github_repositories`, `skill_evidence`, `jobs`, and `job_applications` tables exist. 

Start development:

```bash
npm run dev
```

## Known Limitations

- The bulk resume upload feature was deprecated in favor of a streamlined public job link opt-in workflow to ensure strong relational data integrity.
- README evidence and direct source-file paths are not persisted by the current scanner.
- Next.js middleware-to-proxy deprecation warnings may appear in the console.

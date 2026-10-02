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
- Compare evidence with a job description.
- Generate practical micro-tasks for unsupported or partial skills.
- Share a public evidence report.

### Recruiter

`Job -> Required Skills -> Candidates -> Evidence`

Recruiters can:

- Browse candidates in a dense evidence table.
- Search and filter by candidate, skill, evidence status, and coverage.
- Import multiple PDF resumes with independent queued, parsing, parsed, and error states.
- Analyze a job description into required and preferred skills.
- Compare candidates against the same requirements using stored evidence.
- Select candidates for side-by-side evidence comparison.
- Open repository links and inspect stored scanner signals.

## Evidence Model

SkillProof does not mark a skill as supported from an AI response alone. Evidence comes from persisted GitHub scanner data:

| Status | Meaning | Color |
| --- | --- | --- |
| `PROVEN` | Matching repository signals, recent activity, and detected tests | `#27C281` |
| `PARTIAL` | Matching code exists but testing or recency is limited | `#F2B84B` |
| `CLAIMED-ONLY` | Listed on the resume with no matching repository evidence | `#F05D5E` |

The current scanner persists repository URLs, languages, detected dependencies, tests, Docker, CI, and commit activity. README files and direct source-file paths are not currently persisted and are not presented as evidence.

## Design System

The interface uses a technical midnight/cobalt visual system:

- Midnight: `#0B1020`
- Deep surface: `#111827`
- Raised surface: `#182235`
- Border: `#28354A`
- Primary text: `#F5F7FB`
- Secondary text: `#9AA7B8`
- Cobalt: `#2F6BFF`
- Cobalt hover: `#4A7DFF`
- Tangerine: `#FF7A3D`
- Proven: `#27C281`
- Partial: `#F2B84B`
- Unsupported/error: `#F05D5E`

Headings use Manrope. Body and interface text use Inter. The UI favors tables, evidence rows, dividers, restrained borders, and compact status indicators over decorative cards or gradients.

## Technology

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Lucide React
- Supabase PostgreSQL, Auth, Storage, and `@supabase/ssr`
- Gemini API for structured resume and job-description extraction
- GitHub REST API
- `unpdf` for PDF text extraction
- Zod validation

## Route Map

### Public and Auth

- `/` landing page
- `/login` email/password login and password reset request
- `/signup` candidate/recruiter role selection
- `/auth/callback` Supabase session callback
- `/auth/reset-password` password update flow
- `/v/[slug]` public candidate evidence report

### Candidate

- `/dashboard` candidate overview and next action
- `/onboarding` profile, GitHub validation, and resume upload
- `/matrix` filterable skills and evidence report
- `/jobs` candidate job matching
- `/tasks` evidence-building micro-tasks

### Recruiter

- `/recruiter/dashboard` candidate evidence workspace, bulk resume intake, filters, and comparison
- `/recruiter/jobs` job requirement extraction and multi-candidate matching
- `/recruiter/candidate/[id]` candidate evidence audit and job-specific review

### Server Routes

- `/api/github/validate`
- `/api/github/scan`
- `/api/resume/upload`
- `/api/resume/parse`
- `/api/evidence/evaluate`
- `/api/jobs/match`
- `/api/recruiter/jobs/match`
- `/api/tasks/update`

## Role Security

Roles are stored in `public.profiles.role` and are limited to `candidate` and `recruiter`. Middleware refreshes sessions and redirects users away from unauthorized route groups. Candidate and recruiter layouts repeat the server-side role check. Recruiter APIs also verify the authenticated recruiter role.

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

Apply the profile-role migration in `supabase/migrations/`, configure the `profiles`, `resumes`, `resume_skills`, `github_repositories`, `skill_evidence`, `job_descriptions`, and `micro_tasks` tables, and create the private `resumes` storage bucket with owner-scoped policies.

Start development:

```bash
npm run dev
```

Run validation:

```bash
npm run lint
npm run build
```

## Known Limitations

- Bulk recruiter resumes are uploaded and parsed independently, but the existing schema does not yet include a recruiter import table or a candidate-link workflow.
- README evidence and direct source-file paths are not persisted by the current scanner.
- The repository still reports a Next.js middleware-to-proxy deprecation warning and a small number of existing React hook dependency warnings.

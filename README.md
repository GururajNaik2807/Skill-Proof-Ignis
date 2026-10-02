# SkillProof 🛡️️

> **"Your resume says it. Your work proves it."**

SkillProof is a developer verification SaaS that automatically audits technical claims in a candidate's resume against concrete, verifiable evidence from their public GitHub repositories. It replaces unverifiable resume buzzwords with codebase-backed signals, maps skills against job descriptions to identify real gaps, and generates targeted micro-tasks to turn unproven claims into verified commits.

---

## 🎯 The Core Problem & Dual-Persona Solution

* **The Problem:** Technical resumes are saturated with buzzwords, boilerplate projects, and inflated claims. Recruiters spend hours guessing whether a candidate genuinely knows a technology, while candidates have no actionable guidance on how to prove their true competence.
* **The Solution:** SkillProof establishes a deterministic, codebase-backed evidence loop for two distinct personas:
  * 👨‍💻 **For Developers (Candidates):** Audit claimed skills across public GitHub repositories, spot unproven gaps, and complete targeted micro-tasks to convert claims into proven commits.
  * 🏢 **For Employers & Recruiters:** Search a verified talent pool, inspect audited candidate codebases with deep links down to test suites and commit recency, and run batch candidate matching against pasted Job Descriptions (JDs).

---

## 🚦 Deterministic Evidence Model

SkillProof never relies purely on AI guesses to declare a candidate verified. Evidence is categorized using physical codebase signals:

| Tier | Status Color | Definition | Required Signals |
| :--- | :--- | :--- | :--- |
| **Proven** | `#2E8B6F` (Emerald) | Deep, functional codebase presence with proof of maintenance and testing. | Non-fork repositories, primary language byte weights, package manifests (`package.json`, `pyproject.toml`, `go.mod`), recent commits (< 12 months), and detected automated test suites (`tests/`, `*.spec.ts`, pytest). |
| **Partial** | `#C58A24` (Amber) | Surface-level or dated presence; missing testing or active maintenance. | Mentioned only in configs/scaffolding, inactive repositories (> 12 months), or zero automated test suites. |
| **Claimed-Only** | `#8A6255` (Muted Rust) | Stated on resume, but completely absent from public code. | Skill parsed from resume PDF with zero matching GitHub repositories, manifests, or commits. |

---

## 🔁 Product Loop

```text
       Candidate Journey                       Employer Journey
   ───────────────────────────            ───────────────────────────
   Resume PDF + GitHub Handle             Paste Raw Job Description
               ↓                                       ↓
   Extract Claims (Gemini API)            Parse Required Tech Stack
               ↓                                       ↓
   Scan GitHub (Trees/Tests/Deps)         Rank Candidates by Real Evidence
               ↓                                       ↓
   Evaluate Evidence (Proven/Partial)     Deep-link Code & Test Audit
               ↓                                       ↓
   Generate 1–2 hr Micro-Tasks            Shortlist Verified Engineers
   🛠️ Tech StackFramework: Next.js 15 (App Router, React 19)Language: TypeScriptStyling & Design System: Tailwind CSS v4 (@theme design tokens: Ink, Deep Green, Warm Ivory)Icons: Lucide ReactDatabase & Auth: Supabase PostgreSQL + Supabase Auth + Supabase StorageSession Management: @supabase/ssr (Edge Middleware + Server Actions)AI & Structured Extraction: Google Gemini API (@google/genai targeting gemini-3.8-flash with deterministic regex fallback)PDF Ingestion: unpdf (pure WebAssembly/JS engine, zero native Canvas dependency)Validation: Zod📂 Project StructurePlaintextskillproof/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                  # Email/password authentication
│   │   └── signup/page.tsx                 # Dual-persona registration (Developer vs. Employer)
│   │
│   ├── (dashboard)/                        # DEVELOPER ROUTE GROUP
│   │   ├── layout.tsx                      # Candidate dashboard shell with collapsible sidebar
│   │   ├── dashboard/page.tsx              # Verification Hub (Metrics, Claims, Repos & Quick Task widget)
│   │   ├── onboarding/page.tsx             # 4-step wizard: Profile → GitHub → Resume → Scan
│   │   ├── matrix/page.tsx                 # Interactive Evidence Matrix with deep-linked repos
│   │   ├── jobs/page.tsx                   # Job Description Matcher & gap analysis
│   │   └── tasks/page.tsx                  # Micro-Tasks Manager (Interactive status cycles)
│   │
│   ├── (recruiter)/                        # EMPLOYER / RECRUITER ROUTE GROUP
│   │   ├── layout.tsx                      # Recruiter workspace sidebar & navigation
│   │   ├── recruiter/
│   │   │   ├── dashboard/page.tsx          # Verified candidate talent pool & filtering
│   │   │   ├── jobs/page.tsx               # Raw JD ingestion & batch candidate match scores
│   │   │   └── candidate/[id]/page.tsx     # Deep-dive candidate code audit report
│   │
│   ├── v/[slug]/page.tsx                   # Public Shareable Proof View (Tokenized URL)
│   │
│   ├── api/                                # Backend Route Handlers (Server-side secrets)
│   │   ├── github/
│   │   │   ├── validate/route.ts           # GitHub profile verification
│   │   │   └── scan/route.ts               # Repo tree, dependency & test scanner
│   │   ├── resume/
│   │   │   ├── upload/route.ts             # PDF text extraction (unpdf) & Supabase storage
│   │   │   └── parse/route.ts              # Gemini skill extraction into resume_skills
│   │   ├── evidence/
│   │   │   └── evaluate/route.ts           # Deterministic codebase matching & classification
│   │   ├── jobs/
│   │   │   └── match/route.ts              # Gemini JD skill extractor & candidate match scoring
│   │   └── tasks/
│   │       ├── generate/route.ts           # Gemini micro-task generator for gaps
│   │       └── update/route.ts             # Micro-task progress & status updates
│   │
│   ├── auth/
│   │   ├── callback/route.ts               # OAuth and magic link session exchange
│   │   └── signout/route.ts                # Server-side auth signout handler
│   │
│   ├── globals.css                         # Tailwind v4 @theme design tokens
│   ├── layout.tsx                          # Root layout with Manrope & Inter fonts
│   └── page.tsx                            # Landing page with interactive sample audit
│
├── components/
│   ├── auth/
│   │   └── password-requirements.tsx       # Live interactive password strength checker
│   ├── layout/
│   │   ├── dashboard-sidebar.tsx           # Collapsible desktop/mobile developer sidebar
│   │   ├── navbar.tsx                      # Public header
│   │   └── footer.tsx                      # Global footer
│   └── ui/
│       ├── button.tsx                      # CVA-styled design token buttons
│       └── input.tsx                       # Styled input fields with validation states
│
├── lib/
│   ├── evidence/
│   │   └── classifier.ts                   # Deterministic Proven/Partial/Claimed heuristics
│   ├── gemini/
│   │   ├── extractor.ts                    # Gemini resume parser with backoff & regex fallback
│   │   ├── job-matcher.ts                  # JD requirements extractor & match score calculator
│   │   └── task-generator.ts               # Micro-task generation engine
│   ├── github/
│   │   ├── client.ts                       # GitHub REST API client with rate-limit safety
│   │   └── scanner.ts                      # Language, manifest, test, and Docker parser
│   ├── supabase/
│   │   ├── client.ts                       # Browser Supabase client
│   │   └── server.ts                       # Cookie-based Server Supabase client
│   ├── validation/
│   │   └── onboarding.ts                   # Zod schemas for user profiles & file validation
│   └── utils.ts                            # Class merger utility (clsx + twMerge)
│
├── types/                                  # Global TypeScript definitions
├── middleware.ts                           # Edge route guard & session refresher
└── .env.local                              # Private API keys & service credentials
🎨 Design System & PaletteTokenHexRoleInk#17201CPrimary text, headings, dark surfacesDeep Green#1F5C48Primary brand accent, action buttons, active statesEmerald#2E8B6FSecondary accent, icons, proven status highlightWarm Ivory#F7F5EFBackground canvas toneSoft Surface#EEECE5Card backgrounds, inputs, neutral chipsMuted Text#69716CCaptions, secondary descriptionsBorder#D9DDD7Divider lines, card bordersProven#2E8B6FBadge status: verified with tested codePartial#C58A24Badge status: shallow config / no testsClaimed#8A6255Badge status: resume-only claimError#B94A48Destructive states, critical gaps🔑 Environment Variables SetupCreate a .env.local file in the root directory:Code snippet# Supabase
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# GitHub REST API (Prevents 60 req/hr anonymous rate limits)
GITHUB_TOKEN=ghp_your_personal_access_token

# Google Gemini API
GEMINI_API_KEY=AIzaSy...
🚀 Getting StartedInstall dependencies:Bashnpm install
Configure Supabase Database & Storage:Run the SQL migrations to set up the multi-role schema (profiles, resumes, github_repositories, skill_evidence, job_descriptions, micro_tasks).Create a private storage bucket named resumes with a 5MB PDF limit and owner-scoped RLS policies.Start Development Server:Bashnpm run dev
Open http://localhost:3000 in your browser.🗺️ Roadmap & Implementation Stages[x] Stage 0: Foundation & Design System (Tailwind v4 tokens, fonts, folder structure)   [x] Stage 1: Landing Page, Supabase Auth Integration, and Dashboard Shell   [x] Stage 2: Dual-Persona Onboarding Flow (GitHub validation + unpdf resume extraction)   [x] Stage 3: GitHub Codebase Analyzer (language breakdown, commit recency, manifests, tests)   [x] Stage 4: Resume Skill Extractor (Gemini gemini-3.8-flash structured extraction into resume_skills)   [x] Stage 5: Deterministic Evidence Classification Engine (proven / partial / claimed)   [x] Stage 6: Interactive Evidence Matrix Dashboard (/matrix) & Candidate Public Proof URL (/v/[slug])   [x] Stage 7: Job Description Parser & Match Score Engine (/jobs & /api/jobs/match)   [x] Stage 8: Practical Micro-Task Generator (/tasks with status cycles & deliverables)   [ ] Stage 9: Security Polish, Global Error Handling, Rate Limiting, and Demo Preparation   
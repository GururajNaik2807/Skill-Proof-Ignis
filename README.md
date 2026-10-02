# SkillProof 🛡️

> **"Your resume says it. Your work proves it."**

SkillProof is a developer verification SaaS that automatically audits technical claims in a candidate's resume against concrete, verifiable evidence from their public GitHub repositories. It replaces unverifiable resume bullet points with codebase-backed signals, maps skills against job descriptions to identify real gaps, and generates targeted micro-tasks to turn unproven claims into verified commits.

---

## 🎯 The Core Problem & Solution

* **The Problem:** Technical resumes are saturated with buzzwords, boilerplate projects, and inflated claims. Recruiters and hiring managers spend hours guessing whether a candidate genuinely knows a technology or simply copied a tutorial.
* **The Solution:** SkillProof extracts skills claimed on a candidate's resume, inspects their public GitHub repositories (code, dependencies, commits, Dockerfiles, unit tests), and classifies each skill into a verifiable tier:
  * 🟢 **Proven:** Supported by deep source code, active commits, unit tests, and production dependencies.
  * 🟡 **Partial:** Mentioned in configs or starter templates, but lacks active commits or unit test suites.
  * 🟤 **Claimed-Only:** Stated on the resume with zero public codebase evidence.

---

## 🔁 Product Loop

```text
Resume (PDF) + GitHub Profile
          ↓
Extract Claimed Skills (Gemini API)
          ↓
Analyze GitHub Evidence (REST API: trees, commits, package manifests, tests)
          ↓
Verify Each Skill (Proven / Partial / Claimed-only)
          ↓
Traceable Evidence Matrix (Deep-links to source files & commits)
          ↓
Job Description Matching (Identify missing gaps)
          ↓
Generate Micro-Tasks (1–2 hr practical challenges to close skill gaps)

🛠️ Tech StackFramework: Next.js (App Router)Language: TypeScriptStyling & Design System: Tailwind CSS v4 (Custom palette: Ink, Deep Green, Warm Ivory)Icons: Lucide ReactDatabase & Auth: Supabase PostgreSQL + Supabase Auth + Supabase StorageSession Management: @supabase/ssr (Edge Middleware + Server Actions)AI & Parsing: Google Gemini API (@google/genai)Validation: Zod + React Hook FormPDF Ingestion: pdf-parse📂 Project StructurePlaintextskillproof/
├── app/
│   ├── (dashboard)/             # Protected dashboard route group
│   │   ├── dashboard/           # Main verification overview & metrics
│   │   │   └── page.tsx
│   │   ├── onboarding/          # 4-step wizard: Profile → GitHub → Resume → Scan
│   │   │   └── page.tsx
│   │   └── layout.tsx           # Dashboard sidebar, session protection, layout shell
│   │
│   ├── api/                     # Backend Route Handlers (Keeps secrets server-side)
│   │   ├── github/
│   │   │   └── validate/        # GitHub username validation via GitHub REST API
│   │   │       └── route.ts
│   │   └── resume/
│   │       └── upload/          # PDF parser & Supabase Storage upload
│   │           └── route.ts
│   │
│   ├── auth/
│   │   ├── callback/            # Supabase OAuth/magic link exchange handler
│   │   │   └── route.ts
│   │   └── signout/             # Server-side auth signout handler
│   │       └── route.ts
│   │
│   ├── login/                   # User sign-in page
│   │   └── page.tsx
│   ├── signup/                  # User registration page
│   │   └── page.tsx
│   ├── globals.css              # Tailwind v4 @theme design tokens & custom colors
│   ├── layout.tsx               # Root layout: Manrope & Inter fonts, meta tags
│   └── page.tsx                 # Public marketing landing page & live audit preview
│
├── components/                  # Reusable UI & Feature components
│   ├── auth/                    # Auth cards and verification widgets
│   ├── evidence/                # Evidence badges, signal lists, breakdown cards
│   ├── layout/                  # Navigation bars, footers, headers
│   └── ui/                      # Base buttons, dialogs, inputs, skeletons
│
├── lib/                         # Core domain logic & integrations
│   ├── evidence/                # Heuristic evidence matching algorithms
│   ├── gemini/                  # Google Gemini prompt schemas & parsing clients
│   ├── github/                  # GitHub API rate-limit handling & tree inspectors
│   ├── resume/                  # Text sanitization & resume extraction helpers
│   ├── skills/                  # Master skill normalization dictionary
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase browser client
│   │   └── server.ts            # Server-side cookie-based Supabase client
│   ├── validation/
│   │   └── onboarding.ts        # Zod schemas for user profiles, GitHub, and resumes
│   └── utils.ts                 # Class merger utility (clsx + twMerge)
│
├── types/                       # Shared TypeScript interfaces & DB types
├── middleware.ts                # Route guard & automatic Supabase session refresher
└── .env.local                   # Secret environment variables (never committed)
🎨 Design System & PaletteSkillProof is styled with an authentic developer SaaS aesthetic (no generic purple gradients, neon crypto styling, or fake buzzwords):TokenHexRoleInk#17201CPrimary text, headings, dark surfacesDeep Green#1F5C48Primary brand accent, action buttons, active statesEmerald#2E8B6FSecondary accent, icons, proven status highlightWarm Ivory#F7F5EFPage background, canvas toneSoft Surface#EEECE5Card backgrounds, inputs, neutral chipsMuted Text#69716CCaptions, secondary descriptionsBorder#D9DDD7Crisp divider lines, card bordersProven#2E8B6FBadge status: verified with deep evidencePartial#C58A24Badge status: shallow config / no testsClaimed#8A6255Badge status: resume-only claimError#B94A48Destructive states, critical gaps🔑 Environment Variables SetupCreate a .env.local file in the root directory:Code snippet# Supabase
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# GitHub REST API (Avoids 60 req/hr rate-limits)
GITHUB_TOKEN=ghp_your_personal_access_token

# Google Gemini API
GEMINI_API_KEY=AIzaSy...
🚀 Getting StartedClone and install dependencies:Bashnpm install
Execute Database Migrations:Run the SQL migration script in your Supabase project's SQL Editor to create:profiles, resumes, skills, resume_skillsgithub_repositories, skill_evidence, job_descriptions, micro_tasksStorage bucket: resumes (Private)Start Development Server:Bashnpm run dev
Open http://localhost:3000 in your browser.🗺️ Roadmap & Implementation Stages[x] Stage 0: Foundation & Design System (Tailwind v4 tokens, fonts, folder structure)[x] Stage 1: Landing Page, Supabase Auth Integration, and Dashboard Shell[x] Stage 2: Onboarding Flow (GitHub validation + Resume PDF upload & storage)[ ] Stage 3: GitHub Codebase Analyzer (language breakdown, commit recency, manifests, tests)[ ] Stage 4: Resume Skill Extractor (Gemini structured extraction)[ ] Stage 5: Evidence Classification Engine (Matching heuristics for Proven / Partial / Claimed)[ ] Stage 6: Interactive Evidence Matrix Dashboard[ ] Stage 7: Job Description Parser & Match Score[ ] Stage 8: Practical Micro-Task Generator (closing skill gaps)[ ] Stage 9: Security Polish, Rate Limiting, and Demo Preparation
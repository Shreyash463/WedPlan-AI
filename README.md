# WedPlan AI

> **Intelligent Indian Wedding Planning Assistant**  
> *GenAI-powered, culturally attuned, deterministic event budgeting, countdown timeline roadmap, vendor contract checklists, and personalized wedding ideas.*

**Live Demo:** [https://wedplan-ai.vercel.app](https://wedplan-ai.vercel.app) *(Placeholder)*

```text
================================================================================
                                WEDPLAN AI
                  Intelligent Indian Wedding Planner
================================================================================
  [Intake Form]  ──>  [Deterministic Engine]  ──>  [Results Dashboard (5 Tabs)]
   • Budget INR        • Largest Remainder Split     1. Overview & Health
   • 6 Functions       • Tier Benchmarks             2. Budget & What-If
   • Guest Count       • Lead-time Compression       3. Timeline Roadmap
   • Style & Vibe      • Vendor Contract Match       4. Vendor Checklists
   • Priorities                 │                    5. GenAI Personalized Ideas
                                ▼
                       [Cached Gemini 2.5]
                       (With Robust Fallback)
================================================================================
```

---

## 2. Chosen Vertical (Indian Weddings) and Why

The challenge invites a GenAI-powered assistant for celebrations and community events. **WedPlan AI** deliberately focuses on **Indian Weddings** as its dedicated vertical for three compelling real-world reasons:

1. **Extreme Cultural Multi-Event Complexity:** An Indian wedding is rarely a single dinner—it is a multi-day festival comprising distinct ceremonies (Haldi, Mehendi, Sangeet, Wedding Ceremony/Pheras, Reception, and Engagement). Each ceremony demands separate venues, distinct catering menus, specialized decor (marigold canopies vs. fairy light tunnels), and specialized artists (bridal mehendi artists, Punjabi dholis, choreographed dance troupes, and Vedic priests).
2. **High Financial Stakes & Non-Linear Budget Pressures:** Indian weddings account for significant family savings (budgets typically ranging from ₹10 Lakhs to ₹5+ Crores, with 200 to 1,500+ attendees). Families face opaque pricing, arbitrary vendor quotes, and hidden costs (generator backups, overtime charges, dakshina cash buffers). A deterministic, benchmark-backed engine provides much-needed financial transparency.
3. **Short-Notice Seasonality (Shubh Muhurat):** Auspicious wedding dates determined by astronomical calendars (Kundali / Shubh Muhurat) often force families to plan complex multi-day events in compressed timeframes (e.g. 15 to 45 days). Standard planners assume 12-month linear lead times; Indian families urgently need smart timeline compression that prioritizes critical vendor lock-ins immediately.

---

## 3. Problem Statement Alignment

WedPlan AI addresses all requirements of the hackathon challenge within the Indian wedding persona:

| Challenge Requirement | Implementation Location | Description & Real-World Usability |
| :--- | :--- | :--- |
| **Dynamic Assistant & Intake Form** | `frontend/src/components/IntakeForm.tsx`<br>`backend/app/models.py` | Validated intake capturing couple name, wedding date, city, city tier (Metro/Tier-2/Tier-3), total INR budget, guest count, 6 ceremony toggles, 6 vibe options, top 3 priorities, and dietary/cultural requests. |
| **Event Budgets & What-If Simulator** | `backend/app/engine/budget.py`<br>`frontend/src/components/tabs/BudgetTab.tsx` | Base split across 10 categories renormalized by functions and priorities; exact integer allocation via the Largest Remainder Method; instant debounced slider recalculations without LLM overhead. |
| **Countdown Timeline Roadmaps** | `backend/app/engine/timeline.py`<br>`frontend/src/components/tabs/TimelineTab.tsx` | Counts backwards from Muhurat date across standard phases; automatically compresses timelines for short-notice weddings (<90 or <14 days) and surfaces urgent tasks first. Task completion persisted in `localStorage`. |
| **Vendor Checklists & Contracts** | `backend/app/engine/vendors.py`<br>`frontend/src/components/tabs/VendorsTab.tsx` | Function-filtered vendor categories linked to allocated category budgets; provides lead times, advance payment schedules, cultural questions to ask, and non-negotiable contract clauses. Booking status persisted in `localStorage`. |
| **Personalized GenAI Ideas** | `backend/app/ai/ideas.py`<br>`frontend/src/components/tabs/IdeasTab.tsx` | Single structured Gemini call with JSON schema enforcing themes, catering concepts, function activities, guest experiences, and money-saving hacks; backed by an instant deterministic Indian wedding fallback engine. |

---

## 4. Approach and Logic

WedPlan AI adopts a **hybrid deterministic-generative architecture**: mathematical calculations and timeline sequencing are executed by pure, deterministic Python functions, while creative inspiration is powered by a cached, rate-limited Gemini call.

### A. The Budget Formula & Largest Remainder Allocation

1. **Base Percentage Weights (Summing to exactly 100.0%):**
   - Venue: `18%`
   - Catering: `30%`
   - Decor & Florals: `12%`
   - Photography & Video: `10%`
   - Attire & Jewellery: `12%`
   - Music & Entertainment: `5%`
   - Invitations & Stationery: `2%`
   - Makeup & Mehendi: `3%`
   - Logistics, Transport & Stay: `3%`
   - Contingency: `5%` (Hard minimum floor: never reduced below 5.0%)

2. **Context-Driven Weight Shifting:**
   - **Functions:** If Mehendi is selected, Makeup & Mehendi weight increases by `+1.5%` (decreased by `-1.5%` if omitted). If Sangeet is selected, Music increases by `+2.0%`. Having 5 or 6 functions increases Catering, Decor, and Attire shares.
   - **Vibe/Style:** Royal/Palace shifts weight to Venue (`+5%`) and Decor (`+3%`); Budget-smart trims Decor and Attire and expands Contingency; Destination increases Logistics & Stay (`+7%`); Eco-friendly favors sustainable decor and digital invites.
   - **Priorities:** Each selected priority (up to 3) boosts its respective target category by `+2%` to `+4%`.

3. **Floor Projection & Largest Remainder Method (Hamilton/Hare Method):**
   - Category minimum floors are enforced (`Contingency >= 5%`, `Catering >= 18%`, `Venue >= 10%`, etc.).
   - Weights are iteratively renormalized to exactly 100.0%.
   - Integer INR amounts are calculated:
     $$\text{raw\_amount}_i = \frac{w_i}{100} \times \text{total\_budget}$$
     $$\text{integer\_part}_i = \lfloor \text{raw\_amount}_i \rfloor$$
     $$\text{remainder} = \text{total\_budget} - \sum \text{integer\_part}_i$$
   - The remaining rupees are distributed 1-by-1 to the categories with the largest fractional parts $\text{raw\_amount}_i - \text{integer\_part}_i$.
   - **Result:** $\sum \text{allocated\_amounts} \equiv \text{total\_budget}$ down to the exact rupee without penny-drop rounding errors.

4. **Budget Health Evaluation:**
   Per-guest spend ($\text{total\_budget} / \text{guest\_count}$) is evaluated against city tier benchmarks:
   - **Healthy:** Comfortable hospitality and dining.
   - **Tight:** Achievable with careful guest list and vendor curation; warnings and suggestions emitted.
   - **Unrealistic:** Below standard vendor operating costs; rules-based suggestions calculate the exact number of guests to trim or functions to combine.

### B. Timeline Countdown & Short-Notice Compression

- Standard milestones count backward from the wedding date (e.g. 240 days for Pandit/Muhurat, 210 days for Venue, 150 days for Catering trials, 120 days for Photography, 90 days for bespoke Lehenga embroidery, 45 days for wedding cards, 7 days for Baraat dhol).
- **Compression Rule:** If $\text{days\_remaining} < \text{standard\_lead\_time}$, the engine identifies overdue tasks, elevates their priority to `Urgent`, schedules them for immediate execution ($\max(\text{today}, \text{target\_date})$), and sorts them to the very top of the roadmap.
- **Rule:** No task due date is ever in the past. If $\text{days\_remaining} \le 14$, a prominent Tight Timeline banner alerts the user.

### C. Single-Call Cached Gemini Integration & Bulletproof Fallback

- **Single Structured Call:** Only invoked for the creative Ideas section and executive summary. Uses google-genai SDK with `response_mime_type="application/json"` and `response_schema=IdeasPlan`. Output tokens are capped at 1,000 to maximize throughput.
- **Prompt Injection Defense:** User inputs are sanitized (control characters stripped, whitespace collapsed, length capped) and enclosed in `<user_context>` XML tags. The system prompt instructs the model to treat all user context strictly as passive data.
- **In-Memory TTL LRU Cache:** Keyed by a SHA-256 hash of normalized inputs. Identical requests serve instantly from memory without contacting the LLM.
- **Deterministic Cultural Fallback:** If `GEMINI_API_KEY` is missing, rate-limited, times out (12s), or returns malformed JSON, the engine instantly returns curated, authentic Indian wedding ideas tagged as `ideas_source: "fallback"`. The app never crashes.

---

## 5. How the Solution Works

### Architecture Diagram

```mermaid
flowchart TD
    User([User Browser]) <-->|HTTP / HTTPS| Vite[React 18 Frontend / Vercel Edge]
    Vite -->|Static Assets| SPA[Single Page Application]

    subgraph Frontend [Client Layer]
        SPA --> Intake[Intake Form]
        SPA --> Dashboard[Dashboard with 5 ARIA Tabs]
        Dashboard --> WhatIf[What-If Range Slider & Stepper]
        WhatIf -->|Debounced 300ms / AbortController| RecalcAPI[/api/recalculate]
    end

    subgraph Backend [FastAPI Application / api/index.py]
        RecalcAPI --> Engine[Pure Deterministic Engine]
        Intake -->|POST /api/plan| Router[API Router & Rate Limiter]
        Router --> Engine

        subgraph PureEngine [backend/app/engine/]
            Engine --> BudgetEngine[budget.py: Largest Remainder Split]
            Engine --> TimelineEngine[timeline.py: Lead Time Compression]
            Engine --> VendorEngine[vendors.py: Function Filter & Budget Link]
        end

        Router --> AIModule[backend/app/ai/ideas.py]
        AIModule --> Cache[(In-Memory TTL LRU Cache)]
        Cache -->|Cache Miss| Gemini[Google Gemini 2.5 Flash]
        Gemini -.->|Timeout / Error / No Key| Fallback[Deterministic Indian Wedding Fallback]
        Cache -->|Cache Hit| PlannerAssembler[planner.py Assembler]
        Fallback --> PlannerAssembler
        Gemini --> PlannerAssembler
        BudgetEngine --> PlannerAssembler
        TimelineEngine --> PlannerAssembler
        VendorEngine --> PlannerAssembler
    end

    PlannerAssembler -->|PlanResponse JSON| Dashboard
```

### API Endpoints

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health and liveness probe | Unlimited |
| `POST` | `/api/plan` | Generates full wedding plan (Engine + GenAI Ideas) | 15 req / min per IP |
| `POST` | `/api/recalculate` | Fast what-if recalculation (Zero LLM calls) | 60 req / min per IP |
| `POST` | `/api/ideas` | Regenerates creative ideas independently | 10 req / min per IP |

### Data Flow

1. User submits the intake form on the React SPA.
2. The payload is sent to `POST /api/plan`, validated by Pydantic v2 schemas (`extra="forbid"`).
3. The deterministic engine calculates category budget allocations, countdown tasks, and vendor checklists.
4. The AI module checks the TTL cache. On miss, it queries Gemini with structured JSON output schemas; on failure or missing API key, it seamlessly falls back to the deterministic ideas generator.
5. `PlanResponse` is assembled and delivered to the client, populating the 5 dashboard tabs.
6. When the user manipulates the budget slider or guest stepper in the Budget tab, the client debounces the change (300ms) and calls `POST /api/recalculate` with an `AbortController`. The response updates the budget table and health badges instantly in under 10ms.

---

## 6. Assumptions Made

1. **Currency & Locale:** All financial figures are denominated in Indian Rupees (INR, ₹) formatted using standard Indian numbering format (`₹25,00,000`).
2. **City Tier Cost-Per-Guest Benchmarks:**
   - **Metro** (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata):
     - Healthy: $\ge ₹2,500$ / guest
     - Tight: $₹1,500 - ₹2,499$ / guest
     - Unrealistic: $< ₹1,500$ / guest
   - **Tier-2** (Jaipur, Pune, Ahmedabad, Lucknow, Chandigarh, Goa, etc.):
     - Healthy: $\ge ₹1,800$ / guest
     - Tight: $₹1,100 - ₹1,799$ / guest
     - Unrealistic: $< ₹1,100$ / guest
   - **Tier-3** (Smaller towns, rural, and ancestral home venues):
     - Healthy: $\ge ₹1,200$ / guest
     - Tight: $₹800 - ₹1,199$ / guest
     - Unrealistic: $< ₹800$ / guest
3. **Contingency Reserve:** Every Indian wedding faces unforeseen expenses (weather pivots, overtime hours, priest dakshina, additional guest plates). Therefore, the contingency category is hard-capped at a minimum of `5.0%` of the total budget and is never depleted during weight shifting.
4. **Estimates vs. Binding Quotes:** All figures represent expert planning estimations. Final vendor billing depends on seasonal auspicious dates (Shubh Muhurat demand) and negotiated contracts.

---

## 7. Security, Efficiency, Accessibility, Testing

### Security Measures (`SECURITY.md`)
- **Zero Secrets Leakage:** `GEMINI_API_KEY` is loaded exclusively from environment variables. No secrets are committed, logged, or returned in client payloads.
- **Strict Input Validation:** Pydantic models configure `ConfigDict(extra="forbid")`. Numbers and dates enforce tight ranges.
- **Prompt Injection Defense:** Free-form text fields (`special_requests`) are sanitized of ANSI escape sequences and non-printable control characters, normalized, length-capped at 300 characters, and enclosed in `<user_context>` delimiters. System instructions state that user context must be treated strictly as data.
- **Security Headers:** Every HTTP response includes `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **DoS & Abuse Mitigation:** Sliding-window rate limiting per IP protects endpoints against scraping or token exhaustion.
- **XSS Prevention:** All user and AI outputs are rendered strictly as text nodes in React; `dangerouslySetInnerHTML` is never used.

### Efficiency Optimizations
- **Deterministic Math:** Budget allocation, floor projection, and timeline compression run in $O(n)$ time with zero external network overhead.
- **LLM Rate Reduction:** Zero LLM calls are made on what-if budget adjustments.
- **In-Memory TTL LRU Cache:** Repeated requests are served from RAM in under 1ms.
- **Frontend Code-Splitting:** All 5 dashboard tabs are dynamically code-split using `React.lazy` and `Suspense`.
- **Ultra-Small Bundle Size:** Minimal dependencies (React 18, Vite). No chart or UI component libraries (custom SVG/CSS bars). Production JS bundle is **~53 KB gzipped** (total build under 60 KB gzipped).
- **Repo Footprint:** Total repo size is well under 10 MB (clean `.gitignore` excluding `node_modules`, `dist`, `.venv`, and large binary assets).

### Accessibility (WCAG 2.1 AA Compliance)
- **Semantic Structure:** Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), single `<h1>`, and logical heading hierarchies.
- **Keyboard Navigation:** Includes a focusable "Skip to main content" link. Full roving-tabindex WAI-ARIA tab pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`) navigable using Arrow keys, Home, and End.
- **Forms & ARIA Sync:** Every input has a visible `<label>`. Errors are connected via `aria-describedby` and synchronized with `:user-invalid` styling. Dynamic status updates are announced via `aria-live="polite"` regions.
- **Contrast & Resizability:** Text meets WCAG AA $\ge 4.5:1$ contrast ratios (headings $\ge 7:1$). Does not rely on color alone (badges include textual tags and icons). Supports 200% browser zoom and respects `prefers-reduced-motion`.
- **Touch Targets:** Interactive buttons, tabs, and stepper controls enforce a minimum touch target of $44 \times 44$ px.

### Testing & Verification
- **Backend (Pytest + Coverage):** 23 unit and integration tests covering budget allocation, Hamilton/Hare exact rupee sums, priority adjustments, timeline compression, vendor budget linkages, rate limiting, security headers, prompt injection resistance, and fallback activation. **Test coverage: 93%**.
- **Frontend (Vitest + React Testing Library):** 15 tests verifying form validation, tight timeline notices, 5-tab switching, ARIA keyboard navigation, task completion in `localStorage`, debounced recalculation, and WCAG accessibility semantics.

---

## 8. Setup and Run Locally & Deploy to Vercel

### A. Run Locally

#### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

#### 1. Clone & Setup Environment
```bash
# Clone the repository
git clone <repo-url>
cd "WedPlan AI"

# Copy environment variables
cp .env.example .env
```
*(Optional: Add your `GEMINI_API_KEY` in `.env` to enable live Gemini generation; if omitted, WedPlan AI uses its built-in expert fallback engine without errors).*

#### 2. Start Backend Server
```bash
# Install backend dependencies
python -m pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is live at `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/api/docs`).

#### 3. Start Frontend Dev Server
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 4. Run Test Suites
```bash
# Run backend pytest suite with coverage
python -m pytest backend/tests/ -v --cov=backend.app

# Run backend linter
python -m ruff check backend/

# Run frontend tests
cd frontend
npm test

# Run frontend linter & production build
npm run lint
npm run build
```

---

### B. Deploy to Vercel

WedPlan AI is pre-configured for Vercel deployment with static Vite frontend builds and Python serverless functions via `vercel.json` and `api/index.py`.

#### Vercel Deployment Steps:
1. Push your code to GitHub on the `main` branch.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select this repository.
3. In **Build & Development Settings**:
   - Framework Preset: **Vite**
   - Root Directory: `./` (or leave default root)
4. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio API key)*
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `ALLOWED_ORIGINS`: `https://<your-vercel-deployment-url>.vercel.app`
5. Click **Deploy**. Vercel will build the frontend into `frontend/dist` and expose the FastAPI backend at `/api/*`.

---

## 9. Project Structure

```text
WedPlan AI/
├── .env.example                # Sample environment variables
├── .gitignore                  # Strict ignore file keeping repo < 10 MB
├── pyproject.toml              # Ruff and Pytest configuration
├── requirements.txt            # Pinned backend dependencies
├── vercel.json                 # Vercel serverless routing config
├── SECURITY.md                 # Security policies and defense model
├── README.md                   # Complete graded documentation
├── api/
│   └── index.py                # Vercel Python serverless entrypoint
├── backend/
│   ├── app/
│   │   ├── config.py           # App settings from environment
│   │   ├── constants.py        # Budget weights, floors, and city tier benchmarks
│   │   ├── models.py           # Pydantic v2 schemas (extra="forbid")
│   │   ├── security.py         # Security headers & input sanitizers
│   │   ├── rate_limit.py       # Sliding-window IP rate limiter
│   │   ├── cache.py            # Thread-safe in-memory TTL LRU cache
│   │   ├── main.py             # FastAPI factory & middleware setup
│   │   ├── engine/
│   │   │   ├── budget.py       # Deterministic budget engine & Largest Remainder Method
│   │   │   ├── timeline.py     # Countdown roadmap & short-notice compression
│   │   │   ├── vendors.py      # Vendor checklists & contract requirements
│   │   │   └── planner.py      # Master engine orchestrator
│   │   ├── ai/
│   │   │   └── ideas.py        # Single cached Gemini call + deterministic fallback
│   │   └── routes/
│   │       └── plan.py         # /api/plan, /api/recalculate, /api/ideas routes
│   └── tests/
│       ├── test_budget.py      # Budget logic and exact rupee math tests
│       ├── test_timeline.py    # Timeline offsets and compression tests
│       ├── test_vendors.py     # Vendor filtering and budget linkage tests
│       ├── test_api.py         # Endpoints, rate limiting, and fallback tests
│       ├── test_security_injection.py # Prompt injection defense tests
│       └── verify_flow.py      # Standalone end-to-end integration script
└── frontend/
    ├── package.json            # Pinned frontend dependencies
    ├── tsconfig.json           # TypeScript configuration
    ├── vite.config.ts          # Vite build & Vitest proxy configuration
    ├── eslint.config.js        # ESLint flat configuration
    ├── index.html              # Accessible HTML5 entrypoint
    ├── src/
    │   ├── App.tsx             # Root application component & live region
    │   ├── main.tsx            # React 18 DOM mount
    │   ├── types.ts            # Shared TypeScript interfaces
    │   ├── api/
    │   │   └── client.ts       # Typed fetch client with AbortController
    │   ├── hooks/
    │   │   ├── useLocalStorage.ts # Safe localStorage persistence
    │   │   └── useDebounce.ts     # Slider debounce hook (300ms)
    │   ├── utils/
    │   │   └── formatters.ts   # INR currency and Indian date formatters
    │   ├── styles/
    │   │   ├── variables.css   # Celebratory Indian palette & tokens
    │   │   ├── global.css      # CSS reset, skip link, landmarks
    │   │   ├── form.css        # Intake form & pill chips styling
    │   │   ├── dashboard.css   # Dashboard shell & WAI-ARIA tab list
    │   │   ├── tabs.css        # Tab-specific cards & CSS progress bars
    │   │   └── print.css       # Clean print & PDF export stylesheet
    │   └── components/
    │       ├── Header.tsx      # Semantic header with inline SVG branding
    │       ├── Footer.tsx      # Semantic footer with estimate disclaimers
    │       ├── SkipLink.tsx    # Accessible skip link
    │       ├── IntakeForm.tsx  # Interactive guided intake form
    │       ├── Dashboard.tsx   # Results dashboard with 5 ARIA tabs
    │       ├── common/
    │       │   ├── Badge.tsx   # Color-independent accessible badges
    │       │   ├── ProgressBar.tsx # Pure CSS/SVG progress tracks
    │       │   └── Notice.tsx  # Accessible status and alert banners
    │       └── tabs/
    │           ├── OverviewTab.tsx # Executive summary & health metrics
    │           ├── BudgetTab.tsx   # Budget breakdown & what-if simulator
    │           ├── TimelineTab.tsx # Phase countdown & task checkboxes
    │           ├── VendorsTab.tsx  # Vendor checklists & contract must-haves
    │           └── IdeasTab.tsx    # Personalized GenAI concepts & hacks
    └── tests/
        ├── setup.ts            # Vitest mocks (print, clipboard, scrollTo)
        ├── IntakeForm.test.tsx # Form validation and submission tests
        ├── Dashboard.test.tsx  # Tab navigation, copy, and print tests
        ├── BudgetTab.test.tsx  # Stepper, slider, and recalculation tests
        └── Accessibility.test.tsx # Semantic landmarks & WCAG AA tests
```

---

## 10. Limitations and Future Work

1. **Multi-Currency Support:** WedPlan AI currently focuses exclusively on Indian Weddings denominated in INR. Expanding to global NRI destination weddings (Dubai, Bali, Thailand) with live multi-currency conversion (USD, AED, EUR, GBP) is a natural next step.
2. **Direct Vendor Marketplace Integrations:** Currently, vendor budgets and checklists provide guidance and contract negotiation points. Future versions can integrate direct WhatsApp or email inquiry links to verified local banquet vendors and photographers.
3. **Multi-User Family Collaboration:** Indian wedding planning often involves collaborative decision-making across extended families. Future iterations can support shared cloud sessions and role-based permissions (e.g., bride & groom view, finance coordinator view).
4. **PDF Direct Generation:** While browser-based print styling formats cleanly to PDF, server-side direct PDF generation with downloadable branded brochures would offer enhanced offline accessibility for elders.

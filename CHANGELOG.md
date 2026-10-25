# Changelog

All notable changes to **WedPlan AI** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-24

### Added
- **Hypothesis Property-Based Invariant Tests**: Added `backend/tests/test_hypothesis_invariants.py` with 160 generative iterations verifying budget sum preservation, timeline bounds, and tight budget luxury term exclusions.
- **Axe-Core Automated Accessibility Verification**: Added `frontend/tests/AxeCore.test.tsx` verifying 0 WCAG 2.1 AA violations across IntakeForm, OverviewTab, BudgetTab, TimelineTab, VendorsTab, and IdeasTab.
- **UI Component Primitives**: Extracted self-contained components in `frontend/src/components/ui/` (`Button`, `Badge`, `Card`, `Modal`, `Alert`, `Tooltip`, `NumericInput`, `FormField`).
- **Feature-Based Frontend Architecture**: Modularized frontend into `intake`, `overview`, `budget`, `timeline`, `vendors`, `ideas`, `print`, and `dashboard`.
- **Modular CSS Architecture**: Decomposed monolithic `tabs.css` into 8 focused stylesheets (`tabs-overview.css`, `tabs-alerts.css`, `tabs-chart.css`, `tabs-whatif.css`, `tabs-whatif-controls.css`, `tabs-budget-table.css`, `tabs-timeline.css`, `tabs-vendors.css`), all strictly under 250 lines.
- **Hardened HTTP Headers**: Added HSTS (`max-age=63072000`), COOP (`same-origin`), CORP (`same-origin`), and granular CSP in both `vercel.json` and FastAPI `SecurityHeadersMiddleware`.
- **Automated CI Validation**: Added `.github/workflows/ci.yml` verifying linting, formatting, type checking, unit tests, and Vercel serverless simulation.
- **Comprehensive Documentation**: Added `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/ACCESSIBILITY.md`, and updated `SECURITY.md`.

### Refactored
- **Domain Catalogs**: Separated static data catalogs (`timeline_data.py`, `vendors_data.py`, `ideas_data.py`, `budget_data.py`) from calculation algorithms in `backend/app/engine/data/`.
- **PlanService Extraction**: Extracted pure orchestration service in `backend/app/services/plan_service.py` with dependency injection for Gemini clients.
- **Strict Typing & Linting**: Upgraded Ruff and Mypy strict mode configurations; resolved 100% of static analysis issues across 31 backend files.
- **Component File Limits**: Refactored all components to strictly remain under 150 lines (utilities under 200 lines).

### Fixed
- Fixed integer division per-guest calculation in What-If Simulator and budget plan generation.
- Corrected phase normalization for post-wedding vendor settlement tasks.
- Eliminated all potential undefined property references in tab renderers.

---

## [1.0.0] - 2026-10-22

### Added
- Initial release of WedPlan AI.
- FastAPI backend with Largest Remainder budget engine and Gemini 3.5 Flash Lite ideas generator.
- React 19 frontend with 5 interactive planning tabs and printable celebration plan.
- Serverless deployment on Vercel (`https://wed-plan-ai-six.vercel.app`).

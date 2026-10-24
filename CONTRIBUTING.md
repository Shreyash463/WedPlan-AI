# Contributing to WedPlan AI

Thank you for your interest in contributing to WedPlan AI! We welcome contributions that improve code quality, accessibility, domain accuracy, and developer experience.

---

## Code of Conduct & Standards

To ensure a high standard of maintainability, reliability, and security, all contributions must adhere to the following hard rules:

1. **File Size Constraints**:
   - React components (`.tsx`) must strictly remain under **150 lines**. Extract modular subcomponents if approaching this threshold.
   - Helper scripts and utility functions (`.ts` / `.py`) must strictly remain under **200 lines**.
   - Modular CSS stylesheets must strictly remain under **250 lines**.
2. **Strict Typing**:
   - Python: Strict mode in `mypy` with 0 type errors. No untyped `Any` without explicit justification.
   - TypeScript: Strict mode enabled in `tsconfig.json`. No implicit `any`.
3. **Linting & Code Formatting**:
   - Backend: Ruff with max cyclomatic complexity 10 (`mccabe`), `SIM`, `RET`, `PTH`, `ERA`, `PL`.
   - Frontend: ESLint with zero warnings.
4. **Testing Requirements**:
   - Every bug fix or new feature must include automated unit tests.
   - Domain calculation algorithms must be verified with property-based Hypothesis tests.
   - All UI components must pass automated `axe-core` accessibility audits with 0 violations.

---

## Local Development Workflow

1. Fork and clone the repository.
2. Set up Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   pip install pytest pytest-asyncio pytest-cov hypothesis ruff mypy httpx
   ```
3. Set up Frontend:
   ```bash
   cd frontend
   npm install
   ```
4. Run all verification checks before submitting PR:
   ```bash
   # Backend checks
   python -m ruff check backend api
   python -m mypy backend/app api
   python -m pytest backend/tests

   # Frontend checks
   npm --prefix frontend run check
   npm --prefix frontend test

   # Vercel serverless entrypoint simulation
   python scripts/simulate_vercel.py
   ```

# API Reference Specification

The WedPlan AI backend provides a RESTful JSON API for wedding budgeting, timeline generation, vendor checklist management, and generative ideas synthesis.

---

## 1. General Conventions

- **Base URL**: `/api` (local: `http://localhost:8000/api`, production: `https://wed-plan-ai-six.vercel.app/api`)
- **Content Type**: `application/json; charset=utf-8`
- **Error Format**: All errors return a standardized JSON envelope:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human readable explanation of the failure.",
      "details": []
    }
  }
  ```

---

## 2. Endpoints

### A. Health Check
Checks service availability and runtime configuration.

- **Route**: `GET /api/health`
- **Rate Limit**: 120 req/min
- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "environment": "production",
    "gemini_configured": true
  }
  ```

---

### B. Generate Full Wedding Plan
Generates an all-inclusive wedding plan: budget allocations, countdown roadmap, vendor checklists, and personalized celebration ideas.

- **Route**: `POST /api/plan`
- **Rate Limit**: 15 req/min
- **Request Body**:
  ```json
  {
    "couple_name": "Priya & Rohan",
    "wedding_date": "2026-11-20",
    "city": "Jaipur",
    "city_tier": "Tier-2",
    "total_budget": 3500000,
    "guest_count": 350,
    "functions": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
    "style": "Royal/Palace",
    "priorities": ["Food", "Venue & Decor"],
    "special_requests": "Pure vegetarian catering, outdoor sunset pheras"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "overview": {
      "couple_name": "Priya & Rohan",
      "wedding_date": "2026-11-20",
      "city": "Jaipur",
      "city_tier": "Tier-2",
      "guest_count": 350,
      "total_budget": 3500000,
      "cost_per_guest": 10000,
      "days_remaining": 180,
      "is_tight_timeline": false,
      "health_status": "Healthy",
      "summary": "Tailored for: Pure vegetarian, Sunset outdoor.",
      "key_warnings": []
    },
    "budget": {
      "total_budget": 3500000,
      "guest_count": 350,
      "cost_per_guest": 10000,
      "health_status": "Healthy",
      "health_description": "Budget aligns comfortably with Tier-2 benchmarks.",
      "allocations": [
        {
          "category": "Venue",
          "amount": 770000,
          "percentage": 22.0,
          "description": "Heritage haveli or palace banquet grounds."
        }
      ],
      "warnings": [],
      "suggestions": []
    },
    "timeline": {
      "days_remaining": 180,
      "is_tight_timeline": false,
      "phases": ["6+ Months", "5-6 Months", "3-4 Months", "2 Months", "1 Month", "2 Weeks", "Final Week", "Final 72 Hours", "Wedding Day", "After Wedding"],
      "tasks": []
    },
    "vendors": {
      "categories": []
    },
    "ideas": {
      "overview_summary": "Royal Rajasthani palette...",
      "themes_and_decor": [],
      "catering_and_menu": [],
      "function_activities": [],
      "guest_experience_ideas": [],
      "money_saving_hacks": [],
      "ideas_source": "gemini",
      "budget_band": "Comfortable",
      "budget_band_note": null
    },
    "generated_at": "2026-10-24T12:00:00Z",
    "disclaimer": "Estimates based on regional wedding benchmarks."
  }
  ```

---

### C. Recalculate Budget (What-If Simulator)
Instant recalculation of budget breakdown when sliders or guest counts are adjusted. Runs deterministically with zero LLM latency.

- **Route**: `POST /api/recalculate`
- **Rate Limit**: 60 req/min
- **Request Body**:
  ```json
  {
    "total_budget": 3000000,
    "guest_count": 300,
    "city": "Jaipur",
    "city_tier": "Tier-2",
    "style": "Royal/Palace",
    "functions": ["Wedding"],
    "priorities": ["Food"]
  }
  ```
- **Response (200 OK)**:
  Returns recalculated `BudgetPlan` matching the Hamilton Largest Remainder sum invariant.

---

## 3. HTTP Error Codes

| Status Code | Code String | Description |
| :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Malformed request parameters. |
| `413` | `PAYLOAD_TOO_LARGE` | Request body exceeds the 1 MB size limit. |
| `422` | `VALIDATION_ERROR` | Pydantic schema validation failure (e.g. past wedding date, budget < ₹50,000). |
| `429` | `RATE_LIMIT_EXCEEDED` | Exceeded endpoint rate limit. Includes `Retry-After` header. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected internal exception. Stack traces are sanitized. |
| `502` | `AI_SERVICE_ERROR` | Generative AI upstream failure (automatic fallback is triggered). |

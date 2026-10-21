import {
  IdeasPlan,
  PlanFormInput,
  PlanResponse,
  RecalculateResponse,
} from "../types";

export class ApiClientError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorCode = `HTTP_${res.status}`;
    let errorMessage = `Server error (${res.status})`;
    let details: unknown;

    try {
      const data = await res.json();
      if (data?.error) {
        errorCode = data.error.code || errorCode;
        errorMessage = data.error.message || errorMessage;
        details = data.error.details;
      }
    } catch {
      // Non-JSON response
    }

    throw new ApiClientError(errorMessage, errorCode, details);
  }

  return (await res.json()) as T;
}

export async function createPlan(
  payload: PlanFormInput,
  signal?: AbortSignal
): Promise<PlanResponse> {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<PlanResponse>(res);
}

export async function recalculatePlan(
  payload: Omit<PlanFormInput, "couple_name" | "special_requests">,
  signal?: AbortSignal
): Promise<RecalculateResponse> {
  const res = await fetch("/api/recalculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<RecalculateResponse>(res);
}

export async function regenerateIdeas(
  payload: Omit<PlanFormInput, "couple_name" | "wedding_date">,
  signal?: AbortSignal
): Promise<IdeasPlan> {
  const res = await fetch("/api/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  return handleResponse<IdeasPlan>(res);
}

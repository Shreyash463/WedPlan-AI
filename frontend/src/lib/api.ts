/**
 * Robust typed API client with timeout support and retry for transient failures.
 */

import { IdeasPlan, PlanFormInput, PlanResponse, RecalculateResponse } from "../types";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code: string = "API_ERROR", status: number = 500, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Backward-compatibility alias
export const ApiClientError = ApiError;

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

async function fetchWithTimeoutAndRetry(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 5000, retries = 1, ...init } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // If caller provided external signal, chain it
    if (init.signal) {
      init.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // Retry on 503 (Service Unavailable) if retries left
      if (response.status === 503 && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }

      return response;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new ApiError(
      `Request timed out after ${timeoutMs / 1000} seconds. Please check your network.`,
      "TIMEOUT_ERROR",
      408
    );
  }
  throw lastError;
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
      } else if (data?.detail) {
        errorMessage = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Non-JSON response
    }

    throw new ApiError(errorMessage, errorCode, res.status, details);
  }

  return (await res.json()) as T;
}

export async function createPlan(payload: PlanFormInput, signal?: AbortSignal): Promise<PlanResponse> {
  const res = await fetchWithTimeoutAndRetry("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 15000,
    retries: 1,
    signal,
  });
  return handleResponse<PlanResponse>(res);
}

export async function recalculatePlan(
  payload: Omit<PlanFormInput, "couple_name" | "special_requests">,
  signal?: AbortSignal
): Promise<RecalculateResponse> {
  const res = await fetchWithTimeoutAndRetry("/api/recalculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 5000,
    retries: 1,
    signal,
  });
  return handleResponse<RecalculateResponse>(res);
}

export async function regenerateIdeas(
  payload: Omit<PlanFormInput, "couple_name" | "wedding_date">,
  signal?: AbortSignal
): Promise<IdeasPlan> {
  const res = await fetchWithTimeoutAndRetry("/api/ideas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeoutMs: 15000,
    retries: 1,
    signal,
  });
  return handleResponse<IdeasPlan>(res);
}

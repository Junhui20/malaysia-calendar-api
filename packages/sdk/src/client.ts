import type {
  Holiday,
  HolidayType,
  HolidayStatus,
  State,
  StateGroup,
  StateType,
  SchoolTerm,
  SchoolHoliday,
  SchoolHolidayType,
  Exam,
  ExamType,
  CheckDateResult,
  BusinessDaysResult,
  LocalizedString,
} from "@mycal/core";
import type { Result, ApiError } from "./errors.js";

// ─── Client Options ───

export interface MyCalClientOptions {
  readonly baseUrl?: string;
  readonly apiKey?: string;
}

// ─── Parameter Types ───

export interface HolidaysParams {
  readonly year?: number;
  readonly state?: string;
  readonly month?: number;
  readonly type?: HolidayType;
  readonly status?: HolidayStatus;
}

export interface HolidaysNextParams {
  readonly state?: string;
  readonly type?: HolidayType;
  readonly limit?: number;
}

export interface SchoolTermsParams {
  readonly year?: number;
  readonly group?: StateGroup;
  readonly state?: string;
}

export interface SchoolHolidaysParams {
  readonly year?: number;
  readonly group?: StateGroup;
  readonly state?: string;
}

export interface ExamsParams {
  readonly year?: number;
  readonly type?: ExamType;
}

export interface IsSchoolDayParams {
  readonly state?: string;
  readonly group?: StateGroup;
}

// ─── Response Types ───

export interface HolidaysTodayResponse {
  readonly date: string;
  readonly holidays: readonly Holiday[];
  readonly isHoliday: boolean;
}

export interface AddBusinessDaysResponse {
  readonly startDate: string;
  readonly businessDays: number;
  readonly resultDate: string;
}

export interface ResolveStateResponse {
  readonly canonical: string;
  readonly name: LocalizedString;
  readonly type: StateType;
  readonly group: StateGroup;
}

export interface IsSchoolDayResponse {
  readonly date: string;
  readonly dayOfWeek: string;
  readonly isSchoolDay: boolean;
  readonly isPublicHoliday: boolean;
  readonly isWeekend: boolean;
  readonly group: StateGroup;
  readonly term: { readonly id: string; readonly term: number } | null;
  readonly holiday: {
    readonly id: string;
    readonly name: LocalizedString;
    readonly type: SchoolHolidayType;
  } | null;
}

// ─── Internal Types ───

interface ApiSuccessEnvelope<T> {
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly suggestions?: readonly string[];
  };
}

// ─── Client ───

const DEFAULT_BASE_URL = "https://mycal-api.huijun00100101.workers.dev/v1";

export class MyCalClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;

  constructor(options: MyCalClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = options.apiKey;
  }

  // ─── Holiday Methods ───

  async holidays(params?: HolidaysParams): Promise<Result<readonly Holiday[]>> {
    const query = buildQuery({
      year: params?.year,
      state: params?.state,
      month: params?.month,
      type: params?.type,
      status: params?.status,
    });
    return this.request<readonly Holiday[]>(`/holidays${query}`);
  }

  async holidaysToday(state?: string): Promise<Result<HolidaysTodayResponse>> {
    const query = buildQuery({ state });
    return this.request<HolidaysTodayResponse>(`/holidays/today${query}`);
  }

  async holidaysNext(params?: HolidaysNextParams): Promise<Result<readonly Holiday[]>> {
    const query = buildQuery({
      state: params?.state,
      type: params?.type,
      limit: params?.limit,
    });
    return this.request<readonly Holiday[]>(`/holidays/next${query}`);
  }

  async holidaysBetween(
    start: string,
    end: string,
    state?: string,
  ): Promise<Result<readonly Holiday[]>> {
    const query = buildQuery({ start, end, state });
    return this.request<readonly Holiday[]>(`/holidays/between${query}`);
  }

  async check(date: string, state: string): Promise<Result<CheckDateResult>> {
    const query = buildQuery({ date, state });
    return this.request<CheckDateResult>(`/holidays/check${query}`);
  }

  // ─── Business Day Methods ───

  async businessDays(
    start: string,
    end: string,
    state: string,
  ): Promise<Result<BusinessDaysResult>> {
    const query = buildQuery({ start, end, state });
    return this.request<BusinessDaysResult>(`/business-days${query}`);
  }

  async addBusinessDays(
    date: string,
    days: number,
    state: string,
  ): Promise<Result<AddBusinessDaysResponse>> {
    const query = buildQuery({ date, days, state });
    return this.request<AddBusinessDaysResponse>(`/business-days/add${query}`);
  }

  // ─── State Methods ───

  async states(): Promise<Result<readonly State[]>> {
    return this.request<readonly State[]>("/states");
  }

  async resolveState(queryStr: string): Promise<Result<ResolveStateResponse>> {
    const query = buildQuery({ q: queryStr });
    return this.request<ResolveStateResponse>(`/states/resolve${query}`);
  }

  // ─── School Methods ───

  async schoolTerms(params?: SchoolTermsParams): Promise<Result<readonly SchoolTerm[]>> {
    const query = buildQuery({
      year: params?.year,
      group: params?.group,
      state: params?.state,
    });
    return this.request<readonly SchoolTerm[]>(`/school/terms${query}`);
  }

  async schoolHolidays(params?: SchoolHolidaysParams): Promise<Result<readonly SchoolHoliday[]>> {
    const query = buildQuery({
      year: params?.year,
      group: params?.group,
      state: params?.state,
    });
    return this.request<readonly SchoolHoliday[]>(`/school/holidays${query}`);
  }

  async exams(params?: ExamsParams): Promise<Result<readonly Exam[]>> {
    const query = buildQuery({
      year: params?.year,
      type: params?.type,
    });
    return this.request<readonly Exam[]>(`/school/exams${query}`);
  }

  async isSchoolDay(
    date: string,
    params?: IsSchoolDayParams,
  ): Promise<Result<IsSchoolDayResponse>> {
    const query = buildQuery({
      date,
      state: params?.state,
      group: params?.group,
    });
    return this.request<IsSchoolDayResponse>(`/school/is-school-day${query}`);
  }

  // ─── Feed Methods ───

  icalUrl(state: string, year?: number): string {
    const yearSuffix = year !== undefined ? `?year=${year}` : "";
    return `${this.baseUrl}/feed/ical/${encodeURIComponent(state)}${yearSuffix}`;
  }

  // ─── Internal ───

  private async request<T>(path: string): Promise<Result<T>> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      "Accept": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { headers });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network request failed";
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message,
          status: 0,
        },
      };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return {
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: "Failed to parse JSON response",
          status: response.status,
        },
      };
    }

    // Check for API error envelope
    if (isErrorEnvelope(body)) {
      return {
        success: false,
        error: {
          code: body.error.code,
          message: body.error.message,
          status: response.status,
          suggestions: body.error.suggestions,
        },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: `Request failed with status ${response.status}`,
          status: response.status,
        },
      };
    }

    // Extract data from success envelope
    if (isSuccessEnvelope<T>(body)) {
      return { success: true, data: body.data };
    }

    // Fallback: treat entire body as data
    return { success: true, data: body as T };
  }
}

// ─── Utilities ───

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const entries = Object.entries(params)
    .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return entries.length > 0 ? `?${entries.join("&")}` : "";
}

function isErrorEnvelope(body: unknown): body is ApiErrorEnvelope {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as ApiErrorEnvelope).error === "object" &&
    (body as ApiErrorEnvelope).error !== null &&
    typeof (body as ApiErrorEnvelope).error.code === "string"
  );
}

function isSuccessEnvelope<T>(body: unknown): body is ApiSuccessEnvelope<T> {
  return typeof body === "object" && body !== null && "data" in body;
}

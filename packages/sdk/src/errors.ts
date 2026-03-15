// Result<T> pattern for error handling
export type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ApiError };

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly status: number;
  readonly suggestions?: readonly string[];
}

export class MyCalApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly suggestions?: readonly string[];

  constructor(error: ApiError) {
    super(error.message);
    this.name = "MyCalApiError";
    this.code = error.code;
    this.status = error.status;
    this.suggestions = error.suggestions;
  }
}

export interface ApiError {
  status?: number;
  data: unknown;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  uptime_seconds?: number;
  version?: string;
}

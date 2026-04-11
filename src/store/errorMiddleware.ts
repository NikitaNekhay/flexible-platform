import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import { showErrorNotification, extractError } from '@/components/ErrorNotification';

/**
 * RTK middleware that catches all rejected API calls and shows
 * error notifications automatically. Individual call sites can
 * still handle errors themselves — this is a safety net so no
 * error goes silently unnoticed.
 */
// Track recent notifications to deduplicate repeated polling errors
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 10000;

export const rtkErrorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { message, details } = extractError(action.payload);

    // Derive a title from the action type, e.g. "chainsApi/executeQuery/rejected" → "Request Failed"
    const actionType = (action as { type?: string }).type ?? '';
    const endpoint = actionType.split('/')[1] ?? '';
    const title = endpoint
      ? `API Error: ${endpoint.replace(/([A-Z])/g, ' $1').trim()}`
      : 'API Error';

    // Deduplicate: skip if same error was shown within the window
    const dedupKey = `${endpoint}:${message}`;
    const now = Date.now();
    const lastShown = recentErrors.get(dedupKey);
    if (lastShown && now - lastShown < DEDUP_WINDOW_MS) {
      return next(action);
    }
    recentErrors.set(dedupKey, now);

    // Periodically clean old entries
    if (recentErrors.size > 50) {
      for (const [key, time] of recentErrors) {
        if (now - time > DEDUP_WINDOW_MS) recentErrors.delete(key);
      }
    }

    // Critical errors (5xx, execution failures) are persistent
    const status = (action.payload as { status?: number })?.status;
    const isCritical =
      (status && status >= 500) ||
      endpoint.toLowerCase().includes('execute') ||
      endpoint.toLowerCase().includes('cancel');

    showErrorNotification({
      title,
      message,
      details,
      autoClose: isCritical ? false : 8000,
    });
  }

  return next(action);
};

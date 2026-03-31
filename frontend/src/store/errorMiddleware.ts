import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import { showErrorNotification, extractError } from '@/components/ErrorNotification';

/**
 * RTK middleware that catches all rejected API calls and shows
 * error notifications automatically. Individual call sites can
 * still handle errors themselves — this is a safety net so no
 * error goes silently unnoticed.
 */
export const rtkErrorMiddleware: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { message, details } = extractError(action.payload);

    // Derive a title from the action type, e.g. "chainsApi/executeQuery/rejected" → "Request Failed"
    const actionType = (action as { type?: string }).type ?? '';
    const endpoint = actionType.split('/')[1] ?? '';
    const title = endpoint
      ? `API Error: ${endpoint.replace(/([A-Z])/g, ' $1').trim()}`
      : 'API Error';

    showErrorNotification({ title, message, details });
  }

  return next(action);
};

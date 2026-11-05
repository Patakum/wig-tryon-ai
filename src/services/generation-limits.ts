// A job cannot legitimately outlive the route's 300s limit, so a generation
// still pending after this long is treated as timed out.
export const PENDING_TIMEOUT_MS = 6 * 60 * 1000;

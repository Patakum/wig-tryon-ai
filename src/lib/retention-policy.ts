// Retention periods. The cleanup job enforces them and the privacy page
// reads the same values, so the policy text cannot drift from the behaviour.
export const GUEST_RETENTION_HOURS = 24;
export const ACCOUNT_RETENTION_DAYS = 365;
// Soft-deleted try-ons are kept only while they still count toward the
// 24-hour generation quota.
export const TOMBSTONE_RETENTION_HOURS = 48;

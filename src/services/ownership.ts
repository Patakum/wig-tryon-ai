import { throwApiError } from '@/src/lib/api/errors';
import type { ViewerIdentity } from '@/src/types/viewer';

export function requireOwner(
  owner: ViewerIdentity,
  viewer: ViewerIdentity,
): void {
  if (owner.userId !== null) {
    if (viewer.userId === null) {
      throwApiError(401, 'UNAUTHORIZED', 'Sign in to access this resource');
    }

    if (owner.userId !== viewer.userId) {
      throwApiError(403, 'FORBIDDEN', 'Forbidden');
    }

    return;
  }

  if (owner.guestSessionId !== null) {
    if (viewer.guestSessionId === null && viewer.userId === null) {
      throwApiError(401, 'UNAUTHORIZED', 'Guest session required');
    }

    if (owner.guestSessionId !== viewer.guestSessionId) {
      throwApiError(403, 'FORBIDDEN', 'Forbidden');
    }

    return;
  }

  throwApiError(403, 'FORBIDDEN', 'Forbidden');
}

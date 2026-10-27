'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

// Uploads and generation depend on the connection. Say so as soon as it
// drops, and offer a refresh once it is back.
export default function ConnectionBanner() {
  const router = useRouter();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const markOffline = () => setWasOffline(true);

    window.addEventListener('offline', markOffline);

    return () => window.removeEventListener('offline', markOffline);
  }, []);

  if (!online) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center bg-amber-600 px-3 py-2 text-sm text-white"
      >
        אין חיבור לאינטרנט. העלאה ויצירה יחזרו לעבוד כשהחיבור יחזור.
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-3 bg-green-700 px-3 py-2 text-sm text-white"
      >
        <span>החיבור חזר.</span>
        <button
          type="button"
          className="underline"
          onClick={() => {
            setWasOffline(false);
            router.refresh();
          }}
        >
          רענון העמוד
        </button>
      </div>
    );
  }

  return null;
}

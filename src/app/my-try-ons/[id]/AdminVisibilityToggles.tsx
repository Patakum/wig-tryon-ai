'use client';

import { useState } from 'react';

type Settings = { adminCanSeeSelfie: boolean; adminCanSeeResult: boolean };

type Props = { id: string; initial: Settings };

const OPTIONS: { key: keyof Settings; label: string }[] = [
  { key: 'adminCanSeeSelfie', label: 'מנהלי האתר יכולים לראות את התמונה שהעליתי' },
  { key: 'adminCanSeeResult', label: 'מנהלי האתר יכולים לראות את התוצאה' },
];

export default function AdminVisibilityToggles({ id, initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(key: keyof Settings) {
    const previous = settings;
    const next = { ...settings, [key]: !settings[key] };

    setError(null);
    setSettings(next);

    try {
      const res = await fetch(`/api/my-try-ons/${encodeURIComponent(id)}/privacy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next[key] }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }
    } catch {
      setSettings(previous);
      setError('לא הצלחנו לשמור את ההגדרה. נסי שוב.');
    }
  }

  return (
    <section className="mt-4">
      <h2 className="text-sm font-semibold">פרטיות</h2>
      <p className="text-xs text-muted-foreground">
        מנהלי האתר משתמשים בתמונות רק כדי לבדוק משוב. אפשר לכבות בכל רגע.
      </p>
      <ul className="mt-2 list-none space-y-2">
        {OPTIONS.map(({ key, label }) => (
          <li key={key}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                role="switch"
                checked={settings[key]}
                onChange={() => toggle(key)}
              />
              {label}
            </label>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';

type Props = {
  wig: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
  };
  photos: { id: string; imageUrl: string; position: number }[];
  maxPhotos: number;
};

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export default function WigEditClient({ wig, photos, maxPhotos }: Props) {
  const router = useRouter();
  const [name, setName] = useState(wig.name);
  const [description, setDescription] = useState(wig.description ?? '');
  const [price, setPrice] = useState(wig.price?.toString() ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const basePath = `/api/admin/wigs/${encodeURIComponent(wig.id)}`;

  async function run(action: () => Promise<Response>, successText: string) {
    setBusy(true);
    setMessage(null);

    try {
      const res = await action();

      if (!res.ok) {
        setMessage({ ok: false, text: await readError(res) });
        return;
      }

      setMessage({ ok: true, text: successText });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: 'Network error. Try again.' });
    } finally {
      setBusy(false);
    }
  }

  function saveDetails(e: React.FormEvent) {
    e.preventDefault();

    const parsedPrice = price.trim() === '' ? null : Number(price);

    void run(
      () =>
        fetch(basePath, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description: description.trim() === '' ? null : description,
            price: parsedPrice,
          }),
        }),
      'Details saved.',
    );
  }

  function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    void run(
      () => fetch(`${basePath}/photos`, { method: 'POST', body: formData }),
      'Photo added.',
    );
  }

  function movePhoto(photoId: string, direction: 'up' | 'down') {
    void run(
      () =>
        fetch(`${basePath}/photos/${encodeURIComponent(photoId)}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ direction }),
        }),
      'Order updated.',
    );
  }

  function removePhoto(photoId: string) {
    if (!window.confirm('Remove this photo?')) return;

    void run(
      () =>
        fetch(`${basePath}/photos/${encodeURIComponent(photoId)}`, {
          method: 'DELETE',
        }),
      'Photo removed.',
    );
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveDetails} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Name *
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="price" className="text-sm font-medium">
            Price (optional)
          </label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy}>
          Save details
        </Button>
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Photos ({photos.length}/{maxPhotos})
        </h2>
        <p className="text-sm text-muted-foreground">
          The first photo is the main one used in the catalog and for try-on.
        </p>

        <ul className="space-y-3 list-none">
          {photos.map((photo, index) => (
            <li key={photo.id} className="flex items-center gap-3">
              <Image
                src={photo.imageUrl}
                alt={`Photo ${index + 1}`}
                width={64}
                height={80}
                className="h-20 w-16 rounded object-cover"
                unoptimized
              />
              <span className="flex-1 text-sm">
                {index === 0 ? 'Main photo' : `Photo ${index + 1}`}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Move up"
                disabled={busy || index === 0}
                onClick={() => movePhoto(photo.id, 'up')}
              >
                <ArrowUp size={16} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Move down"
                disabled={busy || index === photos.length - 1}
                onClick={() => movePhoto(photo.id, 'down')}
              >
                <ArrowDown size={16} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remove photo"
                disabled={busy || photos.length <= 1}
                onClick={() => removePhoto(photo.id)}
              >
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>

        {photos.length < maxPhotos && (
          <div className="space-y-1">
            <label htmlFor="new-photo" className="text-sm font-medium">
              Add photo (JPEG, PNG or WebP, up to 10MB)
            </label>
            <Input
              id="new-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={addPhoto}
            />
          </div>
        )}
      </section>

      {message && (
        <p
          role={message.ok ? 'status' : 'alert'}
          className={message.ok ? 'text-sm text-green-600' : 'text-sm text-red-600'}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

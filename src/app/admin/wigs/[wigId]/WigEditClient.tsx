'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import { wigUpdateSchema, type WigUpdateInput } from '@/src/lib/wig-schema';

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

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message ?? 'Request failed';
  }

  return 'Request failed';
}

export default function WigEditClient({ wig, photos, maxPhotos }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [photoToRemove, setPhotoToRemove] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WigUpdateInput>({
    resolver: zodResolver(wigUpdateSchema),
    defaultValues: {
      name: wig.name,
      description: wig.description,
      price: wig.price,
    },
  });

  const basePath = `/api/admin/wigs/${encodeURIComponent(wig.id)}`;

  async function run(action: () => Promise<unknown>, successText: string) {
    setBusy(true);
    setMessage(null);

    try {
      await action();
      setMessage({ ok: true, text: successText });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  const saveDetails = handleSubmit((values) =>
    run(() => axios.patch(basePath, values), 'Details saved.'),
  );

  function addPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    void run(() => axios.post(`${basePath}/photos`, formData), 'Photo added.');
  }

  function movePhoto(photoId: string, direction: 'up' | 'down') {
    void run(
      () =>
        axios.post(`${basePath}/photos/${encodeURIComponent(photoId)}/move`, {
          direction,
        }),
      'Order updated.',
    );
  }

  function removePhoto() {
    const photoId = photoToRemove;
    setPhotoToRemove(null);

    if (!photoId) return;

    void run(
      () => axios.delete(`${basePath}/photos/${encodeURIComponent(photoId)}`),
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
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p role="alert" className="text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <Input
            id="description"
            {...register('description', {
              setValueAs: (v: string) => (v.trim() === '' ? null : v),
            })}
          />
          {errors.description && (
            <p role="alert" className="text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
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
            {...register('price', {
              setValueAs: (v: string) => (v === '' ? null : Number(v)),
            })}
          />
          {errors.price && (
            <p role="alert" className="text-sm text-red-600">
              {errors.price.message}
            </p>
          )}
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
                onClick={() => setPhotoToRemove(photo.id)}
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

      <Dialog
        open={photoToRemove !== null}
        onOpenChange={(open) => !open && setPhotoToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this photo?</DialogTitle>
            <DialogDescription>
              The photo is deleted from the wig and from storage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={removePhoto}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

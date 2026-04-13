'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import UploadImage from '@/src/components/UploadImage';

type WigFormClientProps = {
  onCreateWig: (
    name: string,
    imageUrl: string,
    description: string | null,
    price: number | null,
  ) => Promise<void>;
  successMessage?: boolean;
  errorType?: string;
};

export function WigFormClient({
  onCreateWig,
  successMessage,
  errorType,
}: WigFormClientProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !imageUrl) {
      setError('Name and image are required.');
      return;
    }

    const priceNum = price ? Number(price) : null;
    if (price && Number.isNaN(priceNum)) {
      setError('Price must be a valid number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreateWig(name, imageUrl, description || null, priceNum);

      router.push('/admin/wigs/new?success=1');
      setName('');
      setImageUrl(null);
      setDescription('');
      setPrice('');
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to create wig';
      if (errorMsg === 'missing-fields') {
        setError('Name and image are required.');
      } else if (errorMsg === 'invalid-price') {
        setError('Price must be a valid number.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name *
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wig name"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Wig Image *</label>
        <UploadImage
          endpoint="/api/upload-wig"
          onUpload={setImageUrl}
          placeholder="Drag & drop wig image or click to upload"
          label="Upload Wig Image"
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
          placeholder="Wig description (optional)"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price (optional)
        </label>
        <Input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !imageUrl}>
        {isSubmitting ? 'Adding...' : 'Add Wig'}
      </Button>

      {successMessage && (
        <p className="text-sm text-green-600">Wig added successfully.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {errorType === 'missing-fields' && (
        <p className="text-sm text-red-600">Name and image are required.</p>
      )}
      {errorType === 'invalid-price' && (
        <p className="text-sm text-red-600">Price must be a valid number.</p>
      )}
    </form>
  );
}

'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';
import WigUploader from '@/src/components/uploaders/WigUploader';
import { uploadWigAction } from '@/src/actions/actions';
import { initialWigState } from '@/src/actions/types';

export function WigFormClient() {
  const [state, formAction, isPending] = useActionState(
    uploadWigAction,
    initialWigState,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [state.success]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData(e.currentTarget);
    formData.append('file', selectedFile);
    startTransition(() => formAction(formData));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">
          Name *
        </label>
        <Input id="name" name="name" placeholder="Wig name" required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Wig Image *</label>
        <UploadRulesDialog
          title="Wig image upload rules"
          description="Use a clean wig image so the catalog and try-on results stay accurate."
          rules={[
            'Upload a single wig only, with no person in the image.',
            'Use a front-facing angle on a plain or transparent background.',
            'Avoid collages, screenshots, text overlays, or watermarks.',
            'Use a sharp, well-lit image with visible hairline and ends.',
            'Preferred minimum resolution: 640px on the shortest side.',
          ]}
        />
        <WigUploader
          previewUrl={previewUrl}
          onFileSelect={(file) => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setSelectedFile(file);
            setPreviewUrl(file ? URL.createObjectURL(file) : null);
          }}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="description"
          name="description"
          placeholder="Wig description (optional)"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price (optional)
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
        />
      </div>

      <Button type="submit" disabled={isPending || !selectedFile}>
        {isPending ? 'Adding...' : 'Add Wig'}
      </Button>

      {state.success && (
        <p className="text-sm text-green-600">Wig added successfully.</p>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

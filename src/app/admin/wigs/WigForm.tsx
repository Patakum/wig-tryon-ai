'use client';

import { useActionState, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import UploadRulesDialog from '@/src/components/uploaders/UploadRulesDialog';
import WigUploader from '@/src/components/uploaders/WigUploader';
import { updateWigAction, uploadWigAction } from '@/src/actions/actions';
import { initialWigState } from '@/src/actions/types';
import type { Wig } from '@/src/types';

const FIELDS = [
  { name: 'name', label: 'Name *', placeholder: 'Wig name', required: true },
  {
    name: 'description',
    label: 'Description',
    placeholder: 'Wig description (optional)',
  },
  {
    name: 'price',
    label: 'Price (optional)',
    placeholder: '0.00',
    type: 'number',
    step: '0.01',
    min: '0',
  },
] as const;

// Without `wig` it creates a new one; with `wig` it edits that wig in place.
export function WigForm({ wig }: { wig?: Wig }) {
  const [state, formAction, isPending] = useActionState(
    wig ? updateWigAction.bind(null, wig.id) : uploadWigAction,
    initialWigState,
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    wig?.imageUrl ?? null,
  );

  const selectFile = (next: File | null) => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(next);
    setPreviewUrl(next ? URL.createObjectURL(next) : null);
  };

  return (
    <form
      action={(formData) => {
        if (file) formData.set('file', file);
        formAction(formData);
      }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Wig Image {wig ? '(leave empty to keep the current one)' : '*'}
        </label>
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
        <WigUploader previewUrl={previewUrl} onFileSelect={selectFile} />
      </div>

      {FIELDS.map(({ label, ...input }) => (
        <div key={input.name} className="space-y-1">
          <label htmlFor={input.name} className="text-sm font-medium">
            {label}
          </label>
          <Input
            id={input.name}
            defaultValue={wig?.[input.name] ?? ''}
            {...input}
          />
        </div>
      ))}

      <Button type="submit" disabled={isPending || (!wig && !file)}>
        {isPending ? 'Saving...' : wig ? 'Save changes' : 'Add Wig'}
      </Button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

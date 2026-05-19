import Link from 'next/link';
import { Button } from '@/src/components/ui/button';

interface WigActionButtonsProps {
  wigId: string;
  wigPrice?: number | null;
}

export default function WigActionButtons({
  wigId,
  wigPrice,
}: WigActionButtonsProps) {
  return (
    <div className="fixed flex flex-col items-center justify-center bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 space-y-3">
      <Button
        asChild
        size="lg"
        className="w-1/2 border-[1px] border-gray-800 rounded-full bg-secondary text-black hover:bg-gray-100 transition"
      >
        <Link href={`/instructions?wigId=${wigId}`}>נסי עליך</Link>
      </Button>
      <form className="w-full flex justify-center">
        <Button
          type="submit"
          size="lg"
          formAction={async () => {
            'use server';
            // TODO: implement add to cart
          }}
          className="w-1/2 bg-secondary-foreground rounded-full hover:bg-amber-800 transition"
        >
          הוסיפי לסל {wigPrice && `/ ₪${wigPrice}`}
        </Button>
      </form>
    </div>
  );
}

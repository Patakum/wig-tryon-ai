import FakeProgressBar from './FakeProgressBar';
import WigMarquee from './WigMarquee';

type GenerationLoaderProps = {
  wigImages: string[];
};

export default function GenerationLoader({ wigImages }: GenerationLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-10 overflow-hidden">
      <WigMarquee images={wigImages} direction="left" />

      <div className="flex flex-col items-center gap-4 w-full px-10">
        <p className="text-2xl tracking-[0.3em] font-light">RACHELI</p>
        <FakeProgressBar />
      </div>

      <WigMarquee images={wigImages} direction="right" />
    </div>
  );
}

import MainNav from '@/src/components/MainNav';
import Logo from '@/src/components/Logo';

export default function CatalogHeader() {
  return (
    <header className="bg-accent sticky top-0 z-10">
      <div className="flex items-center justify-between gap-2 py-2 px-4">
        <MainNav />
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-center flex-1 text-gray-800">WIGS</h1>
          <Logo />
        </div>
      </div>
    </header>
  );
}

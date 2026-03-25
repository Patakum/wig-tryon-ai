import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="w-full border-b flex justify-between items-center">
      <span className="font-black text-foreground text-lg">studio</span>
      <div className="ml-auto flex items-center gap-2">
        <AuthButton/>
      </div>
    </header>
  );
}

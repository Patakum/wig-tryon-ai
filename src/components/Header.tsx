import Image from 'next/image';
import AuthButton from './AuthButton';

export default function Header() {
  return (
    <header className="w-full border-b flex justify-between items-center sticky">
      <div className="mr-2 ">
        <AuthButton />
      </div>
      <Image
        src="/icon.png"
        alt="Racheli"
        width={100}
        height={50}
        className="ml-2 font-black text-foreground text-lg"
      />
    </header>
  );
}

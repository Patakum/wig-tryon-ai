import { prisma } from "../lib/prisma";

export default async function Home() {
  const wigs = await prisma.wig.findMany();
  console.log(wigs); 
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      helloworld
    </div>
  );
}

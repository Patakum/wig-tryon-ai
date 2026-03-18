// /app/api/test/route.ts

import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const wigs = await prisma.wig.findMany();

  return Response.json({ wigs });
}
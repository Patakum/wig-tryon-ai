import { NextRequest } from 'next/server';
import { prisma } from '@/src/lib/prisma';
import { requireAdmin } from '@/src/lib/api/auth';
import { ok } from '@/src/lib/api/http';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';

export async function GET(): Promise<Response> {
  try {
    const businessInfo = await prisma.businessInfo.findFirst();
    return ok(businessInfo);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch business information');
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    await requireAdmin();

    const body = await request.json();

    const {
      whatsappNumber,
      phone,
      email,
      address,
      openingHours,
    } = body;

    const existingInfo = await prisma.businessInfo.findFirst();

    let businessInfo;
    if (existingInfo) {
      businessInfo = await prisma.businessInfo.update({
        where: { id: existingInfo.id },
        data: {
          whatsappNumber: whatsappNumber || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          openingHours: openingHours || null,
        },
      });
    } else {
      businessInfo = await prisma.businessInfo.create({
        data: {
          whatsappNumber: whatsappNumber || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          openingHours: openingHours || null,
        },
      });
    }

    return ok(businessInfo);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to save business information');
  }
}

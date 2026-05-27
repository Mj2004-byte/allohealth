import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: params.id },
      });

      if (!reservation) throw new Error('NOT_FOUND');
      if (reservation.status !== 'pending') throw new Error('INVALID_STATUS');

      await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reservedStock" = "reservedStock" - ${reservation.quantity}
        WHERE "productId" = ${reservation.productId}
          AND "warehouseId" = ${reservation.warehouseId};
      `;

      return tx.reservation.update({
        where: { id: params.id },
        data: { status: 'released' },
        include: { product: true, warehouse: true },
      });
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    if (message === 'INVALID_STATUS') return NextResponse.json({ error: 'Reservation cannot be released' }, { status: 400 });
    console.error('POST release error:', error);
    return NextResponse.json({ error: 'Failed to release reservation' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'pending',
        expiresAt: { lt: new Date() },
      },
    });

    let processed = 0;

    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reservedStock" = "reservedStock" - ${reservation.quantity}
          WHERE "productId" = ${reservation.productId}
            AND "warehouseId" = ${reservation.warehouseId}
            AND "reservedStock" >= ${reservation.quantity};
        `;

        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'expired' },
        });
      });

      processed++;
    }

    console.log(`[Cron] Expired ${processed} reservations`);
    return NextResponse.json({ expired: processed, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Cron] Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { addMinutes } from 'date-fns';

const ReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
    }

    const { productId, warehouseId, quantity } = parsed.data;
    const expiryMinutes = parseInt(process.env.RESERVATION_EXPIRY_MINUTES ?? '10', 10);

    const reservation = await prisma.$transaction(
      async (tx) => {
        // Row-level lock: prevents concurrent reservations from overselling
        const inventoryRows = await tx.$queryRaw<
          Array<{ id: string; totalStock: number; reservedStock: number }>
        >`
          SELECT id, "totalStock", "reservedStock"
          FROM "Inventory"
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
          FOR UPDATE;
        `;

        if (inventoryRows.length === 0) {
          throw new Error('INVENTORY_NOT_FOUND');
        }

        const inventory = inventoryRows[0];
        const available = inventory.totalStock - inventory.reservedStock;

        if (available < quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        // Safe to update — we hold the lock
        await tx.$executeRaw`
          UPDATE "Inventory"
          SET "reservedStock" = "reservedStock" + ${quantity}
          WHERE id = ${inventory.id};
        `;

        const newReservation = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: 'pending',
            expiresAt: addMinutes(new Date(), expiryMinutes),
          },
          include: {
            product: true,
            warehouse: true,
          },
        });

        return newReservation;
      },
      { isolationLevel: 'Serializable' }
    );

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: 'Insufficient stock available' }, { status: 409 });
    }
    if (message === 'INVENTORY_NOT_FOUND') {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }

    console.error('POST /api/reservations error:', error);
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 });
  }
}

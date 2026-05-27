import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data safely (order matters because of relations)
    await prisma.reservation.deleteMany().catch(() => {});
    await prisma.inventory.deleteMany().catch(() => {});
    await prisma.product.deleteMany().catch(() => {});
    await prisma.warehouse.deleteMany().catch(() => {});

    // Create warehouses
    const warehouses = await Promise.all([
      prisma.warehouse.create({
        data: {
          name: "Mumbai Central",
          location: "Mumbai, Maharashtra",
        },
      }),
      prisma.warehouse.create({
        data: {
          name: "Delhi North",
          location: "New Delhi, Delhi",
        },
      }),
      prisma.warehouse.create({
        data: {
          name: "Bangalore South",
          location: "Bengaluru, Karnataka",
        },
      }),
    ]);

    // Create products
    const products = await Promise.all([
      prisma.product.create({
        data: {
          name: "iPhone 15 Pro",
          price: 134900,
          description:
            "Titanium design, A17 Pro chip, 48MP camera system",
          category: "Smartphones",
        },
      }),
      prisma.product.create({
        data: {
          name: "MacBook Air M3",
          price: 114900,
          description: "13.6-inch Liquid Retina display, 18-hour battery",
          category: "Laptops",
        },
      }),
      prisma.product.create({
        data: {
          name: "Sony WH-1000XM5",
          price: 29990,
          description:
            "Industry-leading noise cancellation, 30hr battery",
          category: "Audio",
        },
      }),
      prisma.product.create({
        data: {
          name: 'iPad Pro 12.9"',
          price: 112900,
          description: "M2 chip, Liquid Retina XDR, Apple Pencil support",
          category: "Tablets",
        },
      }),
      prisma.product.create({
        data: {
          name: "Apple Watch Ultra 2",
          price: 89900,
          description:
            "Rugged titanium, 60hr battery, precision GPS",
          category: "Wearables",
        },
      }),
      prisma.product.create({
        data: {
          name: "AirPods Pro 2nd Gen",
          price: 24900,
          description:
            "Adaptive Audio, Transparency mode, MagSafe charging",
          category: "Audio",
        },
      }),
    ]);

    // Inventory stock matrix
    const stockMatrix = [
      [3, 8, 1],
      [5, 2, 7],
      [12, 0, 4],
      [6, 3, 9],
      [2, 1, 0],
      [15, 8, 11],
    ];

    // Create inventory
    for (let p = 0; p < products.length; p++) {
      for (let w = 0; w < warehouses.length; w++) {
        await prisma.inventory.create({
          data: {
            productId: products[p].id,
            warehouseId: warehouses[w].id,
            totalStock: stockMatrix[p][w],
            reservedStock: 0,
          },
        });
      }
    }

    console.log(
      `✅ Created ${products.length} products, ${warehouses.length} warehouses`
    );
    console.log("🎉 Seed complete!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

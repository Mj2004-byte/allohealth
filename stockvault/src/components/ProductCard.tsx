'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithStock, WarehouseStock } from '@/types';

interface ProductCardProps {
  product: ProductWithStock;
}

const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: '📱',
  Laptops: '💻',
  Audio: '🎧',
  Tablets: '📋',
  Wearables: '⌚',
  Default: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  Smartphones: 'from-blue-500/20 to-indigo-600/20',
  Laptops: 'from-violet-500/20 to-purple-600/20',
  Audio: 'from-emerald-500/20 to-teal-600/20',
  Tablets: 'from-sky-500/20 to-cyan-600/20',
  Wearables: 'from-amber-500/20 to-orange-600/20',
  Default: 'from-slate-500/20 to-slate-600/20',
};

function StockPill({ available }: { available: number }) {
  if (available === 0) {
    return <span className="stock-pill-red"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" /> Out of stock</span>;
  }
  if (available <= 3) {
    return <span className="stock-pill-yellow"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Only {available} left</span>;
  }
  return <span className="stock-pill-green"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> {available} available</span>;
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const icon = CATEGORY_ICONS[product.category ?? ''] ?? CATEGORY_ICONS.Default;
  const gradientColor = CATEGORY_COLORS[product.category ?? ''] ?? CATEGORY_COLORS.Default;

  const stockedWarehouses = product.inventory.filter((inv) => inv.availableStock > 0);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseStock | null>(
    stockedWarehouses[0] ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOutOfStock = product.totalAvailable === 0;

  const handleReserve = async () => {
    if (!selectedWarehouse) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          warehouseId: selectedWarehouse.warehouseId,
          quantity: 1,
        }),
      });

      if (res.status === 409) {
        setError('Someone just grabbed the last one! Stock unavailable.');
        return;
      }
      if (!res.ok) throw new Error('Reservation failed');

      const data = await res.json();
      router.push(`/reserve/${data.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group glass rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col">
      {/* Card art header */}
      <div className={`relative bg-gradient-to-br ${gradientColor} h-28 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
        />
        <span className="text-5xl animate-float select-none">{icon}</span>

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/30 text-white/60 backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Name & price */}
        <div>
          <h3 className="font-semibold text-base text-white leading-snug group-hover:text-blue-100 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[--text-secondary] text-xs mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          <p className="font-mono font-semibold text-lg text-white mt-2">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Warehouse selector */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[--text-secondary] mb-2">
            Warehouse
          </p>
          <div className="space-y-1.5">
            {product.inventory.map((inv) => (
              <button
                key={inv.warehouseId}
                disabled={inv.availableStock === 0}
                onClick={() => !isOutOfStock && inv.availableStock > 0 && setSelectedWarehouse(inv)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all duration-150
                  ${selectedWarehouse?.warehouseId === inv.warehouseId && inv.availableStock > 0
                    ? 'border-blue-500/50 bg-blue-500/10 text-white'
                    : inv.availableStock === 0
                    ? 'border-white/5 bg-white/2 text-[--text-secondary] opacity-50 cursor-not-allowed'
                    : 'border-white/8 hover:border-white/15 text-[--text-secondary] hover:text-white cursor-pointer bg-white/3'
                  }`}
              >
                <span className="font-medium truncate">{inv.warehouseName}</span>
                <StockPill available={inv.availableStock} />
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-slide-up">
            <span className="text-rose-400 text-xs mt-0.5">⚠</span>
            <p className="text-rose-400 text-xs leading-snug">{error}</p>
          </div>
        )}

        {/* Reserve button */}
        <button
          onClick={handleReserve}
          disabled={isOutOfStock || !selectedWarehouse || loading}
          className={`btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:from-[#3B6EF0] disabled:hover:to-[#2952C8]`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reserving…
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              Reserve · 10 min hold
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

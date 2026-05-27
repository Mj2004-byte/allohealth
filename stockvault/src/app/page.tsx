'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProductWithStock } from '@/types';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';

export default function HomePage() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      if (!silent) setError('Could not load products. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => fetchProducts(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchProducts]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 bg-[#080C18]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,110,240,0.12),transparent)]" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Header lastUpdated={lastUpdated} onRefresh={() => fetchProducts()} />

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-blue-500/20 text-xs text-blue-400 font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: 'ping-dot 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live Inventory · Updates every 30s
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
              <span className="text-gradient">Reserve Before</span>
              <br />
              <span className="text-gradient-blue">It&apos;s Gone</span>
            </h1>

            <p className="text-[--text-secondary] text-lg max-w-xl mx-auto leading-relaxed">
              Real-time stock across Mumbai, Delhi &amp; Bangalore warehouses.
              Your hold lasts 10 minutes — act fast.
            </p>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-[--text-secondary]">
              {[
                { icon: '🔒', label: 'Concurrent-safe locking' },
                { icon: '⚡', label: '10-min hold timer' },
                { icon: '🏭', label: '3 warehouse locations' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl h-72 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="h-full flex flex-col gap-4 p-6">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 bg-white/5 rounded" />
                      <div className="h-3 bg-white/5 rounded w-5/6" />
                    </div>
                    <div className="h-10 bg-white/5 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-rose-400 text-lg font-medium mb-2">{error}</p>
              <button onClick={() => fetchProducts()} className="btn-primary mt-4">
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-[--text-secondary]">No products available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product, i) => (
                <div
                  key={product.id}
                  className="animate-fade-up opacity-0"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

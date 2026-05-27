'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReservationWithDetails } from '@/types';
import CountdownTimer from '@/components/CountdownTimer';
import { format } from 'date-fns';

type PageState = 'loading' | 'active' | 'confirmed' | 'cancelled' | 'expired' | 'error';

export default function ReservePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationWithDetails | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [actionLoading, setActionLoading] = useState<'confirm' | 'cancel' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchReservation = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${params.id}`);
      if (res.status === 404) { setPageState('error'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReservation(data);

      if (data.status === 'confirmed') setPageState('confirmed');
      else if (data.status === 'released') setPageState('cancelled');
      else if (data.status === 'expired' || new Date(data.expiresAt) < new Date()) setPageState('expired');
      else setPageState('active');
    } catch {
      setPageState('error');
    }
  }, [params.id]);

  useEffect(() => { fetchReservation(); }, [fetchReservation]);

  const handleConfirm = async () => {
    setActionLoading('confirm');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reservations/${params.id}/confirm`, { method: 'POST' });
      if (res.status === 410) { setPageState('expired'); return; }
      if (!res.ok) throw new Error('Confirmation failed');
      setPageState('confirmed');
    } catch {
      setErrorMessage('Confirmation failed. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/reservations/${params.id}/release`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setPageState('cancelled');
    } catch {
      setErrorMessage('Could not cancel. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpire = useCallback(async () => {
    setPageState('expired');
    try {
      await fetch(`/api/reservations/${params.id}/release`, { method: 'POST' });
    } catch {}
    setTimeout(() => router.push('/'), 4000);
  }, [params.id, router]);

  // Loading skeleton
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#080C18] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[--text-secondary]">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading reservation…</span>
        </div>
      </div>
    );
  }

  // Terminal states
  if (pageState === 'confirmed' && reservation) {
    return <SuccessScreen reservation={reservation} onHome={() => router.push('/')} />;
  }
  if (pageState === 'cancelled') {
    return <CancelledScreen onHome={() => router.push('/')} />;
  }
  if (pageState === 'expired') {
    return <ExpiredScreen onHome={() => router.push('/')} />;
  }
  if (pageState === 'error' || !reservation) {
    return <ErrorScreen onHome={() => router.push('/')} />;
  }

  // Active reservation
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-[#080C18]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,110,240,0.08),transparent)]" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        {/* Back */}
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-[--text-secondary] hover:text-white text-sm transition-colors mb-8 group">
          <svg className="group-hover:-translate-x-0.5 transition-transform" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to products
        </button>

        <div className="animate-fade-up space-y-4">
          {/* Header */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[--text-secondary] mb-1">Reservation</p>
                <h1 className="text-xl font-bold text-white">{reservation.product.name}</h1>
                <p className="text-[--text-secondary] text-sm mt-1">{reservation.warehouse.name} · {reservation.warehouse.location}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono font-bold text-2xl text-white">
                  ₹{reservation.product.price.toLocaleString('en-IN')}
                </p>
                <p className="text-[--text-secondary] text-xs mt-0.5">for 1 unit</p>
              </div>
            </div>

            <div className="border-t border-white/5 mt-4 pt-4 flex items-center justify-between text-xs text-[--text-secondary]">
              <span>ID: <span className="font-mono text-white/50">{reservation.id.slice(-8).toUpperCase()}</span></span>
              <span>Reserved {format(new Date(reservation.createdAt), 'HH:mm, dd MMM')}</span>
            </div>
          </div>

          {/* Timer */}
          <CountdownTimer expiresAt={reservation.expiresAt} onExpire={handleExpire} />

          {/* Info box */}
          <div className="glass rounded-xl p-4 border border-white/5">
            <p className="text-xs text-[--text-secondary] leading-relaxed">
              💡 This reservation holds <strong className="text-white">1 unit</strong> of stock for you for <strong className="text-white">10 minutes</strong>. Once the timer expires, the stock is released back for others. Confirm to complete your purchase.
            </p>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/25 rounded-xl animate-slide-up">
              <span className="text-rose-400">⚠</span>
              <p className="text-rose-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {actionLoading === 'cancel' ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Cancelling…</>
              ) : (
                'Cancel'
              )}
            </button>
            <button
              onClick={handleConfirm}
              disabled={actionLoading !== null}
              className="btn-success flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {actionLoading === 'confirm' ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Confirming…</>
              ) : (
                <>Confirm Purchase</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ reservation, onHome }: { reservation: ReservationWithDetails; onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#080C18] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 animate-float">
          <span className="text-4xl">🎉</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Purchase Confirmed!</h2>
        <p className="text-[--text-secondary] text-sm mb-1">
          <strong className="text-white">{reservation.product.name}</strong>
        </p>
        <p className="text-[--text-secondary] text-sm mb-5">
          Dispatching from {reservation.warehouse.name}
        </p>
        <div className="glass rounded-xl px-5 py-3 mb-6 inline-block">
          <span className="font-mono text-emerald-400 font-semibold">
            Order #{reservation.id.slice(-8).toUpperCase()}
          </span>
        </div>
        <div>
          <button onClick={onHome} className="btn-primary">
            Browse More Products
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelledScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#080C18] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-slate-500/15 border border-slate-500/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">✕</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Reservation Cancelled</h2>
        <p className="text-[--text-secondary] text-sm mb-6">Stock has been released back to inventory.</p>
        <button onClick={onHome} className="btn-primary">Back to Products</button>
      </div>
    </div>
  );
}

function ExpiredScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#080C18] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">⏱</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Reservation Expired</h2>
        <p className="text-[--text-secondary] text-sm mb-2">Your 10-minute hold ran out.</p>
        <p className="text-[--text-secondary] text-sm mb-6">Stock is now available for others.</p>
        <button onClick={onHome} className="btn-primary">Try Again</button>
      </div>
    </div>
  );
}

function ErrorScreen({ onHome }: { onHome: () => void }) {
  return (
    <div className="min-h-screen bg-[#080C18] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center animate-fade-up">
        <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Reservation Not Found</h2>
        <p className="text-[--text-secondary] text-sm mb-6">This reservation may have expired or doesn&apos;t exist.</p>
        <button onClick={onHome} className="btn-primary">Back to Products</button>
      </div>
    </div>
  );
}

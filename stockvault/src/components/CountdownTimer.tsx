'use client';

import { useEffect, useState, useCallback } from 'react';
import { differenceInSeconds } from 'date-fns';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const getSecondsLeft = useCallback(() => {
    return Math.max(0, differenceInSeconds(new Date(expiresAt), new Date()));
  }, [expiresAt]);

  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const s = getSecondsLeft();
      setSecondsLeft(s);
      if (s <= 0 && !expired) {
        setExpired(true);
        onExpire();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [getSecondsLeft, onExpire, expired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  const pct = Math.max(0, secondsLeft / (10 * 60));
  const isRed = secondsLeft < 60;
  const isYellow = secondsLeft < 3 * 60 && !isRed;

  const color = isRed
    ? { ring: 'stroke-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' }
    : isYellow
    ? { ring: 'stroke-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10' }
    : { ring: 'stroke-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' };

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className={`flex flex-col items-center gap-3 p-6 rounded-2xl ${color.bg} border border-white/10`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-[--text-secondary]">
        Reservation expires in
      </p>

      {/* SVG ring timer */}
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            className={`${color.ring} transition-all duration-1000`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold text-4xl tracking-tight ${color.text} ${isRed ? 'animate-timer-pulse' : ''}`}>
            {mm}:{ss}
          </span>
          <span className="text-[10px] text-[--text-secondary] mt-0.5 uppercase tracking-wider">remaining</span>
        </div>
      </div>

      {isRed && !expired && (
        <p className="text-xs text-rose-400 font-medium animate-timer-pulse">
          ⚡ Hurry! Almost expired
        </p>
      )}
    </div>
  );
}

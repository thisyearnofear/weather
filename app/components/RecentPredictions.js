'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

export default function RecentPredictions({ chainId = 56, isNight = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/predictions/health?chainId=${chainId}&lookback=3000&chunk=500&max=5`);
        const json = await res.json();
        if (json.success) {
          setEvents(json.recentEvents || []);
        } else {
          setError(json.error || 'Failed to load');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    load();
  }, [chainId]);

  const textColor = isNight ? 'text-white' : 'text-black';
  const cardBgColor = isNight ? 'bg-slate-900/60 border-white/20' : 'bg-white/60 border-black/20';

  return (
    <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6`}>
      <h3 className={`text-sm font-light ${textColor} mb-3`}>Recent Predictions</h3>
      {loading && (
        <div className={`text-xs ${textColor} opacity-70`}>Loading...</div>
      )}
      {error && (
        <div className={`text-xs ${textColor} opacity-70`}>{error}</div>
      )}
      {!loading && !error && events.length === 0 && (
        <div className={`text-xs ${textColor} opacity-60`}>No recent events</div>
      )}
      <div className="space-y-3">
        {events.map((e) => (
          <div key={`${e.txHash}-${e.id}`} className={`text-xs ${textColor} opacity-80 flex justify-between items-center`}>
            <div className="space-y-0.5">
              <div>Market {e.marketId} · {e.side}</div>
              <div className="opacity-60">Stake {ethers.formatEther(BigInt(e.stakeWei))} BNB · {String(e.user).slice(0,6)}…{String(e.user).slice(-4)}</div>
            </div>
            <a href={`https://bscscan.com/tx/${e.txHash}`} target="_blank" rel="noreferrer" className="opacity-70 underline">View</a>
          </div>
        ))}
      </div>
    </div>
  );
}
'use client';

import React from 'react';

export default function MarketSelector({
  markets,
  selectedMarket,
  onSelectMarket,
  isNight,
  isLoading,
  onAnalyze
}) {
  if (isLoading || !markets || markets.length === 0) {
    return null;
  }

  const textColor = isNight ? 'text-white' : 'text-black';
  const bgColor = isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';
  const hoverBgColor = isNight ? 'hover:bg-white/10' : 'hover:bg-black/10';
  const activeBgColor = isNight ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-400/20 border-blue-500/30';
  const buttonBgColor = isNight 
    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40' 
    : 'bg-gradient-to-r from-blue-400/30 to-purple-400/30 hover:from-blue-400/40 hover:to-purple-400/40';
  const buttonTextColor = isNight ? 'text-blue-200' : 'text-blue-800';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className={`text-2xl font-thin ${textColor} tracking-wide`}>
          Available Markets
        </h3>
        <p className={`text-sm ${textColor} opacity-60 mt-2 font-light`}>
          {markets.length} weather-sensitive opportunity{markets.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
        {markets.map((market, index) => (
          <button
            key={market.marketID || index}
            onClick={() => onSelectMarket(market)}
            className={`w-full p-4 rounded-2xl border backdrop-blur-sm transition-all text-center duration-200 ${
              selectedMarket?.marketID === market.marketID
                ? activeBgColor
                : `${bgColor} ${hoverBgColor}`
            }`}
          >
            {/* Title */}
            <div className={`${textColor} font-light line-clamp-2 text-sm mb-3 tracking-wide`}>
              {market.title || 'Unnamed Market'}
            </div>

            {/* Tags */}
            {market.tags && market.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-3">
                {market.tags.slice(0, 2).map((tag, idx) => {
                  const tagLabel = typeof tag === 'string' ? tag : (tag.label || '');
                  return (
                    <span key={idx} className={`text-xs px-2.5 py-1 rounded-full font-light ${
                      isNight ? 'bg-purple-500/20 text-purple-200 border border-purple-500/20' : 'bg-purple-400/20 text-purple-800 border border-purple-400/20'
                    }`}>
                      {tagLabel}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Stats Grid - Enhanced with edge scores and proper bid/ask */}
            <div className={`${textColor} opacity-70 text-xs space-y-2 font-light`}>
              {/* Row 1: Volume & Bid/Ask or Edge Score */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <span className="opacity-50 text-xs block">Volume</span>
                  <div className="font-light">${(market.volume24h / 1000 || 0).toFixed(0)}K</div>
                </div>
                {market.oddsAnalysis?.bestBid !== undefined && market.oddsAnalysis?.bestBid !== null ? (
                  <div className="text-center">
                    <span className="opacity-50 text-xs block">Bid/Ask</span>
                    <div className="font-light">
                      {(market.oddsAnalysis.bestBid * 100).toFixed(1)}%/{(market.oddsAnalysis.bestAsk * 100).toFixed(1)}%
                    </div>
                  </div>
                ) : market.currentOdds?.yes ? (
                  <div className="text-center">
                    <span className="opacity-50 text-xs block">Mid Price</span>
                    <div className="font-light">{(market.currentOdds.yes * 100).toFixed(1)}%</div>
                  </div>
                ) : null}
              </div>
              
              {/* Row 2: Edge Score & Confidence */}
              {market.edgeScore !== undefined && market.confidence && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <span className="opacity-50 text-xs block">Edge Score</span>
                    <div className={`font-light ${
                      market.confidence === 'HIGH' ? 'text-green-400' :
                      market.confidence === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {market.edgeScore.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="opacity-50 text-xs block">Confidence</span>
                    <div className={`font-light ${
                      market.confidence === 'HIGH' ? 'text-green-400' :
                      market.confidence === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {market.confidence}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedMarket && (
        <button
          onClick={() => onAnalyze(selectedMarket)}
          className={`w-full py-3 rounded-2xl font-light text-sm transition-all duration-300 border ${buttonBgColor} ${buttonTextColor} ${
            isNight ? 'border-blue-400/30 hover:scale-105' : 'border-blue-500/30 hover:scale-105'
          }`}
        >
          Analyze This Market
        </button>
      )}
    </div>
  );
}

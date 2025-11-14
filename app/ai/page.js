'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { weatherService } from '@/services/weatherService';
import { aiService } from '@/services/aiService';
import MarketSelector from './components/MarketSelector';
import AnalysisDisplay from './components/AnalysisDisplay';
import OrderForm from './components/OrderForm';
import PageNav from '@/app/components/PageNav';

export default function AIPage() {
  const { address, isConnected } = useAccount();

  // Weather state
  const [weatherData, setWeatherData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Market state
  const [markets, setMarkets] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [marketFilters, setMarketFilters] = useState({
    eventType: 'all',
    confidence: 'all'
  });

  // Analysis state
  const [analysis, setAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // UI state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  // Load weather on mount
  useEffect(() => {
    loadWeather();
  }, []);

  // Fetch markets when weather loads or filters change
  useEffect(() => {
    if (weatherData) {
      fetchMarkets();
    }
  }, [weatherData, marketFilters]);



  const loadWeather = async () => {
    setIsLoadingWeather(true);
    try {
      const location = await weatherService.getCurrentLocation();
      const data = await weatherService.getCurrentWeather(location);
      setWeatherData(data);
      setCurrentLocation(`${data.location.name}, ${data.location.region}`);
      setError(null);
    } catch (err) {
      // Fallback to default location
      try {
        const data = await weatherService.getCurrentWeather('Nairobi');
        setWeatherData(data);
        setCurrentLocation(`${data.location.name}, ${data.location.region}`);
        setError(null);
      } catch (fallbackErr) {
        setError('Unable to load weather data');
      }
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const fetchMarkets = async () => {
    if (!weatherData) return;
    setIsLoadingMarkets(true);
    setError(null);

    try {
      // Call edge-ranked discovery with user filters
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weatherData,
          location: weatherData?.location?.name || null,
          eventType: marketFilters.eventType,
          confidence: marketFilters.confidence,
          limitCount: 12 // Fetch more to show when filters reduce results
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMarkets(result.markets);
        if (result.markets.length > 0) {
          setSelectedMarket(result.markets[0]);
        } else {
          setError('No weather-sensitive markets found. Try adjusting filters.');
        }
      } else {
        setError(result.error || 'Failed to fetch markets');
      }
    } catch (err) {
      console.error('Market fetch failed:', err);
      setError('Unable to fetch markets');
    } finally {
      setIsLoadingMarkets(false);
    }
  };

  const analyzeMarket = async (market = null) => {
    const marketToAnalyze = market || selectedMarket;
    if (!marketToAnalyze || !weatherData) return;
    setIsLoadingAnalysis(true);
    setError(null);
    setAnalysis(null);

    const result = await aiService.analyzeMarket(marketToAnalyze, weatherData);
    console.log('🎯 Full analysis result:', result);

    if (result.success) {
      // Always use the full result object structure for backward compatibility
      const analysisData = {
        assessment: result.assessment || {},
        analysis: result.reasoning || result.analysis || 'No analysis available',
        key_factors: result.key_factors || [],
        recommended_action: result.recommended_action || 'Monitor manually',
        cached: result.cached || false,
        source: result.source || 'unknown',
        timestamp: result.timestamp
      };

      console.log('✅ Analysis data structure:', {
        hasAssessment: !!analysisData.assessment,
        hasAnalysis: !!analysisData.analysis,
        hasKeyFactors: !!analysisData.key_factors,
        recommendedAction: analysisData.recommended_action,
        reasoningLength: analysisData.analysis?.length
      });

      setAnalysis(analysisData);
    } else {
      console.log('❌ Analysis failed:', result.error);
      setError(result.error);
    }
    setIsLoadingAnalysis(false);
  };

  const handleSelectMarket = (market) => {
    setSelectedMarket(market);
    setAnalysis(null);
  };

  const handleAnalyzeMarket = (market) => {
    console.log('🧠 Analyzing market:', market.title, market.marketID);
    setSelectedMarket(market);
    analyzeMarket(market);
  };

  const handleOrderSuccess = (result) => {
    setOrderResult(result);
    setShowOrderForm(false);
    setTimeout(() => setOrderResult(null), 5000);
  };

  const isNight = useMemo(() => {
    if (!weatherData?.location?.localtime) return false;
    const localTime = weatherData.location.localtime;
    const currentHour = new Date(localTime).getHours();
    return currentHour >= 19 || currentHour <= 6;
  }, [weatherData?.location?.localtime]);

  const textColor = isNight ? 'text-white' : 'text-black';
  const bgColor = isNight ? 'bg-black' : 'bg-white';
  const cardBgColor = isNight ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';

  if (isLoadingWeather) {
    return (
      <div className={`w-screen h-screen flex items-center justify-center ${bgColor}`}>
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 border-4 border-current/30 border-t-current rounded-full animate-spin ${textColor} mb-4`}></div>
          <p className={`${textColor} font-light`}>Loading weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${cardBgColor} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-thin ${textColor} tracking-wide`}>
              Weather Edge Analysis
            </h1>
            <p className={`text-sm ${textColor} opacity-60 mt-2 font-light`}>
              {currentLocation}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <PageNav currentPage="AI" isNight={isNight} />
            <ConnectKitButton mode="dark" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filter Controls */}
        <div className={`${cardBgColor} border rounded-lg p-4 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <label className={`${textColor} text-xs opacity-60 block mb-2`}>Event Type</label>
              <select
                value={marketFilters.eventType}
                onChange={(e) => setMarketFilters(prev => ({ ...prev, eventType: e.target.value }))}
                className={`w-full px-3 py-2 text-sm rounded border ${
                  isNight 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-black/10 border-black/20 text-black'
                }`}
              >
                <option value="all">All Types</option>
                <option value="NFL">NFL</option>
                <option value="NBA">NBA</option>
                <option value="Weather">Weather</option>
                <option value="Politics">Politics</option>
              </select>
            </div>
            <div className="flex-1">
              <label className={`${textColor} text-xs opacity-60 block mb-2`}>Confidence</label>
              <select
                value={marketFilters.confidence}
                onChange={(e) => setMarketFilters(prev => ({ ...prev, confidence: e.target.value }))}
                className={`w-full px-3 py-2 text-sm rounded border ${
                  isNight 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-black/10 border-black/20 text-black'
                }`}
              >
                <option value="all">All Confidence</option>
                <option value="HIGH">High Only</option>
                <option value="MEDIUM">Medium+</option>
                <option value="LOW">Low+</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className={`${textColor} text-sm`}>{error}</p>
            <button
              onClick={loadWeather}
              className="mt-3 px-3 py-1 text-xs bg-red-500/30 hover:bg-red-500/50 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Markets - Full Width */}
          <div className={`${cardBgColor} border rounded-lg p-6`}>
            {isLoadingMarkets ? (
              <div className="flex justify-center py-12">
                <div className={`w-8 h-8 border-2 border-current/30 border-t-current rounded-full animate-spin ${textColor}`}></div>
                <p className={`${textColor} opacity-70 mt-3 text-sm`}>Finding markets...</p>
              </div>
            ) : (
              <MarketSelector
                markets={markets}
                selectedMarket={selectedMarket}
                onSelectMarket={handleSelectMarket}
                onAnalyze={handleAnalyzeMarket}
                isNight={isNight}
                isLoading={isLoadingMarkets}
              />
            )}
          </div>

          {/* Analysis & Trading - Full Width Below */}
          <div className="space-y-6">
            {/* Analysis Display */}
            {isLoadingAnalysis ? (
              <div className={`${cardBgColor} border rounded-lg p-8 flex justify-center`}>
                <div className={`w-6 h-6 border-2 border-current/30 border-t-current rounded-full animate-spin ${textColor}`}></div>
              </div>
            ) : analysis ? (
              <div className={`${cardBgColor} border rounded-lg p-6`}>
                <AnalysisDisplay
                  analysis={analysis}
                  selectedMarket={selectedMarket}
                  isNight={isNight}
                  onTrade={() => setShowOrderForm(!showOrderForm)}
                />
              </div>
            ) : selectedMarket ? (
              <div className={`${cardBgColor} border rounded-lg p-8 text-center`}>
                <p className={`${textColor} opacity-60 text-sm mb-2`}>
                  Ready to analyze this market?
                </p>
                <p className={`${textColor} opacity-40 text-xs`}>
                  Click "Analyze This Market" to get AI insights
                </p>
              </div>
            ) : (
              <div className={`${cardBgColor} border rounded-lg p-8 text-center`}>
                <p className={`${textColor} opacity-60 text-sm mb-2`}>
                  No market selected
                </p>
                <p className={`${textColor} opacity-40 text-xs`}>
                  Choose a market from the left to begin
                </p>
              </div>
            )}

            {/* Order Form */}
            {showOrderForm && selectedMarket && (
              <div className={`${cardBgColor} border rounded-lg p-6`}>
                <h3 className={`text-lg font-light ${textColor} mb-4`}>
                  Place Order - {selectedMarket.title}
                </h3>
                <OrderForm
                  market={selectedMarket}
                  walletAddress={address}
                  isConnected={isConnected}
                  onSuccess={handleOrderSuccess}
                  isNight={isNight}
                />
              </div>
            )}

            {/* Order Success */}
            {orderResult?.success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <p className={`text-sm ${textColor}`}>
                  Order submitted successfully! ID: {orderResult.orderID}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

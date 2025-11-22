'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { weatherService } from '@/services/weatherService';
import PageNav from '@/app/components/PageNav';
import Scene3D from '@/components/Scene3D';

export default function MarketsPage() {
    const { address, isConnected } = useAccount();

    // Tab state: 'sports' or 'discovery'
    const [activeTab, setActiveTab] = useState('sports');

    // Weather state (for UI theming and discovery mode)
    const [weatherData, setWeatherData] = useState(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    // Market state (shared across tabs)
    const [markets, setMarkets] = useState(null);
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);

    // Analysis state (shared across tabs)
    const [analysis, setAnalysis] = useState(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [analysisMode, setAnalysisMode] = useState('basic');

    // Sports-specific filters
    const [sportsFilters, setSportsFilters] = useState({
        eventType: 'Soccer',
        confidence: 'MEDIUM',
        bestEdgesOnly: true
    });
    const [sportsSearchText, setSportsSearchText] = useState('');
    const [sportsMaxDays, setSportsMaxDays] = useState(7);
    const [sportsMinVolume, setSportsMinVolume] = useState(10000);
    const [includeFutures, setIncludeFutures] = useState(false);

    // Discovery-specific filters
    const [discoveryFilters, setDiscoveryFilters] = useState({
        category: 'all',
        minVolume: '50000',
        search: ''
    });
    const [discoverySearchQuery, setDiscoverySearchQuery] = useState('');

    // UI state
    const [error, setError] = useState(null);
    const [expandedMarketId, setExpandedMarketId] = useState(null);
    const [isNight, setIsNight] = useState(() => {
        const hour = new Date().getHours();
        return hour >= 19 || hour <= 6;
    });

    // Load weather on mount
    useEffect(() => {
        loadWeather();
    }, []);

    // Fetch markets when tab changes or filters change (NOT on search text change - explicit search only)
    useEffect(() => {
        if (weatherData) {
            fetchMarkets();
        }
    }, [activeTab, sportsFilters, sportsMaxDays, sportsMinVolume, includeFutures]);

    const loadWeather = async () => {
        setIsLoadingWeather(true);
        try {
            const location = await weatherService.getCurrentLocation();
            const data = await weatherService.getCurrentWeather(location);
            setWeatherData(data);

            // Update theme
            if (data?.location?.localtime) {
                const currentHour = new Date(data.location.localtime).getHours();
                setIsNight(currentHour >= 19 || currentHour <= 6);
            }
            setError(null);
        } catch (err) {
            try {
                const data = await weatherService.getCurrentWeather('Nairobi');
                setWeatherData(data);
                setError(null);
            } catch (fallbackErr) {
                console.warn('Unable to load weather:', fallbackErr.message);
                setError(null);
            }
        } finally {
            setIsLoadingWeather(false);
        }
    };

    const fetchMarkets = async () => {
        setIsLoadingMarkets(true);
        setError(null);

        try {
            const isSportsMode = activeTab === 'sports';

            const response = await fetch('/api/markets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    isSportsMode
                        ? {
                            // Sports mode: event-weather analysis
                            weatherData: null,
                            location: null,
                            eventType: sportsFilters.eventType,
                            confidence: sportsFilters.confidence,
                            limitCount: 50, // Increased from 12 to get more results after filtering
                            excludeFutures: !includeFutures,
                            searchText: sportsSearchText,
                            maxDaysToResolution: sportsMaxDays,
                            minVolume: sportsMinVolume,
                            analysisType: 'event-weather',
                            theme: sportsFilters.eventType === 'Sports' ? 'sports' : undefined
                        }
                        : {
                            // Discovery mode: global market browsing
                            location: null,
                            eventType: discoveryFilters.category === 'all' ? 'all' : discoveryFilters.category,
                            confidence: 'all',
                            limitCount: 50,
                            searchText: discoveryFilters.search || null,
                            theme: 'all',
                            minVolume: parseInt(discoveryFilters.minVolume),
                            analysisType: 'discovery',
                            weatherData: null
                        }
                )
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                if (Array.isArray(result.markets) && result.markets.length > 0) {
                    setMarkets(result.markets);
                    setSelectedMarket(result.markets[0]);
                } else {
                    setMarkets([]);
                    setError('No markets found. Try adjusting filters.');
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

    const analyzeMarket = async (market, mode = analysisMode) => {
        if (!market || !weatherData) return;
        setIsLoadingAnalysis(true);
        setError(null);
        setAnalysis(null);
        setSelectedMarket(market);
        setExpandedMarketId(market.marketID || market.id || market.tokenID);

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: market.eventType || market.title || 'Market',
                    title: market.title || market.question,
                    location: market.location || market.eventLocation || (weatherData?.location?.name || ''),
                    weatherData,
                    currentOdds: market.currentOdds || (
                        (market.bid !== undefined && market.ask !== undefined)
                            ? { yes: Number(market.ask), no: Number(market.bid) }
                            : null
                    ),
                    participants: market.teams || [],
                    marketID: market.marketID || market.id || market.tokenID,
                    eventDate: market.resolutionDate || market.expiresAt || null,
                    mode
                })
            });

            const data = await response.json();

            if (data.success) {
                setAnalysis(data);
            } else {
                setError(data.error || 'Analysis failed');
            }
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('Failed to analyze market');
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const handlePublishSignal = async () => {
        if (!selectedMarket || !analysis) return;

        try {
            const response = await fetch('/api/signals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    market: selectedMarket,
                    analysis,
                    weather: weatherData,
                    authorAddress: address
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Signal published successfully!');
            } else {
                alert('Failed to publish signal: ' + result.error);
            }
        } catch (err) {
            console.error('Failed to publish signal:', err);
            alert('Failed to publish signal');
        }
    };

    const textColor = isNight ? 'text-white' : 'text-black';
    const bgColor = 'bg-black';
    const cardBgColor = isNight ? 'bg-slate-900/60 border-white/20' : 'bg-white/60 border-black/20';

    if (isLoadingWeather) {
        return (
            <div className={`w-screen h-screen flex items-center justify-center ${bgColor}`}>
                <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 border-4 border-current/30 border-t-current rounded-full animate-spin ${textColor} mb-4`}></div>
                    <p className={`${textColor} font-light`}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            {/* 3D Scene Background */}
            <div className="fixed inset-0 z-0">
                <Scene3D
                    weatherData={weatherData}
                    isLoading={isLoadingWeather}
                    quality="ambient"
                />
            </div>

            {/* Scrollable Content */}
            <div className="relative z-20 flex flex-col min-h-screen overflow-y-auto">
                {/* Header */}
                <header className={`sticky top-0 z-50 border-b ${cardBgColor} backdrop-blur-md`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex justify-between items-center">
                        <div>
                            <h1 className={`text-3xl font-thin ${textColor} tracking-wide`}>
                                Markets
                            </h1>
                            <p className={`text-sm ${textColor} opacity-60 mt-2 font-light`}>
                                {activeTab === 'sports'
                                    ? 'Event weather analysis for sports markets'
                                    : 'Discover high-volume prediction markets globally'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <PageNav currentPage="Markets" isNight={isNight} />
                            <div className="hidden sm:flex items-center ml-2">
                                <label className={`${textColor} text-xs opacity-70 mr-2`}>Analysis Mode</label>
                                <select
                                    value={analysisMode}
                                    onChange={(e) => setAnalysisMode(e.target.value)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}
                                >
                                    <option value="basic">Basic (Free)</option>
                                    <option value="deep">Deep (Research)</option>
                                </select>
                            </div>
                            <ConnectKitButton mode={isNight ? "dark" : "light"} />
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4">
                        <div className={`inline-flex rounded-2xl p-1 border ${cardBgColor} backdrop-blur-xl`}>
                            <button
                                onClick={() => setActiveTab('sports')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-light transition-all ${activeTab === 'sports'
                                    ? (isNight ? 'bg-blue-500/30 text-white border border-blue-400/40' : 'bg-blue-400/30 text-black border border-blue-500/40')
                                    : `${textColor} opacity-60 hover:opacity-100`
                                    }`}
                            >
                                ⚽ Sports (Event Weather)
                            </button>
                            <button
                                onClick={() => setActiveTab('discovery')}
                                className={`px-6 py-2.5 rounded-xl text-sm font-light transition-all ${activeTab === 'discovery'
                                    ? (isNight ? 'bg-purple-500/30 text-white border border-purple-400/40' : 'bg-purple-400/30 text-black border border-purple-500/40')
                                    : `${textColor} opacity-60 hover:opacity-100`
                                    }`}
                            >
                                🔍 All Markets (Discovery)
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1">
                    {/* Sports Tab Content */}
                    {activeTab === 'sports' && (
                        <SportsTabContent
                            markets={markets}
                            isLoading={isLoadingMarkets}
                            error={error}
                            filters={sportsFilters}
                            setFilters={setSportsFilters}
                            searchText={sportsSearchText}
                            setSearchText={setSportsSearchText}
                            maxDays={sportsMaxDays}
                            setMaxDays={setSportsMaxDays}
                            minVolume={sportsMinVolume}
                            setMinVolume={setSportsMinVolume}
                            includeFutures={includeFutures}
                            setIncludeFutures={setIncludeFutures}
                            onAnalyze={analyzeMarket}
                            isNight={isNight}
                            textColor={textColor}
                            cardBgColor={cardBgColor}
                            expandedMarketId={expandedMarketId}
                            setExpandedMarketId={setExpandedMarketId}
                            analysis={analysis}
                            isAnalyzing={isLoadingAnalysis}
                            selectedMarket={selectedMarket}
                            onPublishSignal={handlePublishSignal}
                            analysisMode={analysisMode}
                        />
                    )}

                    {/* Discovery Tab Content */}
                    {activeTab === 'discovery' && (
                        <DiscoveryTabContent
                            markets={markets}
                            isLoading={isLoadingMarkets}
                            error={error}
                            filters={discoveryFilters}
                            setFilters={setDiscoveryFilters}
                            searchQuery={discoverySearchQuery}
                            setSearchQuery={setDiscoverySearchQuery}
                            onAnalyze={analyzeMarket}
                            isNight={isNight}
                            textColor={textColor}
                            cardBgColor={cardBgColor}
                            expandedMarketId={expandedMarketId}
                            setExpandedMarketId={setExpandedMarketId}
                            analysis={analysis}
                            isAnalyzing={isLoadingAnalysis}
                            selectedMarket={selectedMarket}
                            onPublishSignal={handlePublishSignal}
                            fetchMarkets={fetchMarkets}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

// Sports Tab Component (reuses sports page logic)
function SportsTabContent({
    markets, isLoading, error, filters, setFilters, searchText, setSearchText,
    maxDays, setMaxDays, minVolume, setMinVolume, includeFutures, setIncludeFutures,
    onAnalyze, isNight, textColor, cardBgColor, expandedMarketId, setExpandedMarketId,
    analysis, isAnalyzing, selectedMarket, onPublishSignal, analysisMode
}) {
    const [pendingSearch, setPendingSearch] = React.useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchText(pendingSearch);
    };

    return (
        <div className="space-y-6">
            {/* Filters - Compact version from sports page */}
            <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-4`}>
                <div className="space-y-3">
                    {/* Event Type */}
                    <div>
                        <label className={`${textColor} text-xs opacity-60 block mb-1`}>Event Type</label>
                        <select
                            value={filters.eventType}
                            onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}
                        >
                            <option value="all">All Supported Sports</option>
                            <option value="Soccer">⚽ Soccer</option>
                            <option value="NFL">🏈 NFL</option>
                            <option value="F1">🏎️ Formula 1</option>
                        </select>
                    </div>

                    {/* Search with Button */}
                    <div>
                        <label className={`${textColor} text-xs opacity-60 block mb-1`}>Search Events</label>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={pendingSearch}
                                onChange={(e) => setPendingSearch(e.target.value)}
                                placeholder="e.g., Chiefs, Liverpool, Arrowhead Stadium"
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white placeholder-white/50' : 'bg-black/10 border-black/20 text-black placeholder-black/50'}`}
                            />
                            <button
                                type="submit"
                                className={`px-4 py-2 text-sm rounded-lg border transition-all ${isNight ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-400/30' : 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-800 border-blue-500/30'}`}
                            >
                                Search
                            </button>
                        </form>
                        {searchText && (
                            <button
                                onClick={() => { setSearchText(''); setPendingSearch(''); }}
                                className={`mt-1 text-xs ${textColor} opacity-60 hover:opacity-100`}
                            >
                                Clear search
                            </button>
                        )}
                    </div>

                    {/* Min Volume */}
                    <div>
                        <label className={`${textColor} text-xs opacity-60 block mb-1`}>Min Volume</label>
                        <select
                            value={String(minVolume)}
                            onChange={(e) => setMinVolume(parseInt(e.target.value))}
                            className={`w-full px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}
                        >
                            <option value="10000">$10k+</option>
                            <option value="50000">$50k+</option>
                            <option value="100000">$100k+</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Markets List */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className={`w-6 h-6 border-2 ${isNight ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'} rounded-full animate-spin`}></div>
                    <span className={`ml-3 ${textColor} opacity-70`}>Loading markets...</span>
                </div>
            )}

            {error && (
                <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6 text-center`}>
                    <p className={`${textColor} opacity-90`}>{error}</p>
                </div>
            )}

            {!isLoading && !error && markets && markets.length > 0 && (
                <div className="space-y-4">
                    {markets.map((market, index) => (
                        <MarketCard
                            key={market.marketID || market.id || index}
                            market={market}
                            onAnalyze={onAnalyze}
                            isNight={isNight}
                            textColor={textColor}
                            cardBgColor={cardBgColor}
                            isExpanded={expandedMarketId === (market.marketID || market.id || market.tokenID)}
                            setExpandedMarketId={setExpandedMarketId}
                            analysis={analysis}
                            isAnalyzing={isAnalyzing}
                            selectedMarket={selectedMarket}
                            onPublishSignal={onPublishSignal}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Discovery Tab Component (reuses discovery page logic)
function DiscoveryTabContent({
    markets, isLoading, error, filters, setFilters, searchQuery, setSearchQuery,
    onAnalyze, isNight, textColor, cardBgColor, expandedMarketId, setExpandedMarketId,
    analysis, isAnalyzing, selectedMarket, onPublishSignal, fetchMarkets
}) {
    const handleSearch = async (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setFilters(prev => ({ ...prev, search: searchQuery.trim() }));
            setSearchQuery('');
        }
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6`}>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search markets by name, team, or keyword..."
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-light ${isNight ? 'bg-white/10 border border-white/20 text-white placeholder-white/50' : 'bg-black/10 border border-black/20 text-black placeholder-black/50'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                        disabled={isLoading}
                    />
                    <select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-light ${isNight ? 'bg-white/10 border border-white/20 text-white' : 'bg-black/10 border border-black/20 text-black'}`}
                        disabled={isLoading}
                    >
                        <option value="all">All Categories</option>
                        <option value="Sports">⚽ Sports</option>
                        <option value="Politics">🏛️ Politics</option>
                        <option value="Crypto">₿ Crypto</option>
                    </select>
                    <select
                        value={filters.minVolume}
                        onChange={(e) => setFilters(prev => ({ ...prev, minVolume: e.target.value }))}
                        className={`px-4 py-2.5 rounded-xl text-sm font-light ${isNight ? 'bg-white/10 border border-white/20 text-white' : 'bg-black/10 border border-black/20 text-black'}`}
                        disabled={isLoading}
                    >
                        <option value="10000">$10k+ Volume</option>
                        <option value="50000">$50k+ Volume</option>
                        <option value="100000">$100k+ Volume</option>
                    </select>
                    <button
                        type="submit"
                        disabled={!searchQuery.trim() || isLoading}
                        className={`px-8 py-2.5 rounded-xl text-sm font-light transition-all disabled:opacity-40 border ${isNight ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-400/30' : 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-800 border-blue-500/30'}`}
                    >
                        Search
                    </button>
                </form>
            </div>

            {/* Markets List */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className={`w-6 h-6 border-2 ${isNight ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'} rounded-full animate-spin`}></div>
                    <span className={`ml-3 ${textColor} opacity-70`}>Loading markets...</span>
                </div>
            )}

            {error && (
                <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6 text-center`}>
                    <p className={`${textColor} opacity-90 mb-4`}>{error}</p>
                    <button
                        onClick={fetchMarkets}
                        className={`px-4 py-2 rounded-lg text-sm font-light ${isNight ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-black/20 hover:bg-black/30 text-black'}`}
                    >
                        Try Again
                    </button>
                </div>
            )}

            {!isLoading && !error && markets && markets.length > 0 && (
                <div className="space-y-4">
                    {markets.map((market, index) => (
                        <MarketCard
                            key={market.marketID || market.id || index}
                            market={market}
                            onAnalyze={onAnalyze}
                            isNight={isNight}
                            textColor={textColor}
                            cardBgColor={cardBgColor}
                            isExpanded={expandedMarketId === (market.marketID || market.id || market.tokenID)}
                            setExpandedMarketId={setExpandedMarketId}
                            analysis={analysis}
                            isAnalyzing={isAnalyzing}
                            selectedMarket={selectedMarket}
                            onPublishSignal={onPublishSignal}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Shared Market Card Component
function MarketCard({
    market, onAnalyze, isNight, textColor, cardBgColor,
    isExpanded, setExpandedMarketId, analysis, isAnalyzing,
    selectedMarket, onPublishSignal
}) {
    const isHidden = expandedMarketId && !isExpanded;
    const isCurrentMarket = (selectedMarket?.marketID || selectedMarket?.id) === (market.marketID || market.id);

    return (
        <div
            className={`backdrop-blur-xl border rounded-3xl transition-all duration-500 ${isExpanded
                ? 'fixed inset-4 p-8 z-40 overflow-y-auto'
                : 'p-5 sm:p-6'
                } ${isHidden
                    ? 'opacity-0 pointer-events-none scale-95'
                    : `opacity-100 hover:scale-[1.01] ${cardBgColor}`
                }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <h3 className={`text-lg font-light ${textColor} leading-relaxed tracking-wide`}>
                        {market.title || market.question}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {market.volume24h && (
                            <span className={`px-3 py-1 rounded-full font-light border ${isNight ? 'bg-orange-500/10 text-orange-200 border-orange-500/20' : 'bg-orange-400/10 text-orange-800 border-orange-400/20'}`}>
                                ⚡ ${(market.volume24h / 1000).toFixed(0)}K
                            </span>
                        )}
                        {market.confidence && (
                            <span className={`px-3 py-1 rounded-full font-light border ${market.confidence === 'HIGH' ? (isNight ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-400/20 text-green-800 border-green-400/30') :
                                market.confidence === 'MEDIUM' ? (isNight ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-yellow-400/20 text-yellow-800 border-yellow-400/30') :
                                    (isNight ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-400/20 text-red-800 border-red-400/30')
                                }`}>
                                {market.confidence}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {isExpanded ? (
                        <button
                            onClick={() => setExpandedMarketId(null)}
                            className={`px-6 py-3 rounded-2xl font-light text-sm transition-all border ${isNight ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-black/10 hover:bg-black/20 text-black border-black/20'}`}
                        >
                            ← Back
                        </button>
                    ) : (
                        <button
                            onClick={() => onAnalyze(market, 'basic')}
                            disabled={isAnalyzing}
                            className={`px-6 py-3 rounded-2xl font-light text-sm transition-all disabled:opacity-40 hover:scale-105 border ${isNight ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-200 border-blue-400/30' : 'bg-gradient-to-r from-blue-400/20 to-purple-400/20 hover:from-blue-400/30 hover:to-purple-400/30 text-blue-800 border-blue-500/30'}`}
                        >
                            {isAnalyzing && isCurrentMarket ? 'Analyzing...' : 'Analyze'}
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Analysis View */}
            {isExpanded && analysis && (
                <div className="mt-8 pt-8 border-t border-white/10">
                    <h2 className={`text-2xl font-light ${textColor} mb-6`}>Analysis</h2>
                    <div className="space-y-4">
                        <div className={`${cardBgColor} backdrop-blur-sm border rounded-xl p-5`}>
                            <p className={`text-base ${textColor} opacity-90 leading-relaxed font-light`}>
                                {analysis.reasoning || analysis.analysis || 'No analysis available'}
                            </p>
                        </div>

                        {analysis.recommended_action && (
                            <div className={`${cardBgColor} backdrop-blur-sm border rounded-xl p-5`}>
                                <h4 className={`text-sm font-light ${textColor} opacity-90 mb-2`}>Recommendation</h4>
                                <p className={`text-base font-medium ${textColor}`}>
                                    {analysis.recommended_action}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={onPublishSignal}
                            className={`w-full px-6 py-3 rounded-2xl font-light text-sm transition-all border ${isNight ? 'bg-green-500/20 hover:bg-green-500/30 text-green-200 border-green-400/30' : 'bg-green-400/20 hover:bg-green-400/30 text-green-800 border-green-500/30'}`}
                        >
                            📡 Publish Signal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

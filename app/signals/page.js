'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ConnectKitButton } from 'connectkit';
import PageNav from '@/app/components/PageNav';
import Scene3D from '@/components/Scene3D';
import { weatherService } from '@/services/weatherService';

export default function SignalsPage() {
    const [signals, setSignals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        eventId: '',
        confidence: 'all',
        oddsEfficiency: 'all'
    });

    // Weather for theming
    const [weatherData, setWeatherData] = useState(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState(true);
    const [isNight, setIsNight] = useState(() => {
        const hour = new Date().getHours();
        return hour >= 19 || hour <= 6;
    });

    // Load weather on mount
    useEffect(() => {
        loadWeather();
    }, []);

    // Fetch signals on mount
    useEffect(() => {
        fetchSignals();
    }, []);

    const loadWeather = async () => {
        try {
            const location = await weatherService.getCurrentLocation();
            const data = await weatherService.getCurrentWeather(location);
            setWeatherData(data);

            if (data?.location?.localtime) {
                const currentHour = new Date(data.location.localtime).getHours();
                setIsNight(currentHour >= 19 || currentHour <= 6);
            }
        } catch (err) {
            console.warn('Unable to load weather:', err.message);
        } finally {
            setIsLoadingWeather(false);
        }
    };

    const fetchSignals = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/signals?limit=50');
            const result = await response.json();

            if (result.success) {
                setSignals(result.signals || []);
            } else {
                setError(result.error || 'Failed to load signals');
            }
        } catch (err) {
            console.error('Failed to fetch signals:', err);
            setError('Unable to connect to signals service');
        } finally {
            setIsLoading(false);
        }
    };

    // Filter signals
    const filteredSignals = useMemo(() => {
        return signals.filter(signal => {
            if (filters.eventId && !signal.event_id?.toLowerCase().includes(filters.eventId.toLowerCase())) {
                return false;
            }
            if (filters.confidence !== 'all' && signal.confidence !== filters.confidence) {
                return false;
            }
            if (filters.oddsEfficiency !== 'all' && signal.odds_efficiency !== filters.oddsEfficiency) {
                return false;
            }
            return true;
        });
    }, [signals, filters]);

    // Group signals by event_id for timeline view
    const signalsByEvent = useMemo(() => {
        const grouped = {};
        filteredSignals.forEach(signal => {
            const eventId = signal.event_id || 'unknown';
            if (!grouped[eventId]) {
                grouped[eventId] = [];
            }
            grouped[eventId].push(signal);
        });
        return grouped;
    }, [filteredSignals]);

    const textColor = isNight ? 'text-white' : 'text-black';
    const bgColor = 'bg-black';
    const cardBgColor = isNight ? 'bg-slate-900/60 border-white/20' : 'bg-white/60 border-black/20';

    const getConfidenceColor = (confidence) => {
        switch (confidence) {
            case 'HIGH': return isNight ? 'text-green-400' : 'text-green-700';
            case 'MEDIUM': return isNight ? 'text-yellow-400' : 'text-yellow-700';
            case 'LOW': return isNight ? 'text-red-400' : 'text-red-700';
            default: return isNight ? 'text-gray-400' : 'text-gray-700';
        }
    };

    const getConfidenceBadge = (confidence) => {
        const baseClass = 'px-3 py-1 rounded-full text-xs font-light border';
        switch (confidence) {
            case 'HIGH':
                return `${baseClass} ${isNight ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-400/20 text-green-800 border-green-400/30'}`;
            case 'MEDIUM':
                return `${baseClass} ${isNight ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-yellow-400/20 text-yellow-800 border-yellow-400/30'}`;
            case 'LOW':
                return `${baseClass} ${isNight ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-red-400/20 text-red-800 border-red-400/30'}`;
            default:
                return `${baseClass} ${isNight ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' : 'bg-gray-400/20 text-gray-800 border-gray-400/30'}`;
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

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
                                Signals
                            </h1>
                            <p className={`text-sm ${textColor} opacity-60 mt-2 font-light`}>
                                Published weather × odds × AI signals registry
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <PageNav currentPage="Signals" isNight={isNight} />
                            <ConnectKitButton mode={isNight ? "dark" : "light"} />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1">
                    {/* Filters */}
                    <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6 mb-8`}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className={`${textColor} text-xs opacity-60 block mb-1`}>Event ID</label>
                                <input
                                    type="text"
                                    value={filters.eventId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, eventId: e.target.value }))}
                                    placeholder="Filter by event ID..."
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white placeholder-white/50' : 'bg-black/10 border-black/20 text-black placeholder-black/50'}`}
                                />
                            </div>

                            <div>
                                <label className={`${textColor} text-xs opacity-60 block mb-1`}>Confidence</label>
                                <select
                                    value={filters.confidence}
                                    onChange={(e) => setFilters(prev => ({ ...prev, confidence: e.target.value }))}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}
                                >
                                    <option value="all">All Confidence Levels</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </div>

                            <div>
                                <label className={`${textColor} text-xs opacity-60 block mb-1`}>Odds Efficiency</label>
                                <select
                                    value={filters.oddsEfficiency}
                                    onChange={(e) => setFilters(prev => ({ ...prev, oddsEfficiency: e.target.value }))}
                                    className={`w-full px-3 py-2 text-sm rounded-lg border ${isNight ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}
                                >
                                    <option value="all">All Efficiency Levels</option>
                                    <option value="INEFFICIENT">Inefficient</option>
                                    <option value="EFFICIENT">Efficient</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    {!isLoading && !error && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            <div className={`${cardBgColor} backdrop-blur-xl border rounded-2xl p-4`}>
                                <div className={`text-2xl font-light ${textColor} mb-1`}>{signals.length}</div>
                                <div className={`text-xs ${textColor} opacity-60`}>Total Signals</div>
                            </div>
                            <div className={`${cardBgColor} backdrop-blur-xl border rounded-2xl p-4`}>
                                <div className={`text-2xl font-light ${textColor} mb-1`}>{Object.keys(signalsByEvent).length}</div>
                                <div className={`text-xs ${textColor} opacity-60`}>Unique Events</div>
                            </div>
                            <div className={`${cardBgColor} backdrop-blur-xl border rounded-2xl p-4`}>
                                <div className={`text-2xl font-light ${textColor} mb-1`}>{filteredSignals.length}</div>
                                <div className={`text-xs ${textColor} opacity-60`}>Filtered Results</div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className={`w-6 h-6 border-2 ${isNight ? 'border-white/30 border-t-white' : 'border-black/30 border-t-black'} rounded-full animate-spin`}></div>
                            <span className={`ml-3 ${textColor} opacity-70`}>Loading signals...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6 text-center`}>
                            <p className={`${textColor} opacity-90 mb-4`}>{error}</p>
                            <button
                                onClick={fetchSignals}
                                className={`px-4 py-2 rounded-lg text-sm font-light ${isNight ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-black/20 hover:bg-black/30 text-black'}`}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Signals List */}
                    {!isLoading && !error && filteredSignals.length === 0 && (
                        <div className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-12 text-center`}>
                            <div className="text-6xl mb-4">📡</div>
                            <h3 className={`text-xl font-light ${textColor} mb-2`}>No Signals Yet</h3>
                            <p className={`${textColor} opacity-60 text-sm`}>
                                Signals will appear here once published from the Markets page
                            </p>
                        </div>
                    )}

                    {!isLoading && !error && filteredSignals.length > 0 && (
                        <div className="space-y-6">
                            {/* Timeline View by Event */}
                            {Object.entries(signalsByEvent).map(([eventId, eventSignals]) => (
                                <div key={eventId} className={`${cardBgColor} backdrop-blur-xl border rounded-3xl p-6`}>
                                    <h3 className={`text-lg font-light ${textColor} mb-4`}>
                                        {eventSignals[0]?.market_title || eventId}
                                    </h3>

                                    {eventSignals[0]?.venue && (
                                        <div className={`text-sm ${textColor} opacity-60 mb-4`}>
                                            📍 {eventSignals[0].venue}
                                        </div>
                                    )}

                                    {/* Signal Timeline */}
                                    <div className="space-y-3">
                                        {eventSignals.map((signal, index) => (
                                            <div
                                                key={signal.id || index}
                                                className={`border-l-2 pl-4 ${isNight ? 'border-blue-500/30' : 'border-blue-400/30'}`}
                                            >
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={getConfidenceBadge(signal.confidence)}>
                                                        {signal.confidence || 'UNKNOWN'}
                                                    </span>
                                                    {signal.odds_efficiency && (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-light border ${signal.odds_efficiency === 'INEFFICIENT'
                                                                ? (isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-400/20 text-orange-800 border-orange-400/30')
                                                                : (isNight ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-400/20 text-green-800 border-green-400/30')
                                                            }`}>
                                                            {signal.odds_efficiency}
                                                        </span>
                                                    )}
                                                    <span className={`text-xs ${textColor} opacity-50`}>
                                                        {formatTimestamp(signal.timestamp)}
                                                    </span>
                                                    {signal.tx_hash && (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-light border ${isNight ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-400/20 text-purple-800 border-purple-400/30'}`}>
                                                            On-chain: {signal.tx_hash.substring(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>

                                                {signal.ai_digest && (
                                                    <p className={`text-sm ${textColor} opacity-70 line-clamp-2`}>
                                                        {signal.ai_digest}
                                                    </p>
                                                )}

                                                {signal.author_address && (
                                                    <div className={`text-xs ${textColor} opacity-50 mt-1`}>
                                                        By: {signal.author_address.substring(0, 6)}...{signal.author_address.substring(signal.author_address.length - 4)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Event Stats */}
                                    <div className={`mt-4 pt-4 border-t ${isNight ? 'border-white/10' : 'border-black/10'}`}>
                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            <span className={`${textColor} opacity-60`}>
                                                {eventSignals.length} signal{eventSignals.length !== 1 ? 's' : ''} published
                                            </span>
                                            {eventSignals[0]?.event_time && (
                                                <span className={`${textColor} opacity-60`}>
                                                    Event: {formatTimestamp(eventSignals[0].event_time)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

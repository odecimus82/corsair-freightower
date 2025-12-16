
import React, { useState, useEffect, useRef } from 'react';
import { fetchLogisticsNews } from '../services/geminiService';
import { LogisticsNewsItem } from '../types';
import { Radio, Plane, Ship, AlertTriangle, CloudRain, Clock, RefreshCw, Globe, MapPin } from 'lucide-react';

const CACHE_KEY = 'freightflow_news_cache';

// Instant Fallback Data (Used if no cache & API is loading)
const FALLBACK_NEWS: LogisticsNewsItem[] = [
    { id: 'fb1', timestamp: '09:15 CST', category: 'PORT', location: 'Shanghai (CNSHA)', headline: 'Terminal 4 operating at peak efficiency', impact: 'LOW' },
    { id: 'fb2', timestamp: '18:30 PST', category: 'AIRPORT', location: 'Los Angeles (KLAX)', headline: 'Cargo apron congestion easing, 2h delays', impact: 'MEDIUM' },
    { id: 'fb3', timestamp: '03:45 CET', category: 'PORT', location: 'Rotterdam (NLRTM)', headline: 'Vessel queue stable, gate operations normal', impact: 'LOW' },
    { id: 'fb4', timestamp: '21:00 EST', category: 'WEATHER', location: 'North Atlantic', headline: 'Storm front causing minor deviation for westbound vessels', impact: 'MEDIUM' },
    { id: 'fb5', timestamp: '11:20 HKT', category: 'AIRPORT', location: 'Hong Kong (VHHH)', headline: 'Exports volume surge, booking recommended 3 days prior', impact: 'MEDIUM' },
    { id: 'fb6', timestamp: '14:10 GST', category: 'PORT', location: 'Jebel Ali (AEJEA)', headline: 'Customs system maintenance scheduled for weekend', impact: 'LOW' }
];

export const LiveMarketFeed: React.FC = () => {
    const [news, setNews] = useState<LogisticsNewsItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false); // Used for small spinner
    const [nextUpdateIn, setNextUpdateIn] = useState<number>(10); // Minutes
    const [currentTime, setCurrentTime] = useState(new Date());

    const loadNews = async (isBackground = false) => {
        if (!isBackground) setIsRefreshing(true);
        
        try {
            const data = await fetchLogisticsNews();
            
            if (data && data.length > 0) {
                // Duplicate the data to ensure smooth infinite scrolling illusion
                const displayData = [...data, ...data]; 
                setNews(displayData);
                
                // Cache the RAW single set of data
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                }));
                
                setNextUpdateIn(10);
            }
        } catch (error) {
            console.error("Failed to load fresh news:", error);
            // If API fails, we just keep showing whatever we have (cache or fallback)
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // --- 1. INSTANT LOAD STRATEGY ---
        const loadInitialData = () => {
            const cached = localStorage.getItem(CACHE_KEY);
            let hasValidCache = false;

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Check if cache is "fresh enough" (e.g., less than 1 hour old)
                    // Even if old, we show it first, then update in background
                    if (parsed.data && Array.isArray(parsed.data)) {
                        const cachedData = parsed.data;
                        setNews([...cachedData, ...cachedData]); // Duplicate for scroll
                        hasValidCache = true;
                    }
                } catch (e) {
                    console.warn("Cache parse failed, using fallback");
                }
            }

            if (!hasValidCache) {
                // If no cache, show Fallback immediately so user sees something
                setNews([...FALLBACK_NEWS, ...FALLBACK_NEWS]);
            }

            // Always fetch fresh data in background to update the view
            // Delay slightly to let the UI render the initial frame smoothly
            setTimeout(() => loadNews(true), 1000); 
        };

        loadInitialData();

        // --- 2. INTERVALS ---
        
        // Data Refresh Interval (10 mins)
        const dataInterval = setInterval(() => {
            loadNews(true); // Always background refresh on interval
        }, 600000); 

        // Clock & Countdown
        const timerInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const countdownInterval = setInterval(() => {
             setNextUpdateIn(prev => prev > 0 ? prev - 1 : 10);
        }, 60000);

        return () => {
            clearInterval(dataInterval);
            clearInterval(timerInterval);
            clearInterval(countdownInterval);
        };
    }, []);

    // Helper for Icon
    const getIcon = (category: string) => {
        switch(category) {
            case 'PORT': return <Ship className="w-5 h-5 text-blue-400" />;
            case 'AIRPORT': return <Plane className="w-5 h-5 text-indigo-400" />;
            case 'WEATHER': return <CloudRain className="w-5 h-5 text-cyan-400" />;
            default: return <AlertTriangle className="w-5 h-5 text-amber-400" />;
        }
    };

    // Helper for World Clock
    const getTimeInZone = (zone: string) => {
        try {
            return currentTime.toLocaleTimeString('en-US', { 
                timeZone: zone, 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return "--:--";
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
            
            {/* Header / Control Tower Status */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <Radio className="w-32 h-32 text-indigo-500 animate-pulse" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className={`w-3 h-3 rounded-full absolute top-0 left-0 opacity-75 ${isRefreshing ? 'bg-amber-500 animate-ping' : 'bg-red-500 animate-ping'}`}></div>
                                <div className={`w-3 h-3 rounded-full relative ${isRefreshing ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-xl tracking-tight leading-none">Global Ops Center</h2>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live Monitoring</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-500'}`} />
                            <span>{isRefreshing ? 'Updating...' : `Next: ${nextUpdateIn}m`}</span>
                        </div>
                    </div>

                    {/* World Clocks */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-4">
                        <div className="text-center border-r border-slate-800 last:border-0">
                            <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Beijing
                            </div>
                            <div className="text-white font-mono text-lg font-bold">{getTimeInZone('Asia/Shanghai')}</div>
                            <div className="text-slate-600 text-[9px] font-bold">CST</div>
                        </div>
                        <div className="text-center border-r border-slate-800 last:border-0">
                             <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Los Angeles
                            </div>
                            <div className="text-white font-mono text-lg font-bold">{getTimeInZone('America/Los_Angeles')}</div>
                            <div className="text-slate-600 text-[9px] font-bold">PST</div>
                        </div>
                        <div className="text-center">
                             <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Rotterdam
                            </div>
                            <div className="text-white font-mono text-lg font-bold">{getTimeInZone('Europe/Amsterdam')}</div>
                            <div className="text-slate-600 text-[9px] font-bold">CET</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rolling Ticker Feed */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Network Feed
                    </h3>
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Auto-Scroll</span>
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                <div className="relative flex-1 overflow-hidden bg-slate-50/30">
                     {/* Gradient Overlays for smooth fade effect */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>

                    {news.length === 0 ? (
                         // Should not happen with fallback, but safe guard
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Establishing Satellite Link...</span>
                        </div>
                    ) : (
                        <div className="h-full overflow-hidden relative group">
                            {/* CSS Animation Wrapper */}
                            <div 
                                className="absolute top-0 left-0 w-full animate-infinite-scroll hover:pause-animation"
                                style={{
                                    animation: `scrollY ${news.length * 6}s linear infinite`
                                }}
                            >
                                {news.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="p-4 border-b border-slate-100 hover:bg-indigo-50/50 transition-colors cursor-default bg-white/50 backdrop-blur-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                    item.impact === 'HIGH' ? 'bg-red-100 text-red-600 border-red-200' :
                                                    item.impact === 'MEDIUM' ? 'bg-amber-100 text-amber-600 border-amber-200' :
                                                    'bg-blue-100 text-blue-600 border-blue-200'
                                                }`}>
                                                    {item.impact}
                                                </span>
                                                {/* Timestamp with Timezone Emphasis */}
                                                <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-1.5 rounded">{item.timestamp}</span>
                                            </div>
                                            {getIcon(item.category)}
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1 leading-snug">{item.headline}</h4>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span className="font-semibold text-slate-600">{item.location}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes scrollY {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-infinite-scroll {
                    /* ensure the content is duplicated so 50% scroll is seamless */
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused !important;
                }
            `}</style>
        </div>
    );
};

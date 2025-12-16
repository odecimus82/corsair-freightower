
import React, { useState, useEffect, useRef } from 'react';
import { fetchLogisticsNews } from '../services/geminiService';
import { LogisticsNewsItem } from '../types';
import { Radio, Plane, Ship, AlertTriangle, CloudRain, Clock, RefreshCw, Globe, MapPin } from 'lucide-react';

export const LiveMarketFeed: React.FC = () => {
    const [news, setNews] = useState<LogisticsNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [nextUpdateIn, setNextUpdateIn] = useState<number>(10); // Minutes
    const [currentTime, setCurrentTime] = useState(new Date());

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const loadNews = async () => {
        setLoading(true);
        try {
            const data = await fetchLogisticsNews();
            // Duplicate the data to ensure smooth infinite scrolling illusion if list is short
            setNews([...data, ...data]); 
            setNextUpdateIn(10);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNews();

        // 1. Data Refresh Interval (10 mins)
        const dataInterval = setInterval(() => {
            loadNews();
        }, 600000); 

        // 2. Countdown Timer & Clock (Every minute/second)
        const timerInterval = setInterval(() => {
            setCurrentTime(new Date());
            setNextUpdateIn(prev => {
                // Approximate logic just to show movement
                return prev; 
            });
        }, 1000);

        // Update countdown separately to avoid jitter
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
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute top-0 left-0 opacity-75"></div>
                                <div className="w-3 h-3 bg-red-500 rounded-full relative"></div>
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-xl tracking-tight leading-none">Global Ops Center</h2>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live Monitoring</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            <span>Next: {nextUpdateIn}m</span>
                        </div>
                    </div>

                    {/* World Clocks - Key Feature for Cross-Region Users */}
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

                    {loading && news.length === 0 ? (
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


import React, { useState, useEffect } from 'react';
import { Search, Anchor, Navigation, ArrowRight, MapPin, Info, Ship, Plane, Layers, ChevronDown, Globe, BarChart3, TrendingUp, X, Activity, ExternalLink, Clock, Ruler, Database, Map } from 'lucide-react';
import { getPortDetails, calculateRouteDetails, getPortCongestion } from '../services/geminiService';
import { getCombinedTerminals } from '../services/portData';
import { PortDetails, RouteDetails, TerminalOption } from '../types';
import Markdown from 'react-markdown';

interface PortIntelligenceProps {
    mode: 'lookup' | 'route';
}

const POPULAR_ROUTES = [
    { o: 'Shanghai Port', d: 'Rotterdam Port', type: 'OCEAN', label: 'Shanghai → Rotterdam' },
    { o: 'Hong Kong International Airport', d: 'Los Angeles International Airport', type: 'AIR', label: 'Hong Kong → Los Angeles' },
    { o: 'Singapore Port', d: 'Jebel Ali Port', type: 'OCEAN', label: 'Singapore → Dubai' },
];

export const PortIntelligence: React.FC<PortIntelligenceProps> = ({ mode }) => {
    const [terminals, setTerminals] = useState<TerminalOption[]>([]);
    
    // Lookup State
    const [searchMode, setSearchMode] = useState<'OCEAN' | 'AIR'>('OCEAN'); 
    const [lookupQuery, setLookupQuery] = useState('');
    const [portData, setPortData] = useState<PortDetails | null>(null);
    const [loadingPort, setLoadingPort] = useState(false);

    // Stats & Random Ticker State
    const [oceanCount, setOceanCount] = useState(0);
    const [airCount, setAirCount] = useState(0);
    const [randomOcean, setRandomOcean] = useState<TerminalOption | null>(null);
    const [randomAir, setRandomAir] = useState<TerminalOption | null>(null);

    // Congestion Modal State
    const [showCongestionModal, setShowCongestionModal] = useState(false);
    const [loadingCongestion, setLoadingCongestion] = useState(false);
    const [congestionData, setCongestionData] = useState<{ text: string, sources: {title: string, uri: string}[] } | null>(null);

    // Route Calculator State
    const [routeCalcMode, setRouteCalcMode] = useState<'OCEAN' | 'AIR'>('OCEAN'); // New Mode for Calculator
    const [originQuery, setOriginQuery] = useState('');
    const [destQuery, setDestQuery] = useState('');
    const [routeData, setRouteData] = useState<RouteDetails | null>(null);
    const [loadingRoute, setLoadingRoute] = useState(false);

    useEffect(() => {
        const combined = getCombinedTerminals();
        setTerminals(combined);
        
        // Stats Calculation
        const ocean = combined.filter(t => t.type === 'OCEAN');
        const air = combined.filter(t => t.type === 'AIR');
        setOceanCount(ocean.length);
        setAirCount(air.length);

        // Initial Random Selection
        if (ocean.length) setRandomOcean(ocean[Math.floor(Math.random() * ocean.length)]);
        if (air.length) setRandomAir(air[Math.floor(Math.random() * air.length)]);

        // Random Ticker Interval
        const interval = setInterval(() => {
             if (ocean.length) setRandomOcean(ocean[Math.floor(Math.random() * ocean.length)]);
             if (air.length) setRandomAir(air[Math.floor(Math.random() * air.length)]);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Clear selection when switching modes
    const handleModeToggle = (newMode: 'OCEAN' | 'AIR') => {
        if (newMode !== searchMode) {
            setSearchMode(newMode);
            setLookupQuery(''); // Reset selection to avoid mismatch
        }
    };

    const handleRouteModeToggle = (newMode: 'OCEAN' | 'AIR') => {
        setRouteCalcMode(newMode);
        setOriginQuery('');
        setDestQuery('');
        setRouteData(null);
    };

    // Quick Load Helper
    const loadQuickRoute = (r: any) => {
        setRouteCalcMode(r.type);
        setOriginQuery(r.o);
        setDestQuery(r.d);
    };

    // Fixed: Now accepts an optional override string to handle click events immediately
    // without waiting for the async React state update of 'lookupQuery'.
    const handleLookup = async (e?: React.FormEvent, override?: string) => {
        if (e) e.preventDefault();
        
        const query = override || lookupQuery;
        
        // Ensure UI stays in sync if we used a quick link
        if (override) {
            setLookupQuery(override);
            // Auto-switch mode if the clicked item doesn't match current mode
            const target = terminals.find(t => t.value === override);
            if (target && target.type !== searchMode) {
                setSearchMode(target.type as 'OCEAN' | 'AIR');
            }
        }

        if (!query) return;
        
        setLoadingPort(true);
        setPortData(null);
        try {
            const data = await getPortDetails(query);
            setPortData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingPort(false);
        }
    };

    const handleViewTraffic = async () => {
        if (!portData) return;
        setShowCongestionModal(true);
        setLoadingCongestion(true);
        setCongestionData(null);
        try {
            const result = await getPortCongestion(portData.name);
            setCongestionData(result);
        } catch (error) {
            console.error("Failed to fetch congestion", error);
        } finally {
            setLoadingCongestion(false);
        }
    };

    const handleRouteCalc = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!originQuery || !destQuery) return;
        setLoadingRoute(true);
        setRouteData(null);
        try {
            const data = await calculateRouteDetails(originQuery, destQuery);
            setRouteData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingRoute(false);
        }
    };

    // --- VIEW: PORT DATABASE ---
    if (mode === 'lookup') {
        return (
            <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                {/* Hero Search Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white opacity-50"></div>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-2 mb-2">
                             <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                                Freightflow Intelligence
                             </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Global Port Database</h2>
                        
                        {/* Database Counters */}
                        <div className="flex justify-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                                <Ship className="w-3.5 h-3.5" />
                                <span>{oceanCount} Seaports</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                <Plane className="w-3.5 h-3.5" />
                                <span>{airCount} Airports</span>
                            </div>
                        </div>

                        <div className="max-w-xl mx-auto space-y-4">
                            {/* Mode Switcher Slider */}
                            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => handleModeToggle('OCEAN')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                        searchMode === 'OCEAN' 
                                        ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    <Ship className="w-4 h-4" />
                                    Seaports
                                </button>
                                <button
                                    onClick={() => handleModeToggle('AIR')}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                        searchMode === 'AIR' 
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    <Plane className="w-4 h-4" />
                                    Airports
                                </button>
                            </div>

                            <form onSubmit={handleLookup} className="relative">
                                <div className="relative shadow-lg rounded-xl transition-shadow focus-within:shadow-indigo-500/20">
                                    <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4 z-10 pointer-events-none" />
                                    <select 
                                        className="w-full pl-12 pr-32 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none bg-white text-slate-700 text-base font-medium cursor-pointer hover:border-slate-300"
                                        value={lookupQuery}
                                        onChange={(e) => setLookupQuery(e.target.value)}
                                    >
                                        <option value="" disabled>
                                            {searchMode === 'OCEAN' ? 'Search Seaport Name or Code...' : 'Search Airport Name or Code...'}
                                        </option>
                                        
                                        {/* Filtered Options based on Toggle */}
                                        {terminals
                                            .filter(t => t.type === searchMode)
                                            .map(t => (
                                                <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                            ))
                                        }
                                    </select>
                                    <div className="absolute right-2 top-2">
                                        <button 
                                            type="submit"
                                            disabled={loadingPort || !lookupQuery}
                                            className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-md h-full"
                                        >
                                            {loadingPort ? 'Searching...' : 'Search'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="transition-all duration-300 ease-in-out min-h-[400px]">
                    {loadingPort ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 flex flex-col items-center justify-center text-center animate-pulse h-full">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Globe className="w-10 h-10 text-slate-300 animate-spin-slow" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-700">Retrieving Port Data</h3>
                            <p className="text-slate-400 mt-2">Querying global logistics database...</p>
                        </div>
                    ) : portData ? (
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                            {/* Header Banner */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-8 md:p-10 relative overflow-hidden">
                                {/* Decorative Background Pattern */}
                                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px'}}></div>
                                <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-10 -translate-y-10">
                                    <Anchor className="w-80 h-80" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${portData.type.includes('Air') ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200' : 'bg-blue-500/20 border-blue-400/30 text-blue-200'}`}>
                                                {portData.type}
                                            </span>
                                            <span className="text-slate-400 text-sm font-mono flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded">
                                                <Globe className="w-3 h-3" /> {portData.coordinates}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{portData.name}</h2>
                                        <div className="flex items-center gap-3 text-slate-300 text-lg">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-5 h-5 text-indigo-400" />
                                                <span>{portData.country}</span>
                                            </div>
                                            <span className="text-slate-600">•</span>
                                            <span className="font-mono bg-white/10 px-3 py-1 rounded text-base text-white border border-white/10">{portData.code}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleViewTraffic}
                                            className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 group"
                                        >
                                            <Activity className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                                            Live Congestion
                                        </button>
                                        <button 
                                            onClick={() => setPortData(null)}
                                            className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm text-white p-3 rounded-xl transition-all"
                                            title="Clear Search"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="p-8 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-10">
                                    <div className="prose prose-slate max-w-none">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
                                            <Info className="w-4 h-4" /> Operational Overview
                                        </h4>
                                        <p className="text-slate-600 leading-relaxed text-lg font-light">
                                            {portData.description}
                                        </p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4">
                                            <Layers className="w-4 h-4" /> Infrastructure Capabilities
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {portData.infrastructure.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all group">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                                    <span className="text-slate-700 font-medium">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-1">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 h-full">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">
                                            <BarChart3 className="w-4 h-4" /> Quick Stats
                                        </h4>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0">
                                                <span className="text-slate-500 text-sm">Operational Status</span>
                                                <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2 py-1 rounded-full border border-emerald-200">Active</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0">
                                                <span className="text-slate-500 text-sm">Timezone</span>
                                                <span className="text-slate-800 font-semibold text-sm">Local</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 border-b border-slate-200 last:border-0">
                                                <span className="text-slate-500 text-sm">Category</span>
                                                <span className="text-slate-800 font-semibold text-sm text-right">{portData.type.split(' ')[0]}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <div className="flex gap-3">
                                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-blue-700 leading-relaxed">
                                                    Infrastructure data is aggregated from global shipping indices.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Congestion Modal */}
                            {showCongestionModal && (
                                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative ring-1 ring-black/5">
                                        <button 
                                            onClick={() => setShowCongestionModal(false)}
                                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        
                                        <div className="bg-slate-900 text-white p-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-900/50">
                                                    <Activity className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xl">Live Port Status</h3>
                                                    <p className="text-indigo-200 text-sm">Real-time AI Traffic Analysis</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                                            {loadingCongestion ? (
                                                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                                    <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                                    <p className="text-slate-500 text-sm font-medium">Analyzing satellite & news data...</p>
                                                </div>
                                            ) : congestionData ? (
                                                <div className="space-y-6">
                                                    <div className="prose prose-sm prose-slate max-w-none text-slate-600">
                                                        <Markdown>{congestionData.text}</Markdown>
                                                    </div>
                                                    
                                                    {congestionData.sources.length > 0 && (
                                                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verified Intelligence Sources</h4>
                                                            <div className="space-y-2">
                                                                {congestionData.sources.map((source, idx) => (
                                                                    <a 
                                                                        key={idx}
                                                                        href={source.uri}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-800 hover:underline truncate group"
                                                                    >
                                                                        <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                                                                        {source.title}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-red-500 py-6">
                                                    Unable to retrieve live data. Please try again later.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                             {/* Static Quick Links */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { name: 'Shanghai', code: 'CNSHA', value: 'Shanghai Port' },
                                    { name: 'Rotterdam', code: 'NLRTM', value: 'Rotterdam Port' },
                                    { name: 'Los Angeles', code: 'USLAX', value: 'Port of Los Angeles' },
                                ].map((port) => (
                                    <button 
                                        key={port.code}
                                        onClick={() => handleLookup(undefined, port.value)}
                                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all text-left group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Anchor className="w-24 h-24 transform rotate-12 translate-x-4 -translate-y-4" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Anchor className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">{port.code}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-lg mb-1">{port.name}</h4>
                                            <div className="flex items-center gap-1 text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                View Details <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Network Spotlight - Randomly Rotating */}
                            <div className="pt-8 border-t border-slate-200/60">
                                <div className="flex items-center justify-between mb-4">
                                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <Activity className="w-4 h-4 text-emerald-500" /> Live Network Spotlight
                                    </div>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse delay-75"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse delay-150"></div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Random Ocean Card */}
                                    <div 
                                        onClick={() => randomOcean && handleLookup(undefined, randomOcean.value)}
                                        className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-5 group hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                            <Ship className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0 z-10">
                                            <div className="text-[10px] font-bold text-blue-500 uppercase mb-0.5 tracking-wide">Featured Seaport</div>
                                            <div className="font-bold text-slate-800 text-lg truncate group-hover:text-blue-700 transition-colors">{randomOcean?.label.split(' - ')[0]}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{randomOcean?.value.includes('(') ? randomOcean.value.split('(')[1].replace(')', '') : 'CODE'}</span>
                                                <span className="truncate">{randomOcean?.country}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-700" />
                                        </div>
                                    </div>

                                    {/* Random Air Card */}
                                    <div 
                                        onClick={() => randomAir && handleLookup(undefined, randomAir.value)}
                                        className="bg-white rounded-xl p-5 border border-slate-200 flex items-center gap-5 group hover:bg-indigo-50/30 hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
                                    >
                                         <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
                                            <Plane className="w-7 h-7" />
                                        </div>
                                         <div className="flex-1 min-w-0 z-10">
                                            <div className="text-[10px] font-bold text-indigo-500 uppercase mb-0.5 tracking-wide">Featured Airport</div>
                                            <div className="font-bold text-slate-800 text-lg truncate group-hover:text-indigo-700 transition-colors">{randomAir?.label.split(' - ')[0]}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">{randomAir?.value.includes('(') ? randomAir.value.split('(')[1].replace(')', '') : 'CODE'}</span>
                                                <span className="truncate">{randomAir?.country}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-full group-hover:bg-indigo-200 group-hover:text-indigo-700 transition-colors">
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-700" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW: ROUTE CALCULATOR ---
    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                
                {/* Input Panel */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                                <Navigation className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 leading-tight">Route<br/>Configuration</h2>
                            </div>
                        </div>

                         {/* Mode Switcher */}
                         <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6">
                            <button
                                type="button"
                                onClick={() => handleRouteModeToggle('OCEAN')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${routeCalcMode === 'OCEAN' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Ship className="w-4 h-4" /> Ocean
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRouteModeToggle('AIR')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${routeCalcMode === 'AIR' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Plane className="w-4 h-4" /> Air
                            </button>
                        </div>
                        
                        <form onSubmit={handleRouteCalc} className="space-y-6">
                            {/* Visual Timeline Connector */}
                            <div className="relative pl-6 space-y-8">
                                {/* Vertical Line */}
                                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-slate-200"></div>

                                <div className="relative">
                                     {/* Dot */}
                                     <div className={`absolute -left-[20px] top-3.5 w-4 h-4 rounded-full bg-white border-2 z-10 ${routeCalcMode === 'OCEAN' ? 'border-blue-500' : 'border-indigo-500'}`}></div>
                                     
                                     <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Origin {routeCalcMode === 'OCEAN' ? 'Port' : 'Airport'}</label>
                                     <div className="relative group">
                                        <select 
                                            className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer appearance-none"
                                            value={originQuery}
                                            onChange={(e) => setOriginQuery(e.target.value)}
                                        >
                                            <option value="" disabled>Select Origin...</option>
                                            {terminals.filter(t => t.type === routeCalcMode).map(t => (
                                                <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                                
                                <div className="relative">
                                     {/* Dot */}
                                     <div className={`absolute -left-[20px] top-3.5 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${routeCalcMode === 'OCEAN' ? 'bg-blue-600' : 'bg-indigo-600'}`}></div>
                                    
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Destination {routeCalcMode === 'OCEAN' ? 'Port' : 'Airport'}</label>
                                    <div className="relative group">
                                        <select 
                                            className="w-full pl-3 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer appearance-none"
                                            value={destQuery}
                                            onChange={(e) => setDestQuery(e.target.value)}
                                        >
                                            <option value="" disabled>Select Destination...</option>
                                             {terminals.filter(t => t.type === routeCalcMode).map(t => (
                                                <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={loadingRoute || !originQuery || !destQuery}
                                className={`w-full text-white py-4 rounded-xl text-sm font-bold hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 group ${routeCalcMode === 'OCEAN' ? 'bg-slate-900 hover:bg-blue-900' : 'bg-slate-900 hover:bg-indigo-900'}`}
                            >
                                {loadingRoute ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Calculating...
                                    </>
                                ) : (
                                    <>
                                        Calculate {routeCalcMode === 'OCEAN' ? 'Ocean' : 'Air'} Route 
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-8 flex flex-col h-full">
                     {loadingRoute ? (
                        <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-12 text-center animate-pulse min-h-[500px]">
                            <div className="relative mb-8">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${routeCalcMode === 'OCEAN' ? 'bg-blue-50' : 'bg-indigo-50'}`}>
                                    {routeCalcMode === 'OCEAN' ? <Ship className="w-10 h-10 text-blue-200 animate-bounce" /> : <Plane className="w-10 h-10 text-indigo-200 animate-bounce" />}
                                </div>
                                <div className={`absolute inset-0 border-4 border-t-transparent rounded-full animate-spin ${routeCalcMode === 'OCEAN' ? 'border-blue-100 border-t-blue-500' : 'border-indigo-100 border-t-indigo-500'}`}></div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Global Lanes</h3>
                            <p className="text-slate-500">Calculating distance, transit times, and risk factors...</p>
                        </div>
                    ) : routeData ? (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                             
                            {/* Route Summary Header */}
                            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 sm:w-1 sm:h-full ${routeCalcMode === 'OCEAN' ? 'bg-blue-500' : 'bg-indigo-500'}`}></div>
                                <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-6 sm:gap-4 z-10">
                                    
                                    <div className="text-center sm:text-left flex-1 min-w-0">
                                        <div className="text-sm text-slate-500 font-medium mb-1">Origin</div>
                                        <div className="text-xl sm:text-2xl font-bold text-slate-800 break-words leading-tight">{routeData.origin.split(',')[0]}</div>
                                        <div className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 inline-block mt-1">{routeData.origin.split(',')[1] || 'Global'}</div>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center shrink-0">
                                        <div className="flex items-center gap-1 text-slate-300 mb-1">
                                            <div className="hidden sm:block h-[2px] w-8 md:w-16 bg-slate-200"></div>
                                            <div className="bg-slate-100 p-2 rounded-full transform rotate-90 sm:rotate-0 transition-transform">
                                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="hidden sm:block h-[2px] w-8 md:w-16 bg-slate-200"></div>
                                        </div>
                                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-widest mt-1 text-center ${routeCalcMode === 'OCEAN' ? 'text-blue-600' : 'text-indigo-600'}`}>
                                            {routeCalcMode === 'OCEAN' ? 'Seaport-to-Seaport' : 'Airport-to-Airport'}
                                        </span>
                                    </div>

                                    <div className="text-center sm:text-right flex-1 min-w-0">
                                        <div className="text-sm text-slate-500 font-medium mb-1">Destination</div>
                                        <div className="text-xl sm:text-2xl font-bold text-slate-800 break-words leading-tight">{routeData.destination.split(',')[0]}</div>
                                        <div className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 inline-block mt-1">{routeData.destination.split(',')[1] || 'Global'}</div>
                                    </div>
                                </div>
                            </div>

                             {/* Comparison Grid - NOW ONLY SHOWS SELECTED MODE */}
                             <div className="grid grid-cols-1 gap-6">
                                 {routeCalcMode === 'OCEAN' ? (
                                    /* Ocean Card */
                                    <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-bl-[100px] transition-all group-hover:bg-blue-200/50"></div>
                                        <Ship className="absolute top-6 right-6 w-8 h-8 text-blue-500" />
                                        
                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                <h4 className="font-bold text-slate-800 text-xl mb-1">Ocean Freight Analysis</h4>
                                                <p className="text-sm text-slate-500">Deep Sea Routing • Containerized</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                                                        <Clock className="w-3 h-3" /> Est. Transit Time
                                                    </div>
                                                    <div className="text-3xl font-bold text-slate-800">{routeData.ocean.transitTimeDays} <span className="text-base font-normal text-slate-400">Days</span></div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                                                        <Ruler className="w-3 h-3" /> Voyage Distance
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800 mt-1">{routeData.ocean.distanceNm.toLocaleString()} <span className="text-sm font-normal text-slate-400">NM</span></div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                                                <h5 className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-2">Routing Details</h5>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    {routeData.ocean.routeDescription}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                 ) : (
                                    /* Air Card */
                                    <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-bl-[100px] transition-all group-hover:bg-indigo-200/50"></div>
                                        <Plane className="absolute top-6 right-6 w-8 h-8 text-indigo-500" />
                                        
                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                <h4 className="font-bold text-slate-800 text-xl mb-1">Air Freight Analysis</h4>
                                                <p className="text-sm text-slate-500">Direct/Transshipment • Cargo Aircraft</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                                                        <Clock className="w-3 h-3" /> Flight Duration
                                                    </div>
                                                    <div className="text-3xl font-bold text-indigo-600">{routeData.air.transitTimeHours}</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
                                                        <Ruler className="w-3 h-3" /> Great Circle Dist.
                                                    </div>
                                                    <div className="text-2xl font-bold text-slate-800 mt-1">{routeData.air.distanceKm.toLocaleString()} <span className="text-sm font-normal text-slate-400">KM</span></div>
                                                </div>
                                            </div>

                                            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                                                <h5 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">Flight Path</h5>
                                                <p className="text-sm text-slate-600 leading-relaxed">
                                                    {routeData.air.routeDescription}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                 )}
                             </div>
                        </div>
                    ) : (
                        <div className="h-full bg-slate-50/50 rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                            {/* Background Map Decoration */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                                backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg")',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundSize: 'contain'
                            }}></div>
                            
                            <div className="relative z-10 max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
                                <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                         <Globe className="w-10 h-10 text-indigo-600" />
                                         <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-20"></div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Global Route Planner</h3>
                                    <p className="text-slate-500 mb-8 leading-relaxed">
                                        Analyze transit times, distances, and carbon efficiency across 400+ trade lanes.
                                    </p>
                        
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quick Load Popular Lanes</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {POPULAR_ROUTES.map((r, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => loadQuickRoute(r)}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all group/btn text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${r.type === 'OCEAN' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                            {r.type === 'OCEAN' ? <Ship className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{r.label}</span>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover/btn:text-indigo-600 group-hover/btn:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

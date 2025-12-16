
import React, { useState, useEffect } from 'react';
import { Save, Trash2, Database, Edit3, Plus, ArrowRight, Anchor, MapPin, RefreshCw, XCircle, Settings, Layers, Loader2, Ship, Plane, Shield, Key } from 'lucide-react';
import { getCombinedTerminals } from '../services/portData';
import { calculateQuickMetrics } from '../services/geminiService';
import { RouteDB, PortDB } from '../services/routeStorage';
import { RouteOverride, TerminalOption } from '../types';

export const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'routes' | 'ports' | 'system'>('routes');
    
    // --- ROUTE STATE ---
    const [savedRoutes, setSavedRoutes] = useState<RouteOverride[]>([]);
    const [terminals, setTerminals] = useState<TerminalOption[]>([]);
    
    // Mode Separation State (Routes)
    const [routeConfigMode, setRouteConfigMode] = useState<'OCEAN' | 'AIR'>('OCEAN');

    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    
    // Ocean Data State
    const [oceanDist, setOceanDist] = useState(0);
    const [oceanTime, setOceanTime] = useState('');
    
    // Air Data State
    const [airDist, setAirDist] = useState(0);
    const [airTime, setAirTime] = useState('');
    
    const [isFetchingRoute, setIsFetchingRoute] = useState(false);

    // --- PORT STATE ---
    const [savedPorts, setSavedPorts] = useState<TerminalOption[]>([]); 
    const [portMode, setPortMode] = useState<'create' | 'edit'>('edit'); 
    
    // Mode Separation State (Ports)
    const [portConfigMode, setPortConfigMode] = useState<'OCEAN' | 'AIR'>('OCEAN');

    const [portName, setPortName] = useState('');
    const [portCode, setPortCode] = useState('');
    const [portCountry, setPortCountry] = useState('');
    const [editingPortValue, setEditingPortValue] = useState<string | null>(null);

    // --- SYSTEM / API STATE ---
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        refreshData();
        // Load existing key from storage if present
        const storedKey = localStorage.getItem('freightflow_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const refreshData = () => {
        setSavedRoutes(RouteDB.getAll());
        setSavedPorts(PortDB.getAll());
        setTerminals(getCombinedTerminals()); 
    };

    // --- SYSTEM HANDLERS ---
    const handleSaveApiKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            localStorage.setItem('freightflow_api_key', apiKey.trim());
            alert("API Key Saved Successfully! The application will now reload to apply the new credentials.");
            window.location.reload();
        }
    };

    const handleClearApiKey = () => {
        if(confirm("Remove API Key? The app will revert to using Mock Data or the default environment key.")) {
            localStorage.removeItem('freightflow_api_key');
            setApiKey('');
            window.location.reload();
        }
    }

    // --- ROUTE HANDLERS ---
    
    const handleRouteModeChange = (mode: 'OCEAN' | 'AIR') => {
        setRouteConfigMode(mode);
        setOrigin('');
        setDestination('');
        setOceanDist(0);
        setOceanTime('');
        setAirDist(0);
        setAirTime('');
    };

    const fetchRouteEstimates = async (o: string, d: string) => {
        if (!o || !d) return;

        const existingRoute = RouteDB.get(o, d);
        if (existingRoute) {
             if (routeConfigMode === 'OCEAN') {
                 setOceanDist(existingRoute.oceanDistance);
                 setOceanTime(existingRoute.oceanTime);
             } else {
                 setAirDist(existingRoute.airDistance);
                 setAirTime(existingRoute.airTime);
             }
             return; 
        }

        setIsFetchingRoute(true);
        if (routeConfigMode === 'OCEAN') { setOceanDist(0); setOceanTime(''); }
        if (routeConfigMode === 'AIR') { setAirDist(0); setAirTime(''); }
        
        try {
            const data = await calculateQuickMetrics(o, d);
            if (routeConfigMode === 'OCEAN') {
                setOceanDist(data.oceanDistance);
                setOceanTime(data.oceanTime);
            } else {
                setAirDist(data.airDistance);
                setAirTime(data.airTime);
            }
        } catch (e) {
            console.error("Failed to fetch estimates", e);
        } finally {
            setIsFetchingRoute(false);
        }
    };

    const handleOriginChange = (val: string) => {
        setOrigin(val);
        if (val && destination) fetchRouteEstimates(val, destination);
    };

    const handleDestChange = (val: string) => {
        setDestination(val);
        if (origin && val) fetchRouteEstimates(origin, val);
    };

    const handleSaveRoute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin || !destination) return;

        const newRoute: RouteOverride = {
            id: `${origin}-${destination}`,
            origin,
            destination,
            oceanDistance: routeConfigMode === 'OCEAN' ? oceanDist : 0,
            oceanTime: routeConfigMode === 'OCEAN' ? oceanTime : '',
            airDistance: routeConfigMode === 'AIR' ? airDist : 0,
            airTime: routeConfigMode === 'AIR' ? airTime : ''
        };

        RouteDB.save(newRoute);
        refreshData();
        resetRouteForm();
    };

    const handleDeleteRoute = (id: string) => {
        if(window.confirm('Delete this route override?')) {
            RouteDB.delete(id);
            refreshData();
        }
    };

    const handleEditRoute = (route: RouteOverride) => {
        const originTerminal = terminals.find(t => t.value === route.origin);
        const mode = originTerminal ? originTerminal.type : (route.airDistance > 0 ? 'AIR' : 'OCEAN');

        setRouteConfigMode(mode);
        setOrigin(route.origin);
        setDestination(route.destination);
        setOceanDist(route.oceanDistance);
        setOceanTime(route.oceanTime);
        setAirDist(route.airDistance);
        setAirTime(route.airTime);
        setActiveTab('routes');
    };

    const resetRouteForm = () => {
        setOrigin('');
        setDestination('');
        setOceanDist(0);
        setOceanTime('');
        setAirDist(0);
        setAirTime('');
    };

    // --- LIST FILTERING LOGIC (Routes) ---
    const filteredSavedRoutes = savedRoutes.filter(route => {
        const originTerminal = terminals.find(t => t.value === route.origin);
        if (originTerminal) {
            return originTerminal.type === routeConfigMode;
        }
        if (routeConfigMode === 'OCEAN') return route.oceanDistance > 0;
        if (routeConfigMode === 'AIR') return route.airDistance > 0;
        return false;
    });

    // --- PORT HANDLERS ---
    
    const handlePortModeSwitch = (mode: 'create' | 'edit') => {
        setPortMode(mode);
        resetPortForm();
    };

    const handlePortConfigModeChange = (mode: 'OCEAN' | 'AIR') => {
        setPortConfigMode(mode);
        resetPortForm();
    };

    const handleSavePort = (e: React.FormEvent) => {
        e.preventDefault();
        if (!portName || !portCountry) return;

        const formattedValue = `${portName}, ${portCountry}`;
        
        const newPort: TerminalOption = {
            label: `${portName} (${portCode || 'Custom'}) - ${portCountry}`,
            value: formattedValue,
            type: portConfigMode, // Use current mode context
            country: portCountry,
            code: portCode
        };

        if (portMode === 'edit' && editingPortValue) {
            if (editingPortValue !== formattedValue) {
                PortDB.delete(editingPortValue);
            }
        } else {
            if (terminals.some(p => p.value === formattedValue && p.value !== editingPortValue)) {
                if (!window.confirm("A port with this name already exists. Overwrite?")) {
                    return;
                }
            }
        }

        PortDB.save(newPort);
        refreshData();
        resetPortForm();
    };

    const handleSelectPortToEdit = (val: string) => {
        if (!val) {
            resetPortForm();
            return;
        }
        const target = terminals.find(p => p.value === val);
        if (target) {
            const rawName = target.value.includes(',') ? target.value.split(',')[0] : target.label.split(' (')[0];
            setPortName(rawName);
            setPortCode(target.code || '');
            setPortCountry(target.country);
            setPortConfigMode(target.type); // Sync mode
            setEditingPortValue(target.value);
        }
    };

    const handleDeletePort = (value: string) => {
        if(window.confirm('Delete this custom port? (Global ports cannot be deleted)')) {
            PortDB.delete(value);
            if (editingPortValue === value) resetPortForm();
            refreshData();
        }
    };

    const resetPortForm = () => {
        setPortName('');
        setPortCode('');
        setPortCountry('');
        setEditingPortValue(null);
    };

    // --- LIST FILTERING LOGIC (Ports) ---
    const filteredSavedPorts = savedPorts.filter(p => p.type === portConfigMode);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel: Edit Forms */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col order-1 lg:order-1 h-full max-h-[calc(100vh-140px)]">
                {/* Top Tabs */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex gap-1 flex-shrink-0">
                     <button 
                        onClick={() => setActiveTab('routes')}
                        className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'routes' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Route Config</span><span className="sm:hidden">Route</span>
                     </button>
                     <button 
                        onClick={() => setActiveTab('ports')}
                        className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'ports' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        <Layers className="w-4 h-4" /> <span className="hidden sm:inline">Port Manager</span><span className="sm:hidden">Port</span>
                     </button>
                     <button 
                        onClick={() => setActiveTab('system')}
                        className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'system' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        <Shield className="w-4 h-4" /> <span className="hidden sm:inline">System / API</span><span className="sm:hidden">API</span>
                     </button>
                </div>

                {/* --- SYSTEM / API TAB --- */}
                {activeTab === 'system' && (
                     <div className="p-4 md:p-6 space-y-6 flex-1 overflow-y-auto">
                         <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                             <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-2">
                                 <Key className="w-4 h-4" /> Gemini API Configuration
                             </h3>
                             <p className="text-xs text-indigo-600 leading-relaxed">
                                 Enter your paid Google Gemini API Key here. This connects the dashboard to your real Google Cloud billing account, unlocking higher rate limits and real-time data access.
                             </p>
                         </div>

                         <form onSubmit={handleSaveApiKey} className="space-y-4">
                             <div>
                                 <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Google Gemini API Key</label>
                                 <div className="relative">
                                     <input 
                                         type={showKey ? "text" : "password"}
                                         value={apiKey}
                                         onChange={(e) => setApiKey(e.target.value)}
                                         className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                         placeholder="AIzaSy..."
                                     />
                                     <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                                     <button 
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                     >
                                         {showKey ? 'HIDE' : 'SHOW'}
                                     </button>
                                 </div>
                                 <p className="text-[10px] text-slate-400 mt-2">
                                     Key is stored locally in your browser (LocalStorage). It is never sent to our servers.
                                 </p>
                             </div>

                             <div className="flex gap-3 pt-4">
                                 <button 
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
                                 >
                                     Save & Connect
                                 </button>
                                 {apiKey && (
                                     <button 
                                        type="button"
                                        onClick={handleClearApiKey}
                                        className="px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                                     >
                                         Remove
                                     </button>
                                 )}
                             </div>
                         </form>
                         
                         <div className="border-t border-slate-100 pt-6 mt-6">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">System Status</h4>
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-slate-600">API Connection</span>
                                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${apiKey ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                         {apiKey ? 'Authenticated' : 'Mock / Demo Mode'}
                                     </span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-slate-600">Model Version</span>
                                     <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">gemini-2.5-flash</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                )}

                {activeTab === 'routes' && (
                    <form onSubmit={handleSaveRoute} className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1 overflow-y-auto">
                        
                        {/* ROUTE MODE TOGGLES */}
                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                            <button
                                type="button"
                                onClick={() => handleRouteModeChange('OCEAN')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${routeConfigMode === 'OCEAN' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Ship className="w-4 h-4" /> Ocean Routes
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRouteModeChange('AIR')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${routeConfigMode === 'AIR' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Plane className="w-4 h-4" /> Air Routes
                            </button>
                        </div>

                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex justify-between items-center">
                                {routeConfigMode === 'OCEAN' ? 'Port-to-Port' : 'Airport-to-Airport'} Selection
                                {isFetchingRoute && <span className="text-indigo-500 text-[10px] animate-pulse">Auto-calculating...</span>}
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Origin {routeConfigMode === 'OCEAN' ? 'Port' : 'Airport'}</label>
                                <select 
                                    value={origin} onChange={(e) => handleOriginChange(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                                    required
                                >
                                    <option value="">Select Origin...</option>
                                    {terminals.filter(t => t.type === routeConfigMode).map(t => (
                                        <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Destination {routeConfigMode === 'OCEAN' ? 'Port' : 'Airport'}</label>
                                <select 
                                    value={destination} onChange={(e) => handleDestChange(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                                    required
                                >
                                    <option value="">Select Destination...</option>
                                    {terminals.filter(t => t.type === routeConfigMode).map(t => (
                                        <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* CONDITIONAL INPUTS BASED ON MODE */}
                        {routeConfigMode === 'OCEAN' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wide flex items-center gap-2">
                                    <Anchor className="w-3 h-3" /> Ocean Metrics
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Distance (NM)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={oceanDist} onChange={e => setOceanDist(Number(e.target.value))}
                                                disabled={isFetchingRoute}
                                                className={`w-full p-2 border border-slate-200 rounded text-sm transition-colors ${isFetchingRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                                                placeholder="6500"
                                            />
                                            {isFetchingRoute && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-indigo-500" />}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Time (Days)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={oceanTime} onChange={e => setOceanTime(e.target.value)}
                                                disabled={isFetchingRoute}
                                                className={`w-full p-2 border border-slate-200 rounded text-sm transition-colors ${isFetchingRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                                                placeholder="25-28"
                                            />
                                            {isFetchingRoute && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-indigo-500" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
                                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide flex items-center gap-2">
                                     <Plane className="w-3 h-3" /> Air Metrics
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Distance (km)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={airDist} onChange={e => setAirDist(Number(e.target.value))}
                                                disabled={isFetchingRoute}
                                                className={`w-full p-2 border border-slate-200 rounded text-sm transition-colors ${isFetchingRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                                                placeholder="9800"
                                            />
                                            {isFetchingRoute && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-indigo-500" />}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Time (Hrs)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={airTime} onChange={e => setAirTime(e.target.value)}
                                                disabled={isFetchingRoute}
                                                className={`w-full p-2 border border-slate-200 rounded text-sm transition-colors ${isFetchingRoute ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                                                placeholder="14-16"
                                            />
                                            {isFetchingRoute && <Loader2 className="absolute right-2 top-2 w-4 h-4 animate-spin text-indigo-500" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 mt-auto">
                            <button 
                                type="submit" 
                                disabled={isFetchingRoute}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors text-white ${routeConfigMode === 'OCEAN' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} ${isFetchingRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Save className="w-4 h-4" /> Save {routeConfigMode === 'OCEAN' ? 'Ocean' : 'Air'} Route
                            </button>
                             <button type="button" onClick={resetRouteForm} className="w-full mt-2 text-slate-500 text-xs hover:text-slate-800">
                                Clear Form
                            </button>
                        </div>
                    </form>
                ) : null}

                {/* --- PORT TAB CONTENT (Reuse existing) --- */}
                {activeTab === 'ports' && (
                    <form onSubmit={handleSavePort} className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1 overflow-y-auto flex flex-col">
                        
                        {/* PORT MODE TOGGLES */}
                         <div className="bg-slate-100 p-1 rounded-lg flex gap-1 mb-2">
                            <button
                                type="button"
                                onClick={() => handlePortConfigModeChange('OCEAN')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${portConfigMode === 'OCEAN' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Anchor className="w-4 h-4" /> Ocean Ports
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePortConfigModeChange('AIR')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${portConfigMode === 'AIR' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Plane className="w-4 h-4" /> Airports
                            </button>
                        </div>

                        {/* CREATE/EDIT TOGGLES */}
                        <div className="bg-slate-50 border border-slate-100 p-1 rounded-lg flex gap-1 mb-2">
                            <button
                                type="button"
                                onClick={() => handlePortModeSwitch('create')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${portMode === 'create' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Plus className="w-3 h-3" /> Create New
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePortModeSwitch('edit')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${portMode === 'edit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Edit3 className="w-3 h-3" /> Edit Existing
                            </button>
                        </div>

                        {portMode === 'edit' && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Select {portConfigMode === 'OCEAN' ? 'Port' : 'Airport'} to Modify</label>
                                <select 
                                    value={editingPortValue || ''} 
                                    onChange={(e) => handleSelectPortToEdit(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700"
                                >
                                    <option value="">-- Search / Select {portConfigMode === 'OCEAN' ? 'Port' : 'Airport'} --</option>
                                    {savedPorts.length > 0 && (
                                        <optgroup label="Custom Locations">
                                            {/* FILTER EDIT DROPDOWN BY MODE */}
                                            {savedPorts
                                                .filter(p => p.type === portConfigMode)
                                                .map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    <optgroup label="Global Database">
                                        {/* FILTER EDIT DROPDOWN BY MODE */}
                                        {terminals
                                            .filter(t => !savedPorts.some(sp => sp.value === t.value) && t.type === portConfigMode) 
                                            .map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))
                                        }
                                    </optgroup>
                                </select>
                            </div>
                        )}
                        
                        {portMode === 'create' && (
                             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 animate-in slide-in-from-top-2 duration-300">
                                Enter details below to add a brand new private warehouse or {portConfigMode === 'OCEAN' ? 'sea port' : 'airport'} location.
                            </div>
                        )}

                        <div className="border-t border-slate-100 my-1"></div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">{portConfigMode === 'OCEAN' ? 'Seaport' : 'Airport'} Name</label>
                            <input 
                                type="text" 
                                value={portName} onChange={e => setPortName(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none transition-colors"
                                placeholder={portConfigMode === 'OCEAN' ? "e.g. My Private Port" : "e.g. My Private Airstrip"}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">UN/LOCODE</label>
                                <input 
                                    type="text" 
                                    value={portCode} onChange={e => setPortCode(e.target.value.toUpperCase())}
                                    className="w-full p-2 border border-slate-200 rounded text-sm uppercase focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="USXXX"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                                <input 
                                    type="text" 
                                    value={portCountry} onChange={e => setPortCountry(e.target.value.toUpperCase())}
                                    className="w-full p-2 border border-slate-200 rounded text-sm uppercase focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="US"
                                    required
                                    maxLength={2}
                                />
                            </div>
                        </div>

                         <div className="pt-4 mt-auto">
                            {portMode === 'edit' ? (
                                <div className="flex gap-2">
                                    <button 
                                        type="submit" 
                                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                    >
                                        <Save className="w-4 h-4" /> 
                                        Save Changes
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={resetPortForm} 
                                        className="px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 bg-white"
                                        title="Clear Form"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="submit" 
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                >
                                    <Plus className="w-4 h-4" /> 
                                    Add New {portConfigMode === 'OCEAN' ? 'Port' : 'Airport'}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>

            {/* Right Panel: List - Stack below on mobile (order-2) */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col order-2 lg:order-2 h-full max-h-[calc(100vh-140px)]">
                <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <h2 className="text-base md:text-lg font-bold text-slate-800">
                        {activeTab === 'routes' ? 'Active Routes Config' : activeTab === 'ports' ? 'Custom Port Database' : 'System Configuration'}
                    </h2>
                    {activeTab !== 'system' && (
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                            {activeTab === 'routes' ? filteredSavedRoutes.length : filteredSavedPorts.length}
                        </span>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
                    {/* SYSTEM RIGHT PANEL CONTENT */}
                    {activeTab === 'system' && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                            <Shield className="w-16 h-16 mb-4 text-slate-200" />
                            <h3 className="text-lg font-bold text-slate-600 mb-2">Secure API Management</h3>
                            <p className="max-w-md mx-auto text-sm leading-relaxed">
                                Use the panel on the left to enter your Google Cloud credentials. 
                                <br/><br/>
                                <strong className="text-slate-500">Note:</strong> Without a key, the system runs in <span className="bg-amber-100 text-amber-700 px-1 rounded font-bold">Mock Mode</span> to prevent errors. Adding a key unlocks real-time satellite ship tracking, live congestion data, and news feeds.
                            </p>
                        </div>
                    )}

                    {activeTab === 'routes' && (
                        /* ROUTES LIST */
                        filteredSavedRoutes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                                <Database className="w-12 h-12 mb-3 text-slate-200" />
                                <p>No {routeConfigMode === 'OCEAN' ? 'Ocean' : 'Air'} routes configured.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredSavedRoutes.map((route) => {
                                    return (
                                        <div key={route.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 flex-wrap">
                                                    {routeConfigMode === 'OCEAN' ? <Ship className="w-4 h-4 text-blue-500" /> : <Plane className="w-4 h-4 text-indigo-500" />}
                                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 whitespace-nowrap">{route.origin}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 whitespace-nowrap">{route.destination}</span>
                                                </div>
                                                <div className="flex gap-2 self-end sm:self-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditRoute(route)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteRoute(route.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* CONDITIONAL METRIC DISPLAY */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                {routeConfigMode === 'OCEAN' && (
                                                    <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                                        <span className="text-[10px] font-bold text-blue-400 uppercase">Ocean Data</span>
                                                        <div className="flex flex-col sm:flex-row justify-between mt-1 gap-1">
                                                            <span className="text-slate-700">{route.oceanDistance.toLocaleString()} NM</span>
                                                            <span className="font-medium text-slate-900">{route.oceanTime} days</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {routeConfigMode === 'AIR' && (
                                                    <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100">
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Air Data</span>
                                                        <div className="flex flex-col sm:flex-row justify-between mt-1 gap-1">
                                                            <span className="text-slate-700">{route.airDistance.toLocaleString()} km</span>
                                                            <span className="font-medium text-slate-900">{route.airTime}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {activeTab === 'ports' && (
                        /* PORTS LIST */
                         filteredSavedPorts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                                <Anchor className="w-12 h-12 mb-3 text-slate-200" />
                                <p>No custom {portConfigMode === 'OCEAN' ? 'Ocean' : 'Air'} ports saved.</p>
                                <p className="text-xs mt-2 text-slate-400">Switch mode or add a new port to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredSavedPorts.map((port) => (
                                    <div key={port.value} className={`bg-white p-4 rounded-lg border shadow-sm flex justify-between items-center group ${editingPortValue === port.value ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${port.type === 'OCEAN' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                                {port.type === 'OCEAN' ? <Anchor className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{port.label.split(' - ')[0]}</h4>
                                                <p className="text-xs text-slate-500 truncate">{port.value}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setPortMode('edit');
                                                    handleSelectPortToEdit(port.value);
                                                }} 
                                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeletePort(port.value)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

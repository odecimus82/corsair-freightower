
import React, { useState, useEffect } from 'react';
import { Save, Trash2, Database, Edit3, Plus, ArrowRight, Anchor, MapPin, RefreshCw, XCircle, Settings, Layers, Loader2 } from 'lucide-react';
import { getCombinedTerminals } from '../services/portData';
import { calculateQuickMetrics } from '../services/geminiService';
import { RouteDB, PortDB } from '../services/routeStorage';
import { RouteOverride, TerminalOption } from '../types';

export const AdminSettings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'routes' | 'ports'>('routes');
    
    // --- ROUTE STATE ---
    const [savedRoutes, setSavedRoutes] = useState<RouteOverride[]>([]);
    const [terminals, setTerminals] = useState<TerminalOption[]>([]);
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [oceanDist, setOceanDist] = useState(0);
    const [oceanTime, setOceanTime] = useState('');
    const [airDist, setAirDist] = useState(0);
    const [airTime, setAirTime] = useState('');
    const [isFetchingRoute, setIsFetchingRoute] = useState(false);

    // --- PORT STATE ---
    const [savedPorts, setSavedPorts] = useState<TerminalOption[]>([]); // Only custom ports (for deletion logic)
    const [portMode, setPortMode] = useState<'create' | 'edit'>('edit'); // Default to edit to see list
    
    // Form Fields
    const [portName, setPortName] = useState('');
    const [portCode, setPortCode] = useState('');
    const [portCountry, setPortCountry] = useState('');
    const [portType, setPortType] = useState<'OCEAN' | 'AIR'>('OCEAN');
    const [editingPortValue, setEditingPortValue] = useState<string | null>(null);

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setSavedRoutes(RouteDB.getAll());
        setSavedPorts(PortDB.getAll());
        setTerminals(getCombinedTerminals()); // This loads ALL ports (Global + Custom)
    };

    // --- ROUTE HANDLERS ---
    
    const fetchRouteEstimates = async (o: string, d: string) => {
        if (!o || !d) return;
        setIsFetchingRoute(true);
        // Visual reset while loading
        setOceanDist(0);
        setAirDist(0);
        setOceanTime('');
        setAirTime('');
        
        try {
            // Using the new optimized function for faster results
            const data = await calculateQuickMetrics(o, d);
            setOceanDist(data.oceanDistance);
            setOceanTime(data.oceanTime);
            setAirDist(data.airDistance);
            setAirTime(data.airTime);
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
            oceanDistance: oceanDist,
            oceanTime: oceanTime,
            airDistance: airDist,
            airTime: airTime
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

    // --- PORT HANDLERS ---

    const handleModeSwitch = (mode: 'create' | 'edit') => {
        setPortMode(mode);
        resetPortForm();
    };

    const handleSavePort = (e: React.FormEvent) => {
        e.preventDefault();
        if (!portName || !portCountry) return;

        const formattedValue = `${portName}, ${portCountry}`;
        
        // 1. Construct the Port Object
        const newPort: TerminalOption = {
            label: `${portName} (${portCode || 'Custom'}) - ${portCountry}`,
            value: formattedValue,
            type: portType,
            country: portCountry,
            code: portCode
        };

        // 2. Logic for Update vs Create
        if (portMode === 'edit' && editingPortValue) {
            // If the ID (Name+Country) changed, we must delete the old record to avoid duplicates
            if (editingPortValue !== formattedValue) {
                // Only try delete if it was a custom port. Global ports won't be in DB, so delete does nothing safe.
                PortDB.delete(editingPortValue);
            }
        } else {
             // Create Mode Check: Prevent duplicates
            if (terminals.some(p => p.value === formattedValue && p.value !== editingPortValue)) {
                if (!window.confirm("A port with this name already exists. Overwrite?")) {
                    return;
                }
            }
        }

        // 3. Save (Updates LocalStorage)
        PortDB.save(newPort);
        
        refreshData();
        resetPortForm();
        // Optional: Stay in edit mode or switch? Let's clear and stay in current mode
        alert(portMode === 'create' ? "Port Created Successfully" : "Port Updated Successfully");
    };

    const handleSelectPortToEdit = (val: string) => {
        if (!val) {
            resetPortForm();
            return;
        }
        
        // Find in ALL terminals (Global + Custom)
        const target = terminals.find(p => p.value === val);
        if (target) {
            // Populate Form
            const rawName = target.value.includes(',') ? target.value.split(',')[0] : target.label.split(' (')[0];
            setPortName(rawName);
            setPortCode(target.code || '');
            setPortCountry(target.country);
            setPortType(target.type);
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
        setPortType('OCEAN');
        setEditingPortValue(null);
    };

    // Helper to identify if a selected port is custom or global
    const isSelectedCustom = editingPortValue ? savedPorts.some(p => p.value === editingPortValue) : false;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Panel: Edit Forms */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col order-1 lg:order-1 h-full max-h-[calc(100vh-140px)]">
                {/* Top Tabs */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl flex gap-1 flex-shrink-0">
                     <button 
                        onClick={() => setActiveTab('routes')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'routes' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        <Settings className="w-4 h-4" /> Route Config
                     </button>
                     <button 
                        onClick={() => setActiveTab('ports')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'ports' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                     >
                        <Layers className="w-4 h-4" /> Port Manager
                     </button>
                </div>

                {activeTab === 'routes' ? (
                    <form onSubmit={handleSaveRoute} className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1 overflow-y-auto">
                        <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex justify-between items-center">
                                Route Endpoints
                                {isFetchingRoute && <span className="text-indigo-500 text-[10px] animate-pulse">Auto-calculating...</span>}
                            </h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Origin Port/Hub</label>
                                <select 
                                    value={origin} onChange={(e) => handleOriginChange(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                                    required
                                >
                                    <option value="">Select Origin...</option>
                                    {terminals.map(t => (
                                        <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Destination Port/Hub</label>
                                <select 
                                    value={destination} onChange={(e) => handleDestChange(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white"
                                    required
                                >
                                    <option value="">Select Destination...</option>
                                    {terminals.map(t => (
                                        <option key={t.value + t.type} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ocean Data
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

                        <div className="space-y-4 border-t border-slate-100 pt-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Air Data
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

                        <div className="pt-2 mt-auto">
                            <button 
                                type="submit" 
                                disabled={isFetchingRoute}
                                className={`w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors ${isFetchingRoute ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Save className="w-4 h-4" /> Save Route
                            </button>
                             <button type="button" onClick={resetRouteForm} className="w-full mt-2 text-slate-500 text-xs hover:text-slate-800">
                                Clear Form
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSavePort} className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1 overflow-y-auto flex flex-col">
                        
                        {/* 1. Mode Switcher Tabs */}
                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 mb-2">
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('create')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${portMode === 'create' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Plus className="w-3 h-3" /> Create New
                            </button>
                            <button
                                type="button"
                                onClick={() => handleModeSwitch('edit')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${portMode === 'edit' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Edit3 className="w-3 h-3" /> Edit Existing
                            </button>
                        </div>

                        {/* 2. Mode Specific Content */}
                        {portMode === 'edit' && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Select Port to Modify</label>
                                <select 
                                    value={editingPortValue || ''} 
                                    onChange={(e) => handleSelectPortToEdit(e.target.value)}
                                    className="w-full p-2 border border-slate-200 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700"
                                >
                                    <option value="">-- Search / Select Port --</option>
                                    
                                    {/* Group 1: Custom Ports */}
                                    {savedPorts.length > 0 && (
                                        <optgroup label="Custom Ports">
                                            {savedPorts.map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {/* Group 2: Global Database */}
                                    <optgroup label="Global Database">
                                        {terminals
                                            .filter(t => !savedPorts.some(sp => sp.value === t.value)) // Hide duplicates if customized
                                            .map(p => (
                                                <option key={p.value} value={p.value}>{p.label}</option>
                                            ))
                                        }
                                    </optgroup>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Select any port (Global or Custom) to load its data into the form below.
                                </p>
                            </div>
                        )}
                        
                        {portMode === 'create' && (
                             <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 animate-in slide-in-from-top-2 duration-300">
                                Enter details below to add a brand new private warehouse or port location.
                            </div>
                        )}

                        <div className="border-t border-slate-100 my-1"></div>

                        {/* 3. Common Form Fields */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Port / Airport Name</label>
                            <input 
                                type="text" 
                                value={portName} onChange={e => setPortName(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded text-sm focus:border-indigo-500 outline-none transition-colors"
                                placeholder="e.g. My Private Warehouse"
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

                         <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Terminal Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPortType('OCEAN')}
                                    className={`p-2 rounded text-sm border transition-colors ${portType === 'OCEAN' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                                >
                                    Ocean Port
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPortType('AIR')}
                                    className={`p-2 rounded text-sm border transition-colors ${portType === 'AIR' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                >
                                    Airport
                                </button>
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
                                    Add New Port
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
                        {activeTab === 'routes' ? 'Active Routes' : 'Custom Ports'}
                    </h2>
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                        {activeTab === 'routes' ? savedRoutes.length : savedPorts.length}
                    </span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30">
                    {activeTab === 'routes' ? (
                        /* ROUTES LIST */
                        savedRoutes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                                <Database className="w-12 h-12 mb-3 text-slate-200" />
                                <p>No custom routes.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {savedRoutes.map((route) => (
                                    <div key={route.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 flex-wrap">
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
                                        
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-blue-50/50 p-2 rounded border border-blue-100">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase">Ocean</span>
                                                <div className="flex flex-col sm:flex-row justify-between mt-1 gap-1">
                                                    <span className="text-slate-700">{route.oceanDistance.toLocaleString()} NM</span>
                                                    <span className="font-medium text-slate-900">{route.oceanTime} days</span>
                                                </div>
                                            </div>
                                            <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100">
                                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Air</span>
                                                <div className="flex flex-col sm:flex-row justify-between mt-1 gap-1">
                                                    <span className="text-slate-700">{route.airDistance.toLocaleString()} km</span>
                                                    <span className="font-medium text-slate-900">{route.airTime}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        /* PORTS LIST */
                        savedPorts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                                <Anchor className="w-12 h-12 mb-3 text-slate-200" />
                                <p>No custom ports saved.</p>
                                <p className="text-xs mt-2 text-slate-400">Add a new port or edit a global one to see it here.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {savedPorts.map((port) => (
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


import React, { useState, useEffect, useRef } from 'react';
import { Settings, Bell, Anchor, Database, Menu, X, Navigation, Search, Check, Trash2, MapPin, LayoutDashboard, Radio, Activity, TrendingUp, AlertCircle, Ship, Plane, ArrowRight } from 'lucide-react';
import { PortIntelligence } from './components/PortIntelligence';
import { AdminSettings } from './components/AdminSettings';
import { LiveMarketFeed } from './components/LiveMarketFeed';
import { NotificationDB } from './services/routeStorage';
import { AppNotification } from './types';

const App: React.FC = () => {
  // Updated state to include 'dashboard'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ports' | 'calculator' | 'admin'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleTabChange = (tab: 'dashboard' | 'ports' | 'calculator' | 'admin') => {
    setActiveTab(tab);
    closeSidebar();
  };

  const loadNotifications = () => {
      setNotifications(NotificationDB.getAll());
  };

  useEffect(() => {
      // Initial Load
      loadNotifications();

      // Listen for updates from other components
      window.addEventListener('freightflow:update', loadNotifications);
      
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
          window.removeEventListener('freightflow:update', loadNotifications);
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);

  const handleBellClick = () => {
      setShowNotifications(!showNotifications);
      if (!showNotifications && unreadCount > 0) {
          NotificationDB.markAllRead();
          setTimeout(() => {
             loadNotifications(); 
          }, 500);
      }
  };

  const handleClearNotifications = () => {
      NotificationDB.clear();
      loadNotifications();
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
      switch(activeTab) {
          case 'dashboard': return 'Command Center';
          case 'ports': return 'Global Port Database';
          case 'calculator': return 'Smart Route Calculator';
          case 'admin': return 'System Configuration';
          default: return 'Dashboard';
      }
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans overflow-hidden">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 relative overflow-hidden group">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Corsair_logo_2020.svg" 
            alt="" 
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-20 h-auto opacity-10 brightness-0 invert pointer-events-none select-none transition-transform group-hover:scale-110 duration-500"
          />

          <div className="flex items-center relative z-10 pl-2">
            <span className="text-white font-bold text-lg tracking-tight">Freightflow</span>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-slate-400 hover:text-white relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
           <div className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Logistics Tools</div>
           
           {/* NEW DASHBOARD TAB */}
           <button 
            onClick={() => handleTabChange('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-indigo-200' : 'text-slate-400 group-hover:text-white'}`} />
            Live Dashboard
          </button>

           <button 
            onClick={() => handleTabChange('ports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${activeTab === 'ports' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Anchor className={`w-5 h-5 ${activeTab === 'ports' ? 'text-indigo-200' : 'text-slate-400 group-hover:text-white'}`} />
            Port Database
          </button>

          <button 
            onClick={() => handleTabChange('calculator')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${activeTab === 'calculator' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Navigation className={`w-5 h-5 ${activeTab === 'calculator' ? 'text-indigo-200' : 'text-slate-400 group-hover:text-white'}`} />
            Route Calculator
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="space-y-1 mb-4">
             <button 
                onClick={() => handleTabChange('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${activeTab === 'admin' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-white'}`}
            >
                <Database className="w-4 h-4" />
                Backend Admin
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative bg-[#f8fafc]">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 capitalize truncate tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={handleBellClick}
                    className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        {/* Notification Dropdown Content */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={handleClearNotifications}
                                    className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Clear All
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <p className="text-sm">No new notifications</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map((note) => (
                                        <div key={note.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${!note.read ? 'bg-blue-50/30' : ''}`}>
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${note.type === 'ROUTE' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {note.type === 'ROUTE' ? <Navigation className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className={`text-sm ${!note.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>{note.title}</p>
                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                        {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{note.message}</p>
                                            </div>
                                            {!note.read && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                         {notifications.length > 0 && (
                            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                <button 
                                    onClick={() => handleTabChange('admin')}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                                >
                                    Manage in Admin Settings &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button 
                onClick={() => handleTabChange('admin')}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8 h-full">

            {/* DASHBOARD (HOME) VIEW */}
            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full max-h-[800px]">
                    {/* Left: Live Feed (Takes 1/3) */}
                    <div className="lg:col-span-1 h-full min-h-[500px]">
                         <LiveMarketFeed />
                    </div>

                    {/* Right: Quick Actions / Overview (Takes 2/3) */}
                    <div className="lg:col-span-2 flex flex-col gap-6 h-full">
                        
                        {/* 1. Global Status Hero Card */}
                        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                            {/* Decorative Background Pattern (Dot Matrix World) */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                                backgroundSize: '24px 24px'
                            }}></div>
                            <div className="absolute right-0 bottom-0 opacity-10">
                                <Activity className="w-64 h-64 -mb-16 -mr-16 text-indigo-500" />
                            </div>

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">System Online</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-1">Corsair console</h2>
                                    <p className="text-slate-400 text-sm">Real-time supply chain monitoring</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <div className="text-2xl font-mono font-bold">{new Date().toLocaleDateString()}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">Today</div>
                                </div>
                            </div>

                            {/* KPI Row inside Hero */}
                            <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/50">
                                <div>
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Global Coverage</div>
                                    <div className="text-xl font-bold">142 <span className="text-xs font-normal text-slate-500">Ports</span></div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Avg. Latency</div>
                                    <div className="text-xl font-bold text-indigo-400">120<span className="text-xs font-normal text-slate-500">ms</span></div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Active Routes</div>
                                    <div className="text-xl font-bold text-emerald-400">24/7</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Key Actions Grid - Enhanced Visuals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                             {/* Port Intelligence Card */}
                             <button 
                                onClick={() => handleTabChange('ports')}
                                className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-indigo-300 transition-all text-left overflow-hidden h-full"
                             >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Anchor className="w-32 h-32 transform rotate-12 translate-x-8 -translate-y-8" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                                        <Anchor className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">Port Intelligence</h3>
                                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                                        Access infrastructure data for 100+ global terminals. Check congestion & capacity.
                                    </p>
                                </div>

                                <div className="relative z-10 mt-6 pt-4 border-t border-slate-50">
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Popular</div>
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">Shanghai</span>
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">Rotterdam</span>
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600 font-medium">LAX</span>
                                    </div>
                                </div>
                             </button>

                             {/* Route Optimizer Card */}
                             <button 
                                onClick={() => handleTabChange('calculator')}
                                className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-indigo-300 transition-all text-left overflow-hidden h-full"
                             >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Navigation className="w-32 h-32 transform -rotate-12 translate-x-8 -translate-y-8" />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                                        <Navigation className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">Route Optimizer</h3>
                                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                                        Network big data for distance, transit time, and multi-modal path planning.
                                    </p>
                                </div>

                                <div className="relative z-10 mt-6 pt-4 border-t border-slate-50">
                                     <div className="flex items-center gap-3 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                                         <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                         <div className="h-0.5 flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 relative">
                                             <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white p-0.5 rounded-full border border-indigo-200">
                                                 <Plane className="w-3 h-3 text-indigo-500" />
                                             </div>
                                         </div>
                                         <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                     </div>
                                </div>
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Port Database View */}
            {activeTab === 'ports' && (
                <PortIntelligence mode="lookup" />
            )}

            {/* Route Calculator View */}
            {activeTab === 'calculator' && (
                <PortIntelligence mode="route" />
            )}

            {/* Admin/Backend View */}
            {activeTab === 'admin' && (
                <AdminSettings />
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

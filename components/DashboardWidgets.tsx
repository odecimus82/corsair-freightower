import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Package, AlertTriangle, TrendingUp, Ship, Plane, Truck, Anchor } from 'lucide-react';
import { TransportMode, ShipmentStatus } from '../types';

// --- Types ---
interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  colorClass: string;
}

// --- Components ---

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon, colorClass }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {change && (
        <p className={`text-xs font-medium mt-2 flex items-center ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className="mr-1">{isPositive ? '↑' : '↓'}</span>
          {change} vs last month
        </p>
      )}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} text-white`}>
      {icon}
    </div>
  </div>
);

export const VolumeChart: React.FC = () => {
  const data = [
    { name: 'Jan', air: 40, sea: 24, truck: 24 },
    { name: 'Feb', air: 30, sea: 13, truck: 22 },
    { name: 'Mar', air: 20, sea: 58, truck: 22 },
    { name: 'Apr', air: 27, sea: 39, truck: 20 },
    { name: 'May', air: 18, sea: 48, truck: 21 },
    { name: 'Jun', air: 23, sea: 38, truck: 25 },
    { name: 'Jul', air: 34, sea: 43, truck: 21 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Shipment Volume by Mode</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="air" stackId="1" stroke="#3b82f6" fill="url(#colorAir)" />
          <Area type="monotone" dataKey="sea" stackId="1" stroke="#10b981" fill="url(#colorSea)" />
          <Area type="monotone" dataKey="truck" stackId="1" stroke="#f59e0b" fill="#fcd34d" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TransitTimeChart: React.FC = () => {
    const data = [
        { lane: 'CN-US (West)', days: 14 },
        { lane: 'CN-US (East)', days: 28 },
        { lane: 'CN-EU', days: 32 },
        { lane: 'CN-SEA', days: 5 },
        { lane: 'US-EU', days: 12 },
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96">
             <h3 className="text-lg font-semibold text-slate-800 mb-4">Avg. Transit Time (Ocean)</h3>
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="lane" type="category" width={100} tick={{fontSize: 12, fill: '#475569'}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="days" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
             </ResponsiveContainer>
        </div>
    );
}

export const ModeIcon: React.FC<{ mode: TransportMode }> = ({ mode }) => {
    switch (mode) {
        case TransportMode.AIR: return <Plane className="w-4 h-4" />;
        case TransportMode.OCEAN: return <Ship className="w-4 h-4" />;
        case TransportMode.TRUCK: return <Truck className="w-4 h-4" />;
        case TransportMode.RAIL: return <div className="text-xs font-bold">RAIL</div>;
        default: return <Package className="w-4 h-4" />;
    }
};

export const StatusBadge: React.FC<{ status: ShipmentStatus }> = ({ status }) => {
    const styles = {
        [ShipmentStatus.BOOKED]: 'bg-slate-100 text-slate-600 border-slate-200',
        [ShipmentStatus.IN_TRANSIT]: 'bg-blue-50 text-blue-700 border-blue-200',
        [ShipmentStatus.CUSTOMS_HOLD]: 'bg-orange-50 text-orange-700 border-orange-200',
        [ShipmentStatus.DELIVERED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        [ShipmentStatus.EXCEPTION]: 'bg-red-50 text-red-700 border-red-200',
        [ShipmentStatus.ARRIVED_PORT]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

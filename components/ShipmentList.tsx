import React, { useState } from 'react';
import { Shipment, TransportMode, ShipmentStatus, AIAnalysisResult, ETAPrediction } from '../types';
import { ModeIcon, StatusBadge } from './DashboardWidgets';
import { analyzeShipmentRisk, predictShipmentETA } from '../services/geminiService';
import { Search, Filter, Sparkles, AlertCircle, X, ChevronRight, Zap, Clock, HelpCircle } from 'lucide-react';

interface ShipmentListProps {
  shipments: Shipment[];
}

export const ShipmentList: React.FC<ShipmentListProps> = ({ shipments }) => {
  const [filter, setFilter] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // ETA Prediction State
  const [etaPredictions, setEtaPredictions] = useState<Record<string, ETAPrediction>>({});
  const [loadingEta, setLoadingEta] = useState<Record<string, boolean>>({});

  const filtered = shipments.filter(s => 
    s.reference.toLowerCase().includes(filter.toLowerCase()) ||
    s.origin.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.destination.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAiAnalysis = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setLoadingAi(true);
    setAiResult(null);
    
    // Simulate slight network feel + API call
    const result = await analyzeShipmentRisk(shipment);
    // Cast the generic object to our specific interface type safely
    setAiResult(result as unknown as AIAnalysisResult); 
    setLoadingAi(false);
  };

  const handlePredictETA = async (e: React.MouseEvent, shipment: Shipment) => {
      e.stopPropagation();
      setLoadingEta(prev => ({...prev, [shipment.id]: true}));
      try {
        const prediction = await predictShipmentETA(shipment);
        setEtaPredictions(prev => ({...prev, [shipment.id]: prediction}));
      } catch (err) {
          console.error(err);
      } finally {
        setLoadingEta(prev => ({...prev, [shipment.id]: false}));
      }
  }

  const closeAnalysis = () => {
    setSelectedShipment(null);
    setAiResult(null);
  }

  const getConfidenceColor = (score: number) => {
      if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
      return 'text-red-600 bg-red-50 border-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
      {/* Header & Filter */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
        <h2 className="text-lg font-semibold text-slate-800">Active Shipments</h2>
        <div className="flex gap-2">
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search BOL, Origin..." 
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Reference</th>
              <th className="px-6 py-4">Route</th>
              <th className="px-6 py-4">Mode</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">
                  <div className="flex items-center gap-1">
                      <span>Predicted ETA</span>
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                  </div>
              </th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{shipment.reference}</div>
                    <div className="text-xs text-slate-400">{shipment.carrier}</div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-slate-100 px-1 rounded">{shipment.origin.code}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-mono text-xs bg-slate-100 px-1 rounded">{shipment.destination.code}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <ModeIcon mode={shipment.mode} />
                        <span className="capitalize text-xs">{shipment.mode.toLowerCase()}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <StatusBadge status={shipment.status} />
                </td>
                <td className="px-6 py-4">
                    {loadingEta[shipment.id] ? (
                        <div className="flex items-center gap-2 text-indigo-600 animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">Calculating...</span>
                        </div>
                    ) : etaPredictions[shipment.id] ? (
                        <div className="flex flex-col items-start gap-1">
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-slate-800">
                                    {etaPredictions[shipment.id].predictedEta}
                                </span>
                                <div className="group relative">
                                    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                        {etaPredictions[shipment.id].reasoning}
                                    </div>
                                </div>
                             </div>
                             
                             <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getConfidenceColor(etaPredictions[shipment.id].confidenceScore)}`}>
                                 {etaPredictions[shipment.id].confidenceScore}% Confidence
                             </span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-slate-500">{shipment.eta}</span>
                            <button 
                                onClick={(e) => handlePredictETA(e, shipment)}
                                className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                                title="Use AI to predict actual ETA based on live conditions"
                            >
                                <Zap className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </td>
                <td className="px-6 py-4">
                    <button 
                        onClick={() => handleAiAnalysis(shipment)}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 text-xs font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                        View Details
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Modal */}
      {selectedShipment && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-indigo-200" />
                            <h3 className="text-lg font-bold">Gemini Logistics Intelligence</h3>
                        </div>
                        <p className="text-indigo-100 text-sm">Analyzing shipment {selectedShipment.reference}</p>
                    </div>
                    <button onClick={closeAnalysis} className="text-white/70 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {loadingAi ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 animate-pulse text-sm">Analyzing global data & routes...</p>
                        </div>
                    ) : aiResult ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                                    aiResult.riskLevel === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                                    aiResult.riskLevel === 'MEDIUM' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                    RISK LEVEL: {aiResult.riskLevel}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Analysis</h4>
                                <p className="text-slate-700 leading-relaxed text-sm">{aiResult.analysis}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" />
                                    Recommended Action
                                </h4>
                                <p className="text-slate-800 font-medium text-sm">{aiResult.action}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-red-500 py-4">Analysis Failed. Try again.</div>
                    )}
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                      <button onClick={closeAnalysis} className="text-sm font-medium text-slate-600 hover:text-indigo-600">Close Analysis</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

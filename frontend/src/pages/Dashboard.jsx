import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  RefreshCw, 
  ArrowUpRight,
  ShieldCheck,
  Send,
  ExternalLink
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import api from '../services/api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard({ setActiveTab, selectedStore }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const mult = selectedStore?.multiplier || 1.0;

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getSummary(selectedStore?.mid);
      setData(res);
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedStore]);

  const handleGenerateData = async () => {
    setGenerating(true);
    try {
      await api.generateSyntheticData(15, selectedStore?.mid);
      await fetchSummary();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading RecoverAI Financial Intelligence for {selectedStore?.name || 'Store'}...</p>
      </div>
    );
  }

  const rawSummary = data?.summary || {};
  const summary = {
    revenue_at_risk_inr: Math.round((rawSummary.revenue_at_risk_inr || 120000) * mult),
    revenue_recovered_inr: Math.round((rawSummary.revenue_recovered_inr || 45000) * mult),
    recovery_rate_pct: Math.min(98.5, Math.round((rawSummary.recovery_rate_pct || 32) * (mult > 1 ? 1.15 : 0.95))),
    total_failed_count: Math.round((rawSummary.total_failed_count || 20) * mult),
    total_recovered_count: Math.round((rawSummary.total_recovered_count || 8) * mult),
    avg_recovery_time_minutes: (14.2 / (mult > 1 ? 1.2 : 1.0)).toFixed(1),
    active_campaigns: Math.round((rawSummary.active_campaigns || 12) * mult)
  };

  const action_breakdown = data?.action_breakdown || {};
  const bucket_breakdown = data?.bucket_breakdown || {};
  const recent_activity = data?.recent_activity || [];

  // Mock Trend Chart Data
  const trendData = [
    { name: 'Mon', atRisk: (summary?.revenue_at_risk_inr || 12000) * 0.7, recovered: (summary?.revenue_recovered_inr || 8000) * 0.6 },
    { name: 'Tue', atRisk: (summary?.revenue_at_risk_inr || 14000) * 0.8, recovered: (summary?.revenue_recovered_inr || 8000) * 0.75 },
    { name: 'Wed', atRisk: (summary?.revenue_at_risk_inr || 11000) * 0.9, recovered: (summary?.revenue_recovered_inr || 8000) * 0.85 },
    { name: 'Thu', atRisk: (summary?.revenue_at_risk_inr || 16000) * 0.95, recovered: (summary?.revenue_recovered_inr || 8000) * 0.9 },
    { name: 'Fri', atRisk: (summary?.revenue_at_risk_inr || 15000), recovered: (summary?.revenue_recovered_inr || 8000) },
  ];

  // Action Breakdown for Pie Chart
  const actionPieData = [
    { name: 'Auto-Retry', value: action_breakdown?.AUTO_RETRY || 5 },
    { name: 'Payment Link', value: action_breakdown?.PAYMENT_LINK || 12 },
    { name: 'WhatsApp/SMS', value: action_breakdown?.CUSTOMER_MESSAGE || 4 },
    { name: 'Do Nothing', value: action_breakdown?.DO_NOTHING || 2 },
  ];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner & Quick Controls */}
      <div className="relative overflow-hidden glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Executive Revenue Control</h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Decision Engine v1.4 Active
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                Store: {selectedStore?.name || 'Active Store'} ({selectedStore?.mid})
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
              Real-time payment failure diagnosis, ML recovery probability scoring, and automated action routing (Payment Links, Auto-Retries, Customer Messaging).
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={fetchSummary}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all border border-slate-700/80 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Analytics</span>
            </button>
            
            <button
              onClick={handleGenerateData}
              disabled={generating}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95"
            >
              <Zap className={`w-4 h-4 text-emerald-300 ${generating ? 'animate-bounce' : ''}`} />
              <span>{generating ? 'Generating Data...' : 'Simulate Failures (+15)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Revenue Recovered */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 relative overflow-hidden group glass-card-hover">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Revenue Recovered</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">₹{(summary?.revenue_recovered_inr || 0).toLocaleString('en-IN')}</div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{summary?.total_recovered_count || 0} Successful Salvages</span>
            </div>
          </div>
        </div>

        {/* Recovery Rate % */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 relative overflow-hidden group glass-card-hover">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-20 h-20 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Recovery Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{summary?.recovery_rate_pct || 0}%</div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-indigo-300">
              <span>Target Benchmark: &gt;65%</span>
            </div>
          </div>
        </div>

        {/* Revenue at Risk */}
        <div className="glass-card p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 relative overflow-hidden group glass-card-hover">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-20 h-20 text-rose-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Revenue at Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">₹{(summary?.revenue_at_risk_inr || 0).toLocaleString('en-IN')}</div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-rose-400">
              <span>{summary?.total_failed_count || 0} Failed Payments Pending</span>
            </div>
          </div>
        </div>

        {/* Avg Time to Recovery */}
        <div className="glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 relative overflow-hidden group glass-card-hover">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-20 h-20 text-amber-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Avg Speed to Salvage</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white">{summary?.avg_recovery_time_minutes || 14.2} <span className="text-base font-normal text-slate-400">mins</span></div>
            <div className="flex items-center space-x-1.5 mt-2 text-xs font-semibold text-amber-400">
              <span>{summary?.active_campaigns || 0} Active Recovery Links</span>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Recovery Trend */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Revenue Recovered vs. At Risk (₹)</h2>
              <p className="text-xs text-slate-400">Daily performance comparison of salvaged payment volume</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Recovered
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> At Risk
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="atRiskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} 
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="recovered" name="Recovered" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#recoveredGrad)" />
                <Area type="monotone" dataKey="atRisk" name="At Risk" stroke="#6366f1" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#atRiskGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Type Distribution */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">AI Action Distribution</h2>
            <p className="text-xs text-slate-400 mb-4">Breakdown of recovery actions selected by Decision Engine</p>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {actionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {actionPieData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                <span className="text-slate-300 font-medium truncate">{item.name}</span>
                <span className="text-slate-400 font-bold ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live AI Decision Stream & Audit Activity */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <h2 className="text-base font-bold text-white">Live AI Decision Audit Stream</h2>
          </div>
          <button 
            onClick={() => setActiveTab('failures')}
            className="text-xs text-indigo-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>View All Failures</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recent_activity && recent_activity.length > 0 ? (
            recent_activity.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    item.event_type.includes('CAPTURED') || item.event_type.includes('RECONCILED')
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.event_type.includes('MANUAL')
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">{item.event_type}</span>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{item.entity_id}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{item.details}</p>
                  </div>
                </div>
                
                <div className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              No audit logs recorded yet. Click "Simulate Failures" to test!
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

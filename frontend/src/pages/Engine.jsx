import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  BarChart2, 
  Zap, 
  Database,
  Save,
  HelpCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

export default function Engine({ selectedStore }) {
  const [metrics, setMetrics] = useState(null);
  const [rules, setRules] = useState({
    min_retry_prob: 0.75,
    min_link_prob: 0.40,
    max_retries_per_order: 2,
    auto_link_high_value: true,
    high_value_threshold: 2000.0
  });
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        api.getMlMetrics(selectedStore?.mid),
        api.getDecisionRules(selectedStore?.mid)
      ]);
      setMetrics(mRes.metrics || {});
      setRules(rRes || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStore]);

  const handleTrain = async () => {
    setTraining(true);
    setSuccessMsg('');
    try {
      const res = await api.trainMlModel(750, selectedStore?.mid);
      setMetrics(res.metrics);
      setSuccessMsg(`ML Model retrained successfully for ${selectedStore?.name || 'store'}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setTraining(false);
    }
  };

  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      await api.updateDecisionRules(rules, selectedStore?.mid);
      setSuccessMsg(`Decision Rules Matrix updated successfully for ${selectedStore?.name || 'store'}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRules(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading RecoverAI Decision Engine Parameters...</p>
      </div>
    );
  }

  const featureChartData = metrics?.feature_importances?.map(item => ({
    name: item.feature.replace('cat__', '').replace('num__', ''),
    importance: Math.round(item.importance * 100)
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">Machine Learning & Decision Rules Engine</h1>
                {selectedStore && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {selectedStore.name} · {selectedStore.mode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Scikit-learn classification pipeline paired with business guardrails and probability thresholds.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? 'Retraining ML Model...' : 'Retrain ML Model'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Model Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Model Accuracy</span>
          <div className="text-2xl font-black text-white mt-1">{Math.round((metrics?.accuracy || 0.88) * 100)}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Random Forest Engine</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Precision Score</span>
          <div className="text-2xl font-black text-white mt-1">{Math.round((metrics?.precision || 0.85) * 100)}%</div>
          <span className="text-[10px] text-indigo-400 font-semibold">Low False Positive</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Recall Score</span>
          <div className="text-2xl font-black text-white mt-1">{Math.round((metrics?.recall || 0.91) * 100)}%</div>
          <span className="text-[10px] text-indigo-400 font-semibold">High Opportunity Catch</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
          <span className="text-[11px] font-bold text-slate-400 uppercase">ROC-AUC Index</span>
          <div className="text-2xl font-black text-white mt-1">{metrics?.roc_auc || 0.92}</div>
          <span className="text-[10px] text-amber-400 font-semibold">Separation Power</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40 col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Training Samples</span>
          <div className="text-2xl font-black text-white mt-1">{metrics?.training_samples || 750}</div>
          <span className="text-[10px] text-slate-400 font-semibold">Synthetic + Real Logs</span>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">ML Model Feature Importance Breakdown</h2>
            <p className="text-xs text-slate-400">Features with the highest impact on predicting payment recovery likelihood</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} interval={0} angle={-15} textAnchor="end" />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
              <Bar dataKey="importance" name="Importance Weight (%)" fill="#6366f1" radius={[6, 6, 0, 0]}>
                {featureChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decision Rules Matrix Configurator */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>Decision Matrix Thresholds & Guardrails</span>
            </h2>
            <p className="text-xs text-slate-400">Customize when RecoverAI triggers Auto-Retry vs Payment Links vs Messaging</p>
          </div>
          
          <button
            onClick={handleSaveRules}
            disabled={savingRules}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingRules ? 'Saving...' : 'Save Rule Thresholds'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Min Retry Prob */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Auto-Retry Probability Threshold</label>
              <span className="text-xs font-black text-indigo-400">{Math.round(rules.min_retry_prob * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.50" 
              max="0.95" 
              step="0.05"
              value={rules.min_retry_prob}
              onChange={(e) => setRules({ ...rules, min_retry_prob: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Trigger automatic gateway payment retry only if ML confidence exceeds this score.</p>
          </div>

          {/* Min Link Prob */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Payment Link Generation Threshold</label>
              <span className="text-xs font-black text-indigo-400">{Math.round(rules.min_link_prob * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.20" 
              max="0.80" 
              step="0.05"
              value={rules.min_link_prob}
              onChange={(e) => setRules({ ...rules, min_link_prob: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Generate Razorpay Payment Link and send via SMS/WhatsApp if probability exceeds score.</p>
          </div>

          {/* Max Retries Limit */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Max Recovery Attempts Per Order</label>
              <span className="text-xs font-black text-amber-400">{rules.max_retries_per_order} Attempts</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1"
              value={rules.max_retries_per_order}
              onChange={(e) => setRules({ ...rules, max_retries_per_order: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Safety cap to prevent endless retry loops and protect customer relationship.</p>
          </div>

          {/* High Cart Auto-Link */}
          <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-3 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">High-Value Cart Threshold (₹)</label>
              <span className="text-xs font-black text-emerald-400">₹{rules.high_value_threshold}</span>
            </div>
            <input 
              type="number" 
              value={rules.high_value_threshold}
              onChange={(e) => setRules({ ...rules, high_value_threshold: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <p className="text-[11px] text-slate-400">Always generate Payment Link for high-value carts regardless of probability score.</p>
          </div>

        </div>
      </div>

    </div>
  );
}

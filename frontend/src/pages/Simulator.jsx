import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Code, 
  ArrowRight,
  Sparkles,
  Terminal
} from 'lucide-react';
import api from '../services/api';

export default function Simulator({ selectedStore }) {
  const [presets, setPresets] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('TEMPORARY_TIMEOUT');
  const [firing, setFiring] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  useEffect(() => {
    api.getSimulatorPresets().then(res => setPresets(res || {})).catch(console.error);
    setExecutionResult(null); // Reset result when store changes
  }, [selectedStore]);

  const handleFireWebhook = async () => {
    setFiring(true);
    setExecutionResult(null);
    try {
      const res = await api.fireSimulatedWebhook(selectedPreset, null, selectedStore?.mid);
      setExecutionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setFiring(false);
    }
  };

  const presetInfo = presets[selectedPreset] || {};

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">Razorpay Webhook Sandbox & Execution Simulator</h1>
                {selectedStore && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {selectedStore.name} · {selectedStore.mid}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Generate real payment webhooks, compute HMAC-SHA256 signatures, and observe end-to-end AI execution.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleFireWebhook}
          disabled={firing}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-xl shadow-emerald-500/25 transition-all"
        >
          <Play className={`w-4 h-4 fill-white ${firing ? 'animate-spin' : ''}`} />
          <span>{firing ? 'Dispatching Webhook...' : 'Fire Webhook Event'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Webhook Configuration Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>Select Webhook Event Preset</span>
          </h2>

          <div className="space-y-3">
            {Object.keys(presets).map((key) => {
              const item = presets[key];
              const isSelected = selectedPreset === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedPreset(key)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.event === 'payment.captured' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {item.event}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  <div className="flex items-center space-x-3 mt-2 text-[11px] font-mono text-slate-400">
                    <span>Method: {item.method?.toUpperCase()}</span>
                    <span>•</span>
                    <span>Amount: ₹{(item.amount/100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>X-Razorpay-Signature Preview</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 break-all">
              HMAC-SHA256(secret="whsec_recoverai_buildathon_secret", body)
            </p>
          </div>
        </div>

        {/* Execution Waterfall Results */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>End-to-End Decision Waterfall</span>
          </h2>

          {executionResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between">
                <span>Webhook Event Processed Successfully</span>
                <span className="font-mono text-[10px]">Latency: {executionResult.result?.latency_ms} ms</span>
              </div>

              <div className="space-y-3">
                {executionResult.execution_waterfall?.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mt-0.5">
                      ✓
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{step.step}</div>
                      <div className="text-xs text-indigo-300 font-mono mt-0.5">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {executionResult.result?.payment_link_url && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
                  <span className="text-slate-400 font-semibold">Generated Razorpay Payment Link:</span>
                  <a 
                    href={executionResult.result.payment_link_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block text-emerald-400 font-mono font-bold hover:underline"
                  >
                    {executionResult.result.payment_link_url}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">
              <Play className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              Click "Fire Webhook Event" to test signature verification & decision engine logic.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

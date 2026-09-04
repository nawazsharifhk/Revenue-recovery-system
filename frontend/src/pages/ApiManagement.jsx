import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Activity, 
  Copy, 
  Check, 
  RefreshCw, 
  Lock, 
  Eye, 
  EyeOff, 
  Wifi, 
  Zap, 
  Save, 
  RotateCw,
  Server
} from 'lucide-react';
import api from '../services/api';

export default function ApiManagement({ selectedStore }) {
  const [keys, setKeys] = useState({
    key_id: '',
    raw_key_secret: '',
    raw_webhook_secret: '',
    mode: 'TEST',
    webhook_url: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiLogs, setApiLogs] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [kRes, lRes] = await Promise.all([
        api.getApiKeys(selectedStore?.mid),
        api.getApiLogs(20, selectedStore?.mid)
      ]);
      setKeys({
        key_id: kRes.key_id || '',
        raw_key_secret: kRes.raw_key_secret || '',
        raw_webhook_secret: kRes.raw_webhook_secret || '',
        mode: kRes.mode || 'TEST',
        webhook_url: kRes.webhook_url || 'http://localhost:8000/api/webhooks/razorpay'
      });
      setApiLogs(lRes.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [selectedStore]);

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.updateApiKeys({
        key_id: keys.key_id,
        key_secret: keys.raw_key_secret,
        webhook_secret: keys.raw_webhook_secret,
        mode: keys.mode
      }, selectedStore?.mid);
      setSuccessMsg(`Razorpay API Keys for ${selectedStore?.name || 'store'} saved successfully!`);
      fetchConfig();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(selectedStore?.mid);
      setTestResult(res);
      fetchConfig();
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  const handleRotateSecret = async () => {
    if (!window.confirm('Are you sure you want to rotate the HMAC Webhook secret?')) return;
    try {
      const res = await api.rotateWebhookSecret(selectedStore?.mid);
      setKeys(prev => ({ ...prev, raw_webhook_secret: res.new_webhook_secret }));
      setSuccessMsg(`New Webhook Secret generated for ${selectedStore?.name || 'store'}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(keys.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-400">Loading Razorpay API & Credentials Manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">Razorpay API & Integration Management</h1>
                {selectedStore && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    {selectedStore.name} · {selectedStore.mode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Manage Razorpay API Credentials, Webhook HMAC Secrets, Connectivity Diagnostics, and Execution Logs.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Wifi className={`w-4 h-4 ${testing ? 'animate-ping' : ''}`} />
            <span>{testing ? 'Pinging Razorpay...' : 'Test API Connection'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {testResult && (
        <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
          testResult.status.includes('CONNECTED') 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5" />
            <span>{testResult.message}</span>
          </div>
          <div className="font-mono text-[11px] bg-slate-900 px-3 py-1 rounded border border-slate-800">
            Latency: {testResult.latency_ms} ms
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credentials Form */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-emerald-400" />
            <span>Razorpay Credentials & Secret Keys</span>
          </h2>

          <form onSubmit={handleSaveKeys} className="space-y-5">
            
            {/* Mode Switcher */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">Environment Mode</label>
              <div className="flex items-center space-x-3">
                {['TEST', 'LIVE'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setKeys({ ...keys, mode: m })}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all border ${
                      keys.mode === m
                        ? m === 'LIVE'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                          : 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {m === 'LIVE' ? '🚀 Live Production Mode' : '🧪 Test Sandbox Mode'}
                  </button>
                ))}
              </div>
            </div>

            {/* Key ID */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={keys.key_id}
                onChange={(e) => setKeys({ ...keys, key_id: e.target.value })}
                placeholder="e.g. rzp_test_..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Key Secret */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Razorpay Key Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={keys.raw_key_secret}
                  onChange={(e) => setKeys({ ...keys, raw_key_secret: e.target.value })}
                  placeholder="Enter Key Secret"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Razorpay Webhook Secret (HMAC SHA-256)</label>
                <button
                  type="button"
                  onClick={handleRotateSecret}
                  className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotate Secret</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={keys.raw_webhook_secret}
                  onChange={(e) => setKeys({ ...keys, raw_webhook_secret: e.target.value })}
                  placeholder="whsec_..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Credentials'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Webhook URL & Connection Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>Webhook Endpoint Config</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Paste this Webhook Endpoint URL into your Razorpay Merchant Dashboard to listen for payment failures and captures.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 break-all space-y-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Target Webhook Listener URL</span>
              <div className="flex items-center justify-between">
                <span>{keys.webhook_url}</span>
                <button
                  onClick={copyWebhookUrl}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors ml-2"
                  title="Copy Webhook URL"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Subscribed Webhook Events:</span>
            <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
              <li><code className="text-indigo-400 font-mono">payment.failed</code></li>
              <li><code className="text-emerald-400 font-mono">payment.captured</code></li>
              <li><code className="text-amber-400 font-mono">payment_link.paid</code></li>
            </ul>
          </div>
        </div>

      </div>

      {/* API Call Execution Log Stream */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Outgoing API Execution Logs</h2>
          </div>
          <button 
            onClick={fetchConfig}
            className="text-xs text-slate-400 font-bold hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">HTTP Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Request / Response Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {apiLogs && apiLogs.length > 0 ? (
                apiLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">{log.endpoint}</td>
                    <td className="py-3 px-4 text-indigo-400 font-bold">{log.method}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.status_code === 200 || log.status_code === 201
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.status_code} OK
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{log.latency_ms} ms</td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{log.request_summary || log.response_summary}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    No API logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

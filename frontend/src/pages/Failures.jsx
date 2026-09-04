import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ExternalLink, 
  Zap, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../services/api';

export default function Failures({ selectedStore }) {
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bucketFilter, setBucketFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const mult = selectedStore?.multiplier || 1.0;

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const res = await api.getFailures({
        merchant_id: selectedStore?.mid,
        search: search || undefined,
        status: statusFilter || undefined,
        bucket: bucketFilter || undefined,
      });
      setFailures(res.items || []);
    } catch (err) {
      console.error('Error fetching failures:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, [search, statusFilter, bucketFilter, selectedStore]);

  const handleAction = async (eventId, actionType) => {
    setActionLoading(`${eventId}_${actionType}`);
    try {
      const res = await api.triggerAction(eventId, actionType);
      fetchFailures();
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({
          ...selectedEvent,
          latest_action: {
            action_type: actionType,
            status: 'ACTION_TAKEN',
            payment_link_url: res.payment_link_url,
            explanation: res.execution_notes
          }
        });
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkResolved = async (eventId) => {
    setActionLoading(`${eventId}_RESOLVE`);
    try {
      await api.markResolved(eventId);
      fetchFailures();
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({ ...selectedEvent, status: 'captured' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const getBucketBadge = (bucket) => {
    switch (bucket) {
      case 'TEMPORARY_BANK_OUTAGE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Soft Failure (Bank Outage)</span>;
      case 'CUSTOMER_ACTION_REQUIRED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Customer Action Required</span>;
      case 'HARD_CARD_FAILURE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Hard Card Failure</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{bucket || 'Unclassified'}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight">Failed Payments Recovery Desk</h1>
            {selectedStore && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                {selectedStore.name} · {selectedStore.mid}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">Inspect failure reasons, review AI predictions, and execute bounded recovery actions.</p>
        </div>
        <button
          onClick={fetchFailures}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Failures</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payment ID, order ID, customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="failed">Failed</option>
            <option value="captured">Captured (Recovered)</option>
          </select>

          <select
            value={bucketFilter}
            onChange={(e) => setBucketFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Failure Buckets</option>
            <option value="TEMPORARY_BANK_OUTAGE">Temporary Outage</option>
            <option value="CUSTOMER_ACTION_REQUIRED">Customer Action Required</option>
            <option value="HARD_CARD_FAILURE">Hard Card Failure</option>
          </select>
        </div>
      </div>

      {/* Failures Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3.5 px-4">Payment & Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Failure Category</th>
                <th className="py-3.5 px-4">AI Recovery Score</th>
                <th className="py-3.5 px-4">Current Action</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading payment failures...
                  </td>
                </tr>
              ) : failures.length > 0 ? (
                failures.map((item) => {
                  const probPct = Math.round((item.latest_action?.ml_probability || 0) * 100);
                  const isCaptured = item.status === 'captured';

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedEvent(item)}
                    >
                      <td className="py-4 px-4">
                        <div className="font-bold text-white font-mono">{item.razorpay_payment_id}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">Order: {item.order_id}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">{item.customer?.name}</div>
                        <div className="text-[11px] text-slate-400">{item.customer?.email}</div>
                      </td>

                      <td className="py-4 px-4 font-black text-white text-sm">
                        ₹{item.amount.toLocaleString('en-IN')}
                        <div className="text-[10px] uppercase font-semibold text-slate-400">{item.payment_method}</div>
                      </td>

                      <td className="py-4 px-4">
                        {getBucketBadge(item.failure_bucket)}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                            <div 
                              className={`h-full rounded-full ${
                                probPct >= 75 ? 'bg-emerald-400' : probPct >= 40 ? 'bg-indigo-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${probPct}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-slate-200">{probPct}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {isCaptured ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            RECOVERED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {item.latest_action?.action_type || 'PENDING'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {!isCaptured && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleAction(item.id, 'PAYMENT_LINK')}
                              disabled={actionLoading === `${item.id}_PAYMENT_LINK`}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Send className="w-3 h-3" />
                              <span>Link</span>
                            </button>

                            <button
                              onClick={() => handleMarkResolved(item.id)}
                              disabled={actionLoading === `${item.id}_RESOLVE`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-[11px] transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Resolve</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No failed payments found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Drawer / Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0f172a] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Transaction Diagnosis & Action Audit</span>
                <h2 className="text-lg font-black text-white font-mono mt-0.5">{selectedEvent.razorpay_payment_id}</h2>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Customer & Amount Row */}
              <div className="grid grid-cols-2 gap-4 glass-card p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Customer Profile</span>
                  <div className="text-sm font-bold text-white mt-1">{selectedEvent.customer?.name}</div>
                  <div className="text-xs text-slate-400">{selectedEvent.customer?.email}</div>
                  <div className="text-xs text-slate-400">{selectedEvent.customer?.phone}</div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Amount at Risk</span>
                  <div className="text-2xl font-black text-white mt-1">₹{selectedEvent.amount.toLocaleString('en-IN')}</div>
                  <div className="text-xs font-semibold text-slate-400">Method: {selectedEvent.payment_method.toUpperCase()}</div>
                </div>
              </div>

              {/* Failure Error Info */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Razorpay Error Code: {selectedEvent.failure_code}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{selectedEvent.failure_reason}</p>
              </div>

              {/* AI Recovery Recommendation */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>RecoverAI Prediction & Reasoning</span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-black bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                    Prob: {Math.round((selectedEvent.latest_action?.ml_probability || 0) * 100)}%
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {selectedEvent.latest_action?.explanation || 'Evaluated optimal recovery action based on customer lifetime value and gateway failure bucket.'}
                </p>

                {selectedEvent.latest_action?.payment_link_url && (
                  <div className="pt-2 border-t border-indigo-500/20 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Generated Payment Link:</span>
                    <a 
                      href={selectedEvent.latest_action.payment_link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>{selectedEvent.latest_action.payment_link_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Manual Actions Trigger Row */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  onClick={() => handleAction(selectedEvent.id, 'AUTO_RETRY')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700"
                >
                  Trigger Auto-Retry
                </button>
                <button
                  onClick={() => handleAction(selectedEvent.id, 'PAYMENT_LINK')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Dispatch Payment Link
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

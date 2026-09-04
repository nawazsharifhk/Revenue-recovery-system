import React, { useState } from 'react';
import { Sliders, Shield, UserX, FileText, CheckCircle2, Save } from 'lucide-react';

export default function Settings({ selectedStore }) {
  const [optOutEmail, setOptOutEmail] = useState('');
  const [optOutList, setOptOutList] = useState(['customer.optout@example.com']);
  const [blackoutHours, setBlackoutHours] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddOptOut = (e) => {
    e.preventDefault();
    if (optOutEmail && !optOutList.includes(optOutEmail)) {
      setOptOutList([...optOutList, optOutEmail]);
      setOptOutEmail('');
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">System Settings & Compliance Guardrails</h1>
                {selectedStore && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {selectedStore.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Configure global customer communication boundaries, opt-out lists, and safety policies.</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save System Settings'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Safety Guardrails */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span>Safety & Rate Limits</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Nighttime Messaging Blackout Hours</span>
                <span className="text-[11px] text-slate-400">Suppress automated WhatsApp/SMS reminders between 10 PM - 8 AM.</span>
              </div>
              <input
                type="checkbox"
                checked={blackoutHours}
                onChange={(e) => setBlackoutHours(e.target.checked)}
                className="w-5 h-5 accent-indigo-500 cursor-pointer rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Immediate Halt on Capture</span>
                <span className="text-[11px] text-slate-400">Automatically cancel active recovery links upon receiving payment.captured webhook.</span>
              </div>
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-5 h-5 accent-emerald-500 cursor-not-allowed rounded"
              />
            </div>
          </div>
        </div>

        {/* Customer Opt-Out Registry */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserX className="w-5 h-5 text-rose-400" />
            <span>Customer Communication Opt-Out Registry</span>
          </h2>

          <form onSubmit={handleAddOptOut} className="flex space-x-2">
            <input
              type="email"
              placeholder="Enter customer email to opt out..."
              value={optOutEmail}
              onChange={(e) => setOptOutEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
            >
              Add Opt-Out
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {optOutList.map((email, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                <span className="text-slate-300 font-mono">{email}</span>
                <button
                  onClick={() => setOptOutList(optOutList.filter(e => e !== email))}
                  className="text-slate-500 hover:text-rose-400 font-bold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

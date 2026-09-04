import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  BrainCircuit, 
  Webhook, 
  KeyRound, 
  Sliders, 
  Zap, 
  ShieldCheck,
  Bell,
  Search,
  ChevronDown,
  Activity,
  CheckCircle2,
  Store,
  Check,
  ExternalLink,
  Plus,
  ArrowRight,
  Sparkles,
  DollarSign,
  X
} from 'lucide-react';
import api from '../services/api';

export default function Navbar({ activeTab, setActiveTab, selectedStore, setSelectedStore, storesList }) {
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  
  const notifMenuRef = useRef(null);
  const storeMenuRef = useRef(null);

  const notificationsList = [
    {
      id: 1,
      title: 'Payment Salvaged!',
      desc: `₹4,999.00 recovered for ${selectedStore?.name || 'Active Store'}`,
      time: '2 mins ago',
      type: 'RECOVERY'
    },
    {
      id: 2,
      title: 'Webhook Event Ingested',
      desc: `payment.failed event processed for ${selectedStore?.mid || 'acc_recoverai'}`,
      time: '12 mins ago',
      type: 'WEBHOOK'
    },
    {
      id: 3,
      title: 'ML Model Retrained',
      desc: 'Model accuracy updated to 77.1% (Recall: 91.9%)',
      time: '1 hour ago',
      type: 'SYSTEM'
    }
  ];

  useEffect(() => {
    // Close dropdowns on outside click
    const handleClickOutside = (event) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setIsNotifMenuOpen(false);
      }
      if (storeMenuRef.current && !storeMenuRef.current.contains(event.target)) {
        setIsStoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    setIsStoreMenuOpen(false);
  };

  const handleMarkAllRead = () => {
    setUnreadNotifications(0);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'failures', label: 'Failures Desk', icon: AlertTriangle, badge: 'Live' },
    { id: 'engine', label: 'AI Engine', icon: BrainCircuit },
    { id: 'simulator', label: 'Webhook Sandbox', icon: Webhook },
    { id: 'api-management', label: 'API Management', icon: KeyRound, highlight: true },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const activeMode = selectedStore?.mode || 'TEST';

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-indigo-950/20">
      
      {/* Top Thin Notification Status Ribbon */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/10 px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-2 sm:px-4">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Razorpay Webhook Engine Synced ({selectedStore?.name})
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400 font-medium">Auto-retry & Payment Link Routing Active</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Active Store Mode:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                activeMode === 'LIVE' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {activeMode === 'LIVE' ? '🚀 LIVE PRODUCTION' : '🧪 TEST SANDBOX'}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[10px]">Latency: 14ms</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('overview')}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-400 opacity-60 blur-sm group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 rounded-xl bg-[#0f172a] border border-slate-700/80 flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-white tracking-tight">
                  Recover<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold tracking-wide">Razorpay Revenue Salvage Agent</p>
            </div>
          </div>

          {/* Segmented Navigation Bar */}
          <nav className="hidden lg:flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                      : item.highlight
                        ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>

                  {item.badge && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      API
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Mobile Menu */}
            <div className="lg:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2"
              >
                {navItems.map(item => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative" ref={notifMenuRef}>
              <button 
                onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                className={`relative h-10 w-10 rounded-xl flex items-center justify-center bg-slate-900/90 border transition-all ${
                  isNotifMenuOpen 
                    ? 'border-indigo-500 text-white bg-slate-800 shadow-lg shadow-indigo-500/20' 
                    : 'border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border-2 border-[#0b0f19]">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {isNotifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card rounded-2xl border border-slate-700/80 bg-[#0f172a] shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-extrabold text-white">System Notifications</span>
                    </div>
                    {unreadNotifications > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-indigo-400 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
                    {notificationsList.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {n.type === 'RECOVERY' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                            {n.type === 'WEBHOOK' && <Webhook className="w-3.5 h-3.5 text-indigo-400" />}
                            {n.type === 'SYSTEM' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                            <span className="text-xs font-bold text-white">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsNotifMenuOpen(false);
                        setActiveTab('simulator');
                      }}
                      className="w-full text-center py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Open Webhook Sandbox</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Perfectly Aligned Merchant Store Selector Dropdown with Text Truncation */}
            <div className="relative" ref={storeMenuRef}>
              <button 
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className={`hidden sm:flex items-center h-10 space-x-2.5 px-3 rounded-xl bg-slate-900/90 border cursor-pointer transition-all max-w-[220px] sm:max-w-[240px] shrink-0 overflow-hidden ${
                  isStoreMenuOpen 
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 bg-slate-800' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-slate-950 rounded-[5px] flex items-center justify-center">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>

                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-extrabold text-white truncate max-w-[130px] sm:max-w-[150px] block leading-tight">
                      {selectedStore?.name}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isStoreMenuOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate leading-none mt-0.5">
                    MID: {selectedStore?.mid}
                  </div>
                </div>
              </button>

              {/* Merchant Store Dropdown Menu */}
              {isStoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl border border-slate-700/80 bg-[#0f172a] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Select Active Merchant Store</span>
                    <span className="text-emerald-400 text-[10px]">{storesList?.length || 3} Stores</span>
                  </div>

                  <div className="py-1.5 space-y-1">
                    {storesList?.map((st) => (
                      <div
                        key={st.id || st.mid}
                        onClick={() => handleSelectStore(st)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                          selectedStore?.mid === st.mid 
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' 
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                          <Store className={`w-4 h-4 shrink-0 ${selectedStore?.mid === st.mid ? 'text-indigo-400' : 'text-slate-500'}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{st.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{st.mid}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                st.mode === 'LIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                              }`}>
                                {st.mode}
                              </span>
                            </div>
                          </div>
                        </div>
                        {selectedStore?.mid === st.mid && (
                          <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <button
                      onClick={() => {
                        setIsStoreMenuOpen(false);
                        setActiveTab('api-management');
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-xl flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5" />
                        Configure API Credentials
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}

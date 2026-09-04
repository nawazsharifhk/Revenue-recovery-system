import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Failures from './pages/Failures';
import Engine from './pages/Engine';
import Simulator from './pages/Simulator';
import ApiManagement from './pages/ApiManagement';
import Settings from './pages/Settings';

export const STORES_LIST = [
  { id: 'store_1', name: 'Acme D2C Store', mid: 'acc_recoverai_demo', mode: 'TEST', key_id: 'rzp_test_recoverai_demo', multiplier: 1.0 },
  { id: 'store_2', name: 'Fashion & Retail Store (High Volume)', mid: 'acc_fashion_live', mode: 'LIVE', key_id: 'rzp_live_fashion_prod', multiplier: 2.4 },
  { id: 'store_3', name: 'Global Subscription Club', mid: 'acc_sub_prod', mode: 'LIVE', key_id: 'rzp_live_sub_club', multiplier: 1.7 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStore, setSelectedStore] = useState(STORES_LIST[0]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Dashboard setActiveTab={setActiveTab} selectedStore={selectedStore} />;
      case 'failures':
        return <Failures selectedStore={selectedStore} />;
      case 'engine':
        return <Engine selectedStore={selectedStore} />;
      case 'simulator':
        return <Simulator selectedStore={selectedStore} />;
      case 'api-management':
        return <ApiManagement selectedStore={selectedStore} />;
      case 'settings':
        return <Settings selectedStore={selectedStore} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} selectedStore={selectedStore} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        storesList={STORES_LIST}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {renderContent()}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0b0f19] py-6 text-center text-xs text-slate-500">
        <p>RecoverAI v1.0 • Intelligent Revenue Recovery Agent for Razorpay Infrastructure</p>
      </footer>
    </div>
  );
}

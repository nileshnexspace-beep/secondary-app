
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Minus, BarChart3, History, Sparkles, 
  LayoutDashboard, User, LogOut, CheckCircle2,
  Building2, Home, Store, Briefcase, Users, UserCheck,
  TrendingUp, PieChart, Download, FileSpreadsheet, Trash2,
  Smartphone, Share, Info
} from 'lucide-react';
import { Category, InventoryLog, DailyAggregation, Source } from './types.ts';
import { CATEGORIES, CATEGORY_COLORS, INITIAL_LOGS } from './constants.ts';
import { InventoryChart } from './components/InventoryChart.tsx';
import { getPortfolioInsights } from './services/geminiService.ts';

const STORAGE_KEY = 'estatepulse_inventory_logs';
const USER_KEY = 'estatepulse_active_user';

const App: React.FC = () => {
  // Persistence Initialization
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem(USER_KEY));
  const [loginInput, setLoginInput] = useState('');
  const [logs, setLogs] = useState<InventoryLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'insights'>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Bulk Entry State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entrySource, setEntrySource] = useState<Source>('Owner');
  const [entryCounts, setEntryCounts] = useState<Record<Category, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>)
  );

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    if (currentUser) localStorage.setItem(USER_KEY, currentUser);
    else localStorage.removeItem(USER_KEY);
  }, [currentUser]);

  const totalsByCategory = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => {
      acc[cat] = logs.filter(l => l.category === cat).reduce((sum, l) => sum + l.count, 0);
      return acc;
    }, {} as Record<Category, number>);
  }, [logs]);

  const ownerTotals = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      count: logs.filter(l => l.source === 'Owner' && l.category === cat).reduce((sum, l) => sum + l.count, 0)
    }));
  }, [logs]);

  const brokerTotals = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      count: logs.filter(l => l.source === 'Broker' && l.category === cat).reduce((sum, l) => sum + l.count, 0)
    }));
  }, [logs]);

  const aggregateDailyData = (filteredLogs: InventoryLog[]) => {
    const grouped: Record<string, DailyAggregation> = {};
    filteredLogs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = { date: log.date };
        CATEGORIES.forEach(c => grouped[log.date][c] = 0);
      }
      grouped[log.date][log.category] = (Number(grouped[log.date][log.category]) || 0) + log.count;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const dailyDataOwner = useMemo(() => aggregateDailyData(logs.filter(l => l.source === 'Owner')), [logs]);
  const dailyDataBroker = useMemo(() => aggregateDailyData(logs.filter(l => l.source === 'Broker')), [logs]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setCurrentUser(loginInput.trim());
    }
  };

  const updateCount = (cat: Category, delta: number) => {
    setEntryCounts(prev => ({
      ...prev,
      [cat]: Math.max(0, prev[cat] + delta)
    }));
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntries: InventoryLog[] = [];
    
    (Object.entries(entryCounts) as [Category, number][]).forEach(([cat, count]) => {
      if (count > 0) {
        newEntries.push({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2),
          date: entryDate,
          category: cat,
          source: entrySource,
          count: count,
          recordedBy: currentUser || 'Unknown'
        });
      }
    });

    if (newEntries.length === 0) return;

    setLogs(prev => [...newEntries, ...prev]);
    setEntryCounts(CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>));
    setIsAdding(false);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Source', 'Count', 'RecordedBy'];
    const rows = logs.map(l => [l.date, l.category, l.source, l.count, l.recordedBy].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EstatePulse_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearLogs = () => {
    if (confirm("Are you sure you want to clear all local logs? This cannot be undone.")) {
      setLogs(INITIAL_LOGS);
    }
  };

  const generateInsights = async () => {
    setIsGeneratingInsights(true);
    const result = await getPortfolioInsights(logs);
    setInsights(result);
    setIsGeneratingInsights(false);
    setActiveTab('insights');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden page-transition">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-900 p-6 rounded-3xl mb-6 text-white shadow-2xl rotate-3">
              <BarChart3 size={40} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">EstatePulse</h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Professional Inventory Hub</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">Team Identity</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  required
                  placeholder="Full Name"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-900"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all active:scale-[0.98] shadow-xl shadow-blue-100 uppercase tracking-widest text-sm"
            >
              Access Dashboard
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold tracking-tight">
              DATA IS STORED LOCALLY ON THIS DEVICE
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row page-transition">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 md:sticky md:top-0 md:h-screen z-30 flex flex-col shadow-sm">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 leading-none">EstatePulse</h1>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Team Portal</span>
            </div>
          </div>
          
          <nav className="space-y-3">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics' },
              { id: 'history', icon: History, label: 'Audit Log' },
              { id: 'insights', icon: Sparkles, label: 'AI Strategy' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all font-black ${activeTab === item.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-300 scale-[1.02]' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <item.icon size={22} />
                <span className="text-sm uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <button 
              onClick={() => setIsInstalling(true)}
              className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <Smartphone size={18} />
              Download App
            </button>
          </div>
        </div>

        <div className="mt-auto p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center gap-4 border border-slate-100 group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-lg font-black text-white shadow-xl group-hover:rotate-6 transition-transform">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Member</p>
              <p className="text-base font-black truncate text-slate-900 leading-tight">{currentUser}</p>
            </div>
            <button onClick={() => setCurrentUser(null)} className="ml-auto p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut size={20} />
            </button>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-4 bg-blue-600 text-white py-6 rounded-[2rem] font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-95 uppercase tracking-widest text-xs border-b-4 border-blue-800"
          >
            <Plus size={24} />
            Log New Report
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 lg:p-20 max-w-screen-2xl mx-auto w-full pb-32 md:pb-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Real-Time Pulse</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 capitalize tracking-tighter leading-none">{activeTab}</h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all font-black border-2 border-emerald-100 shadow-sm text-xs uppercase tracking-widest"
            >
              <FileSpreadsheet size={18} /> Excel Export
            </button>
            <button 
              onClick={generateInsights}
              disabled={isGeneratingInsights}
              className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-black border-2 border-slate-200 shadow-sm text-xs uppercase tracking-widest"
            >
              {isGeneratingInsights ? 'Analysing...' : <><Sparkles size={18} className="text-indigo-600" /> Market AI</>}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-24">
            {/* Charts Section */}
            <section className="page-transition">
              <div className="flex items-center gap-5 mb-10">
                <div className="bg-blue-600 p-4 rounded-[1.5rem] text-white shadow-2xl shadow-blue-200">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Owner Portfolio</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Directly Sourced Inventory</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-10">
                    <PieChart size={22} className="text-blue-600" />
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Asset Distribution</h4>
                  </div>
                  <InventoryChart data={ownerTotals} type="horizontal-bar" />
                </div>
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-10">
                    <TrendingUp size={22} className="text-blue-600" />
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Daily Growth Scale</h4>
                  </div>
                  <InventoryChart data={dailyDataOwner} type="line" />
                </div>
              </div>
            </section>

            <section className="page-transition" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-5 mb-10">
                <div className="bg-emerald-600 p-4 rounded-[1.5rem] text-white shadow-2xl shadow-emerald-200">
                  <Users size={32} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Broker Network</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Collaborative Channel Assets</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-10">
                    <PieChart size={22} className="text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Category Performance</h4>
                  </div>
                  <InventoryChart data={brokerTotals} type="horizontal-bar" />
                </div>
                <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-10">
                    <TrendingUp size={22} className="text-emerald-600" />
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-[0.2em]">Network Intake Velocity</h4>
                  </div>
                  <InventoryChart data={dailyDataBroker} type="line" />
                </div>
              </div>
            </section>

            <section className="page-transition" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <LayoutDashboard size={20} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Global Portfolio Matrix</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-50 shadow-sm relative overflow-hidden group hover:border-blue-500 transition-all hover:-translate-y-2">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-30 transition-all group-hover:scale-125 group-hover:rotate-12">
                      {cat.includes('Office') ? <Briefcase size={48}/> : cat.includes('Showroom') ? <Store size={48}/> : cat.includes('Apartment') ? <Home size={48}/> : <Building2 size={48}/>}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3 truncate">{cat}</span>
                    <div className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{totalsByCategory[cat]}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ... Other Tabs remain the same ... */}
        {activeTab === 'history' && (
          <div className="space-y-8 page-transition">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail</h3>
                  <p className="text-sm font-medium text-slate-500">History of all reported inventories on this device.</p>
               </div>
               <button onClick={clearLogs} className="flex items-center gap-2 px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                 <Trash2 size={16} /> Clear All Records
               </button>
            </div>
            <div className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Log Date</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category Type</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Channel</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Units</th>
                      <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.slice().reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-7 text-sm font-bold text-slate-700">{log.date}</td>
                        <td className="px-10 py-7"><span className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: CATEGORY_COLORS[log.category] + '15', color: CATEGORY_COLORS[log.category] }}>{log.category}</span></td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-3">
                            {log.source === 'Owner' ? <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-100"><UserCheck size={14}/></div> : <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg shadow-emerald-100"><Users size={14}/></div>}
                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${log.source === 'Owner' ? 'text-blue-600' : 'text-emerald-600'}`}>{log.source}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-lg font-black text-slate-900 text-right">+{log.count}</td>
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-md">{log.recordedBy.charAt(0).toUpperCase()}</div>
                              <span className="text-xs font-bold text-slate-600">{log.recordedBy}</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white p-16 md:p-24 rounded-[4rem] border-2 border-slate-50 max-w-5xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden page-transition">
             <div className="flex items-center gap-6 mb-12">
                <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-2xl"><Sparkles size={32} /></div>
                <div><h3 className="text-4xl font-black tracking-tighter text-slate-900">Portfolio Analysis</h3><p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">Generated by EstatePulse AI</p></div>
              </div>
              <div className="prose prose-slate max-w-none"><p className="text-slate-600 leading-relaxed text-2xl font-medium italic">{insights || "Tap the 'Market AI' button in the header to synthesize your data into a strategic outlook."}</p></div>
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-8 right-8 md:hidden z-50">
        <button onClick={() => setIsAdding(true)} className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] flex items-center justify-center active:scale-90 transition-all border-4 border-white">
          <Plus size={32} />
        </button>
      </div>

      {/* Installation Helper Modal */}
      {isInstalling && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-[200]">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 page-transition border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">How to Download</h3>
              <button onClick={() => setIsInstalling(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 h-fit"><Smartphone size={28} /></div>
                <div>
                  <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-xs">On iPhone (Safari)</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Tap the <Share size={16} className="inline mx-1 text-blue-500" /> Share icon and select <strong className="text-slate-900">"Add to Home Screen"</strong>.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 h-fit"><Info size={28} /></div>
                <div>
                  <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-xs">On Android (Chrome)</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">Tap the menu dots <strong className="text-slate-900">(⋮)</strong> and select <strong className="text-slate-900">"Install App"</strong> or "Add to Home Screen".</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsInstalling(false)}
              className="w-full mt-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Bulk Entry Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center p-4 z-[100]">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-[0_0_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[92vh] border border-white/20 page-transition">
            <div className="p-10 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Record Findings</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Batch entry for multiple assets</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-900 p-3 hover:bg-white rounded-3xl transition-all shadow-sm border-2 border-transparent hover:border-slate-100">
                <Minus size={32} className="rotate-45" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scroll flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reporting Date</label>
                  <input 
                    type="date" 
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-slate-900 outline-none focus:border-blue-500 transition-all text-lg"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Source</label>
                  <div className="flex gap-4 p-2 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                    <button onClick={() => setEntrySource('Owner')} className={`flex-1 flex items-center justify-center gap-4 py-4 rounded-[1.5rem] text-sm font-black transition-all ${entrySource === 'Owner' ? 'bg-white shadow-xl text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><UserCheck size={20} /> OWNER</button>
                    <button onClick={() => setEntrySource('Broker')} className={`flex-1 flex items-center justify-center gap-4 py-4 rounded-[1.5rem] text-sm font-black transition-all ${entrySource === 'Broker' ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}><Users size={20} /> BROKER</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {CATEGORIES.map(cat => (
                  <div key={cat} className="p-8 bg-white rounded-[2.5rem] border-2 border-slate-50 group hover:border-blue-200 transition-all shadow-sm hover:shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{cat}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => updateCount(cat, -1)} className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center hover:bg-slate-100 text-slate-600 active:scale-90 transition-all"><Minus size={24} /></button>
                      <input type="number" min="0" value={entryCounts[cat]} onChange={(e) => setEntryCounts(prev => ({...prev, [cat]: Math.max(0, parseInt(e.target.value) || 0)}))} className="flex-1 bg-slate-50 border-2 border-slate-100 h-14 rounded-2xl text-center font-black text-xl text-slate-900 focus:border-blue-500 outline-none transition-all" />
                      <button onClick={() => updateCount(cat, 1)} className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-slate-800 text-white shadow-2xl active:scale-90 transition-all"><Plus size={24} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-8 items-center">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-[1.2rem] bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-2xl font-black text-xl">{currentUser.charAt(0).toUpperCase()}</div>
                 <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Operator</p><p className="text-lg font-black text-slate-900 leading-none">{currentUser}</p></div>
              </div>
              <button onClick={handleBulkSubmit} className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-4 px-16 py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] text-xs border-b-4 border-blue-800" disabled={Object.values(entryCounts).every(c => c === 0)}>
                <CheckCircle2 size={24} /> Archive Daily Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

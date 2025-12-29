
import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Plus, Minus, BarChart3, History, Sparkles, 
  LayoutDashboard, User, LogOut, CheckCircle2,
  Building2, Home, Store, Briefcase, Users, UserCheck,
  TrendingUp, PieChart, Download, FileSpreadsheet, Trash2,
  Smartphone, Share, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, Cell 
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
type Category = 
  | 'Office Sale' | 'Office Lease' | 'Showroom Sale' | 'Showroom Lease' 
  | 'Apartment Sale' | 'Apartment Rent' | 'Bunglow Sale' | 'Bunglow Rent'
  | 'Penthouse Rent' | 'Duplex Rent';

type Source = 'Owner' | 'Broker';

interface InventoryLog {
  id: string;
  date: string;
  category: Category;
  source: Source;
  count: number;
  recordedBy: string;
}

interface DailyAggregation {
  date: string;
  [key: string]: string | number;
}

// --- CONSTANTS ---
const CATEGORIES: Category[] = [
  'Office Sale', 'Office Lease', 'Showroom Sale', 'Showroom Lease',
  'Apartment Sale', 'Apartment Rent', 'Bunglow Sale', 'Bunglow Rent',
  'Penthouse Rent', 'Duplex Rent'
];

const CATEGORY_COLORS: Record<Category, string> = {
  'Office Sale': '#3b82f6',
  'Office Lease': '#60a5fa',
  'Showroom Sale': '#10b981',
  'Showroom Lease': '#34d399',
  'Apartment Sale': '#f59e0b',
  'Apartment Rent': '#fbbf24',
  'Bunglow Sale': '#8b5cf6',
  'Bunglow Rent': '#a78bfa',
  'Penthouse Rent': '#ec4899',
  'Duplex Rent': '#f43f5e',
};

const INITIAL_LOGS: InventoryLog[] = [
  // System Baseline Data (Owner)
  { id: 'b1', date: '2024-05-20', category: 'Showroom Sale', source: 'Owner', count: 305, recordedBy: 'System Baseline' },
  { id: 'b2', date: '2024-05-20', category: 'Showroom Lease', source: 'Owner', count: 1274, recordedBy: 'System Baseline' },
  { id: 'b3', date: '2024-05-20', category: 'Office Sale', source: 'Owner', count: 290, recordedBy: 'System Baseline' },
  { id: 'b4', date: '2024-05-20', category: 'Office Lease', source: 'Owner', count: 487, recordedBy: 'System Baseline' },
  { id: 'b5', date: '2024-05-20', category: 'Bunglow Sale', source: 'Owner', count: 247, recordedBy: 'System Baseline' },
  { id: 'b6', date: '2024-05-20', category: 'Apartment Sale', source: 'Owner', count: 296, recordedBy: 'System Baseline' },
  // System Baseline Data (Broker)
  { id: 'b7', date: '2024-05-20', category: 'Office Lease', source: 'Broker', count: 147, recordedBy: 'System Baseline' },
  { id: 'b8', date: '2024-05-20', category: 'Bunglow Sale', source: 'Broker', count: 168, recordedBy: 'System Baseline' },
  { id: 'b9', date: '2024-05-20', category: 'Apartment Sale', source: 'Broker', count: 137, recordedBy: 'System Baseline' },
  { id: 'b10', date: '2024-05-20', category: 'Apartment Rent', source: 'Broker', count: 147, recordedBy: 'System Baseline' },
];

// --- SERVICES ---
const getPortfolioInsights = async (logs: InventoryLog[]) => {
  if (typeof process === 'undefined' || !process.env.API_KEY) return "AI Insights unavailable: API Key missing.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataSummary = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + log.count;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `As a real estate analyst, provide a 3-sentence summary of this data: ${JSON.stringify(dataSummary)}`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text;
  } catch (e) { return "Unable to reach AI assistant."; }
};

// --- COMPONENTS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
        <p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const InventoryChart: React.FC<{ data: any[], type?: string }> = ({ data, type = 'bar' }) => {
  if (type === 'horizontal-bar') {
    return (
      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category as Category] || '#cbd5e1'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold' }} />
          {CATEGORIES.slice(0, 5).map((cat) => (
            <Line key={cat} type="monotone" dataKey={cat} stroke={CATEGORY_COLORS[cat]} strokeWidth={3} dot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('ep_user'));
  const [loginInput, setLoginInput] = useState('');
  const [logs, setLogs] = useState<InventoryLog[]>(() => {
    const saved = localStorage.getItem('ep_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'insights'>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [insights, setInsights] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entrySource, setEntrySource] = useState<Source>('Owner');
  const [entryCounts, setEntryCounts] = useState<Record<Category, number>>(
    CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>)
  );

  useEffect(() => { localStorage.setItem('ep_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { if (currentUser) localStorage.setItem('ep_user', currentUser); }, [currentUser]);

  const ownerTotals = useMemo(() => CATEGORIES.map(cat => ({
    category: cat, count: logs.filter(l => l.source === 'Owner' && l.category === cat).reduce((sum, l) => sum + l.count, 0)
  })), [logs]);

  const brokerTotals = useMemo(() => CATEGORIES.map(cat => ({
    category: cat, count: logs.filter(l => l.source === 'Broker' && l.category === cat).reduce((sum, l) => sum + l.count, 0)
  })), [logs]);

  const aggregateDaily = (src: Source) => {
    const grouped: Record<string, any> = {};
    logs.filter(l => l.source === src).forEach(log => {
      if (!grouped[log.date]) grouped[log.date] = { date: log.date };
      grouped[log.date][log.category] = (grouped[log.date][log.category] || 0) + log.count;
    });
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntries = Object.entries(entryCounts)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => ({
        id: Math.random().toString(36).substr(2, 9),
        date: entryDate, category: cat as Category, source: entrySource, count, recordedBy: currentUser || 'Team'
      }));
    if (newEntries.length) setLogs(prev => [...newEntries, ...prev]);
    setIsAdding(false);
    setEntryCounts(CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as Record<Category, number>));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden page-transition">
          <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex flex-col items-center mb-10">
            <div className="bg-slate-900 p-6 rounded-3xl mb-6 text-white shadow-2xl rotate-3"><BarChart3 size={40} /></div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">EstatePulse</h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Inventory Hub</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (loginInput) setCurrentUser(loginInput); }} className="space-y-6">
            <input 
              type="text" required placeholder="Full Name" value={loginInput} onChange={(e) => setLoginInput(e.target.value)}
              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 outline-none font-bold"
            />
            <button className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-sm">Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row page-transition">
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 md:sticky md:top-0 md:h-screen flex flex-col shadow-sm p-8">
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-slate-900 p-3 rounded-2xl text-white"><BarChart3 size={24} /></div>
          <div><h1 className="text-2xl font-black tracking-tighter">EstatePulse</h1><span className="text-[9px] font-black text-blue-600 uppercase">Portal</span></div>
        </div>
        <nav className="space-y-3 flex-1">
          {['dashboard', 'history', 'insights'].map(id => (
            <button key={id} onClick={() => setActiveTab(id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest ${activeTab === id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
              {id === 'dashboard' ? <LayoutDashboard size={20}/> : id === 'history' ? <History size={20}/> : <Sparkles size={20}/>} {id}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAdding(true)} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black shadow-2xl uppercase tracking-widest text-xs mt-8">+ Log Report</button>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:p-20">
        <header className="flex justify-between items-center mb-16">
          <h2 className="text-5xl font-black capitalize tracking-tighter">{activeTab}</h2>
          <div className="flex gap-4">
             <button onClick={() => { setIsGenerating(true); getPortfolioInsights(logs).then(setInsights).finally(() => setIsGenerating(false)); }} className="flex items-center gap-2 px-6 py-3 bg-white border-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
                <Sparkles size={16} className="text-indigo-600"/> {isGenerating ? 'Analyzing...' : 'Market AI'}
             </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-24">
            <section>
              <h3 className="text-3xl font-black mb-10">Owner Portfolio</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm"><InventoryChart data={ownerTotals} type="horizontal-bar" /></div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm"><InventoryChart data={aggregateDaily('Owner')} type="line" /></div>
              </div>
            </section>
            <section>
              <h3 className="text-3xl font-black mb-10">Broker Portfolio</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm"><InventoryChart data={brokerTotals} type="horizontal-bar" /></div>
                <div className="bg-white p-10 rounded-[3rem] shadow-sm"><InventoryChart data={aggregateDaily('Broker')} type="line" /></div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr><th className="p-8 text-[10px] font-black uppercase">Date</th><th className="p-8 text-[10px] font-black uppercase">Category</th><th className="p-8 text-[10px] font-black uppercase">Source</th><th className="p-8 text-[10px] font-black uppercase text-right">Count</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-t border-slate-50">
                    <td className="p-8 text-sm font-bold">{l.date}</td>
                    <td className="p-8"><span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase" style={{ backgroundColor: CATEGORY_COLORS[l.category]+'20', color: CATEGORY_COLORS[l.category] }}>{l.category}</span></td>
                    <td className="p-8 text-[10px] font-black uppercase text-slate-400">{l.source}</td>
                    <td className="p-8 text-lg font-black text-right">+{l.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="bg-white p-16 rounded-[4rem] shadow-2xl text-2xl italic text-slate-600 leading-relaxed">
            {insights || "Tap 'Market AI' in the header to synthesize your data."}
          </div>
        )}
      </main>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black">Record Daily Inventory</h3>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-slate-100 rounded-full"><Plus className="rotate-45"/></button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className="p-5 bg-slate-50 rounded-2xl font-black border-2 border-slate-100"/>
              <div className="flex gap-4 bg-slate-50 p-2 rounded-2xl">
                <button onClick={() => setEntrySource('Owner')} className={`flex-1 py-3 rounded-xl font-black ${entrySource === 'Owner' ? 'bg-white shadow' : 'text-slate-400'}`}>OWNER</button>
                <button onClick={() => setEntrySource('Broker')} className={`flex-1 py-3 rounded-xl font-black ${entrySource === 'Broker' ? 'bg-white shadow' : 'text-slate-400'}`}>BROKER</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CATEGORIES.map(cat => (
                <div key={cat} className="p-6 bg-slate-50 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">{cat}</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setEntryCounts(p => ({...p, [cat]: Math.max(0, p[cat]-1)}))} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm"><Minus size={16}/></button>
                    <span className="font-black text-xl w-8 text-center">{entryCounts[cat]}</span>
                    <button onClick={() => setEntryCounts(p => ({...p, [cat]: p[cat]+1}))} className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg"><Plus size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleBulkSubmit} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase mt-10 shadow-2xl">Archive Report</button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

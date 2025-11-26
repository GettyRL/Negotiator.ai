
import React, { useState, useEffect } from 'react';
import { Battle, BattleStatus, RiskAnalysis } from './types';
import { negotiateWithVendor, analyzeContractRisks, findAlternatives, generateVictoryVideo, generateStrategicAnalysis } from './services/geminiService';
import { WarRoomLive } from './components/WarRoomLive';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, CartesianGrid } from 'recharts';
import { Radio, Hash, Activity, Terminal, Zap, Maximize2, Mic, Settings, Filter, LayoutGrid, List, ArrowUpRight, DollarSign, ShieldCheck, Linkedin, Cpu, FileText, CheckCircle, XCircle, Users, Building2, UploadCloud, Search, AlertTriangle, Briefcase, ChevronRight } from 'lucide-react';

// --- Types ---
interface ExtendedBattle extends Battle {
  tags?: ('URGENT' | 'WATCHLIST')[];
}

// --- Components ---

const SubscriptionModal: React.FC<{ onClose: () => void, initialTab?: 'CORPORATE' | 'INDIVIDUAL' }> = ({ onClose, initialTab = 'CORPORATE' }) => {
  const [activeTab, setActiveTab] = useState<'CORPORATE' | 'INDIVIDUAL'>(initialTab);

  const plans = {
    CORPORATE: [
      { name: 'STARTUP', price: '$499', period: '/mo', features: ['Up to 5 Active Contracts', 'Basic Risk Scanning', 'Email Support', '1 User Seat'] },
      { name: 'GROWTH', price: '$1,299', period: '/mo', features: ['Up to 50 Active Contracts', 'Advanced Clause Hunter', 'Priority AI Negotiation', '5 User Seats', 'API Access'] },
      { name: 'ENTERPRISE', price: 'CUSTOM', period: '', features: ['Unlimited Contracts', 'Full Legal Autonomy', 'Dedicated War Room Coach', 'SSO & Audit Logs', '24/7 Dedicated Support'] }
    ],
    INDIVIDUAL: [
      { name: 'FREELANCE', price: '$29', period: '/mo', features: ['1 Active Contract', 'Basic Templates', 'Community Support'] },
      { name: 'CONSULTANT', price: '$99', period: '/mo', features: ['10 Active Contracts', 'Risk Analysis', 'Export to PDF', 'Negotiation Scripts'] },
      { name: 'POWER BROKER', price: '$299', period: '/mo', features: ['Unlimited Contracts', 'AI Auto-Reply', 'White-label Reports', 'Priority Processing'] }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-cyber-dark border border-neon-cyan/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-cyber-grid bg-cyber-black flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
             <Building2 className="text-neon-cyan" size={24} />
             <h2 className="text-2xl font-mono font-bold text-white tracking-widest">SUBSCRIPTION_MATRIX // <span className="text-neon-cyan">{activeTab}</span></h2>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white p-2 border border-transparent hover:border-gray-700">✕ ESC</button>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center p-8 bg-cyber-black/50 shrink-0">
            <div className="flex bg-cyber-grid/30 p-1 border border-cyber-grid rounded-sm">
                <button 
                  onClick={() => setActiveTab('CORPORATE')}
                  className={`px-8 py-3 font-mono font-bold text-sm tracking-wider transition-all ${activeTab === 'CORPORATE' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white'}`}
                >
                  CORPORATE
                </button>
                <button 
                  onClick={() => setActiveTab('INDIVIDUAL')}
                  className={`px-8 py-3 font-mono font-bold text-sm tracking-wider transition-all ${activeTab === 'INDIVIDUAL' ? 'bg-neon-pink text-black shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'text-gray-400 hover:text-white'}`}
                >
                  INDIVIDUAL
                </button>
            </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px]">
           {plans[activeTab].map((plan, idx) => (
             <div key={idx} className="bg-cyber-black/80 border border-cyber-grid p-6 hover:border-neon-cyan transition-all group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <h3 className="text-xl font-mono font-bold text-neon-cyan mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-bold text-white tracking-tighter">{plan.price}</span>
                    <span className="text-gray-500 font-mono text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300 font-mono">
                            <CheckCircle size={16} className="text-neon-green shrink-0 mt-0.5" />
                            {feat}
                        </li>
                    ))}
                </ul>

                <button className="w-full py-4 border border-neon-cyan text-neon-cyan font-mono font-bold hover:bg-neon-cyan hover:text-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    Activate Protocol <ChevronRight size={14} />
                </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}

const AnalysisModal: React.FC<{ battles: ExtendedBattle[], onClose: () => void }> = ({ battles, onClose }) => {
  const [step, setStep] = useState<'UPLOAD' | 'PROCESSING' | 'REPORT'>('UPLOAD');
  const [report, setReport] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const startAnalysis = async () => {
    setStep('PROCESSING');
    
    // Simulation of multi-agent process
    const steps = [
        "Initializing Neural Link...",
        "Scanning Active Portfolios...",
        "Accessing Global Vendor Database (v9.2)...",
        "Benchmarking AWS vs Market Spot Rates...",
        "Detecting Hidden Renewal Clauses in Zoom Contracts...",
        "Calculating Optimal Savings Trajectory..."
    ];

    for (const log of steps) {
        setLogs(prev => [...prev, log]);
        await new Promise(r => setTimeout(r, 800));
    }

    const data = battles.map(b => `${b.vendorName}: $${b.contractValue} (Status: ${b.status}, Savings Potential: $${b.savingsPotential})`).join('\n');
    const res = await generateStrategicAnalysis(data);
    setReport(res);
    setStep('REPORT');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-cyber-dark border border-neon-cyan/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-cyber-grid bg-cyber-black flex justify-between items-center">
           <h2 className="text-xl font-mono font-bold text-neon-cyan flex items-center gap-2">
             <Cpu className="animate-pulse"/> AGENTIC INTELLIGENCE // STRATEGIC SCAN
           </h2>
           <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-95">
            
            {step === 'UPLOAD' && (
                <div className="flex flex-col items-center justify-center h-full gap-8">
                    <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
                        <button onClick={startAnalysis} className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 hover:border-neon-cyan bg-cyber-black/50 hover:bg-cyber-grid/30 transition-all group rounded-lg">
                            <Briefcase size={48} className="text-gray-500 group-hover:text-neon-cyan mb-4 transition-colors" />
                            <span className="text-lg font-bold text-white font-mono">ANALYZE ACTIVE PORTFOLIO</span>
                            <span className="text-xs text-gray-500 font-mono mt-2">Scan current deals from dashboard</span>
                        </button>
                        
                        <button className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 hover:border-neon-pink bg-cyber-black/50 hover:bg-cyber-grid/30 transition-all group rounded-lg relative overflow-hidden">
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                            <UploadCloud size={48} className="text-gray-500 group-hover:text-neon-pink mb-4 transition-colors" />
                            <span className="text-lg font-bold text-white font-mono">UPLOAD CONTRACT / PDF</span>
                            <span className="text-xs text-gray-500 font-mono mt-2">Drag & Drop or Click to Browse</span>
                        </button>
                    </div>
                    <div className="max-w-xl text-center">
                        <h3 className="text-neon-green font-mono font-bold mb-2">CAPABILITIES:</h3>
                        <p className="text-gray-400 text-sm font-mono">
                            • Industry Benchmarking against 50,000+ data points<br/>
                            • Risk Assessment & Clause Detection<br/>
                            • Automated Savings Recommendations
                        </p>
                    </div>
                </div>
            )}

            {step === 'PROCESSING' && (
                <div className="flex flex-col items-start justify-end h-full font-mono text-sm p-8 bg-black border border-cyber-grid relative overflow-hidden">
                     <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(6,182,212,0.1)_25%,rgba(6,182,212,0.1)_26%,transparent_27%,transparent_74%,rgba(6,182,212,0.1)_75%,rgba(6,182,212,0.1)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(6,182,212,0.1)_25%,rgba(6,182,212,0.1)_26%,transparent_27%,transparent_74%,rgba(6,182,212,0.1)_75%,rgba(6,182,212,0.1)_76%,transparent_77%,transparent)] bg-[size:50px_50px]"></div>
                     <div className="w-full space-y-2 relative z-10">
                        {logs.map((log, i) => (
                            <div key={i} className="text-neon-green font-bold opacity-80 border-l-2 border-neon-green pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                > {log}
                            </div>
                        ))}
                        <div className="text-neon-cyan animate-pulse border-l-2 border-neon-cyan pl-4">> PROCESSING...</div>
                     </div>
                </div>
            )}

            {step === 'REPORT' && (
                <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-line p-4 border border-cyber-grid bg-black/50 mb-6 shadow-inner">
                        {report}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                         <button onClick={onClose} className="p-4 border border-red-500 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group">
                            <XCircle className="group-hover:rotate-90 transition-transform" />
                            REJECT RECOMMENDATION
                         </button>
                         <button onClick={() => { alert("Automated negotiation sequence initiated."); onClose(); }} className="p-4 bg-neon-green text-black font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]">
                            <CheckCircle />
                            EXECUTE STRATEGY
                         </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

const NegotiationTerminal: React.FC<{ 
  battle: ExtendedBattle; 
  onClose: () => void; 
  onUpdate: (b: ExtendedBattle) => void;
  onWin: (b: ExtendedBattle) => void;
}> = ({ battle, onClose, onUpdate, onWin }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [risks, setRisks] = useState<RiskAnalysis['clauses']>([]);
  const [alternatives, setAlternatives] = useState<any[]>([]);

  useEffect(() => {
    analyzeContractRisks(`Standard contract for ${battle.vendorName} including general SaaS terms.`)
      .then(res => { try { setRisks(JSON.parse(res)); } catch(e) {} });
    findAlternatives(battle.vendorName)
      .then(res => { try { setAlternatives(JSON.parse(res)); } catch (e) {} });
  }, [battle.vendorName]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { role: 'user' as const, content: input, timestamp: new Date() };
    const updatedHistory = [...battle.history, newMessage];
    onUpdate({ ...battle, history: updatedHistory });
    setInput('');
    setIsLoading(true);

    const aiResponse = await negotiateWithVendor(
      updatedHistory.map(h => `${h.role}: ${h.content}`),
      `Vendor: ${battle.vendorName}. Contract Value: $${battle.contractValue}.`
    );

    const modelMessage = { role: 'model' as const, content: aiResponse, timestamp: new Date() };
    onUpdate({
      ...battle,
      history: [...updatedHistory, modelMessage],
      lastMessage: aiResponse.slice(0, 50) + '...'
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-cyber-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl h-[85vh] bg-cyber-dark border border-neon-cyan/50 flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden rounded-sm">
        
        {/* Header */}
        <div className="h-14 border-b border-cyber-grid bg-cyber-black/50 flex justify-between items-center px-6">
          <div className="flex items-center gap-3 text-neon-cyan">
             <Terminal size={20} />
             <span className="font-mono text-xl font-bold tracking-widest uppercase">SECURE_CHANNEL // {battle.vendorName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-neon-pink animate-pulse">ENCRYPTION: ACTIVE</span>
            <button onClick={() => onWin(battle)} className="bg-neon-green/10 text-neon-green border border-neon-green/50 px-6 py-2 text-sm font-mono hover:bg-neon-green hover:text-black transition-colors font-bold">
              CONFIRM_DEAL
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2">✕</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Feed */}
          <div className="flex-1 flex flex-col border-r border-cyber-grid relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm">
              {battle.history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] relative group ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className="text-[10px] text-gray-500 mb-1 font-bold">{msg.role === 'model' ? 'AI_AGENT_01' : 'OPERATOR'} // {msg.timestamp.toLocaleTimeString()}</div>
                    <div className={`p-4 border ${
                      msg.role === 'user' 
                        ? 'bg-cyber-grid/30 border-gray-600 text-gray-300 rounded-bl-xl' 
                        : 'bg-neon-cyan/5 border-neon-cyan/30 text-neon-cyan rounded-br-xl shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-neon-cyan/5 border border-neon-cyan/30 p-4 text-neon-cyan/80 text-sm font-mono animate-pulse">
                      > CALCULATING OPTIMAL RESPONSE...
                    </div>
                 </div>
              )}
            </div>
            <div className="p-4 border-t border-cyber-grid bg-cyber-dark z-10">
              <div className="flex gap-2">
                <input 
                  autoFocus
                  className="flex-1 bg-cyber-black border border-gray-700 text-white px-4 py-4 font-mono text-sm focus:border-neon-cyan focus:outline-none placeholder-gray-600"
                  placeholder="ENTER COMMAND OR RESPONSE..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="bg-neon-cyan text-black font-bold font-mono px-8 text-lg hover:bg-cyan-300">
                  SEND
                </button>
              </div>
            </div>
          </div>

          {/* Intel Panel */}
          <div className="w-96 bg-cyber-black/50 overflow-y-auto font-mono">
            <div className="p-6 border-b border-cyber-grid">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Contract Analytics</h3>
              <div className="space-y-4">
                 <div className="bg-cyber-grid/20 border border-cyber-grid p-4">
                   <div className="text-gray-400 text-xs uppercase mb-1">Current Value</div>
                   <div className="text-2xl font-bold text-white tracking-tighter">${battle.contractValue.toLocaleString()}</div>
                 </div>
                 <div className="bg-cyber-grid/20 border border-cyber-grid p-4">
                   <div className="text-gray-400 text-xs uppercase mb-1">Est. Waste</div>
                   <div className="text-2xl font-bold text-neon-pink tracking-tighter">${(battle.contractValue * 0.15).toLocaleString()}</div>
                 </div>
              </div>
            </div>

            <div className="p-6 border-b border-cyber-grid">
               <div className="flex items-center justify-between mb-4">
                 <span className="text-sm font-bold text-gray-500 uppercase">Risk Scan</span>
                 <span className="text-xs bg-neon-pink/20 text-neon-pink px-2 py-1 border border-neon-pink/50 font-bold">{risks.length} FOUND</span>
               </div>
               <div className="space-y-3">
                  {risks.map((r, i) => (
                    <div key={i} className="text-xs p-3 border-l-2 border-neon-pink bg-neon-pink/5">
                      <div className="font-bold text-neon-pink mb-1 text-sm">{r.title}</div>
                      <div className="text-gray-400 leading-snug">{r.description}</div>
                    </div>
                  ))}
                  {risks.length === 0 && <div className="text-xs text-gray-600 italic">Scanning contract text...</div>}
               </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Market Alts</h3>
              <div className="space-y-3">
                {alternatives.map((alt, i) => (
                  <div key={i} className="border border-cyber-grid p-3 hover:border-neon-green transition-colors cursor-pointer group">
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-bold text-gray-300 group-hover:text-neon-green">{alt.name}</span>
                       <span className="text-xs text-neon-green font-bold">{alt.estimated_price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthWidget: React.FC<{ battles: ExtendedBattle[] }> = ({ battles }) => {
  const totalValue = battles.reduce((acc, b) => acc + b.contractValue, 0);
  const potentialSavings = battles.reduce((acc, b) => acc + b.savingsPotential, 0);
  const efficiency = Math.round(((totalValue - potentialSavings) / totalValue) * 100);
  
  return (
    <div className="h-full flex flex-col justify-between p-6">
       <div className="flex justify-between items-start mb-4 border-b border-cyber-grid pb-3">
          <h2 className="text-lg font-mono text-gray-300 uppercase tracking-widest flex items-center gap-3 font-bold">
            <Activity size={18} className="text-neon-green"/> Budget Health
          </h2>
          <div className="flex gap-2 items-center bg-neon-green/10 px-3 py-1 rounded-full border border-neon-green/30">
             <div className="w-2.5 h-2.5 rounded-full bg-neon-green animate-pulse"></div>
             <span className="text-xs text-neon-green font-mono font-bold tracking-wider">OPTIMAL</span>
          </div>
       </div>
       
       <div className="flex items-center justify-center gap-10 flex-1">
         <div className="relative flex-shrink-0 w-44 h-44">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
              <circle cx="50" cy="50" r="40" stroke={efficiency > 80 ? '#10b981' : '#f59e0b'} strokeWidth="8" fill="transparent" strokeDasharray={`${efficiency * 2.51} 251`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-5xl font-bold font-mono text-white">{efficiency}%</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider mt-1">Efficiency</span>
            </div>
         </div>
         <div className="flex flex-col gap-6">
            <div>
                <div className="text-xs uppercase text-gray-500 mb-1 font-bold tracking-wider">Identified Savings</div>
                <div className="text-5xl font-mono text-neon-pink text-glow-pink font-bold tracking-tighter">$ {potentialSavings.toLocaleString()}</div>
            </div>
             <div>
                <div className="text-xs uppercase text-gray-500 mb-1 font-bold tracking-wider">Total Spend</div>
                <div className="text-3xl font-mono text-white tracking-tight">$ {totalValue.toLocaleString()}</div>
            </div>
         </div>
       </div>

       <div className="space-y-3 mt-6 pb-2">
         <div className="flex justify-between text-xs font-mono text-gray-400 font-bold mb-2">
           <span>SYSTEM LOAD</span>
           <span className="text-neon-cyan text-glow-cyan">42%</span>
         </div>
         <div className="w-full bg-cyber-grid h-1.5 rounded-full overflow-hidden">
           <div className="bg-neon-cyan h-full w-[42%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
         </div>
       </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [battles, setBattles] = useState<ExtendedBattle[]>([
    { id: '1', vendorName: 'Zoom Corp', contractValue: 12000, savingsPotential: 2000, status: BattleStatus.ACTIVE, lastMessage: 'Renewal notice received. +15% increase.', coordinates: { x: 20, y: 30 }, history: [{ role: 'system', content: 'Initial negotiation initiated.', timestamp: new Date()}], tags: ['URGENT'] },
    { id: '2', vendorName: 'AWS Cloud', contractValue: 45000, savingsPotential: 5000, status: BattleStatus.PENDING, lastMessage: 'Usage report analysis pending.', coordinates: { x: 60, y: 50 }, history: [], tags: ['WATCHLIST'] },
    { id: '3', vendorName: 'Salesforce', contractValue: 85000, savingsPotential: 12000, status: BattleStatus.LOST, lastMessage: 'Auto-renewed without notice.', coordinates: { x: 40, y: 70 }, history: [] },
    { id: '4', vendorName: 'Slack', contractValue: 8000, savingsPotential: 1500, status: BattleStatus.WON, lastMessage: 'Successfully reduced seat cost by 10%.', coordinates: { x: 80, y: 20 }, history: [] }
  ]);
  const [selectedBattle, setSelectedBattle] = useState<ExtendedBattle | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showSubscription, setShowSubscription] = useState<'CORPORATE' | 'INDIVIDUAL' | null>(null);
  const [victoryVideo, setVictoryVideo] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'URGENT' | 'WATCHLIST'>('ALL');

  useEffect(() => { if (!process.env.API_KEY) setApiKeyMissing(true); }, []);

  const handleKeySelect = async () => {
    if ((window as any).aistudio?.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        window.location.reload();
    }
  };

  const handleBattleWin = async (battle: ExtendedBattle) => {
    setBattles(prev => prev.map(b => b.id === battle.id ? { ...b, status: BattleStatus.WON } : b));
    setSelectedBattle(null);
    const videoUrl = await generateVictoryVideo(battle.vendorName);
    if (videoUrl) setVictoryVideo(videoUrl);
  };

  const filteredBattles = battles.filter(b => {
      if (activeFilter === 'ALL') return true;
      return b.tags?.includes(activeFilter);
  });

  if (apiKeyMissing) return (
    <div className="h-screen w-screen bg-cyber-black flex flex-col items-center justify-center font-mono relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="z-10 bg-cyber-dark p-12 border border-neon-green/30 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-center max-w-lg">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter font-sans">NEGOTIATOR.AI</h1>
            <div className="h-px w-full bg-neon-green mb-8"></div>
            <p className="mb-8 text-gray-400 text-sm">SECURE TERMINAL ACCESS REQUIRED. <br/>PLEASE AUTHENTICATE.</p>
            <button onClick={handleKeySelect} className="bg-neon-green text-black font-bold px-8 py-3 hover:bg-white transition-all text-sm tracking-widest">
                CONNECT_API_KEY
            </button>
        </div>
    </div>
  );

  return (
    <div className="h-screen bg-cyber-black text-gray-300 font-sans selection:bg-neon-cyan selection:text-black overflow-hidden flex flex-col">
      
      {/* Victory Overlay */}
      {victoryVideo && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-500">
              <h1 className="text-6xl font-black text-white mb-8 tracking-tighter text-glow-green font-sans">NEGOTIATION WON</h1>
              <video src={victoryVideo} autoPlay loop className="w-full max-w-4xl border border-neon-green shadow-[0_0_100px_rgba(16,185,129,0.2)]" />
              <button onClick={() => setVictoryVideo(null)} className="mt-8 text-gray-500 hover:text-white font-mono uppercase text-sm">[ RETURN_TO_DASHBOARD ]</button>
          </div>
      )}

      {/* Top Bar */}
      <nav className="h-16 border-b border-cyber-grid bg-cyber-dark flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse"></div>
                <span className="font-mono font-bold text-2xl tracking-widest text-white">NEGOTIATOR.AI <span className="text-gray-600 text-xs ml-2">v2.1</span></span>
            </div>
            
            {/* Subscription Plans */}
            <div className="h-8 w-px bg-cyber-grid mx-2"></div>
            <div className="flex gap-4 text-xs font-mono font-bold tracking-wider">
               <button onClick={() => setShowSubscription('CORPORATE')} className="flex items-center gap-2 text-gray-500 hover:text-neon-cyan transition-colors group">
                  <Building2 size={14} />
                  <span className="group-hover:underline">CORPORATE PLAN</span>
               </button>
               <button onClick={() => setShowSubscription('INDIVIDUAL')} className="flex items-center gap-2 text-gray-500 hover:text-neon-pink transition-colors group">
                  <Users size={14} />
                  <span className="group-hover:underline">INDIVIDUAL PLAN</span>
               </button>
            </div>
        </div>

        <div className="flex items-center gap-8 font-mono text-sm text-gray-400">
           <div className="flex flex-col items-end">
               <span className="text-[10px] uppercase text-gray-600 font-bold tracking-wider">YTD Savings</span>
               <span className="text-white font-bold text-lg">$142,500.00</span>
           </div>
           <div className="h-8 w-px bg-cyber-grid"></div>
           <div className="flex flex-col items-end">
               <span className="text-[10px] uppercase text-gray-600 font-bold tracking-wider">Active Deals</span>
               <span className="text-neon-cyan font-bold text-lg">{battles.filter(b => b.status === BattleStatus.ACTIVE).length} PENDING</span>
           </div>
           <div className="h-8 w-px bg-cyber-grid"></div>
           
           <button 
                onClick={() => setShowAnalysis(true)}
                className="group bg-cyber-grid/30 border border-cyber-grid hover:border-white text-gray-300 hover:text-white px-4 py-2 flex items-center gap-2 transition-all">
                <FileText size={16} />
                <span className="font-bold">REPORT</span>
           </button>

           <button 
                onClick={() => setShowLive(true)}
                className="group relative bg-neon-pink/10 text-neon-pink border border-neon-pink/50 px-5 py-2 hover:bg-neon-pink hover:text-black transition-all flex items-center gap-2 overflow-hidden">
                <Mic size={16} className="group-hover:animate-bounce" />
                <span className="font-bold tracking-wider">LIVE COACH</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <main className="flex-1 p-4 grid grid-cols-12 grid-rows-6 gap-4 min-h-0">
        
        {/* Panel 1: Budget Health (Top Left) */}
        <div className="col-span-4 row-span-2 bg-cyber-dark border border-cyber-grid shadow-lg relative group flex flex-col">
           <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-neon-cyan opacity-50"></div>
           <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-neon-cyan opacity-50"></div>
           <HealthWidget battles={battles} />
        </div>

        {/* Panel 2: Negotiation Landscape (Center Large) */}
        <div className="col-span-5 row-span-4 bg-cyber-dark border border-cyber-grid relative overflow-hidden group flex flex-col">
            {/* Map Header */}
            <div className="h-12 border-b border-cyber-grid bg-cyber-black/50 flex justify-between items-center px-4 z-20 shrink-0">
                <div className="flex items-center gap-2 text-neon-cyan text-sm font-mono font-bold uppercase tracking-wider">
                    <Maximize2 size={14} /> Negotiation Landscape
                </div>
                <div className="flex gap-2">
                    <button className="p-1.5 hover:text-white text-gray-500 hover:bg-gray-800 rounded"><Filter size={14}/></button>
                    <button className="p-1.5 hover:text-white text-gray-500 hover:bg-gray-800 rounded"><LayoutGrid size={14}/></button>
                    <button className="p-1.5 hover:text-white text-gray-500 hover:bg-gray-800 rounded"><Settings size={14}/></button>
                </div>
            </div>

            {/* Grid Background */}
            <div className="absolute inset-0 top-10 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            
            {/* Map Area */}
            <div className="relative flex-1">
                {/* Radar Sweep Effect */}
                <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(6,182,212,0.05)_0deg,transparent_60deg)] animate-[spin_8s_linear_infinite] rounded-full opacity-30 pointer-events-none scale-150"></div>

                {filteredBattles.map(battle => (
                    <button
                        key={battle.id}
                        onClick={() => setSelectedBattle(battle)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group/point transition-all duration-300 z-10"
                        style={{ left: `${battle.coordinates.x}%`, top: `${battle.coordinates.y}%` }}
                    >
                        {/* Node Graphic */}
                        <div className="flex flex-col items-center">
                            <div className={`relative flex items-center justify-center w-6 h-6 mb-2 transition-transform group-hover/point:scale-125`}>
                                <div className={`absolute w-full h-full border-2 rotate-45 ${
                                    battle.status === 'WON' ? 'border-neon-green bg-neon-green/20' :
                                    battle.status === 'LOST' ? 'border-red-600 bg-red-600/20' :
                                    'border-neon-cyan bg-neon-cyan/20 animate-pulse'
                                }`}></div>
                            </div>
                            
                            {/* Label - Larger */}
                            <div className="bg-cyber-black/90 border border-cyber-grid px-3 py-1.5 flex flex-col items-center shadow-xl backdrop-blur-sm group-hover/point:border-neon-cyan transition-colors">
                                <span className="text-xs font-bold text-white whitespace-nowrap">{battle.vendorName}</span>
                                <span className="text-[10px] font-mono text-gray-400 font-bold">${battle.contractValue/1000}k</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Panel 3: Active Negotiations (Right Column) */}
        <div className="col-span-3 row-span-6 bg-cyber-dark border border-cyber-grid flex flex-col">
           <div className="h-12 border-b border-cyber-grid bg-cyber-grid/20 flex items-center px-4 justify-between shrink-0">
              <span className="text-sm font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                  <List size={16} className="text-neon-pink" /> Active Deals
              </span>
              <button className="text-gray-500 hover:text-white"><ArrowUpRight size={16}/></button>
           </div>
           
           {/* Filters visual */}
           <div className="flex border-b border-cyber-grid text-[10px] font-mono uppercase text-gray-500 font-bold shrink-0">
               <div onClick={() => setActiveFilter('ALL')} className={`flex-1 py-3 text-center border-r border-cyber-grid cursor-pointer hover:bg-cyber-grid/50 transition-colors ${activeFilter === 'ALL' ? 'bg-cyber-grid/50 text-white' : ''}`}>All</div>
               <div onClick={() => setActiveFilter('URGENT')} className={`flex-1 py-3 text-center border-r border-cyber-grid cursor-pointer hover:bg-cyber-grid/20 transition-colors ${activeFilter === 'URGENT' ? 'bg-cyber-grid/50 text-neon-pink' : ''}`}>Urgent</div>
               <div onClick={() => setActiveFilter('WATCHLIST')} className={`flex-1 py-3 text-center cursor-pointer hover:bg-cyber-grid/20 transition-colors ${activeFilter === 'WATCHLIST' ? 'bg-cyber-grid/50 text-neon-cyan' : ''}`}>Watchlist</div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredBattles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 text-xs font-mono">
                      <Search size={24} className="mb-2 opacity-50"/>
                      NO CONTRACTS FOUND
                  </div>
              ) : (
                filteredBattles.map(battle => (
                <div 
                    key={battle.id} 
                    onClick={() => setSelectedBattle(battle)}
                    className={`p-5 border transition-all cursor-pointer font-mono group relative overflow-hidden flex flex-col gap-3 ${
                        battle.status === 'ACTIVE' ? 'bg-neon-cyan/5 border-neon-cyan/50 hover:border-neon-cyan shadow-[0_0_15px_rgba(6,182,212,0.1)]' :
                        battle.status === 'WON' ? 'bg-neon-green/5 border-neon-green/50 opacity-70' :
                        'bg-cyber-black border-cyber-grid hover:border-gray-500'
                    }`}
                >
                    <div className="flex justify-between items-start relative z-10">
                        <span className="font-bold text-base text-white group-hover:text-neon-cyan transition-colors">{battle.vendorName}</span>
                        <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] px-2 py-0.5 border font-bold ${
                                battle.status === 'ACTIVE' ? 'border-neon-cyan text-neon-cyan' :
                                battle.status === 'WON' ? 'border-neon-green text-neon-green' :
                                'border-gray-700 text-gray-500'
                            }`}>{battle.status}</span>
                            {battle.tags?.includes('URGENT') && <span className="text-[9px] text-neon-pink font-bold animate-pulse">!! URGENT</span>}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-end relative z-10">
                        <div className="text-xs text-gray-400 font-bold">
                             Val: <span className="text-white text-sm">${battle.contractValue.toLocaleString()}</span>
                        </div>
                        {battle.status === 'ACTIVE' && <div className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-pulse"></div>}
                    </div>

                    <div className="h-px w-full bg-gray-800"></div>
                    
                    <div className="text-xs text-gray-500 truncate relative z-10 italic">
                        "{battle.lastMessage}"
                    </div>
                </div>
              )))}
           </div>
           
           <div className="p-4 border-t border-cyber-grid bg-cyber-black/50 shrink-0">
               <button onClick={() => setShowAnalysis(true)} className="w-full bg-neon-cyan text-black font-bold p-4 flex items-center justify-center gap-2 hover:bg-cyan-300 transition-all text-sm font-mono uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                   <AlertTriangle size={16} />
                   <span>INITIATE ANALYSIS</span>
               </button>
           </div>
        </div>

        {/* Panel 4: Savings Velocity (Bottom Left) */}
        <div className="col-span-4 row-span-4 bg-cyber-dark border border-cyber-grid p-5 pt-6 flex flex-col">
            <h3 className="text-sm font-mono text-gray-400 uppercase mb-4 flex items-center justify-between font-bold tracking-wider">
                <span className="flex items-center gap-2"><Zap size={16} className="text-neon-amber"/> Savings Velocity</span>
                <span className="text-xs text-neon-cyan/70 font-mono">15-12-2025</span>
            </h3>
            <div className="flex-1 w-full h-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { name: 'Q1', saved: 4000, color: '#f59e0b' }, 
                        { name: 'Q2', saved: 3000, color: '#ef4444' },
                        { name: 'Q3', saved: 12000, color: '#10b981' }, 
                        { name: 'Q4', saved: 8000, color: '#10b981' },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 14, fontWeight: 'bold'}} tickLine={false} axisLine={true} />
                        <YAxis stroke="#64748b" tick={{fontSize: 14, fontWeight: 'bold'}} tickLine={false} axisLine={true} />
                        <Tooltip 
                            cursor={{fill: '#1e293b'}}
                            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff' }}
                            itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                            formatter={(value: any) => [`$${value}`, 'Saved']}
                        />
                        <Bar dataKey="saved">
                            {
                                [
                                    { name: 'Q1', saved: 4000, color: '#f59e0b' }, 
                                    { name: 'Q2', saved: 3000, color: '#ef4444' },
                                    { name: 'Q3', saved: 12000, color: '#10b981' }, 
                                    { name: 'Q4', saved: 8000, color: '#10b981' },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Panel 5: System Logs (Bottom Center) */}
        <div className="col-span-5 row-span-2 bg-black border border-cyber-grid p-3 text-sm font-mono overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-gray-900 pb-2 mb-2 px-1 shrink-0">
                 <span className="text-gray-500 uppercase tracking-widest flex items-center gap-2 font-bold">
                     <ShieldCheck size={14} /> Procurement Protocols
                 </span>
                 <span className="text-neon-green text-[10px] animate-pulse font-bold">● LIVE</span>
            </div>
            <div className="opacity-90 space-y-2 px-1 overflow-y-auto h-full pb-8">
                <div className="flex gap-2">
                    <span className="text-gray-600">[10:42:05]</span>
                    <span className="text-neon-cyan">Scanning contract "Salesforce_Master_Service_Agreement_v4.pdf"...</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-gray-600">[10:42:08]</span>
                    <span className="text-neon-amber font-bold">Warning: Clause 4.2 contains "Auto-renewal without notice" risk.</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-gray-600">[10:42:15]</span>
                    <span className="text-white">Benchmark found: AWS Spot Instances currently trading 12% lower than contract rate.</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-gray-600">[10:43:00]</span>
                    <span className="text-neon-green font-bold">Optimization complete. Estimated savings: $12,500.</span>
                </div>
                <div className="flex gap-2 mt-2">
                    <span className="text-gray-600">>></span>
                    <span className="text-gray-400 animate-pulse font-bold">Awaiting operator command_</span>
                </div>
            </div>
        </div>

      </main>
      
      {/* Footer / Status Bar */}
      <footer className="h-8 bg-cyber-dark border-t border-cyber-grid flex items-center justify-between px-6 text-xs font-mono z-20 shrink-0">
          <span className="text-gray-600 flex items-center gap-2 font-bold">SYSTEM STATUS: <span className="text-neon-green">ONLINE</span></span>
          <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1 font-bold">
                 <Linkedin size={12} />
                 DEVELOPED BY <a href="https://www.linkedin.com/in/gettyrl/" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-white transition-colors ml-1 uppercase hover:underline">GETTYRL</a>
              </span>
          </div>
      </footer>
      
      {/* Modals */}
      {selectedBattle && (
          <NegotiationTerminal 
            battle={selectedBattle} 
            onClose={() => setSelectedBattle(null)} 
            onUpdate={(b) => setBattles(prev => prev.map(p => p.id === b.id ? b : p))}
            onWin={handleBattleWin}
          />
      )}

      {showLive && <WarRoomLive onClose={() => setShowLive(false)} />}
      
      {showAnalysis && <AnalysisModal battles={battles} onClose={() => setShowAnalysis(false)} />}

      {showSubscription && <SubscriptionModal onClose={() => setShowSubscription(null)} initialTab={showSubscription} />}
    </div>
  );
}

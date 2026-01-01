
import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Wallet, 
  User as UserIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Timer,
  Trophy,
  Info,
  ChevronRight,
  LogOut,
  Users,
  Share2,
  Gift,
  Plus,
  Send,
  MessageCircle,
  X,
  Zap
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { User, Bet } from './types';
import AuthModal from './components/AuthModal';

const INITIAL_WALLET = 100; // Default wallet for guests
const ROUND_DURATION = 300; // 5 minutes
const REFERRAL_REWARD = 10;
const SIGNUP_BONUS = 10;
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('predictx_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [showAuth, setShowAuth] = useState(false);
  const [showWinPopup, setShowWinPopup] = useState<{show: boolean, number: number | null}>({show: false, number: null});
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Game State
  const [wallet, setWallet] = useState<number>(() => {
    return Number(localStorage.getItem('predictx_wallet')) || INITIAL_WALLET;
  });
  const [results, setResults] = useState<number[]>(() => {
    return JSON.parse(localStorage.getItem('predictx_results') || '[]');
  });
  const [betHistory, setBetHistory] = useState<Bet[]>(() => {
    return JSON.parse(localStorage.getItem('predictx_betHistory') || '[]');
  });
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  
  // Interaction State
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [currentBetAmount, setCurrentBetAmount] = useState<number>(1);
  const [pendingBets, setPendingBets] = useState<Bet[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<'game' | 'history' | 'refer'>('game');

  // Persistence
  useEffect(() => {
    localStorage.setItem('predictx_wallet', wallet.toString());
    localStorage.setItem('predictx_results', JSON.stringify(results));
    localStorage.setItem('predictx_betHistory', JSON.stringify(betHistory));
  }, [wallet, results, betHistory]);

  // Session Expiry Monitor
  useEffect(() => {
    const checkSession = () => {
      const loginTime = localStorage.getItem('predictx_login_time');
      if (loginTime && user) {
        const expirationTime = parseInt(loginTime) + SESSION_DURATION;
        if (Date.now() > expirationTime) {
          handleLogout();
        }
      }
    };

    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRoundEnd();
          return ROUND_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingBets]);

  // Auto-close win popup after 3 seconds
  useEffect(() => {
    if (showWinPopup.show) {
      const timer = setTimeout(() => {
        setShowWinPopup({ show: false, number: null });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showWinPopup.show]);

  const handleRoundEnd = useCallback(() => {
    const winNumber = Math.floor(Math.random() * 100) + 1;
    
    setResults(prev => [winNumber, ...prev].slice(0, 15));
    setShowWinPopup({show: true, number: winNumber});

    if (pendingBets.length > 0) {
      let totalWinnings = 0;
      const processedBets: Bet[] = pendingBets.map(bet => {
        const isWin = bet.numbers.includes(winNumber);
        const numCount = Number(bet.numbers.length);
        const multiplier = numCount > 0 ? 95 / numCount : 0; 
        const payout = isWin ? Math.floor(Number(bet.amount) * multiplier) : 0;
        
        if (isWin) totalWinnings += payout;

        return {
          ...bet,
          winNumber,
          result: isWin ? 'WIN' : 'LOSS',
          payout: isWin ? payout : 0
        };
      });

      setWallet(prev => prev + totalWinnings);
      setBetHistory(prev => [...processedBets, ...prev].slice(0, 50));
      setPendingBets([]);
    }
  }, [pendingBets]);

  const totalCost = Number(selectedNumbers.length) * Number(currentBetAmount);

  const handlePlaceBet = () => {
    if (timeLeft <= 10) return;
    if (!user) { setShowAuth(true); return; }
    if (selectedNumbers.length === 0) return;
    if (wallet < totalCost) { alert("Insufficient balance."); return; }

    const newBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      time: new Date().toLocaleTimeString(),
      numbers: [...selectedNumbers],
      amount: totalCost, 
      result: 'PENDING'
    };

    setWallet(prev => prev - totalCost);
    setPendingBets(prev => [...prev, newBet]);
    setSelectedNumbers([]);
    setCurrentBetAmount(1);
  };

  const toggleNumber = (num: number) => {
    if (timeLeft <= 10) return;
    setSelectedNumbers(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };

  const handleAuthSuccess = (u: User, isNew: boolean) => {
    setUser(u);
    localStorage.setItem('predictx_user', JSON.stringify(u));
    localStorage.setItem('predictx_login_time', Date.now().toString());
    
    const bonusClaimed = localStorage.getItem('predictx_bonus_claimed');
    if (isNew && !bonusClaimed) {
      setWallet(prev => prev + SIGNUP_BONUS);
      localStorage.setItem('predictx_bonus_claimed', 'true');
      alert(`Welcome! ₹${SIGNUP_BONUS} bonus added to your wallet.`);
    }
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('predictx_user');
    localStorage.removeItem('predictx_login_time');
    setView('game');
    setShowProfile(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const allPendingNumbers = Array.from(new Set(pendingBets.flatMap(b => b.numbers))).sort((a, b) => a - b);
  const totalPendingAmount = pendingBets.reduce((sum, b) => sum + b.amount, 0);
  const chartData = results.slice().reverse().map((val, idx) => ({ name: idx, value: val }));

  return (
    <div className="min-h-screen pb-24 max-w-lg mx-auto bg-slate-950 border-x border-slate-900 relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none mb-1 text-white">PredictX</h1>
            <div className="flex items-center gap-1.5 text-slate-100 text-xl font-black">
              <Timer className="w-5 h-5 text-cyan-400" />
              <span className={timeLeft < 30 ? 'text-red-400 animate-pulse' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowWalletModal(true)}
            className="bg-slate-900/50 rounded-full pl-3 pr-1 py-1 flex items-center gap-2 border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            <span className="text-emerald-400 font-bold text-sm">₹{wallet.toLocaleString()}</span>
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
          </button>
          <button 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`p-4 space-y-6 ${view !== 'game' ? 'hidden' : ''}`}>
        {/* Results Visualizer (Trend Analysis) */}
        <section className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/60 overflow-hidden">
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Trend Analysis</h2>
            <div className="flex gap-1">
              {results.slice(0, 5).map((r, i) => (
                <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border ${
                  i === 0 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 animate-glow' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {r}
                </div>
              ))}
            </div>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3, fill: '#06b6d4' }} />
                <Tooltip content={() => null} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Active Bets Section - aggregated in one Trend Analysis-style box */}
        {pendingBets.length > 0 && (
          <section className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/60 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">Active Round Bets</h2>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Locked Amount</p>
                <p className="text-lg font-black text-emerald-400 leading-none">₹{totalPendingAmount}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-800/40">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2.5">All Picks for this Round ({allPendingNumbers.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {allPendingNumbers.map(n => (
                  <div key={n} className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Number Grid */}
        <section className="relative">
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select Lucky Numbers</h2>
            <span className="text-xs text-slate-500 font-medium">
              {selectedNumbers.length} Selected
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 relative">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                disabled={timeLeft <= 10}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200 border ${
                  selectedNumbers.includes(num)
                    ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30 scale-105'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                } ${timeLeft <= 10 ? 'opacity-50 grayscale' : ''}`}
              >
                {num}
              </button>
            ))}
            
            {/* 10 Second Countdown Overlay */}
            {timeLeft <= 10 && timeLeft > 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-[4px] rounded-2xl animate-in fade-in duration-300">
                <div className="text-center">
                  <div className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] animate-bounce">
                    {timeLeft}
                  </div>
                  <div className="text-sm font-black text-cyan-400 uppercase tracking-[0.3em] mt-4 animate-pulse">
                    Locked
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Betting Panel */}
        <section className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/60 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Per Number</span>
            {selectedNumbers.length > 0 && (
              <span className="text-xs font-bold text-cyan-400">
                Total: ₹{totalCost}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 10].map(amt => (
              <button
                key={amt}
                onClick={() => setCurrentBetAmount(amt)}
                disabled={timeLeft <= 10}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  currentBetAmount === amt ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-300'
                } ${timeLeft <= 10 ? 'opacity-50' : ''}`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <button
            onClick={handlePlaceBet}
            disabled={pendingBets.length > 15 || timeLeft <= 10}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex flex-col items-center justify-center leading-tight transition-all ${
              selectedNumbers.length > 0 && timeLeft > 10 ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-xl shadow-blue-600/20 active:scale-95 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{timeLeft <= 10 ? 'Market Closed' : 'Confirm Prediction'}</span>
            {selectedNumbers.length > 0 && timeLeft > 10 && <span className="text-xs opacity-80 font-medium tracking-wide">DEDUCT ₹{totalCost}</span>}
          </button>
        </section>

        {/* History Section */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">History</h3>
             <button onClick={() => setView('history')} className="text-xs text-cyan-500 font-bold hover:underline transition-all">View All</button>
          </div>
          <div className="space-y-3">
            {betHistory.slice(0, 5).map(bet => (
               <div key={bet.id} className="bg-slate-900/50 border border-slate-800/40 rounded-2xl p-4 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className={`p-2.5 rounded-xl ${bet.result === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {bet.result === 'WIN' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-200 uppercase tracking-wider">Winner: {bet.winNumber || '--'}</div>
                      <div className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{bet.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-black ${bet.result === 'WIN' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {bet.result === 'WIN' ? `+₹${bet.payout}` : `-₹${bet.amount}`}
                    </div>
                    <div className={`text-[10px] uppercase font-black tracking-widest ${bet.result === 'WIN' ? 'text-emerald-500' : 'text-red-400'}`}>{bet.result}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/40">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">My Picks ({bet.numbers.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {bet.numbers.map(num => (
                      <div key={num} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border ${
                        num === bet.winNumber 
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                          : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                      }`}>
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
             </div>
            ))}
          </div>
        </section>
      </main>

      {/* Refer View */}
      {view === 'refer' && (
        <main className="p-4 space-y-6 animate-in slide-in-from-bottom-4 duration-300 min-h-[70vh]">
          <div className="text-center space-y-4 pt-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-cyan-600 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <Gift className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white">Refer & Earn</h2>
            <p className="text-slate-400 text-sm max-w-[280px] mx-auto">Invite friends and get ₹{REFERRAL_REWARD} instantly!</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
             <button onClick={() => { setWallet(p => p + REFERRAL_REWARD); alert("Referral simulated!"); }} className="w-full py-4 bg-emerald-600 rounded-2xl font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-600/20">Simulate Referral</button>
          </div>
        </main>
      )}

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl p-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-cyan-400" /> Wallet Actions
              </h3>
              <button onClick={() => setShowWalletModal(false)} className="text-slate-500 hover:text-white transition-colors"><X /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl text-center border border-slate-800">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Balance</p>
                <p className="text-3xl font-black text-emerald-400">₹{wallet}</p>
              </div>
              <button 
                onClick={() => window.open('https://wa.me/919999999999', '_blank')}
                className="w-full py-4 bg-emerald-600 rounded-2xl font-bold flex items-center justify-center gap-3 text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-5 h-5" /> Deposit via WhatsApp
              </button>
              <button 
                onClick={() => window.open('https://t.me/yourtelegram', '_blank')}
                className="w-full py-4 bg-blue-600 rounded-2xl font-bold flex items-center justify-center gap-3 text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Send className="w-5 h-5" /> Withdraw via Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Popup - Auto-closes quickly */}
      {showWinPopup.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-xs rounded-3xl border border-cyan-500/30 p-8 text-center shadow-[0_0_50px_rgba(6,182,212,0.3)] animate-in zoom-in duration-300">
             <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
             <h2 className="text-2xl font-black text-white mb-2">Winning Number</h2>
             <div className="text-8xl font-black text-cyan-400 mb-6 drop-shadow-[0_0_20px_rgba(6,182,212,0.7)]">
               {showWinPopup.number}
             </div>
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                <div className="h-full bg-cyan-500 animate-[shrink_3.5s_linear_forwards]" />
             </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-6 py-3 flex justify-around items-center z-40">
        <button onClick={() => setView('game')} className={`flex flex-col items-center gap-1 ${view === 'game' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <Trophy className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tight">Games</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <History className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tight">History</span>
        </button>
        <div className="relative -top-4">
          <button onClick={() => setShowWalletModal(true)} className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center shadow-2xl text-white ring-4 ring-slate-950 active:scale-95 transition-all">
            <Wallet className="w-7 h-7" />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-300">Wallet</span>
        </div>
        <button onClick={() => setView('refer')} className={`flex flex-col items-center gap-1 ${view === 'refer' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <Users className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tight">Refer</span>
        </button>
        <button onClick={() => setShowProfile(true)} className={`flex flex-col items-center gap-1 ${showProfile ? 'text-cyan-400' : 'text-slate-500'}`}>
          <UserIcon className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-tight">Profile</span>
        </button>
      </nav>

      {/* Detailed History Overlay */}
      {view === 'history' && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col animate-in slide-in-from-right duration-300">
          <header className="px-4 py-4 border-b border-slate-900 flex items-center gap-4">
            <button onClick={() => setView('game')} className="p-2 -ml-2 rounded-full hover:bg-slate-900 transition-colors">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <h2 className="text-lg font-bold tracking-tight">Detailed Activity</h2>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {betHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                <History className="w-16 h-16 opacity-20" />
                <p className="font-medium">No activity recorded yet.</p>
              </div>
            ) : (
              betHistory.map(bet => (
                <div key={bet.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl flex flex-col gap-4 shadow-sm hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bet.result === 'WIN' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {bet.result === 'WIN' ? <Trophy className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-200 uppercase tracking-widest text-sm">Round Win: {bet.winNumber}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{bet.time} • {bet.id.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-black text-lg leading-none ${bet.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {bet.result === 'WIN' ? `+₹${bet.payout}` : `-₹${bet.amount}`}
                       </p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-1">{bet.result}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2.5">Your Selected Numbers ({bet.numbers.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bet.numbers.map(n => (
                        <span key={n} className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black border ${n === bet.winNumber ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-400 border-slate-700/50'}`}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        onSuccess={handleAuthSuccess} 
      />

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
           <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 p-8 animate-in zoom-in duration-200 shadow-2xl">
             <div className="text-center space-y-6">
               <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full mx-auto flex items-center justify-center border-4 border-cyan-500/20">
                 <UserIcon className="w-10 h-10 text-slate-400" />
               </div>
               <div>
                 <h3 className="text-2xl font-black text-white">{user?.username || 'Guest'}</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">{user?.uid || 'Sign in for full access'}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700/50">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">WALLET</p>
                   <p className="text-xl font-black text-emerald-400 leading-none">₹{wallet}</p>
                 </div>
                 <div className="bg-slate-800 p-4 rounded-2xl text-center border border-slate-700/50">
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1.5">ROUNDS</p>
                   <p className="text-xl font-black text-cyan-400 leading-none">{results.length}</p>
                 </div>
               </div>
               <div className="space-y-3 pt-4">
                <button onClick={handleLogout} className="w-full py-4 text-red-400 font-black uppercase tracking-widest text-xs border border-red-500/20 rounded-2xl hover:bg-red-500/5 transition-all active:scale-95">Log Out</button>
                <button onClick={() => setShowProfile(false)} className="w-full py-4 bg-slate-800 text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all">Close</button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;

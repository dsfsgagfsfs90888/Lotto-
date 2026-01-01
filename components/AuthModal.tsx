
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, UserPlus, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNew: boolean) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    mobile: '',
    password: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || (!isLogin && !formData.mobile)) {
      setError('All fields are required');
      return;
    }

    // Mock Authentication Logic
    const uid = 'PX' + Math.floor(100000 + Math.random() * 900000);
    const user: User = {
      username: formData.username,
      mobile: formData.mobile || 'Private',
      uid: uid
    };

    onSuccess(user, !isLogin);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {isLogin ? <LogIn className="text-cyan-500" /> : <UserPlus className="text-emerald-500" />}
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Username / ID</label>
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                placeholder="Enter username"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={e => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                  placeholder="10-digit mobile"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Security Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-400 text-xs font-bold text-center animate-bounce">{error}</p>}

            <button
              type="submit"
              className={`w-full py-4 rounded-xl font-bold text-lg mt-4 transition-all ${
                isLogin 
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              {isLogin ? 'Login Securely' : 'Sign Up Free'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              {isLogin ? "New player? " : "Already have an account? "}
              <span className="text-cyan-400 font-bold underline decoration-cyan-400/30">
                {isLogin ? 'Register now' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

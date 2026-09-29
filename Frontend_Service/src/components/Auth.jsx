import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, LogIn, UserPlus, ShieldAlert, CircleCheck, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => {
      const field = d.loc && d.loc.length > 1 ? d.loc[d.loc.length - 1] : '';
      return field ? `${field}: ${d.msg}` : d.msg;
    }).join(', ');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return fallback;
};

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login Request
        const loginResp = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        });
        
        const { access_token, username: loggedUsername } = loginResp.data;

        // Fetch profile to obtain user ID
        const profileResp = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` }
        });

        const userId = profileResp.data.id;
        
        onAuthSuccess(access_token, loggedUsername, userId);
      } else {
        // Registration Request
        await axios.post(`${API_URL}/auth/register`, {
          email,
          username,
          password
        });
        
        setIsLogin(true);
        setError('');
        setNotice('Your account is ready. Sign in with your new credentials.');
      }
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, 'Authentication failed. Please verify your credentials and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-[75vh] max-w-4xl mx-auto px-4 gap-8 lg:gap-12 py-8 animate-fade-in">
      
      {/* Brand Intro Column */}
      <div className="flex-1 space-y-5 text-center lg:text-left max-w-md lg:max-w-none">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Next-Generation Resume Intelligence</span>
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Find the right fit with <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">smarter resume insights</span>
        </h1>
        
        <p className="text-slate-500 text-sm leading-relaxed">
          Turn resumes into useful insights and match candidate skills to the roles that matter.
        </p>

        <div className="hidden lg:grid grid-cols-2 gap-4 pt-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
            <h3 className="font-bold text-xs text-slate-900">Embedding Engine</h3>
            <p className="text-[11px] text-slate-500 leading-normal">Find candidates by skills and experience.</p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-1">
            <h3 className="font-bold text-xs text-slate-900">Structured Insights</h3>
            <p className="text-[11px] text-slate-500 leading-normal">Get clear, structured resume summaries.</p>
          </div>
        </div>
      </div>

      {/* Card Auth Column */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden shrink-0">
        
        {/* Top subtle glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-700" />

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin
              ? 'Sign in to continue to your workspace.'
              : 'Get started with your resume insights workspace.'
            }
          </p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <ShieldAlert className="h-5 w-5 text-rose-700" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-900">{isLogin ? 'Unable to sign in' : 'Unable to create account'}</p>
                <p className="mt-1 break-words text-sm leading-relaxed text-rose-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <div role="status" aria-live="polite" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CircleCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-emerald-900">Registration complete</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800">{notice}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                  placeholder="e.g. dev_user1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 mt-4 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span className="text-sm">Sign in</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span className="text-sm">Create account</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setNotice('');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors focus:outline-none cursor-pointer"
          >
            {isLogin 
              ? "Need a developer account? Register here" 
              : "Already registered? Access credentials login"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User, LogIn, UserPlus, ShieldAlert } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        alert('Registration successful! Please log in.');
      }
    } catch (err) {
      console.error(err);
      setError(
        getErrorMessage(err, 'An error occurred. Please check your credentials and try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md simple-panel p-8 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin 
              ? 'Enter your credentials to access the analyzer' 
              : 'Sign up to upload and evaluate resumes'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 p-3.5 rounded-lg text-sm text-red-700">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  placeholder="johndoe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 mt-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
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
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors focus:outline-none"
          >
            {isLogin 
              ? "Don't have an account? Register" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

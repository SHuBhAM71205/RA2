import { useState, useEffect } from 'react';
import Home from './components/Home';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AnalysisDetails from './components/AnalysisDetails';
import Profile from './components/Profile';
import { LogOut, BrainCircuit, User, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' or 'profile'
  const [showAuth, setShowAuth] = useState(false); // Controls landing page vs auth page when logged out

  // Synchronize localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
    }
  }, [token, username, userId]);

  const handleAuthSuccess = (newToken, newUsername, newUserId) => {
    setToken(newToken);
    setUsername(newUsername);
    setUserId(newUserId);
    setCurrentTab('dashboard');
    setShowAuth(false);
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setUserId('');
    setSelectedResumeId(null);
    setCurrentTab('dashboard');
    setShowAuth(false);
  };

  const renderContent = () => {
    if (selectedResumeId) {
      return (
        <AnalysisDetails
          token={token}
          resumeId={selectedResumeId}
          onBack={() => setSelectedResumeId(null)}
        />
      );
    }

    if (currentTab === 'profile') {
      return (
        <Profile
          token={token}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <Dashboard
        token={token}
        userId={userId}
        onSelectResume={(id) => setSelectedResumeId(id)}
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity" 
            onClick={() => {
              setSelectedResumeId(null);
              setCurrentTab('dashboard');
              if (!token) setShowAuth(false);
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center text-white shadow-sm">
              <BrainCircuit className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
                RESUME
              </span>
              <span className="font-bold text-[11px] text-indigo-600 tracking-wider">
                ANALYZER AI
              </span>
            </div>
          </div>

          {/* Navigation Links & User Action */}
          {token ? (
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedResumeId(null);
                    setCurrentTab('dashboard');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none ${
                    currentTab === 'dashboard' && !selectedResumeId
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedResumeId(null);
                    setCurrentTab('profile');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 focus:outline-none ${
                    currentTab === 'profile' && !selectedResumeId
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile Stats</span>
                </button>
              </nav>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-3">
                <div 
                  onClick={() => {
                    setSelectedResumeId(null);
                    setCurrentTab('profile');
                  }}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all">
                    {username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors hidden sm:inline">{username}</span>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-650 p-2 rounded-lg hover:bg-red-55/50 transition-colors focus:outline-none cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(!showAuth)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md focus:outline-none cursor-pointer"
            >
              {showAuth ? 'Back to Home' : 'Sign In'}
            </button>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow py-8 bg-slate-50">
        {!token ? (
          showAuth ? (
            <Auth onAuthSuccess={handleAuthSuccess} />
          ) : (
            <Home onGetStarted={() => setShowAuth(true)} />
          )
        ) : (
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-450">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Resume Analyzer AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-650 cursor-pointer">Security Policy</span>
            <span className="hover:text-slate-650 cursor-pointer">API Reference</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

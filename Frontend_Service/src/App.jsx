import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AnalysisDetails from './components/AnalysisDetails';
import { LogOut, BrainCircuit, User } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [selectedResumeId, setSelectedResumeId] = useState(null);

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
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setUserId('');
    setSelectedResumeId(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setSelectedResumeId(null)}>
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900">
              Resume Analyzer
            </span>
          </div>

          {/* User profile / Logout */}
          {token && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                <User className="w-4 h-4 text-slate-500" />
                <span>{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 focus:outline-none"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-semibold">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-grow py-8">
        {!token ? (
          <Auth onAuthSuccess={handleAuthSuccess} />
        ) : selectedResumeId ? (
          <AnalysisDetails
            token={token}
            resumeId={selectedResumeId}
            onBack={() => setSelectedResumeId(null)}
          />
        ) : (
          <Dashboard
            token={token}
            userId={userId}
            onSelectResume={(id) => setSelectedResumeId(id)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Resume Analyzer. All rights reserved.</p>
      </footer>
    </div>
  );
}

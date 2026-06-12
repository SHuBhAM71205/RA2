import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Award, Cpu, FileText, CheckCircle2, ShieldAlert, Calendar, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Profile({ token, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    analyzed: 0,
    processing: 0,
    failed: 0,
    avgScore: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfileAndStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch profile
      const profResp = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(profResp.data);

      // Fetch resumes list
      const resumeResp = await axios.get(`${API_URL}/resume/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resumes = resumeResp.data || [];

      // Calculate stats
      const total = resumes.length;
      const processing = resumes.filter(r => r.status === 'processing').length;
      const failed = resumes.filter(r => r.status === 'failed').length;
      const analyzedResumes = resumes.filter(r => r.status === 'analyzed');
      const analyzed = analyzedResumes.length;

      // Fetch analysis details to sum tokens and calculate avg match score
      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      let scoreSum = 0;

      await Promise.all(
        analyzedResumes.map(async (resume) => {
          try {
            const analysisResp = await axios.get(`${API_URL}/resume/analysis/${resume.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const analysis = analysisResp.data;
            if (analysis) {
              scoreSum += analysis.match_score || 0;
              totalTokens += analysis.total_tokens || 0;
              promptTokens += analysis.prompt_tokens || 0;
              completionTokens += analysis.completion_tokens || 0;
            }
          } catch (e) {
            console.error(`Failed to load analysis for ${resume.id}:`, e);
          }
        })
      );

      setStats({
        total,
        analyzed,
        processing,
        failed,
        avgScore: analyzed > 0 ? Math.round(scoreSum / analyzed) : 0,
        totalTokens,
        promptTokens,
        completionTokens,
      });

    } catch (err) {
      console.error('Failed to load profile/stats:', err);
      setError('Could not load profile statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading developer statistics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-8 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-indigo-600" /> Account Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your developer workspace and monitor AI model consumption details.
          </p>
        </div>
        <button
          onClick={fetchProfileAndStats}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Statistics"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="md:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-md mb-4 relative overflow-hidden group">
                <span className="text-3xl font-bold uppercase select-none z-10">
                  {profile?.username?.substring(0, 2) || 'US'}
                </span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{profile?.username}</h2>
              <p className="text-xs text-slate-450 mt-0.5">Developer Account</p>
              
              <div className="mt-2.5">
                {profile?.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-450 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</p>
                  <p className="text-sm text-slate-700 font-medium truncate">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-450 shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">User UID</p>
                  <p className="text-xs text-slate-600 font-mono truncate">{profile?.id}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={onLogout}
              className="w-full bg-red-50 hover:bg-red-100 text-red-650 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors focus:outline-none"
            >
              Sign Out from Session
            </button>
          </div>
        </div>

        {/* Statistics and LLM Usage Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Dashboard Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-10 text-slate-800">
                <FileText className="w-16 h-16" />
              </div>
              <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Total Resumes</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{stats.total}</h3>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-500 font-medium">
                <span className="text-green-600 font-semibold">{stats.analyzed} Analyzed</span>
                <span>•</span>
                <span className="text-amber-500 font-semibold">{stats.processing} Processing</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute right-3 top-3 opacity-10 text-slate-800">
                <Award className="w-16 h-16" />
              </div>
              <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Avg Match Score</p>
              <h3 className="text-3xl font-extrabold text-indigo-650 mt-2">{stats.avgScore}%</h3>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.avgScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Token Consumption Detail Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BarChart2 className="w-5 h-5 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">LLM Token Consumption Analysis</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Prompt Tokens</p>
                <p className="text-lg font-bold text-slate-700 mt-1">{stats.promptTokens.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Completion Tokens</p>
                <p className="text-lg font-bold text-slate-700 mt-1">{stats.completionTokens.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <p className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider">Total Consumed</p>
                <p className="text-lg font-bold text-indigo-700 mt-1">{stats.totalTokens.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl flex items-start gap-3 border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-150 flex items-center justify-center shrink-0 text-indigo-600">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">Hugging Face API Quotas</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Token totals represent calls routed dynamically to the LLM model endpoints. Average costs are simulated based on standard token sizes. Ensure your <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">HF_ACCESS_TOKEN</code> remains active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

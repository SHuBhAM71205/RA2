import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Brain, Cpu, Calendar, Award, Lightbulb, 
  BookOpen, Terminal, ShieldAlert, Sparkles, RefreshCw, FileText
} from 'lucide-react';

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

export default function AnalysisDetails({ token, resumeId, onBack }) {
  const [analysis, setAnalysis] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs: 'overview', 'skills', 'recommendations', 'developer'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  useEffect(() => {
    let active = true;
    let localPdfUrl = '';

    const fetchAnalysisAndPdf = async () => {
      try {
        // Fetch AI Analysis details
        const analResp = await axios.get(`${API_URL}/resume/analysis/${resumeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (active) {
          setAnalysis(analResp.data);
        }

        // Fetch PDF file as a blob
        const pdfResp = await axios.get(`${API_URL}/resume/file/${resumeId}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });

        if (active) {
          const blob = new Blob([pdfResp.data], { type: 'application/pdf' });
          localPdfUrl = URL.createObjectURL(blob);
          setPdfUrl(localPdfUrl);
          setPdfLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch workspace details:', err);
        if (active) {
          setError(
            getErrorMessage(err, 'Failed to load analysis or PDF. It might still be processing.')
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAnalysisAndPdf();

    // Clean up local blob URL on unmount to prevent leaks
    return () => {
      active = false;
      if (localPdfUrl) {
        URL.revokeObjectURL(localPdfUrl);
      }
    };
  }, [resumeId, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-sm text-slate-500 font-semibold animate-pulse">Analyzing parsed resume embeddings...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-sm">
          <Brain className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">Workspace Load Error</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 border border-slate-200 rounded-xl inline-flex items-center gap-1.5 text-xs transition-colors shadow-sm focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  const score = analysis.match_score || 0;
  const aiOutput = analysis.raw_ai_output || {};
  const summary = aiOutput.summary || 'No summary available.';
  const skills = aiOutput.extracted_skills || [];
  const experience = aiOutput.experience_years ?? 0;
  const recommendations = aiOutput.recommendations || 'No recommendations available.';

  // SVG parameters for circular score ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-6 px-4 animate-fade-in">
      
      {/* Left Pane: Interactive PDF Preview */}
      <div className="w-full md:w-1/2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full min-h-[350px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-850">Resume Document Stream</h3>
          </div>
          <span className="text-[10px] bg-slate-100 font-bold text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
            PDF Embed
          </span>
        </div>

        <div className="flex-grow mt-4 bg-slate-50 rounded-xl overflow-hidden relative border border-slate-100">
          {pdfLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              <p className="text-[11px] text-slate-400">Loading document view...</p>
            </div>
          ) : (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full rounded-xl"
              title="Resume Preview"
            />
          )}
        </div>
      </div>

      {/* Right Pane: AI Analysis Report */}
      <div className="w-full md:w-1/2 flex flex-col h-full">
        {/* Header Action Row */}
        <div className="flex items-center justify-between pb-4 shrink-0">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors focus:outline-none"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vault</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-450">
            <Cpu className="w-3.5 h-3.5" />
            <span>ID: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">{resumeId.substring(0, 8)}</code></span>
          </div>
        </div>

        {/* Hero Assessment Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-6 shrink-0 mb-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">AI Assessment Intelligence</h2>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed max-w-sm">
              Vector index mapping and syntax evaluation for general tech roles.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{experience} Years Experience</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>{skills.length} Extracted Skills</span>
              </div>
            </div>
          </div>

          {/* SVG Score Gauge */}
          <div className="relative flex items-center justify-center shrink-0 w-24 h-24 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                className="stroke-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-lg font-extrabold text-slate-900">{score}%</span>
              <span className="text-[8px] font-bold text-slate-400 tracking-wider uppercase -mt-0.5">Match</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative focus:outline-none cursor-pointer ${
              activeSubTab === 'overview' ? 'text-indigo-600' : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Summary
            </span>
            {activeSubTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('skills')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative focus:outline-none cursor-pointer ${
              activeSubTab === 'skills' ? 'text-indigo-600' : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Skills Badges
            </span>
            {activeSubTab === 'skills' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('recommendations')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative focus:outline-none cursor-pointer ${
              activeSubTab === 'recommendations' ? 'text-indigo-600' : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> AI Feedback
            </span>
            {activeSubTab === 'recommendations' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('developer')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative focus:outline-none cursor-pointer ${
              activeSubTab === 'developer' ? 'text-indigo-600' : 'text-slate-450 hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Token Metrics
            </span>
            {activeSubTab === 'developer' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Detail Pane */}
        <div className="flex-grow mt-6 overflow-y-auto bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-0">
          
          {/* Tab: Overview */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-slate-400" /> Executive Profile Summary
              </h4>
              <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 text-slate-600 text-xs leading-relaxed whitespace-pre-line italic">
                "{summary}"
              </blockquote>
            </div>
          )}

          {/* Tab: Skills */}
          {activeSubTab === 'skills' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">
                  Extracted Skill Set
                </h4>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                  {skills.length} skills identified
                </span>
              </div>
              
              {skills.length === 0 ? (
                <p className="text-slate-400 text-xs italic">No skills identified in the schema model.</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-750 transition-all cursor-default select-none shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Recommendations */}
          {activeSubTab === 'recommendations' && (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-slate-400" /> Structural Suggestions
              </h4>
              
              <div className="bg-amber-50/35 border border-amber-100 rounded-xl p-4 text-slate-650 text-xs leading-relaxed whitespace-pre-line">
                {recommendations}
              </div>
            </div>
          )}

          {/* Tab: Developer / Token Logs */}
          {activeSubTab === 'developer' && (
            <div className="space-y-6 animate-fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-450" /> API Model Metadata Logs
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prompt Tokens</p>
                    <p className="text-base font-bold text-slate-700 mt-1">{(analysis.prompt_tokens ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Tokens</p>
                    <p className="text-base font-bold text-slate-700 mt-1">{(analysis.completion_tokens ?? 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="border border-slate-150 rounded-xl p-4 bg-indigo-50/25 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-550 uppercase tracking-wider">Total Combined Tokens</p>
                    <p className="text-lg font-extrabold text-indigo-750 mt-1">{(analysis.total_tokens ?? 0).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    HF Qwen-7B
                  </span>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 text-[10.5px] text-slate-500 font-medium space-y-2">
                  <div className="flex justify-between">
                    <span>Database Log UID:</span>
                    <span className="font-mono text-slate-700 select-all">{analysis.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Related Resume UID:</span>
                    <span className="font-mono text-slate-700 select-all">{analysis.resume_id}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

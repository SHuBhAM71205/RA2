import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, Play, Eye, AlertCircle, RefreshCw, 
  Search, SlidersHorizontal, ArrowUpDown, Cpu, Award, Activity, Sparkles 
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

export default function Dashboard({ token, userId, onSelectResume }) {
  const [resumes, setResumes] = useState([]);
  const [analyses, setAnalyses] = useState({}); // Cache for analysis results by resumeId
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingResumeId, setUpdatingResumeId] = useState(null); // ID of resume currently being updated
  const [uploadError, setUploadError] = useState('');
  
  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'analyzed', 'processing', 'uploaded', 'failed'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'name_asc', 'name_desc', 'score_desc', 'score_asc', 'size_desc'

  const fileInputRef = useRef(null);
  const updateInputRef = useRef(null);

  // Load user's resumes and analysis scores
  const fetchResumes = async () => {
    try {
      const resp = await axios.get(`${API_URL}/resume/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = resp.data || [];
      // Filter out failed resumes
      const activeData = data.filter(r => r.status !== 'failed');
      setResumes(activeData);

      // Proactively fetch analysis details for analyzed resumes to cache scores
      const analyzed = activeData.filter(r => r.status === 'analyzed');
      const analysisCache = { ...analyses };
      let hasNew = false;

      await Promise.all(
        analyzed.map(async (resume) => {
          if (!analysisCache[resume.id]) {
            try {
              const analResp = await axios.get(`${API_URL}/resume/analysis/${resume.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              analysisCache[resume.id] = analResp.data;
              hasNew = true;
            } catch (err) {
              console.error('Error fetching analysis details:', err);
            }
          }
        })
      );

      if (hasNew) {
        setAnalyses(analysisCache);
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Poll active statuses
  useEffect(() => {
    const activeResumes = resumes.filter(
      r => r.status === 'processing'
    );
    if (activeResumes.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const copy = [...resumes];
      const analysisCache = { ...analyses };

      for (let i = 0; i < copy.length; i++) {
        const resume = copy[i];
        if (resume.status === 'processing') {
          try {
            const resp = await axios.get(`${API_URL}/resume/status/${resume.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.data.status !== resume.status) {
              if (resp.data.status === 'failed') {
                // Remove failed resume from the dashboard lists
                copy.splice(i, 1);
                i--;
                updated = true;
              } else {
                copy[i].status = resp.data.status;
                updated = true;

                // If status transitioned to analyzed, load analysis details immediately
                if (resp.data.status === 'analyzed') {
                  try {
                    const analResp = await axios.get(`${API_URL}/resume/analysis/${resume.id}`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    analysisCache[resume.id] = analResp.data;
                  } catch (err) {
                    console.error('Failed to load analysis on transition:', err);
                  }
                }
              }
            }
          } catch (e) {
            console.error('Failed to poll status:', e);
          }
        }
      }

      if (updated) {
        setResumes(copy);
        setAnalyses(analysisCache);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [resumes, analyses]);

  // Handle PDF Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/resume/upload/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      fetchResumes();
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(getErrorMessage(err, 'Failed to upload resume.'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle PDF Re-upload / Update
  const handleFileUpdate = async (e) => {
    const file = e.target.files[0];
    if (!file || !updatingResumeId) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed for updates.');
      setUpdatingResumeId(null);
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.put(`${API_URL}/resume/update/${updatingResumeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      // Clear from score cache since content has changed
      const newCache = { ...analyses };
      delete newCache[updatingResumeId];
      setAnalyses(newCache);

      // Immediately trigger analysis after update
      setResumes(prev => 
        prev.map(r => r.id === updatingResumeId ? { ...r, status: 'processing' } : r)
      );
      await axios.post(`${API_URL}/resume/analyze/${updatingResumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchResumes();
    } catch (err) {
      console.error('Update failed:', err);
      setUploadError(getErrorMessage(err, 'Failed to update resume.'));
    } finally {
      setUploading(false);
      setUpdatingResumeId(null);
      if (updateInputRef.current) updateInputRef.current.value = '';
    }
  };

  // Trigger Resume Analysis
  const handleAnalyze = async (resumeId) => {
    try {
      setResumes(prev => 
        prev.map(r => r.id === resumeId ? { ...r, status: 'processing' } : r)
      );

      await axios.post(`${API_URL}/resume/analyze/${resumeId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchResumes();
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
      alert('Failed to trigger analysis: ' + getErrorMessage(err, 'Server error'));
      fetchResumes();
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Filter & Sort computation
  const filteredResumes = resumes
    .filter(resume => {
      const filename = resume.minio_object_name.split('/').pop().toLowerCase();
      const matchesSearch = filename.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || resume.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const nameA = a.minio_object_name.split('/').pop().toLowerCase();
      const nameB = b.minio_object_name.split('/').pop().toLowerCase();
      
      switch (sortBy) {
        case 'name_asc':
          return nameA.localeCompare(nameB);
        case 'name_desc':
          return nameB.localeCompare(nameA);
        case 'score_desc': {
          const scoreA = analyses[a.id]?.match_score || 0;
          const scoreB = analyses[b.id]?.match_score || 0;
          return scoreB - scoreA;
        }
        case 'score_asc': {
          const scoreA = analyses[a.id]?.match_score || 0;
          const scoreB = analyses[b.id]?.match_score || 0;
          return scoreA - scoreB;
        }
        case 'size_desc':
          return b.file_size - a.file_size;
        case 'newest':
        default:
          return 0; // Default matches database ordering
      }
    });

  // Analytics sums
  const totalTokens = Object.values(analyses).reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
  const avgMatchScore = (() => {
    const scored = Object.values(analyses).map(a => a.match_score || 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  })();

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Resumes</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{resumes.length}</h3>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Match Score</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{avgMatchScore}%</h3>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden group">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total LLM Tokens</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalTokens.toLocaleString()}</h3>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/20 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
        </div>
      </div>

      {/* Main Panel Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Resume Vault</h2>
            <p className="text-slate-500 text-xs mt-1">
              Select or upload structured resumes to evaluate key job market credentials.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept="application/pdf"
            />
            <input
              type="file"
              ref={updateInputRef}
              onChange={handleFileUpdate}
              className="hidden"
              accept="application/pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-sm shadow-indigo-100"
            >
              {uploading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>Upload PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search resumes by file name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-3.5 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 placeholder-slate-450 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Status
            </span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Resumes</option>
              <option value="analyzed">Analyzed</option>
              <option value="processing">Processing</option>
              <option value="uploaded">Uploaded / New</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
            </span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="newest">Upload Order</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="score_desc">Match Score (High-Low)</option>
              <option value="score_asc">Match Score (Low-High)</option>
              <option value="size_desc">File Size (Large-Small)</option>
            </select>
          </div>
        </div>

        {uploadError && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-6 py-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Empty State / List */}
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-550" />
            <p className="text-xs text-slate-500">Loading database entries...</p>
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-450 border border-slate-200">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Resumes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn't find any resumes matching your query. Clear your filters or upload a new PDF to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredResumes.map((resume) => {
              const filename = resume.minio_object_name.split('/').pop();
              const score = analyses[resume.id]?.match_score;

              return (
                <div 
                  key={resume.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-450 shrink-0 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate max-w-md" title={filename}>
                        {filename}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium">
                          {formatBytes(resume.file_size)}
                        </span>
                        <span className="text-slate-300 text-[10px] select-none">•</span>
                        
                        {/* Status badges */}
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          resume.status === 'analyzed' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : resume.status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : resume.status === 'processing'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : 'bg-indigo-550/5 text-indigo-700 border-indigo-200'
                        }`}>
                          {resume.status}
                        </span>

                        {score !== undefined && (
                          <>
                            <span className="text-slate-300 text-[10px] select-none">•</span>
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-500" />
                              <span>{score}% Match</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {/* View Analysis */}
                    {resume.status === 'analyzed' && (
                      <button
                        onClick={() => onSelectResume(resume.id)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] transition-colors focus:outline-none cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Workspace</span>
                      </button>
                    )}

                    {/* Run Analysis */}
                    {(resume.status === 'uploaded' || resume.status === 'failed' || resume.status === 'updated') && (
                      <button
                        onClick={() => handleAnalyze(resume.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] transition-colors focus:outline-none cursor-pointer shadow-sm shadow-indigo-100"
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Analyze</span>
                      </button>
                    )}

                    {/* Processing loading state */}
                    {resume.status === 'processing' && (
                      <div className="text-[11px] text-slate-500 italic font-medium flex items-center gap-2 mr-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        <span>Analyzing...</span>
                      </div>
                    )}

                    {/* Replace / Update File (expose PUT /resume/update) */}
                    {resume.status !== 'processing' && (
                      <button
                        onClick={() => {
                          setUpdatingResumeId(resume.id);
                          updateInputRef.current?.click();
                        }}
                        className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-semibold px-3.5 py-1.5 rounded-xl text-[11px] transition-colors focus:outline-none cursor-pointer"
                        title="Update Resume File (Re-upload new version)"
                      >
                        <span>Update File</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

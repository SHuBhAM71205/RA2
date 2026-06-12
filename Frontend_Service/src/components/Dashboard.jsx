import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, Play, Eye, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Load user's resumes
  const fetchResumes = async () => {
    try {
      const resp = await axios.get(`${API_URL}/resume/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumes(resp.data);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Poll active statuses
  useEffect(() => {
    const activeResumes = resumes.filter(
      r => r.status === 'processing' || r.status === 'uploaded' || r.status === 'updated'
    );
    if (activeResumes.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const copy = [...resumes];

      for (let i = 0; i < copy.length; i++) {
        const resume = copy[i];
        if (resume.status === 'processing' || resume.status === 'uploaded' || resume.status === 'updated') {
          try {
            const resp = await axios.get(`${API_URL}/resume/status/${resume.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (resp.data.status !== resume.status) {
              copy[i].status = resp.data.status;
              updated = true;
            }
          } catch (e) {
            console.error('Failed to poll status:', e);
          }
        }
      }

      if (updated) {
        setResumes(copy);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [resumes]);

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

  // Trigger Resume Analysis
  const handleAnalyze = async (resumeId) => {
    try {
      // Set local state to processing immediately to show progress spinner
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Resumes
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Upload PDF resumes to extract embeddings and perform structural AI analysis.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="application/pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Upload Resume</span>
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Empty State */}
      {resumes.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-250 hover:border-slate-350 bg-white rounded-lg p-12 text-center cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            No Resumes Uploaded
          </h3>
          <p className="text-xs text-slate-500">
            Click here to upload your first resume PDF.
          </p>
        </div>
      ) : (
        /* Resume List Grid */
        <div className="space-y-3">
          {resumes.map((resume) => (
            <div 
              key={resume.id}
              className="simple-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-sm text-slate-900 truncate max-w-md">
                    {resume.minio_object_name.split('/').pop()}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-550">
                      {formatBytes(resume.file_size)}
                    </span>
                    <span className="text-[11px] text-slate-300">•</span>
                    {/* Status badges */}
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      resume.status === 'analyzed' 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : resume.status === 'failed'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : resume.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      <span>{resume.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {resume.status === 'analyzed' && (
                  <button
                    onClick={() => onSelectResume(resume.id)}
                    className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Analysis</span>
                  </button>
                )}

                {(resume.status === 'uploaded' || resume.status === 'failed' || resume.status === 'updated') && (
                  <button
                    onClick={() => handleAnalyze(resume.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Analyze</span>
                  </button>
                )}

                {resume.status === 'processing' && (
                  <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                    <span>Analyzing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

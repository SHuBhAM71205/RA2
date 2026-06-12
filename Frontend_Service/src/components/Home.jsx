import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  Target, 
  LineChart, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Database, 
  Search,
  MessageSquare
} from 'lucide-react';

export default function Home({ onGetStarted }) {
  // Mock interactive state
  const [selectedRole, setSelectedRole] = useState('Fullstack Engineer');
  const [userSkills, setUserSkills] = useState('React, Node.js, Python, Git');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [score, setScore] = useState(0);

  const mockRoles = {
    'Fullstack Engineer': {
      required: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'Python'],
      score: 82,
      feedback: 'Excellent core stack. Consider adding Docker or PostgreSQL to hit a 95%+ match score.'
    },
    'Data Scientist': {
      required: ['Python', 'PyTorch', 'SQL', 'Scikit-Learn', 'Pandas', 'Qdrant'],
      score: 75,
      feedback: 'Strong language match. Adding vector search techniques (like Qdrant) is recommended.'
    },
    'Product Manager': {
      required: ['Agile', 'Roadmapping', 'SQL', 'A/B Testing', 'Jira', 'Analytics'],
      score: 68,
      feedback: 'Good project foundation. Emphasize SQL capabilities and A/B testing frameworks.'
    }
  };

  const handleMockAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setScore(0);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      const roleData = mockRoles[selectedRole];
      setAnalysisResult(roleData);
    }, 1500);
  };

  // Score counter animation
  useEffect(() => {
    if (analysisResult && score < analysisResult.score) {
      const interval = setInterval(() => {
        setScore(prev => {
          if (prev >= analysisResult.score) {
            clearInterval(interval);
            return analysisResult.score;
          }
          return prev + 1;
        });
      }, 15);
      return () => clearInterval(interval);
    }
  }, [analysisResult, score]);

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-6 max-w-6xl mx-auto px-4">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/50 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Text Column */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-750 text-xs font-extrabold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Next-Gen ATS Parser & AI Audit</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Unlock Your Resume's <br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 bg-clip-text text-transparent">
                True Compatibility
              </span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Upload candidate profiles, extract high-fidelity structured parameters, query high-dimensional vector space, and receive actionable insights from advanced AI systems.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#interactive-demo"
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Try Sandbox Demo</span>
              </a>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-100">
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none">99.9%</h4>
                <p className="text-slate-450 text-[11px] font-bold uppercase tracking-wider mt-1.5">Accuracy Rate</p>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none">&lt; 2s</h4>
                <p className="text-slate-450 text-[11px] font-bold uppercase tracking-wider mt-1.5">Analysis Time</p>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900 leading-none">Qdrant</h4>
                <p className="text-slate-450 text-[11px] font-bold uppercase tracking-wider mt-1.5">Embedding Vector</p>
              </div>
            </div>
          </div>

          {/* Graphical Dashboard Mockup Column */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xl shadow-indigo-100/40 relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400" />
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-md">
                  Mockup Dashboard
                </div>
              </div>

              {/* Mock content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Resume_Dev_Candidate.pdf</h3>
                    <p className="text-[10px] text-slate-400">UUID: a9c2937d-f450-410a-b892</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-150 rounded-full">
                    Active Session
                  </span>
                </div>

                {/* Score Dial */}
                <div className="bg-gradient-to-tr from-slate-50 to-indigo-50/20 border border-slate-150/40 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Match Compatibility</span>
                    <h4 className="text-xl font-extrabold text-slate-800">High Match Potential</h4>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 flex items-center justify-center shadow-inner relative">
                    <span className="font-black text-sm text-indigo-700">92%</span>
                  </div>
                </div>

                {/* Feature Tags Mockup */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-slate-500">Key Skills Found</span>
                    <span className="font-bold text-indigo-600">8 / 10 Match</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'Python', 'Tailwind', 'Redis'].map(s => (
                      <span key={s} className="px-2 py-1 bg-slate-50 text-[10px] font-bold text-slate-650 rounded-lg border border-slate-150/60 hover:border-indigo-200 transition-colors">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ATS Actionable Insights */}
                <div className="border border-indigo-100 bg-indigo-50/30 p-3 rounded-xl space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-750">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    <span>AI Feedback Summary</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Candidate shows deep understanding of containerization and frontend component lifecycles. Recommend scheduling immediate technical interview.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Background absolute floating cards */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-slate-200 rounded-xl p-3 shadow-xl hidden md:flex items-center gap-3 z-20 animate-bounce" style={{ animationDuration: '6s' }}>
              <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-900 leading-none">Security Guaranteed</span>
                <span className="text-[8px] text-slate-400 mt-1">Data encrypted in sandbox</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-slate-100/60 border-y border-slate-200 py-16">
        <div className="max-w-6xl mx-auto px-4 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Built for Enterprise-Grade Resume Pipelines
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Equipped with a modern backend and vector search databases, our platform processes resume credentials at scale without compromizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <UploadCloud className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Instant PDF Extraction</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload raw PDF resumes, and let our structured parser extract text, contact details, work experience, and profile attributes.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Database className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Vector Embeddings (Qdrant)</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Convert resume features into vector embeddings, allowing high-dimensional semantic search and smart candidate matchmaking.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Target className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">ATS Match Indexing</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Evaluate profiles against customizable job requisitions. Generate accurate percentages showing target role alignment.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <MessageSquare className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Actionable Feedback Log</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Receive logical breakdowns of missing keywords, unnecessary jargon, and clear steps required to optimization.
                </p>
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <Zap className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Real-Time Redis Cache</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Leverage cached database queries and in-memory caches to load resumes and profiles instantly, saving compute resources.
                </p>
              </div>
            </div>

            {/* Card 6 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all space-y-4 group">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                <LineChart className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Detailed Metric Reports</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Log tokens consumed, model metrics, processing history, and candidate success scores over time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Simulator */}
      <section id="interactive-demo" className="max-w-4xl mx-auto px-4 scroll-mt-24">
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl border border-indigo-900 p-8 shadow-xl relative overflow-hidden">
          {/* Subtle Glows */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-2 text-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-900/50 px-3 py-1 rounded-md border border-indigo-850">
                Sandbox Simulator
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Try Out the AI Analyzer Algorithm
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/70 max-w-md mx-auto">
                Select a target role, list a set of technical skills, and test candidate fit against standard parameters.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-indigo-900/50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    Target Job Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-900 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Fullstack Engineer">Fullstack Engineer</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Product Manager">Product Manager</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    Candidate Core Skills
                  </label>
                  <input
                    type="text"
                    value={userSkills}
                    onChange={(e) => setUserSkills(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-900 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. React, Node.js, Python"
                  />
                </div>
              </div>

              <button
                onClick={handleMockAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-800"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing vectors & NLP parameters...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Run Match Analysis</span>
                  </>
                )}
              </button>

              {/* Result display */}
              {analysisResult && !isAnalyzing && (
                <div className="mt-4 border-t border-indigo-900/60 pt-4 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-indigo-300">Target Role Required Stack</h4>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {analysisResult.required.map(skill => {
                          const isMatch = userSkills.toLowerCase().includes(skill.toLowerCase());
                          return (
                            <span 
                              key={skill} 
                              className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                                isMatch 
                                  ? 'bg-green-950/70 border border-green-900 text-green-300' 
                                  : 'bg-red-950/70 border border-red-900 text-red-300'
                              }`}
                            >
                              {skill} {isMatch ? '✓' : '✗'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest leading-none mb-1">ATS Score</span>
                      <div className="w-14 h-14 rounded-full border-4 border-slate-950 border-t-indigo-500 bg-slate-950 flex items-center justify-center relative">
                        <span className="font-black text-xs text-indigo-400">{score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-950/30 border border-indigo-900/40 p-3 rounded-lg text-xs leading-relaxed text-indigo-200/90 flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p>{analysisResult.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl p-12 text-center space-y-6 shadow-xl relative overflow-hidden">
          {/* Glowing blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-2xl -z-10" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-900/40 rounded-full blur-2xl -z-10" />

          <h2 className="text-3xl font-black tracking-tight leading-tight max-w-xl mx-auto">
            Ready to Streamline and Standardize Candidate Evaluations?
          </h2>
          <p className="text-indigo-100 text-sm max-w-md mx-auto leading-relaxed">
            Create an account to upload real resumes, check vector embedding correlations, and review complete structured analysis logs.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white hover:bg-slate-50 text-indigo-700 font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Access Workspace</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </section>
    </div>
  );
}

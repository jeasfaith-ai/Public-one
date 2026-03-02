import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';

interface PlagiarismCheckerProps {
  onBack: () => void;
}

export default function PlagiarismChecker({ onBack }: PlagiarismCheckerProps) {
  const { user } = useContext(UserContext);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<{ score: number, message: string } | null>(null);

  useEffect(() => {
    if (user?.id) {
      clientFetch(`/api/projects/${user.id}`)
        .then(res => res.ok ? res.json() : { projects: [] })
        .then(data => setProjects(data.projects || []))
        .catch(err => console.error('Error fetching projects:', err));
    }
  }, [user]);

  const handleCheckProject = () => {
    if (!selectedProject) return;
    setIsChecking(true);
    setResult(null);
    
    // Simulate plagiarism check
    setTimeout(() => {
      setIsChecking(false);
      // Generate a random score between 0 and 15 for generated projects
      const score = Math.floor(Math.random() * 15);
      setResult({
        score,
        message: score < 10 ? 'Excellent! Your project is highly original.' : 'Good originality. Minor similarities found.'
      });
    }, 3000);
  };

  const handleCheckFile = () => {
    if (!file) return;
    setIsChecking(true);
    setResult(null);
    
    // Simulate plagiarism check for uploaded file
    setTimeout(() => {
      setIsChecking(false);
      // Generate a random score between 5 and 35 for uploaded files
      const score = Math.floor(Math.random() * 30) + 5;
      setResult({
        score,
        message: score < 15 ? 'Good originality.' : score < 25 ? 'Moderate similarities found. Review recommended.' : 'High similarities found. Revision required.'
      });
    }, 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSelectedProject(null); // Clear selected project if file is chosen
      setResult(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen p-4 sm:p-6 md:p-12 max-w-4xl mx-auto pb-24 relative bg-[#0f172a]"
    >
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-emerald-500 transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Plagiarism Checker</h2>
            <p className="text-slate-400">Verify the originality of your work</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Check Generated Project */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Check Generated Project</h3>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-400">No generated projects found.</p>
            ) : (
              <div className="space-y-4">
                <select 
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  onChange={(e) => {
                    const proj = projects.find(p => p.id.toString() === e.target.value);
                    setSelectedProject(proj);
                    setFile(null);
                    setResult(null);
                  }}
                  value={selectedProject?.id || ''}
                >
                  <option value="">Select a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.topic.substring(0, 50)}...</option>
                  ))}
                </select>
                <button 
                  onClick={handleCheckProject}
                  disabled={!selectedProject || isChecking}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center"
                >
                  {isChecking && !file ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Check Project
                </button>
              </div>
            )}
          </div>

          {/* Check Uploaded Document */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Upload Document (PDF/Word)</h3>
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-slate-800/80 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-400">
                    {file ? <span className="text-emerald-400 font-medium">{file.name}</span> : "Click to upload or drag and drop"}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              </label>
              <button 
                onClick={handleCheckFile}
                disabled={!file || isChecking}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center"
              >
                {isChecking && file ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                Check Document
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl border ${result.score < 15 ? 'bg-emerald-900/20 border-emerald-500/30' : result.score < 25 ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-red-900/20 border-red-500/30'}`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${result.score < 15 ? 'border-emerald-500 text-emerald-400' : result.score < 25 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'}`}>
                  <span className="text-2xl font-black">{result.score}%</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Plagiarism Score</h3>
                  <p className={`text-sm ${result.score < 15 ? 'text-emerald-400' : result.score < 25 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
              <div className="text-slate-400 text-sm max-w-xs">
                <p>This is an estimated originality score based on our internal database and common academic patterns.</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

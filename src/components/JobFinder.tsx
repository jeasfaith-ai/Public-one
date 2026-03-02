import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Loader2, Download, Briefcase, MapPin, Phone, Building2, User } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface JobFinderProps {
  onBack: () => void;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function JobFinder({ onBack }: JobFinderProps) {
  const [state, setState] = useState('');
  const [jobType, setJobType] = useState('');
  const [jobs, setJobs] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async () => {
    if (!state) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a professional recruitment consultant for Nigerian students and graduates.
        Find at least 5 CURRENT and ACTIVE job vacancies in ${state}, Nigeria.
        
        Focus on: ${jobType || 'General entry-level or student-friendly jobs'}
        
        For each job, you MUST provide:
        1. Job Position/Title
        2. Company/Business Name
        3. Specific Location in ${state}
        4. Job Owner/Contact Person Name (if available, otherwise HR Department)
        5. Contact Phone Number or Official Application Link
        
        CRITICAL INSTRUCTIONS:
        - Use Google Search to find real, recent listings from the last 30 days.
        - Ensure the positions are still available.
        - DO NOT use Markdown formatting like "###" or "**". Use plain text headers in ALL CAPS.
        - DO NOT include any introductory or concluding remarks.
        - Provide a ready-to-paste list.
        - Format each job clearly with a separator line.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt, {
        tools: [{ googleSearch: {} }]
      });
      setJobs(result || 'No active jobs found at the moment. Please try a different state or job type.');
    } catch (error) {
      console.error(error);
      setJobs('An error occurred while searching for jobs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Logo/Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STRESS NO MORE", pageWidth / 2, 17, { align: "center" });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`Available Jobs in ${state}`, pageWidth / 2, 40, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(jobs, contentWidth);
    
    let cursorY = 55;
    const lineHeight = 6;

    for (let i = 0; i < splitContent.length; i++) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitContent[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save(`Jobs_in_${state.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
            <Briefcase className="w-8 h-8 mr-3 text-blue-400" />
            Job Finder
          </h1>
          <p className="text-slate-400 text-sm">Find real-time available jobs in your preferred state in Nigeria.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-500" />
                Search Filters
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Select State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a State</option>
                  {NIGERIAN_STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Job Category (Optional)</label>
                <input
                  type="text"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  placeholder="e.g. Teaching, Sales, IT..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isGenerating || !state}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6 mr-2" />
                  Find Jobs
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Current Vacancies</h3>
                {jobs && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-800/50 rounded-lg p-6 overflow-y-auto max-h-[700px] border border-slate-700/50 whitespace-pre-wrap break-words font-serif leading-relaxed text-slate-300">
                {jobs ? (
                  jobs
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <Briefcase className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Select a state and click 'Find Jobs' to see current opportunities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

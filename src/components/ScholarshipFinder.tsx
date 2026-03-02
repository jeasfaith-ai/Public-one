import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, GraduationCap, Loader2, Download, Search, Filter } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface ScholarshipFinderProps {
  onBack: () => void;
}

export default function ScholarshipFinder({ onBack }: ScholarshipFinderProps) {
  const [cgpa, setCgpa] = useState('');
  const [course, setCourse] = useState('');
  const [level, setLevel] = useState('');
  const [scholarships, setScholarships] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async () => {
    if (!course.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a scholarship consultant for Nigerian students.
        List available scholarships for a student with the following profile:
        - CGPA: ${cgpa} (on a 5.0 scale)
        - Course: ${course}
        - Level: ${level}
        
        Requirements:
        - Focus on scholarships available for Nigerian undergraduates (Federal, State, Oil Companies, Private, International).
        - List at least 10 relevant scholarships.
        - For each scholarship, include:
          1. Name of Scholarship
          2. Eligibility Criteria (brief)
          3. Application Period (approximate)
          4. Worth/Benefits
        - Format clearly with bullet points or numbered lists.
        - Be accurate and up-to-date with general knowledge.
        - DO NOT use Markdown formatting like "###" or "**". Use plain text headers.
        - Output ONLY the scholarship list. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setScholarships(result || 'Could not find scholarships. Please try again.');
    } catch (error) {
      console.error(error);
      setScholarships('An error occurred while searching for scholarships.');
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
    doc.text("Scholarship Opportunities", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Profile: ${course} | Level ${level} | CGPA ${cgpa}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(scholarships, contentWidth);
    
    let cursorY = 65;
    const lineHeight = 6;

    for (let i = 0; i < splitContent.length; i++) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitContent[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save("Scholarship_List.pdf");
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
            <GraduationCap className="w-8 h-8 mr-3 text-yellow-500" />
            Scholarship Finder
          </h1>
          <p className="text-slate-400 text-sm">Find scholarships tailored to your CGPA, course, and level (Nigeria-focused).</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-emerald-500" />
                Your Profile
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Current CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 3.50"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Course of Study</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none"
                >
                  <option value="">Select Level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isGenerating || !course.trim()}
              className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6 mr-2" />
                  Find Scholarships
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Available Scholarships</h3>
                {scholarships && (
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
                {scholarships ? (
                  scholarships
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <GraduationCap className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your profile details to find relevant scholarship opportunities.
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

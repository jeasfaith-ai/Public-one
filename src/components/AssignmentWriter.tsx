import { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, FileText, Download, Loader2, User, Calendar, Hash, School, GraduationCap } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";
import { UserContext } from '../App';

interface AssignmentWriterProps {
  onBack: () => void;
}

export default function AssignmentWriter({ onBack }: AssignmentWriterProps) {
  const { user } = useContext(UserContext);
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    regNo: user?.regNo || '',
    department: user?.department || '',
    level: '',
    courseCode: '',
    courseTitle: '',
    topic: '',
    pages: 2,
    lecturerName: '',
    submissionDate: new Date().toISOString().split('T')[0],
    citationStyle: 'APA',
    tone: 'Formal',
    instructions: ''
  });

  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.topic || !formData.courseCode) {
      setError('Please fill in at least the Topic and Course Code.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const wordCount = formData.pages * 350; // Approx 350 words per page
      
      const prompt = `
        Act as an expert academic writer for a university student.
        Write a high-quality, plagiarism-free assignment on the following topic:
        "${formData.topic}"
        
        Context:
        - Course: ${formData.courseCode} - ${formData.courseTitle}
        - Department: ${formData.department}
        - Level: ${formData.level}
        - Specific Instructions: ${formData.instructions}
        
        Requirements:
        - Length: Approximately ${wordCount} words (to cover about ${formData.pages} pages).
        - Tone: ${formData.tone} (Academic, critical, and well-structured).
        - Structure: Introduction, Main Body (addressing the questions/topic in detail), Conclusion, and References (${formData.citationStyle} Style).
        - Quality: Perfect grammar, zero plagiarism, hit key points directly.
        - Format: Use clear headings and paragraphs.
        
        CRITICAL: 
        - Output ONLY the assignment content. 
        - DO NOT use Markdown formatting like "###" or "**" for headers. Use plain text headers in ALL CAPS.
        - DO NOT include any introductory or concluding remarks like "Here is your assignment".
        - Provide a ready-to-paste script.
      `;

      const content = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      
      if (content) {
        setGeneratedContent(content);
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (err) {
      console.error('Assignment generation error:', err);
      setError('Failed to generate assignment. Please try again.');
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

    // --- COVER PAGE ---
    
    // Border
    doc.setLineWidth(1);
    doc.setDrawColor(0);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // University Header (Placeholder or Standard)
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text("NWAFOR ORIZU COLLEGE OF EDUCATION", pageWidth / 2, 40, { align: "center" });
    doc.setFontSize(14);
    doc.text("NSUGBE", pageWidth / 2, 48, { align: "center" });

    doc.setFontSize(16);
    doc.text(`DEPARTMENT OF ${formData.department.toUpperCase()}`, pageWidth / 2, 70, { align: "center" });

    // Assignment Title
    doc.setFontSize(20);
    doc.text("ASSIGNMENT", pageWidth / 2, 100, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`ON`, pageWidth / 2, 110, { align: "center" });
    
    // Course Info
    doc.setFontSize(16);
    doc.text(`${formData.courseCode.toUpperCase()}: ${formData.courseTitle.toUpperCase()}`, pageWidth / 2, 125, { align: "center" });

    // Topic
    doc.setFontSize(14);
    const splitTopic = doc.splitTextToSize(formData.topic.toUpperCase(), contentWidth);
    doc.text(splitTopic, pageWidth / 2, 145, { align: "center" });

    // Presented To
    doc.setFontSize(12);
    doc.text("PRESENTED TO:", pageWidth / 2, 180, { align: "center" });
    doc.setFont("times", "bold");
    doc.text(formData.lecturerName.toUpperCase() || "THE LECTURER", pageWidth / 2, 190, { align: "center" });

    // Presented By
    doc.setFont("times", "normal");
    doc.text("PRESENTED BY:", pageWidth / 2, 210, { align: "center" });
    doc.setFont("times", "bold");
    doc.text(formData.fullName.toUpperCase(), pageWidth / 2, 220, { align: "center" });
    doc.text(formData.regNo.toUpperCase(), pageWidth / 2, 228, { align: "center" });
    doc.text(`${formData.level} LEVEL`, pageWidth / 2, 236, { align: "center" });

    // Date
    doc.setFont("times", "normal");
    doc.text(new Date(formData.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth / 2, 260, { align: "center" });

    // --- CONTENT PAGES ---
    doc.addPage();
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    const splitContent = doc.splitTextToSize(generatedContent, contentWidth);
    let cursorY = 20;

    // Add content line by line to handle page breaks
    // Note: splitTextToSize returns an array of strings
    
    // Simple pagination loop
    const lineHeight = 7;
    
    for (let i = 0; i < splitContent.length; i++) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitContent[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save(`${formData.courseCode}_Assignment_${formData.regNo}.pdf`);
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
            <FileText className="w-8 h-8 mr-3 text-emerald-500" />
            Assignment Writer
          </h1>
          <p className="text-slate-400 text-sm">Generate high-quality, plagiarism-free assignments ready for submission.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-indigo-500" />
                Student Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Reg No</label>
                  <input
                    type="text"
                    value={formData.regNo}
                    onChange={(e) => handleChange('regNo', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleChange('level', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
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
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center mb-4">
                <BookOpen className="w-5 h-5 mr-2 text-emerald-500" />
                Assignment Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CSC 101"
                    value={formData.courseCode}
                    onChange={(e) => handleChange('courseCode', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Course Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Intro to Computer Science"
                    value={formData.courseTitle}
                    onChange={(e) => handleChange('courseTitle', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Assignment Topic / Questions</label>
                <textarea
                  value={formData.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="Enter the full assignment question(s) here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Est. Pages</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.pages}
                    onChange={(e) => handleChange('pages', parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Submission Date</label>
                  <input
                    type="date"
                    value={formData.submissionDate}
                    onChange={(e) => handleChange('submissionDate', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Lecturer Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. A. Okeke"
                  value={formData.lecturerName}
                  onChange={(e) => handleChange('lecturerName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Citation Style</label>
                  <select
                    value={formData.citationStyle}
                    onChange={(e) => handleChange('citationStyle', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="APA">APA</option>
                    <option value="MLA">MLA</option>
                    <option value="Chicago">Chicago</option>
                    <option value="Harvard">Harvard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Tone</label>
                  <select
                    value={formData.tone}
                    onChange={(e) => handleChange('tone', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="Formal">Formal</option>
                    <option value="Critical">Critical</option>
                    <option value="Descriptive">Descriptive</option>
                    <option value="Persuasive">Persuasive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Specific Instructions (Optional)</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => handleChange('instructions', e.target.value)}
                  placeholder="Any specific focus, key points to include, or structure requirements..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none h-20 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Writing Assignment...
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6 mr-2" />
                  Generate Assignment
                </>
              )}
            </button>
            
            {error && (
              <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Assignment Preview</h3>
                {generatedContent && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}
              </div>

              <div className="flex-1 bg-white text-slate-900 rounded-lg p-6 font-serif leading-relaxed overflow-y-auto max-h-[600px] shadow-inner">
                {generatedContent ? (
                  <div className="whitespace-pre-wrap break-words">
                    {generatedContent}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                    <FileText className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Fill in the details and click generate to see your assignment here.
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

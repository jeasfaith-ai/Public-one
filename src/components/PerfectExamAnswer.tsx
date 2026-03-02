import { useState } from 'react';
import { ArrowLeft, PenTool, Loader2, Download, GraduationCap } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface PerfectExamAnswerProps {
  onBack: () => void;
}

export default function PerfectExamAnswer({ onBack }: PerfectExamAnswerProps) {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!question.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a top-performing university student and academic tutor.
        Write a "Perfect Exam Answer" for the following question to impress a lecturer.
        
        Subject/Course: ${subject}
        Question: ${question}
        Key Points to Include (Optional): ${keyPoints}
        
        Requirements:
        1. **Structure:** Use a clear Introduction, Body (with paragraphs/points), and Conclusion structure.
        2. **Tone:** Academic, professional, and authoritative.
        3. **Depth:** Demonstrate deep understanding, use relevant terminology, and cite examples if applicable.
        4. **Clarity:** Be concise but comprehensive.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the answer. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setAnswer(result || 'Could not generate answer. Please try again.');
    } catch (error) {
      console.error(error);
      setAnswer('An error occurred while generating the answer.');
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
    doc.text("Model Exam Answer", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Subject: ${subject}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(answer, contentWidth);
    
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

    doc.save("Model_Answer.pdf");
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
            <PenTool className="w-8 h-8 mr-3 text-blue-500" />
            Perfect Exam Answer Writer
          </h1>
          <p className="text-slate-400 text-sm">Generate structured, high-scoring answers to impress your lecturers.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-emerald-500" />
                Question Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Subject / Course</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Political Science 201"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Exam Question</label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Paste the exam question here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-32 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Key Points to Include (Optional)</label>
                <textarea
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  placeholder="Any specific points, dates, or theories you want mentioned?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-24 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !question.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Writing...
                </>
              ) : (
                <>
                  <PenTool className="w-6 h-6 mr-2" />
                  Generate Answer
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Model Answer</h3>
                {answer && (
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
                {answer ? (
                  answer
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <PenTool className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter a question to see a perfect, structured answer.
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

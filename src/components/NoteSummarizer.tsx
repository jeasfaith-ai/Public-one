import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2, Download, List, BookOpen, Zap } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface NoteSummarizerProps {
  onBack: () => void;
}

export default function NoteSummarizer({ onBack }: NoteSummarizerProps) {
  const [noteContent, setNoteContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSummarize = async () => {
    if (!noteContent.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as an expert academic tutor.
        Summarize the following lecture notes/text.
        
        Input Text:
        "${noteContent}"
        
        Requirements:
        1. **Simplified Summary:** Explain the core concepts in simple, easy-to-understand language.
        2. **Key Bullet Points:** List the most important facts, dates, or definitions.
        3. **Exam-Focused Version:** Highlight potential exam questions and key takeaways that are likely to be tested.
        
        Format clearly with plain text headings.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the summary. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setSummary(result || 'Could not summarize notes. Please try again.');
    } catch (error) {
      console.error(error);
      setSummary('An error occurred while summarizing.');
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
    doc.text("Smart Note Summary", pageWidth / 2, 40, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(summary, contentWidth);
    
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

    doc.save("Note_Summary.pdf");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
            <Zap className="w-8 h-8 mr-3 text-yellow-400" />
            Smart Note Summarizer
          </h1>
          <p className="text-slate-400 text-sm">Turn lengthy lecture notes into simplified summaries, bullet points, and exam prep material.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-250px)] min-h-[600px]">
          {/* Input Section */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Paste Lecture Notes
              </h3>
            </div>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Paste your lecture notes, PDF text, or article content here..."
              className="flex-1 w-full bg-transparent p-6 text-slate-300 placeholder-slate-600 outline-none resize-none font-mono text-sm leading-relaxed"
            />
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <button
                onClick={handleSummarize}
                disabled={isGenerating || !noteContent.trim()}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Summarize Notes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wider flex items-center">
                <List className="w-4 h-4 mr-2" />
                Summary & Key Points
              </h3>
              {summary && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-slate-800/50 p-6 overflow-y-auto border-l border-slate-800">
              {summary ? (
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap break-words">
                  {summary}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                  <BookOpen className="w-12 h-12" />
                  <p className="text-center max-w-xs text-sm">
                    Paste your notes and click summarize to see the magic happen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

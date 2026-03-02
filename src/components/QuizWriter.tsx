import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BrainCircuit, Loader2, Copy, Check, HelpCircle, Download } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";

interface QuizWriterProps {
  onBack: () => void;
}

export default function QuizWriter({ onBack }: QuizWriterProps) {
  const [questions, setQuestions] = useState('');
  const [subject, setSubject] = useState('');
  const [answers, setAnswers] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!questions.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        You are a helpful tutor for a student. 
        The student has provided the following quiz questions (which could be objective/multiple choice or theory/subjective).
        
        Context:
        - Subject/Course: ${subject}
        
        Please provide the correct answers.
        
        CRITICAL INSTRUCTIONS:
        1. Use VERY SIMPLE, easy-to-understand English. No big words or complex grammar.
        2. For Objective questions, just state the correct option and a short 1-sentence explanation why.
        3. For Theory/Subjective questions, provide a clear, direct answer in bullet points or short paragraphs.
        4. Be accurate but keep it simple.
        5. Format the output clearly so it is easy to read.
        6. DO NOT use Markdown formatting like "###" or "**". Use plain text.
        7. Output ONLY the answers. No conversational filler.
        
        Questions:
        ${questions}
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setAnswers(result || 'Sorry, I could not generate answers at this time.');
    } catch (error) {
      console.error(error);
      setAnswers('An error occurred while generating answers.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(answers);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    doc.text("Quiz Answers", pageWidth / 2, 40, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    // Split text to fit page width
    const splitContent = doc.splitTextToSize(answers, contentWidth);
    
    let cursorY = 55;
    const lineHeight = 7;

    for (let i = 0; i < splitContent.length; i++) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitContent[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save("Quiz_Answers.pdf");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
            <BrainCircuit className="w-8 h-8 mr-3 text-pink-500" />
            Quiz Solver
          </h1>
          <p className="text-slate-400 text-sm">Get simple, understandable answers for your quiz questions (Objective & Theory).</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-indigo-500" />
                Input Questions
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Subject / Course (Optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology, GST 101, Computer Science"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Paste your questions here</label>
                <textarea
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="e.g. 1. What is the capital of Nigeria?&#10;A) Lagos&#10;B) Abuja&#10;C) Kano&#10;&#10;2. Explain the concept of osmosis."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 outline-none min-h-[300px] font-mono text-sm leading-relaxed resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !questions.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Solving Quiz...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-6 h-6 mr-2" />
                  Get Answers
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Answers</h3>
                <div className="flex space-x-2">
                  {answers && (
                    <>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-800/50 rounded-lg p-6 overflow-y-auto max-h-[600px] border border-slate-700/50">
                {answers ? (
                  <div className="prose prose-invert prose-sm max-w-none break-words">
                    <ReactMarkdown>{answers}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <BrainCircuit className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Paste your questions and click 'Get Answers' to see the solutions here.
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

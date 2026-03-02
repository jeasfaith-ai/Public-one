import { useState } from 'react';
import { ArrowLeft, FileQuestion, Loader2, Download, BookOpen, Target } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface ExamPredictorProps {
  onBack: () => void;
}

export default function ExamPredictor({ onBack }: ExamPredictorProps) {
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [questions, setQuestions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!syllabus.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a university professor and exam setter.
        Generate a "High Probability" exam prediction for the following course:
        - Course Code: ${courseCode}
        - Course Title: ${courseTitle}
        - Syllabus/Topics: ${syllabus}
        
        Requirements:
        1. **Section A: CBT Questions (70 Questions):** Generate 70 multiple-choice questions covering the syllabus. Include options (A-D) and the correct answer for each.
        2. **Section B: Theory Questions (10 Questions):** Generate 10 high-value theory/essay questions that are likely to appear.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the questions. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setQuestions(result || 'Could not generate questions. Please try again.');
    } catch (error) {
      console.error(error);
      setQuestions('An error occurred while generating questions.');
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
    doc.text("High Probability Exam Predictor", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`${courseCode}: ${courseTitle}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(questions, contentWidth);
    
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

    doc.save(`${courseCode}_Exam_Prediction.pdf`);
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
            <Target className="w-8 h-8 mr-3 text-red-500" />
            Exam Question Predictor
          </h1>
          <p className="text-slate-400 text-sm">Generate high-probability CBT and Theory questions based on your syllabus.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-emerald-500" />
                Course Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. BIO101"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. General Biology I"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Syllabus / Topics / Notes</label>
                <textarea
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="Paste your course syllabus, topics, or summary of notes here..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none h-48 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !syllabus.trim()}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Predicting...
                </>
              ) : (
                <>
                  <Target className="w-6 h-6 mr-2" />
                  Predict Questions
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Predicted Questions</h3>
                {questions && (
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
                {questions ? (
                  questions
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <FileQuestion className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your syllabus to generate high-probability exam questions.
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

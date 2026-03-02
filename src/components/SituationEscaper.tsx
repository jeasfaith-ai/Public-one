import { useState } from 'react';
import { ArrowLeft, Footprints, Loader2, Download, AlertOctagon, MessageSquare } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface SituationEscaperProps {
  onBack: () => void;
}

export default function SituationEscaper({ onBack }: SituationEscaperProps) {
  const [situation, setSituation] = useState('');
  const [plan, setPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!situation.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a crisis management expert and student advisor.
        Provide a step-by-step escape/resolution plan for the following situation in a school environment:
        
        Situation: ${situation}
        
        Requirements:
        1. **Immediate De-escalation:** What to say or do right now to calm things down.
        2. **Step-by-Step Action:** 3-5 clear steps to resolve the issue.
        3. **What to Say (Scripts):** Exact words to use when talking to lecturers, security, or other students involved.
        4. **Safety First:** Prioritize physical and academic safety.
        5. **Ethical & Legal:** Ensure advice is within school rules and laws.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the escape plan. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setPlan(result || 'Could not generate plan. Please try again.');
    } catch (error) {
      console.error(error);
      setPlan('An error occurred while generating the plan.');
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

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STRESS NO MORE", pageWidth / 2, 17, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("Situation Escape Plan", pageWidth / 2, 40, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 45, pageWidth - margin, 45);

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(plan, contentWidth);
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

    doc.save("Escape_Plan.pdf");
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
            <Footprints className="w-8 h-8 mr-3 text-orange-500" />
            Situation Escaper
          </h1>
          <p className="text-slate-400 text-sm">Stuck in a mess? Get a step-by-step plan to get out of trouble safely.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <AlertOctagon className="w-5 h-5 mr-2 text-red-500" />
                What's Happening?
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Describe the Situation</label>
                <textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="e.g. I missed a test because I was sick but have no report, or I accidentally offended a lecturer..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none h-48 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !situation.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Planning Escape...
                </>
              ) : (
                <>
                  <Footprints className="w-6 h-6 mr-2" />
                  Get Me Out of This
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Resolution Plan</h3>
                {plan && (
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
                {plan ? (
                  plan
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <MessageSquare className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Tell us what happened. We'll tell you what to say and do.
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

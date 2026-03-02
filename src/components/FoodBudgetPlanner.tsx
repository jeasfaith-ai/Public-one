import { useState } from 'react';
import { ArrowLeft, ChefHat, Loader2, Download, DollarSign, Utensils } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface FoodBudgetPlannerProps {
  onBack: () => void;
}

export default function FoodBudgetPlanner({ onBack }: FoodBudgetPlannerProps) {
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('Day');
  const [preferences, setPreferences] = useState('');
  const [plan, setPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!amount.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a Nigerian student budget and nutrition expert.
        Create a food budget plan and cooking guide for a student with:
        - Budget: ₦${amount}
        - Duration: ${duration}
        - Preferences/Allergies: ${preferences || 'None'}
        
        Requirements:
        1. **Shopping List:** List exact items to buy with current market prices (approximate) that fit within the budget.
        2. **Meal Plan:** Suggest meals for the specified duration.
        3. **Cooking Tutorial:** Briefly explain how to cook the suggested meals (simple student-friendly recipes).
        4. **Money Saving Tips:** How to stretch this budget further.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the plan. No conversational filler.
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
    doc.text("Student Food Budget Plan", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Budget: N${amount} | Duration: ${duration}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(plan, contentWidth);
    
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

    doc.save("Food_Budget_Plan.pdf");
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
            <ChefHat className="w-8 h-8 mr-3 text-orange-500" />
            Student Food Budget Planner
          </h1>
          <p className="text-slate-400 text-sm">Plan your meals, get shopping lists, and cooking tutorials based on your budget.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-emerald-500" />
                Budget Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Amount (Naira)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                >
                  <option value="Day">1 Day</option>
                  <option value="Weekend">Weekend (2 Days)</option>
                  <option value="Week">1 Week</option>
                  <option value="Month">1 Month</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Preferences / Allergies</label>
                <textarea
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g. No beans, I like spicy food..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none h-24 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !amount.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <ChefHat className="w-6 h-6 mr-2" />
                  Generate Plan
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Your Meal Plan</h3>
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
                    <Utensils className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your budget and preferences to get a customized meal plan.
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

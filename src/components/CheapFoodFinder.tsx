import { useState } from 'react';
import { ArrowLeft, MapPin, Loader2, Download, Search, Utensils } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface CheapFoodFinderProps {
  onBack: () => void;
}

export default function CheapFoodFinder({ onBack }: CheapFoodFinderProps) {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [foodList, setFoodList] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a local food guide for students in Nigeria.
        Find the CHEAPEST food options near: ${location}.
        Budget Range (Optional): ${budget || 'Student Friendly / Lowest Possible'}
        
        Requirements:
        1. **List Specific Places:** Name of the restaurant, buka, or food spot.
        2. **Location/Address:** Detailed description of where it is (e.g., "Behind the engineering faculty", "Opposite the main gate").
        3. **Price Estimates:** What can you buy there and for how much?
        4. **Contact:** Phone number if available.
        5. **Use Google Search:** Use the search tool to find real, current places.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the list of places. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt, { tools: [{ googleSearch: {} }] });
      setFoodList(result || 'Could not find food places. Please try again.');
    } catch (error) {
      console.error(error);
      setFoodList('An error occurred while searching.');
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
    doc.text("Cheap Food Locations", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Location: ${location}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(foodList, contentWidth);
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

    doc.save("Food_Locations.pdf");
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
            <Utensils className="w-8 h-8 mr-3 text-orange-500" />
            Cheap Food Finder
          </h1>
          <p className="text-slate-400 text-sm">Find the most affordable food spots near you with addresses and prices.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                Your Location
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Town / Area / Campus</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. UNN Nsukka, Hilltop Area"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Max Budget (Optional)</label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 500 Naira"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isGenerating || !location.trim()}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Searching Places...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6 mr-2" />
                  Find Cheap Food
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Food Spots Found</h3>
                {foodList && (
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
                {foodList ? (
                  foodList
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <Utensils className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your location to find affordable meals nearby.
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

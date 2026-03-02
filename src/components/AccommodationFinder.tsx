import { useState } from 'react';
import { ArrowLeft, Home, Loader2, Download, Search, MapPin } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface AccommodationFinderProps {
  onBack: () => void;
}

export default function AccommodationFinder({ onBack }: AccommodationFinderProps) {
  const [state, setState] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Any');
  const [budget, setBudget] = useState('');
  const [listings, setListings] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSearch = async () => {
    if (!state.trim() || !location.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a real estate agent for students in Nigeria.
        Find available student accommodation (Lodges, Self-cons, Flats) in:
        State: ${state}
        Location/Area: ${location}
        Type: ${type}
        Budget: ${budget || 'Student Friendly'}
        
        Requirements:
        1. **List Specific Lodges/Houses:** Name of the lodge or building if known.
        2. **Location/Address:** Detailed description of where it is (e.g., "Odim Gate", "Behind Flat").
        3. **Price:** Current rent prices per year.
        4. **Features:** Water, light, security, distance to school.
        5. **Contact:** Caretaker or Agent phone numbers if found online.
        6. **Use Google Search:** Use the search tool to find real, current vacancies or popular student lodges in that area.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the list of accommodations. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt, { tools: [{ googleSearch: {} }] });
      setListings(result || 'Could not find accommodations. Please try again.');
    } catch (error) {
      console.error(error);
      setListings('An error occurred while searching.');
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
    doc.text("Accommodation Listings", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Location: ${location}, ${state}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(listings, contentWidth);
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

    doc.save("Accommodation_List.pdf");
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
            <Home className="w-8 h-8 mr-3 text-purple-500" />
            Accommodation Finder
          </h1>
          <p className="text-slate-400 text-sm">Find lodges, self-cons, and flats near your school with prices and contacts.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-emerald-500" />
                Search Criteria
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Enugu State"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Location / Town / Campus</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nsukka, Odim Gate"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                  >
                    <option value="Any">Any</option>
                    <option value="Self-con">Self-con</option>
                    <option value="Single Room">Single Room</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Max Budget</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 150k"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isGenerating || !state.trim() || !location.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Searching Lodges...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6 mr-2" />
                  Find Vacancies
                </>
              )}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Available Accommodations</h3>
                {listings && (
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
                {listings ? (
                  listings
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <Home className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your desired location to find a place to stay.
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

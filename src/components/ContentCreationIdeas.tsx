import { useState } from 'react';
import { ArrowLeft, Video, Loader2, Download, Instagram, Youtube, Twitter } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface ContentCreationIdeasProps {
  onBack: () => void;
}

export default function ContentCreationIdeas({ onBack }: ContentCreationIdeasProps) {
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [platform, setPlatform] = useState('All Platforms');
  const [ideas, setIdeas] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!skills.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a digital marketing and content strategy expert.
        Generate content creation income ideas for a student with the following profile:
        
        Skills: ${skills}
        Interests: ${interests}
        Preferred Platform: ${platform}
        
        Requirements:
        1. **Niche Ideas:** Suggest 5 specific, profitable niches based on their skills/interests.
        2. **Content Types:** What kind of content to post (Reels, Threads, Long-form video, Blog posts).
        3. **Monetization:** How to make money from each idea (Affiliate, AdSense, Digital Products, Sponsorships).
        4. **Growth Strategy:** First steps to get 1,000 followers.
        
        Format clearly with plain text headers.
        DO NOT use Markdown formatting like "###" or "**".
        Output ONLY the ideas. No conversational filler.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setIdeas(result || 'Could not generate ideas. Please try again.');
    } catch (error) {
      console.error(error);
      setIdeas('An error occurred while generating ideas.');
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
    doc.text("Content Creation Strategy", pageWidth / 2, 40, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Platform: ${platform}`, pageWidth / 2, 50, { align: "center" });

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 55, pageWidth - margin, 55);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    
    const splitContent = doc.splitTextToSize(ideas, contentWidth);
    
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

    doc.save("Content_Strategy.pdf");
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
            <Video className="w-8 h-8 mr-3 text-pink-500" />
            Content Creation Income Ideas
          </h1>
          <p className="text-slate-400 text-sm">Turn your skills and interests into a profitable content creation side hustle.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Instagram className="w-5 h-5 mr-2 text-emerald-500" />
                Your Creator Profile
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Skills / Talents</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Video editing, Graphic design, Storytelling, Comedy..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Interests / Hobbies</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Tech, Fashion, Gaming, Education"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Preferred Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none"
                >
                  <option value="All Platforms">All Platforms</option>
                  <option value="TikTok / Reels">TikTok / Instagram Reels</option>
                  <option value="YouTube">YouTube (Long-form)</option>
                  <option value="Twitter / X">Twitter / X (Text-based)</option>
                  <option value="LinkedIn">LinkedIn (Professional)</option>
                  <option value="Blog / Newsletter">Blog / Newsletter</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !skills.trim()}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Strategizing...
                </>
              ) : (
                <>
                  <Video className="w-6 h-6 mr-2" />
                  Get Content Ideas
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Strategy & Ideas</h3>
                {ideas && (
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
                {ideas ? (
                  ideas
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <Youtube className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your skills to discover your content creator path.
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

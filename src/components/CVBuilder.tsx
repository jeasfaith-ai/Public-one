import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2, Download, Briefcase, GraduationCap, Award } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface CVBuilderProps {
  onBack: () => void;
}

type DocType = 'CV' | 'Personal Statement';
type Purpose = 'SIWES' | 'Internship' | 'Scholarship' | 'NYSC';

export default function CVBuilder({ onBack }: CVBuilderProps) {
  const [docType, setDocType] = useState<DocType>('CV');
  const [purpose, setPurpose] = useState<Purpose>('Internship');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [course, setCourse] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [referees, setReferees] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!fullName || !course) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a professional career coach and resume writer.
        Create a professional ${docType} for a student applying for ${purpose}.
        
        Student Details:
        - Name: ${fullName}
        - Email: ${email}
        - Phone: ${phone}
        - Address: ${address}
        - Course of Study: ${course}
        - Education History: ${education}
        - Key Skills: ${skills}
        - Experience/Activities: ${experience}
        - Referees: ${referees}
        
        Requirements:
        - Format: Professional, clean, and standard for ${purpose} applications in Nigeria.
        - Tone: Formal, ambitious, and persuasive.
        - Structure:
          ${docType === 'CV' ? '- Header (Name, Contact Info)\n- Professional Summary\n- Education\n- Skills\n- Experience (if any)\n- Referees' : '- Header\n- Salutation\n- Introduction\n- Body Paragraphs (Why this role? Why me?)\n- Conclusion\n- Sign-off'}
        - Highlight relevant coursework and soft skills if experience is limited.
        
        CRITICAL:
        - DO NOT use Markdown formatting like "###" or "**". Use plain text headers in ALL CAPS.
        - DO NOT include any introductory or concluding remarks like "Here is your CV".
        - Provide a ready-to-paste script.
        - Output ONLY the document content.
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setGeneratedContent(result || 'Could not generate content. Please try again.');
    } catch (error) {
      console.error(error);
      setGeneratedContent('An error occurred while generating content.');
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

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${docType.toUpperCase()} - ${purpose.toUpperCase()}`, pageWidth / 2, 20, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);

    // Content
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.setTextColor(0);
    
    const splitContent = doc.splitTextToSize(generatedContent, contentWidth);
    
    let cursorY = 35;
    const lineHeight = 6;

    for (let i = 0; i < splitContent.length; i++) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
      doc.text(splitContent[i], margin, cursorY);
      cursorY += lineHeight;
    }

    doc.save(`${fullName.replace(/\s+/g, '_')}_${docType}_${purpose}.pdf`);
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
            <Briefcase className="w-8 h-8 mr-3 text-blue-500" />
            CV & Personal Statement Builder
          </h1>
          <p className="text-slate-400 text-sm">Create professional documents for SIWES, Internships, Scholarships, and NYSC.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-emerald-500" />
                Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="CV">CV / Resume</option>
                    <option value="Personal Statement">Personal Statement</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as Purpose)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="SIWES">SIWES / IT</option>
                    <option value="Internship">Internship</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="NYSC">NYSC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Course of Study</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Education History</label>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. University of Nigeria, Nsukka (2021-Present) - B.Sc. Computer Science"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Key Skills (Comma separated)</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, Communication, Teamwork, Microsoft Office"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Experience / Activities / Achievements</label>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Briefly list any work experience, volunteering, or academic achievements..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-24 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 uppercase">Referees (Optional)</label>
                <textarea
                  value={referees}
                  onChange={(e) => setReferees(e.target.value)}
                  placeholder="Name, Role, Contact Info (or leave blank for 'Available on Request')"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none h-20 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !fullName || !course}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Briefcase className="w-6 h-6 mr-2" />
                  Generate Document
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Preview</h3>
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

              <div className="flex-1 bg-white text-slate-900 rounded-lg p-8 overflow-y-auto max-h-[700px] shadow-inner font-serif leading-relaxed whitespace-pre-wrap break-words">
                {generatedContent ? (
                  generatedContent
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                    <Briefcase className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Fill in your details and click generate to see your professional document here.
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

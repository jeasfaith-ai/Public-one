import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Download, Loader2, CheckCircle, AlertCircle, User, BookOpen, Calendar, GraduationCap, PenTool } from 'lucide-react';
import { generateProjectContent } from '../utils/gemini';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProjectWriterProps {
  onBack: () => void;
}

interface ProjectDetails {
  title: string;
  researcherName: string;
  regNo: string;
  department: string;
  yearOfSubmission: string;
  supervisorName: string;
  hodName: string;
  internalExaminerName: string;
  externalExaminerName: string;
  deanName: string;
  dedication: string;
  acknowledgement: string;
}

export default function ProjectWriter({ onBack }: ProjectWriterProps) {
  const [details, setDetails] = useState<ProjectDetails>({
    title: '',
    researcherName: '',
    regNo: '',
    department: '',
    yearOfSubmission: '',
    supervisorName: '',
    hodName: '',
    internalExaminerName: '',
    externalExaminerName: '',
    deanName: 'Prof. J.C. Omeje', // Default based on PDF
    dedication: '',
    acknowledgement: '',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [writingStatus, setWritingStatus] = useState("Initializing...");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    // Simulation timer
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        const newProgress = prev + 1;
        
        // Update status based on progress
        if (newProgress < 10) setWritingStatus("Initializing project structure...");
        else if (newProgress < 30) setWritingStatus("Writing Chapter 1: Introduction...");
        else if (newProgress < 50) setWritingStatus("Writing Chapter 2: Literature Review...");
        else if (newProgress < 70) setWritingStatus("Writing Chapter 3: Methodology...");
        else if (newProgress < 85) setWritingStatus("Writing Chapter 4: Data Analysis...");
        else setWritingStatus("Writing Chapter 5: Conclusion & Recommendations...");
        
        return newProgress;
      });
    }, 800); // ~80 seconds for 100% if linear, but we wait for API

    try {
      const content = await generateProjectContent(details);
      setResult(content);
      setProgress(100);
      setWritingStatus("Finalizing document...");
    } catch (err: any) {
      setError(err.message || 'Failed to generate project. Please try again.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Set font to Times New Roman
    doc.setFont("times", "normal");
    doc.setTextColor(0, 0, 0);
    
    // Helper to add text with page breaks
    const addTextWithPageBreaks = (text: string, startY: number = 20) => {
      const splitText = doc.splitTextToSize(text, 170);
      let y = startY;
      splitText.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 6;
      });
    };

    // --- COVER PAGE ---
    let y = 40;
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text(details.title.toUpperCase(), 105, y, { align: 'center', maxWidth: 170 });
    
    y += 60;
    doc.text("BY", 105, y, { align: 'center' });
    
    y += 30;
    doc.text(details.researcherName.toUpperCase(), 105, y, { align: 'center' });
    y += 10;
    doc.text(details.regNo, 105, y, { align: 'center' });
    
    y += 50;
    doc.setFontSize(12);
    doc.text(`DEPARTMENT OF ${details.department.toUpperCase()}`, 105, y, { align: 'center' });
    y += 10;
    doc.text("NWAFOR ORIZU COLLEGE OF EDUCATION, NSUGBE", 105, y, { align: 'center' });
    y += 10;
    doc.text("IN AFFILIATION WITH THE UNIVERSITY OF NIGERIA, NSUKKA", 105, y, { align: 'center' });
    
    y += 40;
    doc.text(details.yearOfSubmission.toUpperCase(), 105, y, { align: 'center' });
    
    // --- TITLE PAGE ---
    doc.addPage();
    y = 30;
    doc.setFontSize(14);
    doc.text("TITLE PAGE", 105, y, { align: 'center' });
    
    y += 20;
    doc.text(details.title.toUpperCase(), 105, y, { align: 'center', maxWidth: 170 });
    
    y += 40;
    doc.text("BY", 105, y, { align: 'center' });
    
    y += 20;
    doc.text(details.researcherName.toUpperCase(), 105, y, { align: 'center' });
    y += 10;
    doc.text(details.regNo, 105, y, { align: 'center' });
    
    y += 40;
    doc.setFontSize(11);
    const submissionText = `PROJECT SUBMITTED TO THE DEPARTMENT OF ${details.department.toUpperCase()}, NWAFOR ORIZU COLLEGE OF EDUCATION, NSUGBE IN AFFILIATION WITH THE UNIVERSITY OF NIGERIA, NSUKKA IN PARTIAL FULFILLMENT OF THE REQUIREMENTS FOR THE AWARD OF BACHELOR OF SCIENCE DEGREE IN EDUCATION/POLITICAL SCIENCE (B.SC. ED)`;
    doc.text(submissionText, 105, y, { align: 'center', maxWidth: 160 });
    
    y += 40;
    doc.text(`SUPERVISOR: ${details.supervisorName.toUpperCase()}`, 105, y, { align: 'center' });
    
    y += 30;
    doc.text(details.yearOfSubmission.toUpperCase(), 105, y, { align: 'center' });
    
    // --- CERTIFICATION PAGE ---
    doc.addPage();
    y = 30;
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("CERTIFICATION PAGE", 105, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    const certText = `I, ${details.researcherName} with registration number ${details.regNo} respectively do hereby certify that the work embodied in this project is as a result of original effort and has not to the best of my knowledge been submitted to this university or any other institution for the award of degree certificate.`;
    doc.text(doc.splitTextToSize(certText, 160), 25, y);
    
    y += 50;
    // Signatures
    doc.line(25, y, 85, y);
    doc.text(details.researcherName, 25, y + 5);
    doc.text("(Researcher)", 25, y + 10);
    
    doc.line(125, y, 185, y);
    doc.text(details.supervisorName, 125, y + 5);
    doc.text("(Supervisor)", 125, y + 10);
    
    // --- APPROVAL PAGE ---
    doc.addPage();
    y = 30;
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("APPROVAL PAGE", 105, y, { align: 'center' });
    
    y += 20;
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    const approvalText = `This project "${details.title}" by ${details.researcherName} has been read and approved by the undersigned as meeting the requirement of the Department of ${details.department}, University of Nigeria Nsukka for the award of bachelor of science Degree in Political Science Education.`;
    doc.text(doc.splitTextToSize(approvalText, 160), 25, y);
    
    y += 40;
    doc.text("By", 105, y, { align: 'center' });
    
    y += 30;
    // Signature Grid
    // Row 1
    doc.line(25, y, 85, y);
    doc.text(details.supervisorName, 25, y + 5);
    doc.text("Supervisor", 25, y + 10);
    
    doc.line(125, y, 185, y);
    doc.text(details.hodName, 125, y + 5);
    doc.text("Head of Department", 125, y + 10);
    
    // Row 2
    y += 40;
    doc.line(25, y, 85, y);
    doc.text("Internal Examiner", 25, y + 5);
    
    doc.line(125, y, 185, y);
    doc.text("External Examiner", 125, y + 5);
    
    // Row 3
    y += 40;
    doc.line(75, y, 135, y);
    doc.text(details.deanName, 75, y + 5);
    doc.text("Dean, Faculty of Education", 75, y + 10);
    doc.text("University of Nigeria Nsukka", 75, y + 15);
    
    // --- PARSE CONTENT ---
    const sections = {
      dedication: result.match(/<<<DEDICATION>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      acknowledgement: result.match(/<<<ACKNOWLEDGEMENTS>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      abstract: result.match(/<<<ABSTRACT>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      toc: result.match(/<<<TABLE_OF_CONTENTS>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      ch1: result.match(/<<<CHAPTER_ONE>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      ch2: result.match(/<<<CHAPTER_TWO>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      ch3: result.match(/<<<CHAPTER_THREE>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      ch4: result.match(/<<<CHAPTER_FOUR>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      ch5: result.match(/<<<CHAPTER_FIVE>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      refs: result.match(/<<<REFERENCES>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
      appendix: result.match(/<<<APPENDIX>>>([\s\S]*?)(?=<<<|$)/)?.[1]?.trim() || "",
    };

    // --- DEDICATION ---
    if (sections.dedication) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("DEDICATION", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.dedication, 50);
    }

    // --- ACKNOWLEDGEMENTS ---
    if (sections.acknowledgement) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("ACKNOWLEDGEMENTS", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.acknowledgement, 50);
    }

    // --- TABLE OF CONTENTS ---
    if (sections.toc) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("TABLE OF CONTENTS", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.toc, 50);
    }

    // --- ABSTRACT ---
    if (sections.abstract) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("ABSTRACT", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.abstract, 50);
    }

    // --- CHAPTERS ---
    const chapters = [sections.ch1, sections.ch2, sections.ch3, sections.ch4, sections.ch5];
    chapters.forEach((chapterContent) => {
      if (chapterContent) {
        doc.addPage();
        // Remove markdown headers for cleaner PDF output if desired, or keep them.
        // For now, we print as is but ensure new page for each chapter.
        addTextWithPageBreaks(chapterContent, 20);
      }
    });

    // --- REFERENCES ---
    if (sections.refs) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("REFERENCES", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.refs, 50);
    }

    // --- APPENDIX ---
    if (sections.appendix) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.text("APPENDIX", 105, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont("times", "normal");
      addTextWithPageBreaks(sections.appendix, 50);
    }
    
    doc.save(`${details.title.substring(0, 20).replace(/\s+/g, '_')}_Project.pdf`);
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <PenTool className="w-8 h-8 mr-3 text-indigo-500" />
            Project Writer
          </h1>
          <p className="text-slate-400">Generate a complete, professionally structured academic project following UNN/NOCEN standards.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Project Details</h3>
                <span className="text-xs text-slate-500">Step {step} of 3</span>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Project Title</label>
                      <textarea
                        name="title"
                        value={details.title}
                        onChange={handleInputChange}
                        placeholder="Enter the full project title..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Researcher Name</label>
                        <input
                          name="researcherName"
                          value={details.researcherName}
                          onChange={handleInputChange}
                          placeholder="Full Name"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Reg No</label>
                        <input
                          name="regNo"
                          value={details.regNo}
                          onChange={handleInputChange}
                          placeholder="Registration Number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                      <input
                        name="department"
                        value={details.department}
                        onChange={handleInputChange}
                        placeholder="e.g. Political Science"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Year of Submission</label>
                      <input
                        name="yearOfSubmission"
                        value={details.yearOfSubmission}
                        onChange={handleInputChange}
                        placeholder="e.g. November 2022"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                    >
                      Next: Supervisor Info
                    </button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Supervisor Name</label>
                      <input
                        name="supervisorName"
                        value={details.supervisorName}
                        onChange={handleInputChange}
                        placeholder="Supervisor's Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">HOD Name</label>
                      <input
                        name="hodName"
                        value={details.hodName}
                        onChange={handleInputChange}
                        placeholder="Head of Department"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Internal Examiner</label>
                        <input
                          name="internalExaminerName"
                          value={details.internalExaminerName}
                          onChange={handleInputChange}
                          placeholder="Internal Examiner"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">External Examiner</label>
                        <input
                          name="externalExaminerName"
                          value={details.externalExaminerName}
                          onChange={handleInputChange}
                          placeholder="External Examiner"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Dean, Faculty of Education (UNN)</label>
                      <input
                        name="deanName"
                        value={details.deanName}
                        onChange={handleInputChange}
                        placeholder="Dean's Name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep(3)}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all"
                      >
                        Next: Dedication
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Dedication (Optional)</label>
                      <textarea
                        name="dedication"
                        value={details.dedication}
                        onChange={handleInputChange}
                        placeholder="Leave empty for system to generate..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                      />
                      <p className="text-[10px] text-slate-500 italic">Note: Dedications to supreme beings (e.g. God) are automatically filtered per guidelines.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Acknowledgement (Optional)</label>
                      <textarea
                        name="acknowledgement"
                        value={details.acknowledgement}
                        onChange={handleInputChange}
                        placeholder="Leave empty for system to generate..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStep(2)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !details.title || !details.researcherName}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Full Project'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Result Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Project Preview</h2>
              {result && (
                <button
                  onClick={downloadPDF}
                  className="text-indigo-500 hover:text-indigo-400 flex items-center text-sm font-medium"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto prose prose-invert prose-indigo max-w-none">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="bg-slate-800/50 border border-amber-500/20 rounded-xl p-4 mb-8 max-w-md w-full">
                    <div className="flex items-start gap-3 text-left">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-amber-500 font-medium text-sm mb-1">Important Warning</h4>
                        <p className="text-slate-400 text-xs leading-relaxed">
                          Please do not exit or refresh this page until the generation is 100% complete. Exiting now will cancel the process.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full max-w-md mb-8">
                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <motion.div 
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                  </div>

                  <h2 className="text-xl font-bold text-white mb-2">{writingStatus}</h2>
                  <p className="text-emerald-500 font-medium mb-8">{progress}% Complete</p>
                  
                  <p className="text-slate-500 text-sm">
                    Generating professional content tailored to <br/>
                    <span className="text-slate-400">{details.department || 'your department'}</span>
                  </p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="text-center">{error}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                  <FileText className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center">Your generated project will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

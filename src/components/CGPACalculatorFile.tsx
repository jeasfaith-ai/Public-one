import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calculator, Upload, Download, Loader2, CheckCircle2, AlertCircle, FileText, GraduationCap, X } from 'lucide-react';
import { extractGradesFromFile } from '../utils/gemini';
import { jsPDF } from "jspdf";

interface Course {
  name: string;
  grade: string;
  creditLoad: number;
}

interface CGPACalculatorFileProps {
  onBack: () => void;
}

const GRADES = [
  { label: 'A', value: 5 },
  { label: 'B', value: 4 },
  { label: 'C', value: 3 },
  { label: 'D', value: 2 },
  { label: 'E', value: 1 },
  { label: 'F', value: 0 },
];

export default function CGPACalculatorFile({ onBack }: CGPACalculatorFileProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [classLevel, setClassLevel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => {
        const newFiles = [...prev, ...selectedFiles].slice(0, 10); // Limit to 10 files
        return newFiles;
      });
      setCourses([]);
      setCgpa(null);
      setError(null);
    }
    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setCourses([]);
    setCgpa(null);
    setError(null);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      let allExtractedCourses: Course[] = [];
      
      for (const file of files) {
        const base64Data = await readFileAsDataURL(file);
        const extractedCourses = await extractGradesFromFile(base64Data, file.type);
        allExtractedCourses = [...allExtractedCourses, ...extractedCourses];
      }
      
      setCourses(allExtractedCourses);
      calculateCGPA(allExtractedCourses);
    } catch (err: any) {
      setError(err.message || 'Failed to extract grades. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateCGPA = (courseList: Course[]) => {
    let totalPoints = 0;
    let totalCredits = 0;

    courseList.forEach(course => {
      const gradeValue = GRADES.find(g => g.label === course.grade.toUpperCase())?.value || 0;
      totalPoints += gradeValue * course.creditLoad;
      totalCredits += Number(course.creditLoad);
    });

    if (totalCredits === 0) return;

    const calculatedCgpa = Number((totalPoints / totalCredits).toFixed(2));
    setCgpa(calculatedCgpa);

    let level = '';
    if (calculatedCgpa >= 4.50) level = 'First Class Honours';
    else if (calculatedCgpa >= 3.50) level = 'Second Class Honours (Upper Division)';
    else if (calculatedCgpa >= 2.40) level = 'Second Class Honours (Lower Division)';
    else if (calculatedCgpa >= 1.50) level = 'Third Class Honours';
    else if (calculatedCgpa >= 1.00) level = 'Pass';
    else level = 'Fail';

    setClassLevel(level);
  };

  const generatePDF = () => {
    if (cgpa === null) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo/Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("STRESS NO MORE", pageWidth / 2, 17, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("AUTO-CALCULATED CGPA RESULT SLIP", pageWidth / 2, 32, { align: "center" });
    
    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Result Summary:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 50);
    
    // Result Summary Box
    doc.setFillColor(240, 253, 244); // Light emerald
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(20, 60, 170, 35, 3, 3, 'FD');
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`CGPA: ${cgpa.toFixed(2)}`, 105, 75, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text(`${classLevel}`, 105, 87, { align: "center" });
    
    // Table Header
    let y = 110;
    doc.setFillColor(51, 65, 85); // Slate 700
    doc.rect(20, y, 170, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("COURSE CODE/TITLE", 25, y + 7);
    doc.text("UNITS", 110, y + 7);
    doc.text("GRADE", 140, y + 7);
    doc.text("POINTS", 170, y + 7);
    
    // Table Rows
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    courses.forEach((course, index) => {
      const gradeValue = GRADES.find(g => g.label === course.grade.toUpperCase())?.value || 0;
      const points = gradeValue * course.creditLoad;
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, 170, 10, 'F');
      }
      
      doc.text((course.name || `Course ${index + 1}`).substring(0, 40), 25, y + 7);
      doc.text(course.creditLoad.toString(), 115, y + 7);
      doc.text(course.grade.toUpperCase(), 145, y + 7);
      doc.text(points.toString(), 175, y + 7);
      
      y += 10;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by Stress No More - Your Academic Assistant", 105, pageHeight - 10, { align: "center" });
    
    doc.save(`CGPA_Result_${new Date().getTime()}.pdf`);
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
            <Calculator className="w-8 h-8 mr-3 text-emerald-500" />
            CGPA Calculator (File Upload)
          </h1>
          <p className="text-slate-400">Upload up to 10 result screenshots or PDFs (e.g., Year 1 to Year 4) to calculate your cumulative CGPA automatically.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl p-8 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors flex flex-col items-center justify-center min-h-[300px] text-center relative">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-300 font-medium mb-2">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-sm">PNG, JPG, or PDF (Max 10 files)</p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={files.length >= 10}
              />
            </div>

            {files.length > 0 && (
              <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-slate-300">Uploaded Files ({files.length}/10)</h3>
                  <button 
                    onClick={() => { setFiles([]); setCourses([]); setCgpa(null); }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg">
                      <div className="flex items-center overflow-hidden">
                        <FileText className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="text-slate-500 hover:text-red-400 ml-2 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {files.length > 0 && !cgpa && !loading && (
              <button
                onClick={processFile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center"
              >
                Calculate Cumulative CGPA
              </button>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Result Analysis</h2>
              {cgpa !== null && (
                <button
                  onClick={generatePDF}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center text-sm font-medium"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save PDF
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
                  <p className="text-center">Extracting grades from {files.length} file(s) and calculating CGPA...</p>
                </div>
              ) : cgpa !== null ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="text-5xl font-black text-emerald-400 mb-2">{cgpa.toFixed(2)}</div>
                    <div className="text-emerald-500/80 font-bold uppercase tracking-wider text-sm">{classLevel}</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase px-2">Extracted Courses ({courses.length})</h4>
                    <div className="space-y-1">
                      {courses.map((course, i) => (
                        <div key={i} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-lg text-sm">
                          <span className="text-slate-200 font-medium">{course.name}</span>
                          <div className="flex gap-4">
                            <span className="text-slate-400">{course.creditLoad} Units</span>
                            <span className="text-emerald-400 font-bold">{course.grade.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="text-center">{error}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                  <p className="text-center">Upload your result(s) to see the calculation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

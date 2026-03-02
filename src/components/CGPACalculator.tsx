import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calculator, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, GraduationCap, Download, User, BookOpen } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';
import { jsPDF } from "jspdf";
import { UserContext } from '../App';

interface Course {
  id: string;
  name: string;
  grade: string;
  creditLoad: number;
}

interface CGPACalculatorProps {
  onBack: () => void;
}

const GRADES = [
  { label: 'A', value: 5, description: 'Excellent (70-100)' },
  { label: 'B', value: 4, description: 'Very Good (60-69)' },
  { label: 'C', value: 3, description: 'Good (50-59)' },
  { label: 'D', value: 2, description: 'Fair (45-49)' },
  { label: 'E', value: 1, description: 'Pass (40-44)' },
  { label: 'F', value: 0, description: 'Fail (0-39)' },
];

export default function CGPACalculator({ onBack }: CGPACalculatorProps) {
  const { user } = useContext(UserContext);
  const [studentName, setStudentName] = useState(user?.fullName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', grade: 'A', creditLoad: 3 },
  ]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [classLevel, setClassLevel] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const addCourse = () => {
    setCourses([...courses, { id: Date.now().toString(), name: '', grade: 'A', creditLoad: 3 }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculateCGPA = async () => {
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      const gradeValue = GRADES.find(g => g.label === course.grade)?.value || 0;
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
    
    // Generate Analysis
    setLoadingAnalysis(true);
    try {
      const prompt = `
        Act as an academic advisor for a Nigerian university student (specifically UNN system).
        The student has a CGPA of ${calculatedCgpa} which is a ${level}.
        Student Name: ${studentName}
        Department: ${department}
        
        Course Breakdown:
        ${courses.map(c => `- ${c.name || 'Course'}: Grade ${c.grade}, ${c.creditLoad} units`).join('\n')}
        
        Provide a short, encouraging, and strategic advice (max 3 sentences). 
        If First Class, congratulate them. If lower, suggest specific strategies to improve based on their grades.
        Be concise and motivational.
      `;
      
      const analysis = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setAiAnalysis(analysis || "Keep pushing! Your academic journey is a marathon, not a sprint.");
    } catch (error) {
      console.error("Analysis failed", error);
      setAiAnalysis("Great job calculating your result! Keep working hard.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const generatePDF = () => {
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
    doc.text("UNN CGPA RESULT SLIP", pageWidth / 2, 32, { align: "center" });
    
    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Student Details:", 20, 50);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${studentName || 'N/A'}`, 20, 60);
    doc.text(`Department: ${department || 'N/A'}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 60);
    
    // Result Summary Box
    doc.setFillColor(240, 253, 244); // Light emerald
    doc.setDrawColor(16, 185, 129);
    doc.roundedRect(20, 80, 170, 35, 3, 3, 'FD');
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`CGPA: ${cgpa?.toFixed(2)}`, 105, 95, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text(`${classLevel}`, 105, 107, { align: "center" });
    
    // Table Header
    let y = 130;
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
      const gradeValue = GRADES.find(g => g.label === course.grade)?.value || 0;
      const points = gradeValue * course.creditLoad;
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y, 170, 10, 'F');
      }
      
      doc.text((course.name || `Course ${index + 1}`).substring(0, 40), 25, y + 7);
      doc.text(course.creditLoad.toString(), 115, y + 7);
      doc.text(course.grade, 145, y + 7);
      doc.text(points.toString(), 175, y + 7);
      
      y += 10;
      
      // New page if needed
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
    
    doc.save(`${(studentName || 'Student').replace(/\s+/g, '_')}_CGPA_Result.pdf`);
  };

  const reset = () => {
    setCourses([{ id: '1', name: '', grade: 'A', creditLoad: 3 }]);
    setCgpa(null);
    setClassLevel('');
    setAiAnalysis('');
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

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
              <Calculator className="w-8 h-8 mr-3 text-emerald-500" />
              UNN CGPA Calculator
            </h1>
            <p className="text-slate-400 text-sm">Calculate and download your official result slip.</p>
          </div>
          <button 
            onClick={reset}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors self-start md:self-center"
            title="Reset Calculator"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Student Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-500" />
                Student Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Course Details */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-emerald-500" />
                  Course Grades
                </h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                  {courses.length} Courses
                </span>
              </div>

              {/* Table Header (Desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-2 mb-2 px-3 text-xs font-bold text-slate-500 uppercase">
                <div className="col-span-6">Course Name / Code</div>
                <div className="col-span-2">Grade</div>
                <div className="col-span-3 text-center">Credit Load</div>
                <div className="col-span-1"></div>
              </div>

              <div className="space-y-3">
                {courses.map((course, index) => (
                  <motion.div 
                    key={course.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
                  >
                    <div className="sm:col-span-6">
                      <label className="sm:hidden text-xs text-slate-500 block mb-1">Course Name</label>
                      <input
                        type="text"
                        placeholder={`e.g. MTH101`}
                        value={course.name}
                        onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                        className="w-full bg-transparent border-b border-slate-700 focus:border-emerald-500 text-white placeholder-slate-600 text-sm py-1 outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden text-xs text-slate-500 block mb-1">Grade</label>
                      <select
                        value={course.grade}
                        onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-emerald-500 outline-none"
                      >
                        {GRADES.map(g => (
                          <option key={g.label} value={g.label}>{g.label} ({g.value})</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-xs text-slate-500 block mb-1">Credit Load</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={course.creditLoad}
                          onChange={(e) => updateCourse(course.id, 'creditLoad', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white text-sm focus:border-emerald-500 outline-none text-center"
                        />
                        <span className="text-xs text-slate-500 hidden sm:inline">Units</span>
                      </div>
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {courses.length > 1 && (
                        <button 
                          onClick={() => removeCourse(course.id)}
                          className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={addCourse}
                className="mt-4 w-full py-3 border-2 border-dashed border-slate-700 rounded-lg text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center font-medium text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Course
              </button>
            </div>

            <button
              onClick={calculateCGPA}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.01]"
            >
              Calculate Result
            </button>
          </div>

          {/* Result Section */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {cgpa !== null ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 sticky top-24"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-2">Your CGPA</h3>
                    <div className={`text-6xl font-black mb-2 ${
                      cgpa >= 4.5 ? 'text-emerald-400' : 
                      cgpa >= 3.5 ? 'text-blue-400' : 
                      cgpa >= 2.5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {cgpa.toFixed(2)}
                    </div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      cgpa >= 4.5 ? 'bg-emerald-500/20 text-emerald-400' : 
                      cgpa >= 3.5 ? 'bg-blue-500/20 text-blue-400' : 
                      cgpa >= 2.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {classLevel}
                    </div>
                  </div>

                  <button
                    onClick={generatePDF}
                    className="w-full py-3 mb-6 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Result PDF
                  </button>

                  <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800">
                    <h4 className="flex items-center text-sm font-semibold text-white mb-2">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-400" />
                      Academic Advisor
                    </h4>
                    {loadingAnalysis ? (
                      <div className="flex items-center space-x-2 text-slate-500 text-sm">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150" />
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm leading-relaxed italic">
                        "{aiAnalysis}"
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center text-slate-500">
                  <Calculator className="w-12 h-12 mb-4 opacity-20" />
                  <p>Enter your grades to see your CGPA analysis here.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

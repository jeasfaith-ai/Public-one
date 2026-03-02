import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calculator, Loader2, Download, AlertTriangle, TrendingDown } from 'lucide-react';
import { jsPDF } from "jspdf";

interface CarryoverCalculatorProps {
  onBack: () => void;
}

export default function CarryoverCalculator({ onBack }: CarryoverCalculatorProps) {
  const [currentCGPA, setCurrentCGPA] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [failedCourses, setFailedCourses] = useState([{ units: '', grade: 'F' }]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);

  const addCourse = () => {
    setFailedCourses([...failedCourses, { units: '', grade: 'F' }]);
  };

  const updateCourse = (index: number, field: string, value: string) => {
    const updated = [...failedCourses];
    updated[index] = { ...updated[index], [field]: value };
    setFailedCourses(updated);
  };

  const calculateImpact = () => {
    const currentPoints = parseFloat(currentCGPA) * parseFloat(totalUnits);
    let failedUnits = 0;
    
    // Calculate total units of failed courses (assuming 0 points for F)
    failedCourses.forEach(c => {
      failedUnits += parseFloat(c.units) || 0;
    });

    // New Total Units (Current + Failed courses retaken)
    // Note: This is a simplified projection. Usually, carryovers add to total units registered when retaken.
    // Scenario: Student retakes the courses and passes them.
    // Let's project: If they retake and get 'C' (3 points) or 'A' (5 points).
    
    const projectedUnits = parseFloat(totalUnits) + failedUnits;
    
    // Scenario A: Retake and get A (5 points)
    const pointsWithA = currentPoints + (failedUnits * 5);
    const cgpaWithA = pointsWithA / projectedUnits;

    // Scenario B: Retake and get C (3 points)
    const pointsWithC = currentPoints + (failedUnits * 3);
    const cgpaWithC = pointsWithC / projectedUnits;

    // Current Impact (Drag)
    // If these units were passed with C initially:
    // (Current Points + (FailedUnits * 3)) / TotalUnits
    // The "Lost" CGPA
    
    setImpactAnalysis({
      failedUnits,
      projectedUnits,
      cgpaWithA: cgpaWithA.toFixed(2),
      cgpaWithC: cgpaWithC.toFixed(2),
      drop: "N/A" // Simplified for now
    });
  };

  const handleDownloadPDF = () => {
    if (!impactAnalysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;

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
    doc.text("Carryover Impact Analysis", pageWidth / 2, 40, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Content
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    
    let y = 60;
    doc.text(`Current CGPA: ${currentCGPA}`, margin, y);
    y += 10;
    doc.text(`Total Units Taken So Far: ${totalUnits}`, margin, y);
    y += 10;
    doc.text(`Total Failed Units: ${impactAnalysis.failedUnits}`, margin, y);
    y += 20;

    doc.setFont("helvetica", "bold");
    doc.text("Projected Recovery Scenarios (After Retaking):", margin, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.text(`- If you retake and score all A's: New CGPA ~ ${impactAnalysis.cgpaWithA}`, margin, y);
    y += 10;
    doc.text(`- If you retake and score all C's: New CGPA ~ ${impactAnalysis.cgpaWithC}`, margin, y);
    y += 20;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Note: This is an estimation based on standard weighting. Actual results may vary.", margin, y);

    doc.save("Carryover_Impact_Report.pdf");
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
            <TrendingDown className="w-8 h-8 mr-3 text-red-500" />
            Carryover Impact Calculator
          </h1>
          <p className="text-slate-400 text-sm">Visualize how failed courses affect your final CGPA and plan your recovery.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-emerald-500" />
                Current Standing
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentCGPA}
                    onChange={(e) => setCurrentCGPA(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">Total Units Taken</label>
                  <input
                    type="number"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Failed Courses (Units)</label>
                {failedCourses.map((course, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="Units (e.g. 3)"
                      value={course.units}
                      onChange={(e) => updateCourse(index, 'units', e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-red-500 outline-none"
                    />
                  </div>
                ))}
                <button onClick={addCourse} className="text-xs text-blue-400 hover:text-blue-300 mt-2">+ Add another course</button>
              </div>
            </div>

            <button
              onClick={calculateImpact}
              disabled={!currentCGPA || !totalUnits}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Calculate Impact
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-full min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Impact Analysis</h3>
                {impactAnalysis && (
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                )}
              </div>

              <div className="flex-1 bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                {impactAnalysis ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <h4 className="text-red-400 font-medium mb-1">Total Failed Units</h4>
                      <p className="text-2xl font-bold text-white">{impactAnalysis.failedUnits} Units</p>
                      <p className="text-xs text-slate-400 mt-1">These weigh down your GPA significantly.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-slate-300 font-medium border-b border-slate-700 pb-2">Recovery Projection (If Retaken)</h4>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">If you score all A's:</span>
                        <span className="text-emerald-400 font-bold text-xl">{impactAnalysis.cgpaWithA}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">If you score all C's:</span>
                        <span className="text-yellow-400 font-bold text-xl">{impactAnalysis.cgpaWithC}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <AlertTriangle className="w-16 h-16" />
                    <p className="text-center max-w-xs">
                      Enter your details to see the impact analysis.
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

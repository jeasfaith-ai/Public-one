import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, Download, ArrowLeft, Loader2, CheckCircle, AlertCircle, BrainCircuit } from 'lucide-react';
import { solveImageQuestions } from '../utils/gemini';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface SnapAndSolveProps {
  onBack: () => void;
}

export default function SnapAndSolve({ onBack }: SnapAndSolveProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
    }
  }, [webcamRef]);

  const handleSolve = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const answers = await solveImageQuestions(image);
      setResult(answers);
    } catch (err: any) {
      setError(err.message || 'Failed to solve questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Add Logo/Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('STRESS NO MORE - EXAM SOLVER', 105, 13, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    const splitText = doc.splitTextToSize(result, 180);
    doc.text(splitText, 15, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()} | stressnomore.com`, 105, 285, { align: 'center' });
    
    doc.save('Exam_Answers.pdf');
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
            <Camera className="w-8 h-8 mr-3 text-emerald-500" />
            Snap & Solve
          </h1>
          <p className="text-slate-400">Snap your quiz or exam questions and get ready-to-write answers instantly.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] max-w-sm mx-auto bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-800">
              {!image ? (
                <Webcam
                  {...({
                    audio: false,
                    ref: webcamRef,
                    screenshotFormat: "image/jpeg",
                    className: "w-full h-full object-cover",
                    videoConstraints: { 
                      facingMode: 'environment',
                      aspectRatio: 0.75
                    }
                  } as any)}
                />
              ) : (
                <img src={image} alt="Captured" className="w-full h-full object-cover" />
              )}
              
              {!loading && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                  {!image ? (
                    <button
                      onClick={capture}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setImage(null); setResult(null); }}
                      className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-full shadow-lg transition-all transform hover:scale-110"
                    >
                      <RefreshCw className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {image && !result && !loading && (
              <button
                onClick={handleSolve}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center"
              >
                <BrainCircuit className="w-5 h-5 mr-2" />
                Solve Questions
              </button>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Answers</h2>
              {result && (
                <button
                  onClick={downloadPDF}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center text-sm font-medium"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Save PDF
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] prose prose-invert prose-emerald">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
                  <p className="text-center">Analyzing image and generating answers...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="flex items-center text-emerald-400 text-sm font-medium mb-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ready to write answers generated
                  </div>
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="text-center">{error}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                  <p className="text-center">Capture an image to see answers here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400 mb-3 font-bold">1</div>
            <p className="text-sm text-slate-400">Point your camera at the questions clearly.</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400 mb-3 font-bold">2</div>
            <p className="text-sm text-slate-400">Snap the photo and click "Solve Questions".</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div className="w-8 h-8 bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-400 mb-3 font-bold">3</div>
            <p className="text-sm text-slate-400">Get direct answers and download as PDF.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

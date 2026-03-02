import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, Download, ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, FileText, Type, ShieldCheck } from 'lucide-react';
import { solveEDU432Questions } from '../utils/gemini';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface EDU432QualityAssuranceProps {
  onBack: () => void;
}

type Mode = 'quiz-answers' | 'exam-questions' | 'quiz-questions';
type InputType = 'camera' | 'upload' | 'text';

export default function EDU432QualityAssurance({ onBack }: EDU432QualityAssuranceProps) {
  const [inputType, setInputType] = useState<InputType>('camera');
  const [mode, setMode] = useState<Mode>('quiz-answers');
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImage(null);
    }
  };

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    try {
      let input: { text?: string, base64Data?: string, mimeType?: string } = {};

      if (inputType === 'text') {
        input.text = textInput;
      } else if (inputType === 'camera' && image) {
        input.base64Data = image;
        input.mimeType = 'image/jpeg';
      } else if (inputType === 'upload' && file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        input.base64Data = await base64Promise;
        input.mimeType = file.type;
      }

      const response = await solveEDU432Questions(input, mode);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Add Logo/Header
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text('STRESS NO MORE - EDU 432', 105, 13, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const title = mode === 'quiz-answers' ? 'QUIZ ANSWERS' : mode === 'exam-questions' ? 'POSSIBLE EXAM QUESTIONS' : 'PRACTICE QUIZ';
    doc.text(title, 105, 30, { align: 'center' });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(result, 180);
    doc.text(splitText, 15, 40);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()} | stressnomore.com`, 105, 285, { align: 'center' });
    
    doc.save(`EDU432_${mode}.pdf`);
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
            <ShieldCheck className="w-8 h-8 mr-3 text-emerald-500" />
            EDU 432: Quality Assurance
          </h1>
          <p className="text-slate-400">Master Quality Assurance in Education with Stress no more quiz and exam help.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-2">1. Choose What You Need</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['quiz-answers', 'exam-questions', 'quiz-questions'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setResult(null); }}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all text-left flex items-center justify-between ${
                      mode === m 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {m === 'quiz-answers' ? 'Get Ready-to-Write Quiz Answers' : 
                     m === 'exam-questions' ? 'Get Possible Exam Questions' : 
                     'Get Practice Quiz Questions'}
                    {mode === m && <CheckCircle className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white mb-2">2. Provide Questions/Context</h3>
              <div className="flex gap-2 mb-4">
                {(['camera', 'upload', 'text'] as InputType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setInputType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      inputType === t 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {t === 'camera' && <Camera className="w-3 h-3" />}
                    {t === 'upload' && <Upload className="w-3 h-3" />}
                    {t === 'text' && <Type className="w-3 h-3" />}
                    {t}
                  </button>
                ))}
              </div>

              {inputType === 'camera' && (
                <div className="relative aspect-[3/4] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                  {!image ? (
                    <Webcam
                      {...({
                        audio: false,
                        ref: webcamRef,
                        screenshotFormat: "image/jpeg",
                        className: "w-full h-full object-cover",
                        videoConstraints: { facingMode: 'environment' }
                      } as any)}
                    />
                  ) : (
                    <img src={image} alt="Captured" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    {!image ? (
                      <button onClick={capture} className="bg-emerald-600 p-4 rounded-full text-white shadow-xl"><Camera /></button>
                    ) : (
                      <button onClick={() => setImage(null)} className="bg-slate-700 p-4 rounded-full text-white shadow-xl"><RefreshCw /></button>
                    )}
                  </div>
                </div>
              )}

              {inputType === 'upload' && (
                <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-xl p-8 text-center relative">
                  {!file ? (
                    <>
                      <Upload className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Upload photo or PDF of questions</p>
                      <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileText className="w-10 h-10 text-emerald-500 mb-2" />
                      <p className="text-sm text-slate-200 truncate max-w-full px-4">{file.name}</p>
                      <button onClick={() => setFile(null)} className="text-red-400 text-xs mt-2">Remove</button>
                    </div>
                  )}
                </div>
              )}

              {inputType === 'text' && (
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your questions here..."
                  className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:border-emerald-500 outline-none resize-none"
                />
              )}
            </div>

            <button
              onClick={handleProcess}
              disabled={loading || (inputType === 'camera' && !image) || (inputType === 'upload' && !file) || (inputType === 'text' && !textInput.trim())}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Generate Now'}
            </button>
          </div>

          {/* Result Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Result</h2>
              {result && (
                <button
                  onClick={downloadPDF}
                  className="text-emerald-500 hover:text-emerald-400 flex items-center text-sm font-medium"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto prose prose-invert prose-emerald max-w-none">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-12 h-12 animate-spin mb-4 text-emerald-500" />
                  <p className="text-center">Our system is studying the notes and generating your content...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center text-red-400">
                  <AlertCircle className="w-12 h-12 mb-4" />
                  <p className="text-center">{error}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                  <p className="text-center">Your generated content will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

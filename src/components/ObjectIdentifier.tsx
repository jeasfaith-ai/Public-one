import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, Download, ArrowLeft, Loader2, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { identifyObject } from '../utils/gemini';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';

interface ObjectIdentifierProps {
  onBack: () => void;
}

export default function ObjectIdentifier({ onBack }: ObjectIdentifierProps) {
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

  const handleIdentify = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    try {
      const description = await identifyObject(image);
      setResult(description);
    } catch (err: any) {
      setError(err.message || 'Failed to identify object. Please try again.');
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
    doc.text('STRESS NO MORE - OBJECT IDENTIFIER', 105, 13, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    const splitText = doc.splitTextToSize(result, 180);
    doc.text(splitText, 15, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleString()} | stressnomore.com`, 105, 285, { align: 'center' });
    
    doc.save('Object_Identification.pdf');
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
            <Search className="w-8 h-8 mr-3 text-emerald-500" />
            Object Identifier
          </h1>
          <p className="text-slate-400">Snap any object, person, or device to identify it and get detailed information.</p>
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
                onClick={handleIdentify}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Identify Object
              </button>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Identification Result</h2>
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
                  <p className="text-center">Analyzing image and identifying object...</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="flex items-center text-emerald-400 text-sm font-medium mb-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Object identified successfully
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
                  <p className="text-center">Capture an image to identify it.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

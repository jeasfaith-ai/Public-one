import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Upload, Image as ImageIcon, Download, Trash2, FileOutput } from 'lucide-react';
import jsPDF from 'jspdf';

interface ImageToPdfProps {
  onBack: () => void;
}

export default function ImageToPdf({ onBack }: ImageToPdfProps) {
  const [images, setImages] = useState<{ url: string, file: File }[]>([]);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 50) {
        alert('You can only upload up to 50 images.');
        return;
      }
      
      const newImages = newFiles.map((file: File) => ({
        url: URL.createObjectURL(file),
        file
      }));
      
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generatePdfFromImages = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        const img = new Image();
        img.src = images[i].url;
        
        await new Promise((resolve) => {
          img.onload = () => {
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgRatio = img.width / img.height;
            const pdfRatio = pdfWidth / pdfHeight;
            
            let finalWidth = pdfWidth;
            let finalHeight = pdfHeight;
            
            if (imgRatio > pdfRatio) {
              finalHeight = pdfWidth / imgRatio;
            } else {
              finalWidth = pdfHeight * imgRatio;
            }
            
            const x = (pdfWidth - finalWidth) / 2;
            const y = (pdfHeight - finalHeight) / 2;
            
            pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight);
            resolve(true);
          };
        });
      }
      
      pdf.save('converted_images.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePdfFromText = () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF();
      const margin = 15;
      const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      
      pdf.setFontSize(12);
      const splitText = pdf.splitTextToSize(text, pdfWidth);
      
      let y = margin;
      for (let i = 0; i < splitText.length; i++) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(splitText[i], margin, y);
        y += 7; // Line height
      }
      
      pdf.save('converted_text.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen p-4 sm:p-6 md:p-12 max-w-4xl mx-auto pb-24 relative bg-[#0f172a]"
    >
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-emerald-500 transition-colors mb-8"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Services
      </button>

      <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <FileOutput className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Convert to PDF</h2>
            <p className="text-slate-400">Convert your images or text into a PDF document</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center ${mode === 'image' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Images to PDF
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Text to PDF
          </button>
        </div>

        {/* Image Mode */}
        {mode === 'image' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-800/80 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-slate-400 mb-3" />
                  <p className="text-sm text-slate-400 mb-1">Click to upload images (Max 50)</p>
                  <p className="text-xs text-slate-500">PNG, JPG, JPEG</p>
                </div>
                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
              </label>
            </div>

            {images.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Selected Images ({images.length}/50)</h3>
                  <button 
                    onClick={() => setImages([])}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-700">
                      <img src={img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                        Page {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={generatePdfFromImages}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center text-lg"
                >
                  {isGenerating ? 'Generating PDF...' : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Mode */}
        {mode === 'text' && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <label className="block text-sm font-medium text-slate-300 mb-2">Enter your text below:</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your text here..."
                className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <button
              onClick={generatePdfFromText}
              disabled={!text.trim() || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center text-lg"
            >
              {isGenerating ? 'Generating PDF...' : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

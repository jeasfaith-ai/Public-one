import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Wand2, Loader2, Copy, Check, RefreshCw, Eraser, Feather } from 'lucide-react';
import { generateContentWithRetry } from '../utils/gemini';

interface ParaphraserProps {
  onBack: () => void;
}

export default function Paraphraser({ onBack }: ParaphraserProps) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `
        Act as a professional editor and humanizer.
        Rewrite the following text to make it sound 100% human-written.
        
        Goals:
        1. Bypass detection tools (like Turnitin, GPTZero, ZeroGPT).
        2. Vary sentence structure and length naturally.
        3. Use more natural transitions and idioms where appropriate.
        4. Remove robotic or repetitive patterns.
        5. Retain the original meaning and academic/professional tone (unless the input is casual).
        6. Do not add any introductory or concluding remarks like "Here is the rewritten text". Just output the text.
        7. DO NOT use Markdown formatting like "###" or "**".
        
        Text to Humanize:
        "${inputText}"
      `;
      
      const result = await generateContentWithRetry('gemini-3-flash-preview', prompt);
      setOutputText(result || 'Could not process text. Please try again.');
    } catch (error) {
      console.error(error);
      setOutputText('An error occurred while processing your request.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center">
            <Feather className="w-8 h-8 mr-3 text-purple-500" />
            Paraphrasing & Humanizer
          </h1>
          <p className="text-slate-400 text-sm">Rewrite content to sound natural, human, and bypass detection tools.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
          {/* Input Section */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Input Content</h3>
              <button 
                onClick={clearAll}
                className="text-slate-500 hover:text-red-400 transition-colors"
                title="Clear Text"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your text here..."
              className="flex-1 w-full bg-transparent p-6 text-slate-300 placeholder-slate-600 outline-none resize-none font-sans leading-relaxed text-base"
            />
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <button
                onClick={handleHumanize}
                disabled={isGenerating || !inputText.trim()}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Humanizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Humanize Text
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-semibold text-emerald-400 text-sm uppercase tracking-wider flex items-center">
                <Check className="w-4 h-4 mr-2" />
                Humanized Result
              </h3>
              {outputText && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center text-slate-400 hover:text-white transition-colors text-xs font-medium bg-slate-800 px-2 py-1 rounded"
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            
            <div className="flex-1 relative">
              {outputText ? (
                <textarea
                  readOnly
                  value={outputText}
                  className="w-full h-full bg-transparent p-6 text-slate-200 outline-none resize-none font-sans leading-relaxed text-base"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                  <Feather className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your humanized text will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

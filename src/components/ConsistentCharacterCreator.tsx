import React, { useState, useContext } from 'react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import { Loader2, ArrowLeft, Download, User, Upload, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConsistentCharacterCreator({ onBack }: { onBack: () => void }) {
  const { user, fetchUser } = useContext(UserContext);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = () => {
    if (!prompt || !preview) return;
    setShowPaymentModal(true);
  };

  const handleConfirmGenerate = async () => {
    setShowPaymentModal(false);
    
    const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 1000;
    if (!isPremium) {
      setError('Insufficient credits. Please top up to use this feature.');
      return;
    }

    setLoading(true);
    setError('');
    setImage('');
    
    try {
      const res = await clientFetch('/api/ai/consistent-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, prompt, imageBase64: preview })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      
      setImage(data.image);
      fetchUser(); // Update balance
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6">
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-4">Confirm Transaction</h3>
            <p className="text-slate-300 mb-6">
              This action will cost <span className="font-bold text-emerald-400">1 Credit (₦1,000)</span>.
              Do you want to proceed?
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmGenerate}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-900/20"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Consistent Character Creator</h1>
              <p className="text-slate-400">Upload a photo and generate a consistent 3D character.</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-400">Your Balance:</span>
              <span className="font-bold text-emerald-400">
                {user?.project_credits} Credits / ₦{(user?.balance || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500">Cost per generation: 1 Credit (₦1,000)</p>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload Target Image
                </label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer relative h-64">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400">Click to upload photo</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Describe the Character Action
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Make this person a 3D cartoon character wearing a superhero suit, flying over a city..."
                  className="w-full h-64 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateClick}
              disabled={loading || !prompt || !preview}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating Character...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Character (1 Credit)
                </>
              )}
            </button>
          </div>

          {image && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl group">
                <img src={image} alt="Generated" className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a 
                    href={image} 
                    download={`character-${Date.now()}.png`}
                    className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center hover:scale-105 transition-transform"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Character
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

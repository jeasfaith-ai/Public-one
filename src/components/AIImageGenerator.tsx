import { useState, useContext } from 'react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import { Loader2, ArrowLeft, Download, Camera, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIImageGenerator({ onBack }: { onBack: () => void }) {
  const { user, fetchUser } = useContext(UserContext);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleGenerateClick = () => {
    if (!prompt) return;
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
      const res = await clientFetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, prompt })
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
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-900/20"
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
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mr-4">
              <Camera className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Image Generator</h1>
              <p className="text-slate-400">Create stunning, realistic images from text descriptions.</p>
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic Nigerian city with flying cars and neon lights..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-pink-500/50 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateClick}
              disabled={loading || !prompt}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-pink-900/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Image (1 Credit)
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
                    download={`ai-generated-${Date.now()}.png`}
                    className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center hover:scale-105 transition-transform"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Image
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

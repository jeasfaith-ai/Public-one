import { useState, useContext } from 'react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import { Loader2, ArrowLeft, Video, Film, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StoryboardAnimator({ onBack }: { onBack: () => void }) {
  const { user, fetchUser } = useContext(UserContext);
  const [story, setStory] = useState('');
  const [scenes, setScenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleGenerateClick = () => {
    if (!story) return;
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
    setScenes([]);
    
    try {
      const res = await clientFetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, story })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate storyboard');
      
      setScenes(data.scenes);
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
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-900/20"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Services
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mr-4">
              <Video className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Storyboard & Video Animator</h1>
              <p className="text-slate-400">Turn your story into a visual storyboard and animation prompts.</p>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-400">Your Balance:</span>
              <span className="font-bold text-emerald-400">
                {user?.project_credits} Credits / ₦{(user?.balance || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500">Cost per storyboard: 1 Credit (₦1,000)</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Write your story
              </label>
              <textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Once upon a time in Lagos, a young inventor named Tunde discovered a mysterious device..."
                className="w-full h-40 bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-orange-500/50 outline-none resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateClick}
              disabled={loading || !story}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating Storyboard...
                </>
              ) : (
                <>
                  <Film className="w-5 h-5 mr-2" />
                  Generate Storyboard (1 Credit)
                </>
              )}
            </button>
          </div>

          {scenes.length > 0 && (
            <div className="mt-12 space-y-12">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Your Storyboard</h2>
              {scenes.map((scene, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-6 p-6">
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                      {scene.image ? (
                        <img src={scene.image} alt={`Scene ${scene.scene}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">No Image</div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Scene {scene.scene}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">Visual Description</h3>
                        <p className="text-slate-400 text-sm">{scene.description}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-orange-400 mb-2">Animation Prompt</h3>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
                          {scene.animationPrompt}
                        </div>
                      </div>
                      <button 
                        onClick={() => alert('Video generation feature coming soon! Use the prompt above with Veo or other tools.')}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center w-max"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Animate Scene (Coming Soon)
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

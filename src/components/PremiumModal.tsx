import { motion } from 'motion/react';
import { X, Crown } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  featureName: string;
}

export default function PremiumModal({ isOpen, onClose, onSubscribe, featureName }: PremiumModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800 text-center"
      >
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Premium Feature</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          <span className="font-bold text-slate-800 dark:text-slate-200">{featureName}</span> is available only for premium users. Please subscribe to access this feature.
        </p>
        
        <button 
          onClick={onSubscribe}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
        >
          Subscribe to Premium
        </button>
      </motion.div>
    </div>
  );
}

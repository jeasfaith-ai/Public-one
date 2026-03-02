import { motion } from 'framer-motion';
import { X, Download, Lock } from 'lucide-react';

interface PdfViewerProps {
  pdfUrl: string;
  onClose: () => void;
  onDownload?: () => void;
  isPremium: boolean;
}

export default function PdfViewer({ pdfUrl, onClose, onDownload, isPremium }: PdfViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-4 md:p-8 max-w-4xl w-full h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project PDF Preview</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {!isPremium && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
            You are viewing a preview. To download this PDF to your device, please upgrade to premium or top up your wallet.
          </p>
        )}

        <div 
          className="flex-1 relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            className="w-full h-full border-none"
            title="PDF Viewer"
            sandbox="allow-scripts allow-same-origin" 
          />
          {/* Transparent overlay to capture touch/click events if needed, but allow scrolling? 
              Actually, scrolling is handled by iframe. 
              To block touch-hold, we might need to intercept events on the iframe, which is hard cross-origin (data uri is same-origin usually).
          */}
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          
          {onDownload && (
            <button
              onClick={isPremium ? onDownload : undefined}
              className={`px-6 py-3 flex items-center font-bold rounded-xl transition-colors shadow-lg ${
                isPremium 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-75'
              }`}
              title={isPremium ? "Download PDF" : "Upgrade to Download"}
            >
              {isPremium ? <Download className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
              {isPremium ? 'Download PDF' : 'Download Locked'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

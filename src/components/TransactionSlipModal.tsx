import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface TransactionSlipModalProps {
  transaction: any;
  user: any;
  onClose: () => void;
}

export default function TransactionSlipModal({ transaction, user, onClose }: TransactionSlipModalProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!slipRef.current) return;
    
    try {
      // Clone the node to ensure we capture the full content without scroll issues
      const element = slipRef.current;
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Style the clone to ensure it's fully visible and captured correctly
      clone.style.position = 'fixed';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.width = '400px'; // Fixed width for consistency
      clone.style.height = 'auto';
      clone.style.zIndex = '-1';
      document.body.appendChild(clone);

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      document.body.removeChild(clone);
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `transaction-slip-${transaction.reference || 'ref'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to generate slip image:', error);
      alert('Failed to download slip. Please try again or take a screenshot.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Transaction Slip</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 flex justify-center">
          {/* Slip Design */}
          <div 
            ref={slipRef}
            className="bg-white text-slate-900 p-8 rounded-xl w-full max-w-sm shadow-lg relative overflow-hidden"
          >
            {/* Watermark/Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-tr-full -ml-8 -mb-8"></div>

            <div className="text-center mb-8 relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Transaction Receipt</h2>
              <p className="text-sm text-slate-500">Stress No More</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Amount</span>
                <span className={`font-bold text-lg ${transaction.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                <span className="font-bold text-slate-800 uppercase text-sm">{transaction.status}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Date</span>
                <span className="font-medium text-slate-800 text-sm">
                  {new Date(transaction.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Reference</span>
                <span className="font-medium text-slate-800 text-xs font-mono">
                  {transaction.reference || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">User</span>
                <span className="font-medium text-slate-800 text-sm">
                  {user?.fullName || 'Student'}
                </span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-slate-400">
                Generated automatically by Stress No More.
                <br />
                Keep this slip for your records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleDownload}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Image
          </button>
        </div>
      </motion.div>
    </div>
  );
}

import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, X, Trash2, FileText } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import TransactionSlipModal from './TransactionSlipModal';

interface TransactionsPageProps {
  key?: string;
  onBack: () => void;
}

export default function TransactionsPage({ onBack }: TransactionsPageProps) {
  const { user } = useContext(UserContext);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const res = await clientFetch(`/api/transactions/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await clientFetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTransactions(transactions.filter(t => t.id !== transactionId));
      } else {
        alert('Failed to delete transaction.');
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      alert('An error occurred while deleting the transaction.');
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your entire transaction history? This cannot be undone.')) return;

    try {
      const res = await clientFetch(`/api/transactions/all/${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTransactions([]);
      } else {
        alert('Failed to clear history.');
      }
    } catch (error) {
      console.error('Clear history error:', error);
      alert('An error occurred while clearing history.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-12 pb-24"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors mr-2 sm:mr-4"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
              <p className="text-xs sm:text-sm text-slate-500">Review your recent wallet activity.</p>
            </div>
          </div>
          
          {transactions.length > 0 && (
            <button 
              onClick={clearHistory}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => (
                <div key={t.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-full shrink-0 ${t.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{t.reference || 'Transaction'}</p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
                      <span className={`inline-block mt-1 text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        t.status === 'successful' ? 'bg-emerald-100 text-emerald-700' : 
                        t.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-12 sm:pl-0">
                    <p className={`font-bold text-base sm:text-lg ${t.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTransaction(t)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="View Slip"
                      >
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => deleteTransaction(t.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTransaction && (
        <TransactionSlipModal 
          transaction={selectedTransaction} 
          user={user} 
          onClose={() => setSelectedTransaction(null)} 
        />
      )}
    </motion.div>
  );
}

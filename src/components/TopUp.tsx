import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Loader2, ArrowLeft, Banknote, Landmark, Wallet, CheckCircle2 } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';

interface TopUpProps {
  key?: string;
  onBack: () => void;
}

const accounts = [
  {
    bankName: 'WEMA BANK PLC',
    accountNumber: '8543944389',
    accountName: 'rtechsse',
    icon: Banknote
  },
  {
    bankName: 'CASHCONNET MICROFINANCE BANK',
    accountNumber: '9912023600',
    accountName: 'rtechsse',
    icon: Landmark
  },
  {
    bankName: 'STERLING BANK PLC',
    accountNumber: '8513808366',
    accountName: 'rtechsse',
    icon: Wallet
  },
];

export default function TopUp({ onBack }: TopUpProps) {
  const { user } = useContext(UserContext);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [copiedAccount, setCopiedAccount] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    transactionId: '',
    amount: '',
    projectCredits: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, email: user.email, name: user.fullName || '' }));
    }
    fetchAccounts();
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await clientFetch('/api/topup/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await clientFetch('/api/topup/payment-accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          const mappedAccounts = data.accounts.map((acc: any, index: number) => ({
             ...acc,
             icon: index % 3 === 0 ? Banknote : index % 3 === 1 ? Landmark : Wallet
          }));
          setAccountList(mappedAccounts);
          setSelectedAccount(mappedAccounts[0]);
        } else {
          setAccountList(accounts);
          setSelectedAccount(accounts[0]);
        }
      } else {
        setAccountList(accounts);
        setSelectedAccount(accounts[0]);
      }
    } catch (err) {
      console.error('Failed to fetch accounts', err);
      setAccountList(accounts);
      setSelectedAccount(accounts[0]);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(''), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Submitting top-up to /api/topup', { ...formData, bank: selectedAccount.bankName });
      const res = await clientFetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, bank: selectedAccount.bankName }),
      });

      const contentType = res.headers.get("content-type");
      console.log('Response status:', res.status, 'Content-Type:', contentType);
      
      if (!res.ok) {
        let errorMessage = 'Submission failed. Please try again.';
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await res.text();
          console.error('Server error (non-JSON):', text);
          if (res.status === 404) errorMessage = 'Server endpoint not found. Please contact support.';
        }
        throw new Error(errorMessage);
      }

      // Even on success, check if we need to parse JSON
      if (contentType && contentType.indexOf("application/json") !== -1) {
        await res.json();
      }

      setSuccess(true);
      setFormData({
        email: user?.email || '',
        name: user?.fullName || '',
        transactionId: '',
        amount: '',
        projectCredits: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col"
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Top Up Wallet</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left Side: Instructions & Accounts */}
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg shadow-emerald-600/20">
              <h2 className="text-base sm:text-lg font-bold mb-2">Payment Instructions</h2>
              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed">
                To fund your wallet, please make a transfer to any of the accounts below. 
                After payment, fill the form with your transaction details for verification.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Premium Pricing</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {(plans.length > 0 ? plans : [
                  { projects_count: 1, price_naira: 10000 },
                  { projects_count: 5, price_naira: 50000 },
                  { projects_count: 10, price_naira: 100000 },
                  { projects_count: 15, price_naira: 150000 },
                ]).map((tier) => (
                  <button
                    key={tier.projects_count}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: tier.price_naira.toString(), projectCredits: tier.projects_count })}
                    className={`p-3 rounded-2xl border transition-all text-left ${
                      formData.amount === tier.price_naira.toString()
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{tier.projects_count} Project{tier.projects_count > 1 ? 's' : ''}</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">₦{tier.price_naira.toLocaleString()}</p>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-3 italic">* Credits can be used for project generation and PPT downloads.</p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1">Select Account</h3>
              {accountList.map((account) => (
                <button
                  key={account.accountNumber}
                  onClick={() => setSelectedAccount(account)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                    selectedAccount?.accountNumber === account.accountNumber
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md'
                      : 'bg-white/50 dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedAccount?.accountNumber === account.accountNumber
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <account.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{account.bankName}</p>
                    <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">{account.accountNumber}</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">{account.accountName}</p>
                  </div>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(account.accountNumber);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    {copiedAccount === account.accountNumber ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Verification Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Verify Payment</h3>
            
            {success ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10 space-y-4"
              >
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Request Submitted!</h4>
                  <p className="text-slate-500 text-sm mt-2">
                    Your payment verification request has been sent to the admin. 
                    You will receive a notification once it is approved.
                  </p>
                </div>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Submit another request
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Amount Paid (₦)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all font-mono text-lg"
                    placeholder="e.g. 5000"
                  />
                  {Number(formData.amount) > 0 && Number(formData.amount) < 10000 && (
                    <p className="text-xs text-amber-500 font-medium px-1 mt-1">
                      Note: You need at least ₦10,000 to receive a project credit. Amounts below this will be added to your balance but won't generate a credit until the total reaches ₦10,000.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase px-1">Transaction ID / Reference</label>
                  <input
                    type="text"
                    required
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Enter transaction reference"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Payment Details'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { UserContext } from '../App';
import { LogOut, Users, Settings, MessageSquare, CreditCard, Menu, X, ChevronRight, Search, Loader2, Check, Plus, Trash2, DollarSign, Package, Edit2, Download, Database } from 'lucide-react';
import { clientFetch } from '../utils/api';
import TopUpRequests from './TopUpRequests';

export default function AdminDashboard() {
  const { user, logout } = useContext(UserContext);
  
  if (!user) return null;

  const [users, setUsers] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [pptPaymentAmount, setPptPaymentAmount] = useState(5000);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'support' | 'topups' | 'pricing'>('users');
  const [projectCostCredits, setProjectCostCredits] = useState(1);
  const [creditValueNaira, setCreditValueNaira] = useState(10000);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState<{id?: string, projects_count: number, price_naira: number}>({ projects_count: 1, price_naira: 10000 });
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Balance Update Modal State
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [balanceUpdateSuccess, setBalanceUpdateSuccess] = useState(false);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [isSavingAccounts, setIsSavingAccounts] = useState(false);

  const [geminiKeys, setGeminiKeys] = useState<string[]>([]);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPaymentAmount();
    fetchPptPaymentAmount();
    fetchPaymentAccounts();
    fetchChatUsers();
    fetchPricingPlans();
    fetchSiteSettings();
    fetchGeminiKeys();
  }, []);

  const fetchGeminiKeys = async () => {
    try {
      const res = await clientFetch('/api/admin/pricing/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || [];
        const keysSetting = settings.find((s: any) => s.key === 'gemini_api_keys');
        if (keysSetting && keysSetting.value) {
          try {
            const keys = JSON.parse(keysSetting.value);
            if (Array.isArray(keys)) setGeminiKeys(keys);
          } catch (e) {
            console.error('Failed to parse gemini keys', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch gemini keys', err);
    }
  };

  const saveGeminiKeys = async (updatedKeys: string[]) => {
    setIsSavingKeys(true);
    try {
      const res = await clientFetch('/api/admin/pricing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          key: 'gemini_api_keys',
          value: JSON.stringify(updatedKeys)
        })
      });
      
      if (res.ok) {
        setGeminiKeys(updatedKeys);
        setNewGeminiKey('');
        alert('Gemini keys updated successfully');
      } else {
        alert('Failed to update Gemini keys');
      }
    } catch (error) {
      console.error('Failed to save gemini keys', error);
      alert('Error saving Gemini keys');
    } finally {
      setIsSavingKeys(false);
    }
  };

  const addGeminiKey = () => {
    if (!newGeminiKey.trim()) return;
    const updatedKeys = [...geminiKeys, newGeminiKey.trim()];
    saveGeminiKeys(updatedKeys);
  };

  const removeGeminiKey = (index: number) => {
    if (!confirm('Are you sure you want to remove this API key?')) return;
    const updatedKeys = geminiKeys.filter((_, i) => i !== index);
    saveGeminiKeys(updatedKeys);
  };

  const fetchPricingPlans = async () => {
    try {
      const res = await clientFetch('/api/admin/pricing/plans');
      if (res.ok) {
        const data = await res.json();
        setPricingPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch pricing plans', err);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const res = await clientFetch('/api/admin/pricing/settings');
      if (res.ok) {
        const data = await res.json();
        const settings = data.settings || {};
        if (settings.project_cost_credits) setProjectCostCredits(Number(settings.project_cost_credits));
        if (settings.credit_value_naira) setCreditValueNaira(Number(settings.credit_value_naira));
      }
    } catch (err) {
      console.error('Failed to fetch site settings', err);
    }
  };

  const handleAddPlan = async () => {
    try {
      const res = await clientFetch('/api/admin/pricing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlan)
      });
      if (res.ok) {
        setIsAddingPlan(false);
        setNewPlan({ projects_count: 1, price_naira: 10000 }); // Reset
        fetchPricingPlans();
      }
    } catch (err) {
      console.error('Failed to add/update plan', err);
    }
  };

  const handleEditPlan = (plan: any) => {
    setNewPlan({ id: plan.id, projects_count: plan.projects_count, price_naira: plan.price_naira });
    setIsAddingPlan(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const res = await clientFetch(`/api/admin/pricing/plans/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPricingPlans();
      }
    } catch (err) {
      console.error('Failed to delete plan', err);
    }
  };

  // ... (fetch functions remain same, omitted for brevity but included in final code)
  const fetchUsers = () => {
    clientFetch('/api/admin/users')
      .then(res => res.ok ? res.json() : { users: [] })
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setUsers([]);
        setLoading(false);
      });
  };

  const fetchChatUsers = () => {
    clientFetch('/api/admin/chat-users')
      .then(res => res.ok ? res.json() : { users: [] })
      .then(data => setChatUsers(data.users || []))
      .catch(err => {
        console.error(err);
        setChatUsers([]);
      });
  };

  const fetchMessages = (userId: number) => {
    if (!user) return;
    clientFetch(`/api/support/messages/${userId}`, {
        headers: { 'x-user-id': user.id.toString() }
    })
      .then(res => res.ok ? res.json() : { messages: [] })
      .then(data => setMessages(data.messages || []))
      .catch(err => console.error(err));
  };

  const fetchPaymentAmount = () => {
    clientFetch('/api/support/payment-amount')
      .then(res => res.ok ? res.json() : { amount: 5000 })
      .then(data => setPaymentAmount(data.amount))
      .catch(err => console.error(err));
  };

  const fetchPptPaymentAmount = () => {
    clientFetch('/api/support/ppt-payment-amount')
      .then(res => res.ok ? res.json() : { amount: 5000 })
      .then(data => setPptPaymentAmount(data.amount))
      .catch(err => console.error(err));
  };

  const fetchPaymentAccounts = () => {
    clientFetch('/api/topup/payment-accounts')
      .then(res => res.ok ? res.json() : { accounts: [] })
      .then(data => {
        if (data.accounts && data.accounts.length > 0) {
          setPaymentAccounts(data.accounts);
        } else {
          setPaymentAccounts([
            { bankName: 'WEMA BANK PLC', accountNumber: '8543944389', accountName: 'rtechsse' },
            { bankName: 'CASHCONNET MICROFINANCE BANK', accountNumber: '9912023600', accountName: 'rtechsse' },
            { bankName: 'STERLING BANK PLC', accountNumber: '8513808366', accountName: 'rtechsse' }
          ]);
        }
      });
  };

  useEffect(() => {
    if (selectedChatUser) {
      fetchMessages(selectedChatUser.id);
      const interval = setInterval(() => fetchMessages(selectedChatUser.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatUser]);

  const toggleAccess = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await clientFetch('/api/admin/toggle-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, hasFreeAccess: !currentStatus }),
      });
      if (res.ok) {
        alert(`Access ${!currentStatus ? 'granted' : 'revoked'} successfully`);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(`Failed to update access: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Toggle access error:', error);
      alert('Error updating access');
    }
  };

  const updatePayment = async () => {
    setIsSavingFees(true);
    try {
      const res1 = await clientFetch('/api/admin/payment-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: paymentAmount }),
      });
      const res2 = await clientFetch('/api/admin/ppt-payment-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pptPaymentAmount }),
      });
      const res3 = await clientFetch('/api/admin/pricing/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project_cost_credits: projectCostCredits.toString(),
          credit_value_naira: creditValueNaira.toString()
        }),
      });
      
      if (res1.ok && res2.ok && res3.ok) {
        alert('Changes saved successfully');
        fetchPaymentAmount();
        fetchPptPaymentAmount();
        fetchSiteSettings();
      } else {
        alert('Failed to save some changes. Please check your connection.');
      }
    } catch (error) {
      console.error('Failed to update payment amounts:', error);
      alert('Error updating payment amounts. Please try again.');
    } finally {
      setIsSavingFees(false);
    }
  };

  const handleBalanceUpdate = async (type: 'credit' | 'debit') => {
    if (!selectedUserForBalance || !balanceAdjustment || Number(balanceAdjustment) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const amount = type === 'credit' ? Number(balanceAdjustment) : -Number(balanceAdjustment);

    setIsUpdatingBalance(true);
    try {
      const res = await clientFetch(`/api/admin/users/${selectedUserForBalance.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      
      if (res.ok) {
        setBalanceUpdateSuccess(true);
        fetchUsers(); // Refresh the user list
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to update balance.'}`);
      }
    } catch (error) {
      console.error('Balance update error:', error);
      alert('A network error occurred. Please try again.');
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  const updatePaymentAccounts = async () => {
    setIsSavingAccounts(true);
    try {
      const res = await clientFetch('/api/admin/topup/payment-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: paymentAccounts })
      });
      
      if (res.ok) {
        alert('Successfully saved payment accounts');
        fetchPaymentAccounts(); // Re-fetch to ensure UI is updated
      } else {
        const data = await res.json();
        alert(`Failed to update payment accounts: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error updating payment accounts. Please try again.');
    } finally {
      setIsSavingAccounts(false);
    }
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const newAccounts = [...paymentAccounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setPaymentAccounts(newAccounts);
  };

  const addAccount = () => {
    setPaymentAccounts([...paymentAccounts, { bankName: '', accountNumber: '', accountName: '' }]);
  };

  const removeAccount = (index: number) => {
    const newAccounts = paymentAccounts.filter((_, i) => i !== index);
    setPaymentAccounts(newAccounts);
  };

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const NavItem = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
        activeTab === tab 
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${activeTab === tab ? 'fill-current' : ''}`} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 md:pb-0 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
        <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
              />
            </div>

            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="w-full md:w-auto">
                    <div className="flex items-center justify-between mb-1 md:mb-0">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">{user.fullName}</h3>
                        {user.hasFreeAccess && (
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-0.5 rounded-full shrink-0">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>
                      <span className={`md:hidden px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${user.hasFreeAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {user.hasFreeAccess ? 'Premium' : 'Free'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{user.department}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto">
                    <span className={`hidden md:inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${user.hasFreeAccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.hasFreeAccess ? 'Premium' : 'Free'}
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => toggleAccess(user.id, user.hasFreeAccess)}
                        className={`flex-1 sm:flex-none py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          user.hasFreeAccess 
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {user.hasFreeAccess ? 'Revoke' : 'Grant'}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUserForBalance(user);
                          setShowBalanceModal(true);
                        }}
                        className="flex-1 sm:flex-none py-2 px-3 sm:px-4 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Balance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Pricing Plans</h2>
              <button 
                onClick={() => {
                  setNewPlan({ projects_count: 1, price_naira: 10000 });
                  setIsAddingPlan(true);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Plan
              </button>
            </div>

            {isAddingPlan && (
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white">{newPlan.id ? 'Edit Pricing Plan' : 'New Pricing Plan'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Projects Count</label>
                    <input 
                      type="number"
                      value={newPlan.projects_count}
                      onChange={e => setNewPlan({...newPlan, projects_count: parseInt(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border-none rounded-xl text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Price (₦)</label>
                    <input 
                      type="number"
                      value={newPlan.price_naira}
                      onChange={e => setNewPlan({...newPlan, price_naira: parseInt(e.target.value)})}
                      className="w-full p-3 bg-slate-800 border-none rounded-xl text-white mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleAddPlan} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">
                    {newPlan.id ? 'Update Plan' : 'Save Plan'}
                  </button>
                  <button onClick={() => setIsAddingPlan(false)} className="bg-slate-800 text-slate-400 px-6 py-2 rounded-xl font-bold">Cancel</button>
                </div>
              </div>
            )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {pricingPlans.map((plan) => (
                  <div key={plan.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 relative group">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => handleEditPlan(plan)}
                        className="p-2 text-blue-500 hover:bg-blue-900/20 rounded-full bg-slate-800/50"
                        title="Edit Plan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-red-500 hover:bg-red-900/20 rounded-full bg-slate-800/50"
                        title="Delete Plan"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">{plan.projects_count} Projects</p>
                    <p className="text-2xl font-bold text-white">₦{plan.price_naira.toLocaleString()}</p>
                  </div>
                ))}
              </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                <Database className="w-5 h-5 mr-2 text-emerald-600" /> Database Backup
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Download a full backup of the database in JSON format. This includes users, projects, transactions, and settings.
              </p>
              <button 
                onClick={() => {
                  const token = localStorage.getItem('token');
                  window.open(`${window.location.origin}/api/admin/backup/download?token=${token}`, '_blank');
                }}
                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" /> Download JSON Backup
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-emerald-600" /> Fees Configuration
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project Fee (₦)</label>
                  <input 
                    type="number" 
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PPT Fee (₦)</label>
                  <input 
                    type="number" 
                    value={pptPaymentAmount}
                    onChange={(e) => setPptPaymentAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-none text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Project Cost (Credits)</label>
                    <input 
                      type="number" 
                      value={projectCostCredits}
                      onChange={(e) => setProjectCostCredits(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Credit Value (₦)</label>
                    <input 
                      type="number" 
                      value={creditValueNaira}
                      onChange={(e) => setCreditValueNaira(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <button 
                  onClick={updatePayment}
                  disabled={isSavingFees}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center disabled:opacity-50"
                >
                  {isSavingFees ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">Click to save project and PPT fees</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-600" /> Gemini API Keys
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Manage your Gemini API keys here. These keys will be used in rotation with the environment keys.
              </p>
              
              <div className="space-y-3 mb-4">
                {geminiKeys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <span className="font-mono text-sm text-slate-600 dark:text-slate-300">
                      {key.length > 8 ? `${key.substring(0, 8)}...${key.substring(key.length - 8)}` : key}
                    </span>
                    <button 
                      onClick={() => removeGeminiKey(index)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {geminiKeys.length === 0 && (
                  <p className="text-sm text-slate-400 italic">No custom keys added yet.</p>
                )}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Enter new Gemini API Key"
                  value={newGeminiKey}
                  onChange={(e) => setNewGeminiKey(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border-none text-slate-900 dark:text-white text-sm"
                />
                <button 
                  onClick={addGeminiKey}
                  disabled={!newGeminiKey.trim() || isSavingKeys}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center"
                >
                  {isSavingKeys ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-600" /> Payment Accounts
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {paymentAccounts.map((account, index) => (
                  <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl relative group">
                    <button 
                      onClick={() => removeAccount(index)}
                      className="absolute top-2 right-2 p-1 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Bank Name</label>
                        <input 
                          placeholder="e.g., WEMA BANK PLC"
                          value={account.bankName}
                          onChange={(e) => handleAccountChange(index, 'bankName', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Account Number</label>
                        <input 
                          placeholder="e.g., 8543944389"
                          value={account.accountNumber}
                          onChange={(e) => handleAccountChange(index, 'accountNumber', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Account Name</label>
                        <input 
                          placeholder="e.g., rtechsse"
                          value={account.accountName}
                          onChange={(e) => handleAccountChange(index, 'accountName', e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addAccount}
                  className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  + Add New Account
                </button>
                <button 
                  onClick={updatePaymentAccounts}
                  disabled={isSavingAccounts}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                >
                  {isSavingAccounts ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : 'Save Accounts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <SupportPanel chatUsers={chatUsers} />
        )}

        {/* Topups Tab */}
        {activeTab === 'topups' && (
          <TopUpRequests />
        )}
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2 flex justify-between items-center z-40 pb-safe">
        <NavItem tab="users" icon={Users} label="Users" />
        <NavItem tab="pricing" icon={CreditCard} label="Pricing" />
        <NavItem tab="topups" icon={CreditCard} label="Topups" />
        <NavItem tab="support" icon={MessageSquare} label="Support" />
        <NavItem tab="settings" icon={Settings} label="Settings" />
      </div>

      {/* Balance Update Modal */}
      {showBalanceModal && selectedUserForBalance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            {!balanceUpdateSuccess ? (
              <>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">Update User Balance</h3>
                <p className="text-center text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6">Current Balance: <span className="font-bold text-emerald-600">₦{(selectedUserForBalance.balance || 0).toLocaleString()}</span></p>
                
                <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
                  <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1 sm:mb-2 block">Amount</label>
                  <div className="flex items-center">
                    <span className="text-xl sm:text-2xl font-bold text-slate-400 mr-2">₦</span>
                    <input 
                      type="number"
                      value={balanceAdjustment}
                      onChange={(e) => setBalanceAdjustment(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-300"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <button 
                    onClick={() => handleBalanceUpdate('credit')}
                    disabled={isUpdatingBalance}
                    className="py-2 sm:py-3 px-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center justify-center disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isUpdatingBalance ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Credit (+)'}
                  </button>
                  <button 
                    onClick={() => handleBalanceUpdate('debit')}
                    disabled={isUpdatingBalance}
                    className="py-2 sm:py-3 px-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isUpdatingBalance ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Deduct (-)'}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="w-full py-2 sm:py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Success!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-8">User balance has been updated successfully.</p>
                <button 
                  onClick={() => {
                    setShowBalanceModal(false);
                    setBalanceUpdateSuccess(false);
                    setBalanceAdjustment('');
                    setSelectedUserForBalance(null);
                  }}
                  className="w-full py-3 sm:py-4 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 text-sm sm:text-base"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SupportPanel({ chatUsers }: { chatUsers: any[] }) {
  const { user } = useContext(UserContext);
  
  if (!user) return null;

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (selectedUser) {
      const loadMessages = () => {
        clientFetch(`/api/support/messages/${selectedUser.id}`, {
            headers: { 'x-user-id': user.id.toString() }
        })
          .then(res => res.json())
          .then(data => setMessages(data.messages || []));
      };
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, user.id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedUser) return;

    await clientFetch('/api/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: selectedUser.id,
        content: reply
      })
    });
    setReply('');
    // Optimistic update
    setMessages(prev => [...prev, {
        id: Date.now(),
        senderId: user.id,
        receiverId: selectedUser.id,
        content: reply,
        createdAt: new Date().toISOString()
    }]);
  };

  if (selectedUser) {
    return (
      <div className="h-[calc(100vh-180px)] md:h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
          <button onClick={() => setSelectedUser(null)} className="md:hidden p-1 -ml-1">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{selectedUser.fullName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.department}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/30">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${msg.senderId === user.id ? 'bg-emerald-600 text-white rounded-br-none shadow-md' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <span className={`text-[10px] block mt-1 opacity-70 ${msg.senderId === user.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={sendReply} className="flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type a reply..."
              className="flex-1 p-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-emerald-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!reply.trim()}
              className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white px-1">Recent Conversations</h2>
      <div className="space-y-2">
        {chatUsers.map(u => (
          <button
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex items-center justify-between group"
          >
            <div>
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">{u.fullName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        ))}
        {chatUsers.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 dark:text-slate-400">No active conversations</p>
          </div>
        )}
      </div>
    </div>
  );
}

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

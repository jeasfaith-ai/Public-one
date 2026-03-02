import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, FileText, Download, Wallet, ArrowRight, ArrowLeft, Plus, Eye, X, Edit2, History, LogOut, Save, User, Presentation, Check } from 'lucide-react';
import { UserContext } from '../App';
import { DEPARTMENTS } from '../constants';
import { clientFetch } from '../utils/api';
import pptxgen from 'pptxgenjs';
import PremiumModal from './PremiumModal';
import PdfViewer from './PdfViewer';
import { generateProjectPDF } from '../utils/pdfGenerator';

interface DashboardProps {
  key?: string;
  onBack: () => void;
  onViewProject: (project: any, user: any) => void;
  onNavigate: (step: any) => void;
}

export default function Dashboard({ onBack, onViewProject: propsOnViewProject, onNavigate }: DashboardProps) {
  const { user, setUser, logout } = useContext(UserContext);
  
  const onViewProject = async (project: any, user: any) => {
    // Fetch full project content if missing
    let fullProject = project;
    if (!project.content) {
      try {
        const res = await clientFetch(`/api/projects/single/${project.id}`);
        if (res.ok) {
          fullProject = await res.json();
        } else {
          alert('Failed to load project content');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load project content');
        return;
      }
    }
    propsOnViewProject(fullProject, user);
  };
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    regNo: '',
    gender: ''
  });
  
  // Premium Modal State
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState('');

  // PDF Viewer State
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  // PPT Generation State
  const [pptPaymentAmount, setPptPaymentAmount] = useState(5000);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showPptModal, setShowPptModal] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    if (!user?.id) return;
    setError(null);
    
    console.log('Dashboard: Fetching data for user', user.id);
    
    Promise.all([
      clientFetch(`/api/transactions/${user.id}`).then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Dashboard: Failed to fetch transactions', res.status, text);
          throw new Error(`Failed to fetch transactions: ${res.status}`);
        }
        return res.json();
      }),
      clientFetch(`/api/projects/${user.id}`).then(async res => {
        if (!res.ok) {
          const text = await res.text();
          console.error('Dashboard: Failed to fetch projects', res.status, text);
          throw new Error(`Failed to fetch projects: ${res.status}`);
        }
        const data = await res.json();
        console.log('Dashboard: Projects fetched:', data.projects?.length);
        return data;
      })
    ]).then(([transData, projData]) => {
      setTransactions((transData.transactions || []).filter((t: any) => t));
      setProjects((projData.projects || []).filter((p: any) => p));
      setLoading(false);
    }).catch(err => {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    });
  };

  useEffect(() => {
    if (user?.id) {
      setEditForm({
        fullName: user.fullName,
        department: user.department,
        regNo: user.regNo || '',
        gender: user.gender || ''
      });
      fetchData();
      fetchPptPaymentAmount();
    }
  }, [user]);

  const fetchPptPaymentAmount = () => {
    clientFetch('/api/support/ppt-payment-amount')
      .then(res => res.ok ? res.json() : { amount: 5000 })
      .then(data => setPptPaymentAmount(data.amount))
      .catch(err => console.error('Error fetching PPT payment amount:', err));
  };

  const handleViewPdf = async (project: any) => {
    // Fetch full project content if missing
    let fullProject = project;
    if (!project.content) {
      try {
        const res = await clientFetch(`/api/projects/single/${project.id}`);
        if (res.ok) {
          fullProject = await res.json();
        } else {
          alert('Failed to load project content');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load project content');
        return;
      }
    }

    setSelectedProject(fullProject);
    const doc = generateProjectPDF(fullProject.details || {}, fullProject.content || {}, false);
    const pdfOutput = doc.output('datauristring');
    setPdfDataUrl(pdfOutput);
    setShowPdfViewer(true);
  };

  const handleDownloadPdf = async (project: any) => {
    // Fetch full project content if missing
    let fullProject = project;
    if (!project.content) {
      try {
        const res = await clientFetch(`/api/projects/single/${project.id}`);
        if (res.ok) {
          fullProject = await res.json();
        } else {
          alert('Failed to load project content');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load project content');
        return;
      }
    }

    // Premium logic: User has credits OR balance >= 10000 OR has free access flag
    const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess;
    
    if (isPremium) {
      generateProjectPDF(fullProject.details || {}, fullProject.content || {}, true);
    } else {
      setPremiumFeatureName('PDF Download');
      setShowPremiumModal(true);
    }
  };

  const initiatePptGeneration = async (project: any) => {
    // Fetch full project content if missing
    let fullProject = project;
    if (!project.content) {
      try {
        const res = await clientFetch(`/api/projects/single/${project.id}`);
        if (res.ok) {
          fullProject = await res.json();
        } else {
          alert('Failed to load project content');
          return;
        }
      } catch (e) {
        console.error(e);
        alert('Failed to load project content');
        return;
      }
    }

    setSelectedProject(fullProject);
    setShowPptModal(true);
  };

  const handlePptPaymentAndGeneration = async () => {
    if (!selectedProject || !user?.id) return;

    // Premium users get PPT for free
    const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess;

    if (isPremium) {
      generatePpt(selectedProject);
      setShowPptModal(false);
      setSelectedProject(null);
      return;
    }

    if ((user?.balance || 0) < pptPaymentAmount) {
      alert('Insufficient balance. Redirecting to top-up page...');
      onNavigate('topup');
      return;
    }

    // Deduct payment for non-premium users (if any logic allows this, though currently premium definition covers balance)
    // But if we want to charge specifically for PPT separately from "being premium":
    // The user requirement says: "allow premium users to download PPT and PDF for free"
    // So if they are premium, no deduction.
    
    // If they are NOT premium (no credits, low balance), they can't download anyway based on isPremium check above?
    // Wait, the logic above says if isPremium, generate.
    // If NOT isPremium, show modal.
    // So we don't need this deduction logic here if premium users get it free.
    // BUT, if a user has balance < 1000, they are NOT premium.
    // Can they pay 5000 for PPT? Yes.
    // So we should allow payment if they are not "premium" but have enough balance for this specific action?
    // User said: "allow premium users to download PPT and PDF for free"
    // And "charge users premium users ... for any project writing ... but cannot generate ... when they exhaust Their balances"
    
    // Let's simplify:
    // If user is premium (has credits or balance > 1000), they can download PPT for free.
    // If not, they need to top up.
    
    // Re-reading: "allow premium users to download PPT and PDF for free"
    // This implies no extra charge for PPT/PDF if they are premium.
    
    generatePpt(selectedProject);
    setShowPptModal(false);
    setSelectedProject(null);
  };

  const generatePpt = (project: any) => {
    const pres = new pptxgen();
    const content = project.content || {};
    
    // Define Master Slide
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: 0.6, fill: { color: "008060" } } },
        { text: { text: project.topic, options: { x: 0.2, y: 0.1, w: "90%", h: 0.4, fontSize: 12, color: "FFFFFF", bold: true } } },
        { text: { text: "Generated by Stress No More", options: { x: 0.2, y: 5.3, w: "90%", h: 0.3, fontSize: 10, color: "888888", align: "right" } } }
      ]
    });

    // Title Slide
    let slide = pres.addSlide();
    slide.addText(project.topic.toUpperCase(), { 
      x: 1, y: 1.5, w: '80%', h: 1.5, 
      fontSize: 32, bold: true, align: 'center', 
      color: '008060'
    });
    slide.addText(`BY\n${user?.fullName || 'Student'}`, { 
      x: 1, y: 3.2, w: '80%', 
      fontSize: 20, align: 'center', 
      color: '363636' 
    });
    slide.addText(`DEPARTMENT OF ${user?.department?.toUpperCase() || 'EDUCATION'}`, { 
      x: 1, y: 4.8, w: '80%', 
      fontSize: 16, align: 'center', 
      color: '666666' 
    });

    // Abstract
    slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    slide.addText("ABSTRACT", { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '008060' });
    slide.addText(content.abstract || "No abstract provided.", { 
      x: 0.5, y: 1.5, w: '90%', h: 3.5, 
      fontSize: 14, align: 'justify', 
      valign: 'top' 
    });

    // Chapters
    const chapterList = [
      { title: "Chapter 1: Introduction", text: content.chapter1 },
      { title: "Chapter 2: Literature Review", text: content.chapter2 },
      { title: "Chapter 3: Methods", text: content.chapter3 },
      { title: "Chapter 4: Results", text: content.chapter4 },
      { title: "Chapter 5: Conclusion & Recommendations", text: content.chapter5 },
    ];

    chapterList.forEach(ch => {
      const maxLength = 1500;
      const text = ch.text || "No content generated for this chapter.";
      const chunks = [];
      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.substring(i, i + maxLength));
      }

      chunks.forEach((chunk, idx) => {
        slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        slide.addText(idx === 0 ? ch.title : `${ch.title} (Continued)`, { 
          x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '008060' 
        });
        slide.addText(chunk, { 
          x: 0.5, y: 1.5, w: '90%', h: 3.5, 
          fontSize: 13, align: 'justify', 
          valign: 'top' 
        });
      });
    });

    pres.writeFile({ fileName: `${project.topic.substring(0, 30)}_Presentation.pptx` });
  };

  const handlePptDownload = (project: any) => {
    const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess;
    if (!isPremium) {
      setPremiumFeatureName('PPT Download');
      setShowPremiumModal(true);
      return;
    }
    initiatePptGeneration(project);
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      const res = await clientFetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        alert('Failed to delete project.');
      }
    } catch (error) {
      console.error('Delete project error:', error);
      alert('An error occurred while deleting the project.');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction from your history?')) return;

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleUpdateProfile = async () => {
    const res = await clientFetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    });
    const data = await res.json();
    setUser(data.user);
    setIsEditing(false);
  };



  if (!user) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen p-3 sm:p-6 md:p-12 max-w-6xl mx-auto pb-24 relative transition-colors bg-[#0f172a]"
    >


      <div className="flex justify-between items-center mb-6 md:mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
          <span className="text-slate-200 text-sm md:text-base">Back</span>
        </button>
        <button 
          onClick={logout}
          className="flex items-center text-red-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-1 md:mr-2" />
          <span className="text-slate-200 text-sm md:text-base">Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {error && (
          <div className="md:col-span-3 bg-red-900/20 border border-red-900/50 text-red-400 p-4 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {/* Left Column */}
        <div className="space-y-6 sm:space-y-8">
          {/* Profile Card */}
          <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/50 relative bg-slate-800">
                {user?.gender === 'Male' ? (
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop" 
                    alt="Male Graduate" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + (user?.fullName || 'User') + '&background=0D9488&color=fff';
                    }}
                  />
                ) : user?.gender === 'Female' ? (
                  <img 
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop" 
                    alt="Female Graduate" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + (user?.fullName || 'User') + '&background=DB2777&color=fff';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-900/30">
                    <User className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
              </div>

            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <input 
                  value={editForm.fullName}
                  onChange={e => setEditForm({...editForm, fullName: e.target.value})}
                  className="w-full p-2 border border-slate-700 bg-slate-800 rounded text-sm text-white"
                  placeholder="Full Name"
                />
                <select 
                  value={editForm.department}
                  onChange={e => setEditForm({...editForm, department: e.target.value})}
                  className="w-full p-2 border border-slate-700 bg-slate-800 rounded text-sm text-white"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <input 
                  value={editForm.regNo}
                  onChange={e => setEditForm({...editForm, regNo: e.target.value})}
                  className="w-full p-2 border border-slate-700 bg-slate-800 rounded text-sm text-white"
                  placeholder="Reg No"
                />
                <select 
                  value={editForm.gender}
                  onChange={e => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full p-2 border border-slate-700 bg-slate-800 rounded text-sm text-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-slate-200">{user?.fullName}</h2>
                  {user?.hasFreeAccess && (
                    <div className="flex items-center bg-emerald-900/30 px-2 py-1 rounded-full border border-emerald-800/50">
                      <Check className="w-3 h-3 text-emerald-400 mr-1" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Premium Verified</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-4">{user?.email}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dept:</span>
                    <span className="font-medium text-right text-slate-200">{user?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reg No:</span>
                    <span className="font-medium text-slate-200">{user?.regNo || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Wallet & Credits</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                Active
              </span>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-end border-b border-slate-700/50 pb-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Available Balance</p>
                  <p className="text-2xl font-bold">₦{(user?.balance || 0).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Credit Balance</p>
                  <p className="text-xl font-bold text-emerald-400">₦{(user?.balance || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Project Credits</p>
                  <p className="text-lg font-bold text-emerald-400">{user?.project_credits || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Status</p>
                  <p className={`text-xs font-bold ${(user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {(user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess ? 'PREMIUM' : 'FREE'}
                  </p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => onNavigate('topup')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              Top Up Balance
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6 sm:space-y-8">
          {/* Projects */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
              <History className="w-5 h-5 mr-2 text-emerald-400" />
              Generated Projects
            </h3>
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
              {projects.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No projects generated yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {projects.map((p) => (
                    <div key={p.id} className="p-4 sm:p-5 hover:bg-slate-800/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm sm:text-base md:text-lg mb-1 leading-tight">{p.topic}</h4>
                            <div className="flex items-center gap-2 text-[9px] sm:text-xs text-slate-400">
                              <span className="flex items-center"><History className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> {formatDate(p.created_at || p.createdAt)}</span>
                              <span className="px-1.5 py-0.5 bg-slate-800 rounded-full font-medium">ID: {p.id.toString().substring(0, 8)}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <button 
                              onClick={() => onViewProject(p, user)}
                              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-emerald-900/20 text-emerald-400 rounded-lg text-[9px] sm:text-xs font-bold hover:bg-emerald-900/40 transition-colors"
                            >
                              <Edit2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              EDIT
                            </button>
                            <button 
                              onClick={() => handleViewPdf(p)}
                              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-blue-900/20 text-blue-400 rounded-lg text-[9px] sm:text-xs font-bold hover:bg-blue-900/40 transition-colors"
                            >
                              <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              VIEW
                            </button>
                            <button 
                              onClick={() => handleDownloadPdf(p)}
                              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-slate-800 text-slate-300 rounded-lg text-[9px] sm:text-xs font-bold hover:bg-slate-700 transition-colors"
                            >
                              <Download className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              PDF
                            </button>
                            <button 
                              onClick={() => handlePptDownload(p)}
                              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-orange-900/20 text-orange-400 rounded-lg text-[9px] sm:text-xs font-bold hover:bg-orange-900/40 transition-colors"
                            >
                              <Presentation className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              PPT
                            </button>
                            <button 
                              onClick={() => deleteProject(p.id)}
                              className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete Project"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Transaction History</h3>
                {transactions.length > 0 && (
                  <button 
                    onClick={() => {
                      if(confirm('Clear all transaction history?')) {
                        clientFetch(`/api/transactions/all/${user.id}`, { method: 'DELETE' })
                          .then(res => res.ok && setTransactions([]));
                      }
                    }}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-wider bg-red-900/20 px-2 py-1 rounded border border-red-900/30 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <button 
                onClick={() => onNavigate('transactions')}
                className="text-sm text-emerald-500 hover:text-emerald-600 font-medium"
              >
                View All
              </button>
            </div>
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {transactions.map((t) => (
                    <div key={t.id} className="p-4 flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.amount > 0 ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{t.reference || 'Transaction'}</p>
                          <p className="text-[10px] text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-bold ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                          </p>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{t.status}</span>
                        </div>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete Transaction"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={() => {
          setShowPremiumModal(false);
          onNavigate('topup');
        }}
        featureName={premiumFeatureName}
      />

      {showPdfViewer && pdfDataUrl && selectedProject && (
        <PdfViewer
          pdfUrl={pdfDataUrl}
          onClose={() => setShowPdfViewer(false)}
          isPremium={(user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess}
          onDownload={() => {
            const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess;
            if (isPremium) {
              generateProjectPDF(selectedProject.details || {}, selectedProject.content || {}, true);
            } else {
              setPremiumFeatureName('PDF Download');
              setShowPremiumModal(true);
            }
          }}
        />
      )}

      {/* PPT Modal */}
      {showPptModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-800"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Generate Presentation</h3>
              <button onClick={() => setShowPptModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-slate-400">You are about to generate a PowerPoint presentation for your project: <span className="font-bold text-slate-200">{selectedProject.topic}</span></p>
              <div className="text-center p-4 bg-emerald-900/20 rounded-xl">
                <p className="text-sm text-emerald-300">Cost</p>
                <p className="text-3xl font-bold text-emerald-200">FREE</p>
                <p className="text-xs text-emerald-400 mt-1">Included with Premium</p>
              </div>
              
              <button 
                onClick={handlePptPaymentAndGeneration}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                Download Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

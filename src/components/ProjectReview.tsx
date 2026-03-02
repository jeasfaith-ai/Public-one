import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Edit2, Save, Lock, Wallet, X, Presentation, Settings } from 'lucide-react';
import { ProjectContent, ProjectDetails, PdfOptions } from '../types';
import { DEPARTMENTS } from '../constants';
import ReactMarkdown from 'react-markdown';
import pptxgen from 'pptxgenjs';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import PremiumModal from './PremiumModal';
import PdfViewer from './PdfViewer';
import { generateProjectPDF } from '../utils/pdfGenerator';
import { generateExcel } from '../utils/excelGenerator';
import { FileSpreadsheet } from 'lucide-react';

interface ProjectReviewProps {
  key?: string;
  details: ProjectDetails;
  content: ProjectContent;
  project?: any;
  onUpdateContent: (content: ProjectContent) => void;
  onUpdateDetails: (details: ProjectDetails) => void;
  onBack: () => void;
  onNavigate: (step: any) => void;
  isPremiumSession?: boolean;
}

export default function ProjectReview({ details, content, project, onUpdateContent, onUpdateDetails, onBack, onNavigate, isPremiumSession = false }: ProjectReviewProps) {
  const { user, setUser } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState<keyof ProjectContent | 'details'>('chapter1');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [hasPaid, setHasPaid] = useState(false);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null); // State for PDF data URL
  const [showPdfViewer, setShowPdfViewer] = useState(false); // State to control PDF viewer visibility
  
  // Premium Modal State
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeatureName, setPremiumFeatureName] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // PDF Options State
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PdfOptions>({
    fontFamily: 'times',
    fontSize: 12,
    lineSpacing: 1.5,
    showPageNumbers: true,
    pageNumberPosition: 'top-right'
  });

  const [localProject, setLocalProject] = useState(project);

  const saveProject = async () => {
    if (!user?.id || isSaving) return;
    setIsSaving(true);
    try {
      const url = localProject?.id ? `/api/projects/${localProject.id}` : '/api/projects';
      const method = localProject?.id ? 'PUT' : 'POST';
      
      const res = await clientFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          topic: details.topic,
          content: content,
          details: details,
          is_premium_generated: isPremiumSession || localProject?.is_premium_generated || false
        })
      });
      
      if (res.ok) {
        const savedProject = await res.json();
        setLocalProject(savedProject);
        console.log('Project saved successfully');
      } else {
        console.error('Failed to save project');
      }
    } catch (e) {
      console.error('Failed to save project:', e);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    setLocalProject(project);
    // Auto-save when content is first loaded in review
    if (content && !localProject?.content?.chapter1) {
      saveProject();
    }
  }, [project, content]);

  useEffect(() => {
    // Check if user has free access or sufficient credits/balance for PDF download
    // Or if the session was marked as premium (credit deducted)
    if (user?.hasFreeAccess || (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || isPremiumSession || localProject?.is_premium_generated) {
      setHasPaid(true);
    }
    clientFetch('/api/support/payment-amount')
      .then(res => res.ok ? res.json() : { amount: 10000 })
      .then(data => setPaymentAmount(data.amount))
      .catch(err => console.error('Error fetching payment amount:', err));
  }, [user, isPremiumSession, localProject]);

  const handlePayWithBalance = async (type: 'pdf' | 'ppt') => {
    if (!user) return;
    
    if (user.balance < paymentAmount) {
      alert("Insufficient balance. Redirecting to top-up page...");
      onNavigate('topup');
      return;
    }

    try {
      const res = await clientFetch('/api/wallet/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: paymentAmount,
          description: `Project ${type.toUpperCase()} Download: ${details.topic}`
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUser({ ...user, balance: data.balance });
        setHasPaid(true);
        
        await saveProject();
        
        if (type === 'pdf') {
          generateProjectPDF(details, content, true, pdfOptions); // Trigger download
        } else {
          generatePPT();
        }
      } else {
        alert(data.error || "Payment failed");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred during payment");
    }
  };

  const handleDownload = async (type: 'pdf' | 'ppt') => {
    await saveProject(); // Always save project first

    // Check if user is a free user (no credits, no balance for project cost, and has used free project)
    // Actually, simply check if they have paid capability
    const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess || isPremiumSession || localProject?.is_premium_generated;

    if (type === 'pdf') {
      if (!isPremium) {
        // For free users, generate PDF and show in viewer, but don't download
        const doc = generateProjectPDF(details, content, false, pdfOptions); // Generate PDF without downloading
        if (doc) {
          const pdfOutput = doc.output('datauristring');
          setPdfDataUrl(pdfOutput);
          setShowPdfViewer(true);
        }
      } else {
        // Paid users can download
        generateProjectPDF(details, content, true, pdfOptions); // Trigger download
      }
    } else if (type === 'ppt') {
      // PPT download logic remains the same
      if (isPremium) {
        generatePPT();
      } else {
        setPremiumFeatureName('PPT Download');
        setShowPremiumModal(true);
      }
    }
  };

  const tabs: { id: keyof ProjectContent | 'details'; label: string }[] = [
    { id: 'details', label: 'Project Metadata' },
    { id: 'coverPage', label: 'Cover Page' },
    { id: 'titlePage', label: 'Title Page' },
    { id: 'declaration', label: 'Declaration' },
    { id: 'certification', label: 'Certification' },
    { id: 'approval', label: 'Approval' },
    { id: 'dedication', label: 'Dedication' },
    { id: 'acknowledgement', label: 'Acknowledgement' },
    { id: 'tableOfContents', label: 'Table of Contents' },
    { id: 'listOfTables', label: 'List of Tables' },
    { id: 'listOfFigures', label: 'List of Figures' },
    { id: 'listOfAppendices', label: 'List of Appendices' },
    { id: 'abstract', label: 'Abstract' },
    { id: 'chapter1', label: 'Chapter 1' },
    { id: 'chapter2', label: 'Chapter 2' },
    { id: 'chapter3', label: 'Chapter 3' },
    { id: 'chapter4', label: 'Chapter 4' },
    { id: 'chapter5', label: 'Chapter 5' },
    { id: 'references', label: 'References' },
    { id: 'appendices', label: 'Appendices' },
  ];

  const handleEditStart = () => {
    if (activeTab === 'details') return; // Handled differently
    setEditValue(content[activeTab as keyof ProjectContent]);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (activeTab === 'details') return;
    onUpdateContent({ ...content, [activeTab as keyof ProjectContent]: editValue });
    setIsEditing(false);
  };

  const handleDetailChange = (field: keyof ProjectDetails, value: string) => {
    onUpdateDetails({ ...details, [field]: value });
  };

  const generatePPT = () => {
    const pres = new pptxgen();
    
    // Define Master Slide for consistent branding
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: 0.6, fill: { color: "008060" } } },
        { text: { text: details.topic, options: { x: 0.2, y: 0.1, w: "90%", h: 0.4, fontSize: 12, color: "FFFFFF", bold: true } } },
        { text: { text: "Generated by Project Writer", options: { x: 0.2, y: 5.3, w: "90%", h: 0.3, fontSize: 10, color: "888888", align: "right" } } }
      ]
    });

    // Title Slide
    let slide = pres.addSlide();
    slide.addText(details.topic.toUpperCase(), { 
      x: 1, y: 1.5, w: '80%', h: 1.5, 
      fontSize: 32, bold: true, align: 'center', 
      color: '008060', fontFace: 'Arial' 
    });
    slide.addText(`BY\n${details.surname} ${details.firstName} ${details.middleName}\n${details.regNo}`, { 
      x: 1, y: 3.2, w: '80%', 
      fontSize: 20, align: 'center', 
      color: '363636' 
    });
    slide.addText(`DEPARTMENT OF ${details.department.toUpperCase()}`, { 
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
      // If content is long, split into multiple slides
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

    // References
    slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    slide.addText("REFERENCES", { x: 0.5, y: 0.8, fontSize: 24, bold: true, color: '008060' });
    slide.addText(content.references || "No references provided.", { 
      x: 0.5, y: 1.5, w: '90%', h: 3.5, 
      fontSize: 12, align: 'left', 
      valign: 'top' 
    });

    // Thank You Slide
    slide = pres.addSlide();
    slide.addText("THANK YOU", { 
      x: 1, y: 2, w: '80%', h: 1, 
      fontSize: 48, bold: true, align: 'center', 
      color: '008060' 
    });
    slide.addText("Questions & Comments are welcome", { 
      x: 1, y: 3.2, w: '80%', 
      fontSize: 18, align: 'center', 
      color: '666666' 
    });

    pres.writeFile({ fileName: `${details.surname}_Project_Presentation.pptx` });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen p-6 md:p-8 max-w-7xl mx-auto flex flex-col h-screen relative transition-colors"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
        <button 
          onClick={onBack}
          className="flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-colors bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Writer
        </button>
        
        <div className="grid grid-cols-2 sm:flex gap-2 items-center">
          {/* Balance Display */}
          <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 mr-2">
            <Wallet className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
            ₦{(user?.balance || 0).toLocaleString()}
          </div>

          <button
            onClick={() => setShowPdfSettings(true)}
            className="flex items-center justify-center px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm text-[10px] font-bold"
          >
            <Settings className="w-3 h-3 mr-1.5" />
            SETTINGS
          </button>

          <button
            onClick={() => {
              saveProject().then(() => onNavigate('dashboard'));
            }}
            disabled={isSaving}
            className="flex items-center justify-center px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 text-[10px] font-bold"
          >
            <Save className="w-3 h-3 mr-1.5" />
            {isSaving ? 'SAVING...' : 'SAVE & EXIT'}
          </button>

          <button
            onClick={() => handleDownload('pdf')}
            disabled={isSaving}
            className="flex items-center justify-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 text-[10px] font-bold"
          >
            {hasPaid || user?.hasFreeAccess ? <Download className="w-3 h-3 mr-1.5" /> : <Lock className="w-3 h-3 mr-1.5" />}
            {isSaving ? 'SAVING...' : 'PDF'}
          </button>

          <button
            onClick={() => handleDownload('ppt')}
            disabled={isSaving}
            className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 text-[10px] font-bold"
          >
            {hasPaid || user?.hasFreeAccess ? <Presentation className="w-3 h-3 mr-1.5" /> : <Lock className="w-3 h-3 mr-1.5" />}
            {isSaving ? 'SAVING...' : 'PPT'}
          </button>

          <button
            onClick={() => generateExcel(details, content)}
            disabled={isSaving}
            className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 text-[10px] font-bold"
          >
            {hasPaid || user?.hasFreeAccess ? <FileSpreadsheet className="w-3 h-3 mr-1.5" /> : <Lock className="w-3 h-3 mr-1.5" />}
            EXCEL
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[200px] lg:max-h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200">
            Project Sections
          </div>
          <div className="p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            {activeTab !== 'details' && (
              !isEditing ? (
                <button 
                  onClick={handleEditStart}
                  className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Content
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save Changes
                </button>
              )
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'details' ? (
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Topic</label>
                  <textarea 
                    value={details.topic}
                    onChange={(e) => handleDetailChange('topic', e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all min-h-[80px]"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Surname</label>
                    <input 
                      type="text"
                      value={details.surname}
                      onChange={(e) => handleDetailChange('surname', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name</label>
                    <input 
                      type="text"
                      value={details.firstName}
                      onChange={(e) => handleDetailChange('firstName', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
                    <input 
                      type="text"
                      value={details.middleName}
                      onChange={(e) => handleDetailChange('middleName', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                    <select 
                      value={details.department}
                      onChange={(e) => handleDetailChange('department', e.target.value as any)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date/Session</label>
                    <input 
                      type="text"
                      value={details.date}
                      onChange={(e) => handleDetailChange('date', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Supervisor Name</label>
                  <input 
                    type="text"
                    value={details.supervisorName}
                    onChange={(e) => handleDetailChange('supervisorName', e.target.value)}
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Head of Department</label>
                    <input 
                      type="text"
                      value={details.headOfDepartment}
                      onChange={(e) => handleDetailChange('headOfDepartment', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dean of Faculty</label>
                    <input 
                      type="text"
                      value={details.deanOfFaculty}
                      onChange={(e) => handleDetailChange('deanOfFaculty', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Internal Examiner</label>
                    <input 
                      type="text"
                      value={details.internalExaminer}
                      onChange={(e) => handleDetailChange('internalExaminer', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">External Examiner</label>
                    <input 
                      type="text"
                      value={details.externalExaminer}
                      onChange={(e) => handleDetailChange('externalExaminer', e.target.value)}
                      className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : isEditing ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full h-full p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none font-mono text-sm leading-relaxed resize-none"
              />
            ) : (
              <div className="prose dark:prose-invert prose-slate max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300">
                <ReactMarkdown>{String(content[activeTab as keyof ProjectContent] || '')}</ReactMarkdown>
              </div>
            )}
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

      {/* PDF Settings Modal */}
      {showPdfSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Settings className="w-5 h-5 mr-2 text-emerald-500" />
                PDF Customization
              </h3>
              <button onClick={() => setShowPdfSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Font Family</label>
                <select 
                  value={pdfOptions.fontFamily}
                  onChange={e => setPdfOptions({...pdfOptions, fontFamily: e.target.value as any})}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="times">Times New Roman (Standard)</option>
                  <option value="helvetica">Helvetica (Modern)</option>
                  <option value="courier">Courier (Typewriter)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Font Size</label>
                  <input 
                    type="number" 
                    value={pdfOptions.fontSize}
                    onChange={e => setPdfOptions({...pdfOptions, fontSize: parseInt(e.target.value)})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Line Spacing</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={pdfOptions.lineSpacing}
                    onChange={e => setPdfOptions({...pdfOptions, lineSpacing: parseFloat(e.target.value)})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Page Number Position</label>
                <select 
                  value={pdfOptions.pageNumberPosition}
                  onChange={e => setPdfOptions({...pdfOptions, pageNumberPosition: e.target.value as any})}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="top-right">Top Right</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Page Numbers</span>
                <button 
                  onClick={() => setPdfOptions({...pdfOptions, showPageNumbers: !pdfOptions.showPageNumbers})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${pdfOptions.showPageNumbers ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pdfOptions.showPageNumbers ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <button 
                onClick={() => setShowPdfSettings(false)}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                Apply Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showPdfViewer && pdfDataUrl && (
        <PdfViewer
          pdfUrl={pdfDataUrl}
          onClose={() => setShowPdfViewer(false)}
          isPremium={(user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess}
          onDownload={() => {
            const isPremium = (user?.project_credits || 0) > 0 || (user?.balance || 0) >= 10000 || user?.hasFreeAccess;
            if (isPremium) {
              generateProjectPDF(details, content, true);
            } else {
              setPremiumFeatureName('PDF Download');
              setShowPremiumModal(true);
            }
          }}
        />
      )}
      
    </motion.div>
  );
}

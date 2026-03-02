import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, MessageSquare, Mic, Play, ShieldCheck, User, Download, Presentation, HelpCircle, X } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';
import { generateContentWithRetry } from '../utils/gemini';
import { generateDefensePDF } from '../utils/defensePdfGenerator';
import PremiumModal from './PremiumModal';

interface ProjectDefenseProps {
  key?: string;
  onBack: () => void;
  onNavigate: (step: any) => void;
}

const TOUR_STEPS = [
  {
    target: 'project-list',
    title: 'Select a Project',
    content: 'Choose one of your generated projects to create a defense script for.'
  },
  {
    target: 'generate-btn',
    title: 'Generate Script',
    content: 'Click here to generate a professional defense script. First one is FREE!'
  },
  {
    target: 'script-view',
    title: 'Review & Download',
    content: 'Read your script, practice with the Q&A, and download it as a PDF.'
  }
];

export default function ProjectDefense({ onBack, onNavigate }: ProjectDefenseProps) {
  const { user, setUser } = useContext(UserContext);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [defenseScript, setDefenseScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Tour State
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProjects();
      // Show tour if user hasn't seen it (could use local storage or user preference)
      const hasSeenTour = localStorage.getItem('defenseTourSeen');
      if (!hasSeenTour) {
        setShowTour(true);
      }
    }
  }, [user]);

  const closeTour = () => {
    setShowTour(false);
    localStorage.setItem('defenseTourSeen', 'true');
  };

  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      closeTour();
    }
  };

  const fetchProjects = async () => {
    if (!user?.id) return;
    try {
      const res = await clientFetch(`/api/projects/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDefense = async () => {
    if (!selectedProject || !user?.id) return;
    setGenerating(true);
    setError(null);

    try {
      // 1. Deduct credits/balance
      const deductRes = await clientFetch('/api/projects/defense-deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedProject.topic, projectId: selectedProject.id })
      });

      if (!deductRes.ok) {
        if (deductRes.status === 402) {
          setShowPremiumModal(true);
          throw new Error('Insufficient credits or balance. Please top up.');
        }
        const errorData = await deductRes.json();
        throw new Error(errorData.error || 'Insufficient funds');
      }

      const deductData = await deductRes.json();
      
      // Update user balance/credits in context
      if (user) {
        setUser({
          ...user,
          balance: deductData.balance !== undefined ? deductData.balance : user.balance,
          project_credits: deductData.credits !== undefined ? deductData.credits : user.project_credits,
          used_free_defense: deductData.isFree ? true : user.used_free_defense // Update local state
        });
      }

      // 2. Generate Script with Gemini
      // Read the ENTIRE project content to ensure a comprehensive and accurate defense script
      const projectContent = selectedProject.content || {};
      const fullContent = Object.entries(projectContent)
        .map(([key, value]) => `--- ${key.toUpperCase()} ---\n${value}`)
        .join('\n\n');

      const prompt = `
        You are an expert academic defense coach. Your task is to generate a comprehensive, professional, and highly confident FIRST-PERSON defense script.
        
        CRITICAL INSTRUCTION: You MUST read and analyze the ENTIRE project content provided below from Chapter 1 to the end. Ensure the script is accurate, specific to the research findings, and ready to use.
        
        Topic: ${selectedProject.topic}
        Student: ${user?.fullName || 'Student'}
        Department: ${selectedProject.details?.department || 'Education'}
        Study Location: ${selectedProject.details?.studyLocation || 'N/A'}
        
        FULL PROJECT CONTENT (READ EVERYTHING):
        ${fullContent}

        CRITICAL RULES:
        1. NO CHAT: Output ONLY the script content. No introductions or conversational filler.
        2. STRICT FIRST PERSON: Use "I", "My research", "In my study, I found...", "In my study, I found that...", "I recommend...". NEVER use "The student" or "The researcher".
        3. STRUCTURE: Use clear, bold headings for each section.
        4. FLOW: Ensure the script sounds natural when spoken aloud and is READY TO USE.
        5. NO PLAGIARISM: Ensure the script is original and synthesizes the project content in a unique way. Do not just copy-paste; synthesize.
        6. SPECIFICITY: Use ACTUAL DATA, FINDINGS, and RECOMMENDATIONS from the provided project content. Do not use generic placeholders. Mention specific numbers, means, and results from Chapter 4.
        
        SCRIPT SECTIONS:
        1. Introduction (Greeting the panel, introducing myself and my topic)
        2. Problem Statement (Why I chose this study and the gap I am filling)
        3. Aim and Objectives (What I set out to achieve)
        4. Methodology (How I conducted the research - design, population, sample, instruments)
        5. Results and Discussion (My key findings using actual data from the content provided. Mention specific percentages, means, or p-values from the project)
        6. Conclusion (My final verdict on the research)
        7. Recommendations (My suggestions for policy or further study)
        8. Closing (Thanking the panel and inviting questions)
        
        Q&A Preparation:
        Provide 5-7 likely difficult questions the panel might ask ME, and provide smart, concise FIRST-PERSON answers for each.

        Tone: Confident, professional, authoritative, and academic.
      `;

      const model = "gemini-3.1-pro-preview";
      const responseText = await generateContentWithRetry(model, prompt);
      
      if (responseText) {
        // Clean AI thoughts just in case
        const cleaned = responseText
          .replace(/^(here is|certainly|sure|i have|this is|i've written|let me know|hope this helps|good luck|as an ai|i will write).*$/gim, '')
          .trim();
        setDefenseScript(cleaned);
      } else {
        throw new Error('No content generated');
      }

    } catch (err: any) {
      console.error('Defense generation error:', err);
      // Don't overwrite specific error messages if already set
      if (err.message !== 'Insufficient credits or balance. Please top up.') {
         setError(err.message || 'Failed to generate defense script');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!defenseScript || !selectedProject) return;
    const doc = generateDefensePDF(
      selectedProject.topic, 
      user?.fullName || 'Student', 
      defenseScript
    );
    doc.save(`${selectedProject.topic.substring(0, 30)}_Defense_Script.pdf`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-3 sm:p-6 relative overflow-hidden">
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubscribe={() => {
          setShowPremiumModal(false);
          onNavigate('dashboard'); // Navigate to dashboard to top up
        }}
        featureName="Defense Script Generation"
      />

      {/* Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-700"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                  <HelpCircle className="w-6 h-6 mr-2 text-indigo-500" />
                  {TOUR_STEPS[tourStep].title}
                </h3>
                <button onClick={closeTour} className="text-slate-400 hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {TOUR_STEPS[tourStep].content}
              </p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-1">
                  {TOUR_STEPS.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 w-2 rounded-full ${idx === tourStep ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={nextTourStep}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? 'Got it!' : 'Next'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto relative z-10">
        <button 
          onClick={onBack}
          className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
          <div className="p-2 sm:p-3 bg-indigo-500/10 rounded-full w-fit">
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">Stress no more Defense Coach</h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-400">Generate a professional defense script and Q&A guide.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : !selectedProject ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {projects.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Projects Found</h3>
                <p className="text-slate-400">You haven't generated any projects yet.</p>
              </div>
            ) : (
              projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-all"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white line-clamp-2 mb-2">{project.topic}</h3>
                  <p className="text-sm text-slate-400 line-clamp-3">
                    Click to generate defense script for this project.
                  </p>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar / Project Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Selected Project</h3>
                <p className="text-slate-300 font-medium mb-4">{selectedProject.topic}</p>
                <button 
                  onClick={() => {
                    setSelectedProject(null);
                    setDefenseScript(null);
                    setError(null);
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300"
                >
                  Change Project
                </button>
              </div>

              {!defenseScript && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {user?.used_free_defense ? 'Cost: 2 Credits' : 'First Time: FREE!'}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm mb-6">
                    {user?.used_free_defense ? 'Or ₦2,000 from your wallet balance.' : 'Generate your first defense script for free.'}
                  </p>
                  <button
                    onClick={handleGenerateDefense}
                    disabled={generating}
                    className={`w-full py-3 ${user?.used_free_defense ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'} text-white rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5 mr-2" />
                        {user?.used_free_defense ? 'Generate Script' : 'Generate for FREE'}
                      </>
                    )}
                  </button>
                  {error && (
                    <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
                  )}
                </div>
              )}

              {generating && !defenseScript && (
                <div className="hidden lg:block bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">Generating script...</p>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              {generating && !defenseScript ? (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] sm:min-h-[400px]">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-2">Project writer is thinking...</h3>
                  <p className="text-slate-400 max-w-md text-sm sm:text-base">
                    Our system is crafting your defense script. This may take a moment.
                  </p>
                </div>
              ) : defenseScript ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-8"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Your Defense Script</h2>
                    <button 
                      onClick={handleDownloadPDF}
                      className="flex items-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white transition-colors w-full sm:w-auto justify-center font-bold"
                      title="Download as PDF"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-sm sm:text-base">
                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-serif">
                      {defenseScript}
                    </div>
                  </div>
                </motion.div>
              ) : generating ? null : (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px] sm:min-h-[400px]">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Presentation className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Ready to Defend?</h3>
                  <p className="text-slate-400 max-w-md text-sm sm:text-base">
                    Select a project and click generate to get a tailored defense script and Q&A guide.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
      <p>Error: {error.message}</p>
    </div>
  );
}


import { BookOpen, PenTool, GraduationCap, ArrowRight, CheckCircle2, ShieldCheck, Clock, Users, LogIn, UserPlus, Wallet, Mic, Presentation, Calculator, FileText, BrainCircuit, FileQuestion, Feather, Briefcase, Calendar, TrendingDown, DollarSign, Zap, ChefHat, Target, Brain, Book, Video, TrendingUp, ShieldAlert, Footprints, Utensils, Home } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } }
};

const letterVariants = {
  hidden: { opacity: 0, y: 20, rotateX: -45 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', stiffness: 200, damping: 15 } }
};

interface LandingProps {
  key?: string;
  onStart?: () => void;
  onWrite?: () => void;
  onDashboard?: () => void;
  onLogin?: () => void;
  onSignup?: () => void;
  onDefense?: () => void;
  onPlagiarismCheck?: () => void;
  user?: any;
  isPublic?: boolean;
}

export default function Landing({ onStart, onWrite, onDashboard, onLogin, onSignup, onDefense, onPlagiarismCheck, user, isPublic = false }: LandingProps) {

  console.log('Landing: Rendering...', { isPublic, step: user ? 'authenticated' : 'public' });
  
  const [showPresentationModal, setShowPresentationModal] = useState(false);

  // PUBLIC LANDING PAGE (Home)
  if (isPublic) {


    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="w-full max-w-full overflow-x-hidden bg-[#0f172a] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 relative animated-gradient-background"
      >
        {/* Navbar */}
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto relative z-20">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold text-white tracking-tight">STRESS NO MORE</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={onLogin} className="text-slate-300 hover:text-white font-medium transition-colors">Sign In</button>
            <button onClick={onSignup} className="bg-emerald-600 text-white px-5 py-2 rounded-full font-medium hover:bg-emerald-500 transition-all">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative pt-20 pb-20 md:pt-28 md:pb-32 overflow-hidden z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-4xl mx-auto"
            >
              <motion.h1 
                className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight flex flex-wrap justify-center gap-x-4"
              >
                <motion.span variants={letterVariants}>Professional</motion.span>
                <motion.span variants={letterVariants}>Project</motion.span>
                <div className="w-full hidden sm:block"></div>
                <motion.span variants={letterVariants}>Writing</motion.span>
                <motion.span variants={letterVariants}>Made</motion.span>
                <motion.span variants={letterVariants} className="text-emerald-500">Simple.</motion.span>
              </motion.h1>

              <motion.p 
                variants={itemVariants}
                className="text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed px-4 max-w-3xl mx-auto"
              >
                The trusted platform for students of UNN and its affiliated institutions. We help you generate approved topics, structure your chapters, and format your references perfectly.
              </motion.p>

              <motion.div 
                variants={itemVariants}
                className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4"
              >
                <button onClick={onSignup} className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-500 transition-all flex items-center justify-center group">
                  Start Your Project 
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={onLogin} className="w-full sm:w-auto bg-slate-800/80 text-slate-200 px-8 py-4 rounded-xl font-bold text-lg border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all">
                  Existing User? Login
                </button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Graduates Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-10 bg-[#0f172a]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={itemVariants}>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Join Thousands of <br />
                  <span className="text-emerald-500">Happy Graduates.</span>
                </h2>
                <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                  Don't let project writing hold you back from your celebration. Our Powered Stress no More project writer ensures your work meets the highest academic standards of the University of Nigeria, Nsukka and its affiliated colleges.
                </p>
                
                <div className="space-y-4 mb-8">
                  {[
                    'Strict adherence to UNN Faculty guidelines',
                    'Plagiarism-free academic content',
                    'Proper APA 7th Edition referencing',
                    'Instant PDF export for submission'
                  ].map((feature, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full border border-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <span className="text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button variants={itemVariants} onClick={onSignup} className="text-emerald-500 font-bold text-lg flex items-center hover:text-emerald-400 transition-colors group">
                  Get Started for Free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>

              {/* Mockup Image */}
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl transform rotate-3 opacity-20 blur-lg"></div>
                <div className="relative bg-slate-100 rounded-3xl p-8 shadow-2xl transform -rotate-2 border border-slate-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <GraduationCap className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center space-y-4">
                    <h4 className="text-blue-900 font-bold text-sm">THE IMPACT OF ARTIFICIAL INTELLIGENCE ON ACADEMIC PERFORMANCE</h4>
                    <p className="text-blue-800 text-xs">A CASE STUDY OF COMPUTER SCIENCE STUDENTS</p>
                    <div className="py-4">
                      <p className="text-blue-600 text-[10px] font-bold">BY</p>
                      <p className="text-blue-900 font-bold text-xs">OKEKE CHIDIMMA MARYJANE</p>
                      <p className="text-blue-800 text-[10px]">2021/245689</p>
                    </div>
                    <div className="pt-4 border-t border-blue-200">
                      <p className="text-blue-600 text-[10px] font-bold">DEPARTMENT OF</p>
                      <p className="text-blue-900 font-bold text-xs">COMPUTER SCIENCE EDUCATION</p>
                      <p className="text-blue-800 text-[10px]">FACULTY OF EDUCATION</p>
                    </div>
                    <p className="text-blue-900 font-bold text-[10px] pt-4">UNIVERSITY OF NIGERIA, NSUKKA</p>
                  </div>

                  {/* Approved Badge */}
                  <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl flex items-center space-x-4 border border-slate-100">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status</p>
                      <p className="text-xl font-black text-slate-900">Approved</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Why Choose Us? Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0f172a]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-white text-center mb-12 leading-tight">
              Why Choose <span className="text-emerald-500">Stress No More?</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
                <div className="p-4 bg-emerald-500/10 rounded-full w-fit mx-auto mb-6">
                  <GraduationCap className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Approved Standards</h3>
                <p className="text-slate-400">All content is formatted strictly according to UNN Faculty of Education guidelines.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
                <div className="p-4 bg-blue-500/10 rounded-full w-fit mx-auto mb-6">
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Save Time</h3>
                <p className="text-slate-400">Complete your project in days, not months. Focus on your defense while we handle the structure.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center">
                <div className="p-4 bg-purple-500/10 rounded-full w-fit mx-auto mb-6">
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Expert Support</h3>
                <p className="text-slate-400">Our platform is built with input from academic supervisors to ensure quality.</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Defend Your Project Like a Pro Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0f172a]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div variants={itemVariants}>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Defend Your Project <br />
                  <span className="text-purple-500">Like a Pro.</span>
                </h2>
                <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                  Don't just write it ,own it. Our Stress no more Defense Coach prepares you to face your panel with absolute confidence. Get a personalized script that speaks for you.
                </p>
                
                <div className="space-y-4 mb-8">
                  {[
                    'Custom Defense Script: A complete 1st-person speech tailored to your specific topic.',
                    'Smart Q&A Prep: Anticipate difficult questions with expert-crafted answers.',
                    'PDF Download: Get a printable guide to practice anywhere, anytime.'
                  ].map((feature, idx) => (
                    <motion.div key={idx} variants={itemVariants} className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full border border-purple-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                      </div>
                      <span className="text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button variants={itemVariants} onClick={onDefense} className="text-purple-500 font-bold text-lg flex items-center hover:text-purple-400 transition-colors group">
                  Try Defense Tool <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>

              {/* Mockup Image / Preview */}
              <motion.div variants={itemVariants} className="relative bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 to-purple-400 rounded-3xl transform rotate-3 opacity-20 blur-lg"></div>
                <div className="relative bg-slate-900 rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center space-x-3 mb-4">
                    <BrainCircuit className="w-6 h-6 text-purple-500" />
                    <h4 className="text-lg font-bold text-white">Defense Script Generator</h4>
                  </div>
                  <p className="text-sm text-slate-400 mb-6">Powered by Academic Coach</p>

                  <div className="bg-slate-800 rounded-lg p-4 text-left border border-slate-700">
                    <p className="text-xs text-purple-400 font-bold uppercase mb-2">Generated Script Preview</p>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "Good morning, Mr. Chairman and members of the panel. My name is [Name], and I am here to defend my research on [Topic].
                      <br /><br />
                      The problem that necessitated this study was the observed decline in..."
                    </p>
                  </div>
                  <div className="mt-4 bg-slate-800 rounded-lg p-4 text-left border border-slate-700">
                    <p className="text-xs text-purple-400 font-bold uppercase mb-2">Potential Question #1</p>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "What is the significance of your study?"
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* What We Do Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0a1222]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-white text-center mb-12 leading-tight">
              What We <span className="text-emerald-500">Do</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-emerald-500/10 rounded-full w-fit mx-auto mb-6">
                  <FileQuestion className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Quiz Solver</h3>
                <p className="text-slate-400">Get simple, understandable answers for objective and theory quiz questions instantly.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-blue-500/10 rounded-full w-fit mx-auto mb-6">
                  <Feather className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Assignment Writer</h3>
                <p className="text-slate-400">Generate high-quality, plagiarism-free academic assignments with proper structure and citations.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-purple-500/10 rounded-full w-fit mx-auto mb-6">
                  <Calculator className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">CGPA Calculator</h3>
                <p className="text-slate-400">Calculate your CGPA specifically tailored for Nigerian Universities (UNN grading system).</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-red-500/10 rounded-full w-fit mx-auto mb-6">
                  <Target className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Exam Question Predictor</h3>
                <p className="text-slate-400">Generate high-probability CBT (70 questions) and Theory (10 questions) based on your syllabus.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-green-500/10 rounded-full w-fit mx-auto mb-6">
                  <Book className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Perfect Exam Answer</h3>
                <p className="text-slate-400">Generate structured, high-scoring answers to impress your lecturers.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-yellow-500/10 rounded-full w-fit mx-auto mb-6">
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Textbook to Questions</h3>
                <p className="text-slate-400">Convert textbook chapters or notes into possible exam questions (Objective & Theory).</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-indigo-500/10 rounded-full w-fit mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Fast Revision Cram Sheet</h3>
                <p className="text-slate-400">Condense your notes into a one-page cheat sheet with formulas, dates, and definitions.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-pink-500/10 rounded-full w-fit mx-auto mb-6">
                  <Brain className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Memory Hack Generator</h3>
                <p className="text-slate-400">Boost retention with mnemonics, memory palaces, and cognitive tricks for any topic.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-cyan-500/10 rounded-full w-fit mx-auto mb-6">
                  <Utensils className="w-8 h-8 text-cyan-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Cheap Food Finder</h3>
                <p className="text-slate-400">Find the most affordable food spots near you with addresses and prices.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-orange-500/10 rounded-full w-fit mx-auto mb-6">
                  <Home className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Accommodation Finder</h3>
                <p className="text-slate-400">Find lodges, self-cons, and flats near your school with prices and contacts.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-lime-500/10 rounded-full w-fit mx-auto mb-6">
                  <TrendingDown className="w-8 h-8 text-lime-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Business Demand Detector</h3>
                <p className="text-slate-400">Find out exactly what students in your school are willing to pay for right now.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-rose-500/10 rounded-full w-fit mx-auto mb-6">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Emergency Survival Planner</h3>
                <p className="text-slate-400">Broke? Stranded? Get a strategy to survive until your next allowance.</p>
              </motion.div>




            </div>
          </div>
        </motion.div>



        {/* More Services From Stress no More Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0f172a]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-white text-center mb-12 leading-tight">
              More Services From <span className="text-emerald-500">Stress no More</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-teal-500/10 rounded-full w-fit mx-auto mb-6">
                  <ChefHat className="w-8 h-8 text-teal-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Student Food Budget</h3>
                <p className="text-slate-400">Plan meals, get shopping lists, and cooking tutorials based on your budget amount.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-fuchsia-500/10 rounded-full w-fit mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">CV & Statement Builder</h3>
                <p className="text-slate-400">Create professional CVs and Personal Statements for SIWES, Internships, and NYSC.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-sky-500/10 rounded-full w-fit mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-sky-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Study Timetable</h3>
                <p className="text-slate-400">Create a balanced, effective study schedule tailored to your courses and time.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-indigo-500/10 rounded-full w-fit mx-auto mb-6">
                  <DollarSign className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Side Hustle Generator</h3>
                <p className="text-slate-400">Discover profitable business ideas based on your skills, course, and location.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-yellow-500/10 rounded-full w-fit mx-auto mb-6">
                  <TrendingDown className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Carryover Impact</h3>
                <p className="text-slate-400">Visualize how failed courses affect your final CGPA and plan your recovery.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-red-500/10 rounded-full w-fit mx-auto mb-6">
                  <Users className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Paraphraser & Humanizer</h3>
                <p className="text-slate-400">Rewrite content to sound natural, human, and bypass detection tools.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-orange-500/10 rounded-full w-fit mx-auto mb-6">
                  <Presentation className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Presentation Maker</h3>
                <p className="text-slate-400">Get a slide-by-slide script to nail your next presentation and impress everyone.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-amber-500/10 rounded-full w-fit mx-auto mb-6">
                  <GraduationCap className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Scholarship Finder</h3>
                <p className="text-slate-400">Find scholarships tailored to your CGPA, course, and level (Nigeria-focused).</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-lime-500/10 rounded-full w-fit mx-auto mb-6">
                  <Briefcase className="w-8 h-8 text-lime-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Job Finder</h3>
                <p className="text-slate-400">Find current available jobs in your preferred state with contact details and company info.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-rose-500/10 rounded-full w-fit mx-auto mb-6">
                  <Footprints className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Situation Escaper</h3>
                <p className="text-slate-400">Stuck in a mess? Get a step-by-step plan to get out of trouble safely.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-cyan-500/10 rounded-full w-fit mx-auto mb-6">
                  <Book className="w-8 h-8 text-cyan-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Note Summarizer</h3>
                <p className="text-slate-400">Turn lengthy lecture notes into simplified summaries and exam prep material.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 text-center transform hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-pink-500/10 rounded-full w-fit mx-auto mb-6">
                  <Video className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Content Creation Income</h3>
                <p className="text-slate-400">Turn your skills and interests into a profitable content creation side hustle.</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Promotional Services List */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0f172a]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Unlock Your Academic Potential with <span className="text-emerald-500">Stress No More!</span>
            </motion.h2>
            <motion.p variants={itemVariants} className="text-lg text-slate-400 mb-12 max-w-3xl mx-auto">
              Experience a seamless academic journey with our comprehensive suite of Stress no more tools, designed exclusively for UNN students and affiliated institutions.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-emerald-500/10 rounded-full w-fit mb-6">
                  <BookOpen className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Topic Generation</h3>
                <p className="text-slate-400">Struggling for a research topic? Stress no more generates unique, approved, and highly researchable topics tailored to your department, ensuring your proposal gets accepted the first time!</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-blue-500/10 rounded-full w-fit mb-6">
                  <PenTool className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Project Writing Assistant</h3>
                <p className="text-slate-400">From Chapter One to your final references, get a complete, well-structured, and plagiarism-free project. Our assistant ensures clarity, organization, and strict adherence to academic standards, making your submission stress-free.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-purple-500/10 rounded-full w-fit mb-6">
                  <ShieldCheck className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Defense Coach</h3>
                <p className="text-slate-400">Walk into your defense with confidence! Our Stress no more Defense Coach prepares you with a personalized script, anticipates difficult questions, and provides expert-crafted answers, ensuring you own your presentation like a pro.</p>
              </motion.div>

              <motion.div 
                variants={itemVariants} 
                className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setShowPresentationModal(true)}
              >
                <div className="p-4 bg-orange-500/10 rounded-full w-fit mb-6">
                  <Presentation className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Presentation Generator</h3>
                <p className="text-slate-400">Instantly transform your completed project into a professional, visually appealing PowerPoint presentation. Save hours of design work and focus on delivering a compelling defense.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/10 rounded-full w-fit mb-6">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Plagiarism Checker</h3>
                <p className="text-slate-400">Ensure academic integrity with our robust plagiarism checker. Get detailed reports and suggestions to refine your work, guaranteeing originality and compliance with university policies.</p>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="p-4 bg-green-500/10 rounded-full w-fit mb-6">
                  <Brain className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Academic Coach</h3>
                <p className="text-slate-400">Beyond writing, our coach provides personalized guidance, study tips, and academic support to help you navigate complex topics and achieve your full potential throughout your degree program.</p>
              </motion.div>


            </div>


          </div>
        </motion.div>

        {/* FAQ / Help Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="py-20 bg-[#0f172a]"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div variants={itemVariants} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works & FAQ</h2>
              <p className="text-slate-400 text-lg">Everything you need to know about using our platform effectively.</p>
            </motion.div>

            <div className="space-y-6">
              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">How do I get started?</h3>
                    <p className="text-slate-400">Simply sign up for an account using your email. Once logged in, you can choose to "Generate Topic" to get department-specific topics, or "Write Project" if you already have an approved topic.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Is the content 100% accurate and academic?</h3>
                    <p className="text-slate-400 mb-3">Yes. Our system is specifically trained on UNN Faculty of Education guidelines (and its affiliates). It ensures:</p>
                    <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
                      <li>Proper APA 7th Edition referencing</li>
                      <li>Correct chapter structure (Chapter 1-5)</li>
                      <li>Relevant and up-to-date literature review</li>
                      <li>Plagiarism-free content generation</li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Can I generate a PowerPoint presentation?</h3>
                    <p className="text-slate-400">Absolutely. Once your project is generated, you can use our "Generate PPT" feature in the dashboard to create a professional slide deck for your defense instantly.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={containerVariants}
          className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
            <motion.div variants={itemVariants} className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-white mb-2">
                <GraduationCap className="w-6 h-6" />
                <span className="font-bold text-lg">STRESS NO MORE</span>
              </div>
              <p className="text-sm">Empowering students to achieve academic excellence.</p>
            </motion.div>
            <motion.div variants={itemVariants} className="text-sm">
              <p>&copy; 2026 Stress No More. All Rights Reserved.</p>
              <p className="mt-2">
                Designed & Developed by{' '}
                <a 
                  href="https://wa.me/2347060816237" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                >
                  RTechs
                </a>.
              </p>
            </motion.div>
          </div>
        </motion.footer>

        {/* Presentation Modal */}
        {showPresentationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-700 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
              
              <button 
                onClick={() => setShowPresentationModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                  <Presentation className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Professional Presentation Generator</h3>
                <p className="text-slate-400">Turn your project into a defense-ready PowerPoint in seconds.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">Automatic slide structure based on chapters</span>
                </div>
                <div className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">Professional themes matching your faculty</span>
                </div>
                <div className="flex items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">Key points extraction for concise slides</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowPresentationModal(false);
                    onLogin && onLogin();
                  }}
                  className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    setShowPresentationModal(false);
                    onSignup && onSignup();
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-pink-700 transition-all shadow-lg shadow-orange-900/20"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }

  // AUTHENTICATED MAIN MENU (Landing)
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col bg-[#0f172a] relative"
    >

      <div className="absolute top-6 right-6 flex items-center space-x-4 z-10">
        {!user?.hasFreeAccess && (
          <button 
            onClick={onDashboard}
            className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-900 text-emerald-500 rounded-full border border-slate-800 hover:bg-slate-800 transition-all font-medium"
          >
            <Wallet className="w-4 h-4" />
            <span>₦{user?.walletBalance || 0}</span>
          </button>
        )}

        <div className="hidden md:block">
          <button 
            onClick={onDashboard}
            className="flex items-center space-x-2 text-slate-400 hover:text-emerald-500 font-medium"
          >
            <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span>{user?.fullName}</span>
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 text-center w-full max-w-full mx-auto space-y-10 sm:space-y-16 py-12">
        <div className="space-y-4 sm:space-y-6">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center p-3 sm:p-4 bg-emerald-500/10 rounded-2xl mb-2 sm:mb-4 border border-emerald-500/20"
          >
            <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-500" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white"
          >
            Welcome, <span className="text-emerald-500">{user?.fullName?.split(' ')[0]}</span>!
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0 }}
            className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto font-medium"
          >
            Ready to excel in your academic journey? Choose a tool to begin.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
          <motion.button
            id="generate-topic-btn"
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={onStart}
            className="group relative p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-6 group-hover:bg-emerald-500/20 transition-colors border border-emerald-500/10">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Generate Topic</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Get unique, approved, and researchable topics tailored to your department, ensuring no more rejected proposals.
            </p>
          </motion.button>

          <motion.button
            id="write-project-btn"
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={onWrite}
            className="group relative p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
            <div className="p-3 bg-blue-500/10 rounded-2xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
              <PenTool className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Write Project</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Receive a complete, well-structured project from Chapter One to references, clear, organized, and submission-ready.
            </p>
          </motion.button>

          <motion.button
            id="defend-project-btn"
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={onDefense}
            className="group relative p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
            <div className="p-3 bg-purple-500/10 rounded-2xl w-fit mb-6 group-hover:bg-purple-500/20 transition-colors border border-purple-500/10">
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Defend Like a Pro</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Don't just write it ,own it. Our Stress no more Defense Coach prepares you to face your panel with absolute confidence. Get a personalized script that speaks for you.
            </p>
          </motion.button>

          <motion.button
            id="generate-ppt-btn"
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              alert("Please go to your Dashboard to view your generated projects and convert them to PowerPoint presentations.");
              if (onDashboard) onDashboard();
            }}
            className="group relative p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all" />
            <div className="p-3 bg-orange-500/10 rounded-2xl w-fit mb-6 group-hover:bg-orange-500/20 transition-colors border border-orange-500/10">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Presentation className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </ErrorBoundary>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Generate Presentation</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Instantly turn your project into a clean, professional, defense-ready presentation that helps you speak confidently and stand out.
            </p>
          </motion.button>
          <motion.button
            id="plagiarism-checker-btn"
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={onPlagiarismCheck}
            className="group relative p-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 hover:border-red-500/50 hover:bg-slate-800/50 transition-all text-left overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-all" />
            <div className="p-3 bg-red-500/10 rounded-2xl w-fit mb-6 group-hover:bg-red-500/20 transition-colors border border-red-500/10">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </ErrorBoundary>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Plagiarism Checker</h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Ensure academic integrity. Check your generated project or upload a document to verify originality.
            </p>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

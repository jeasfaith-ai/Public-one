import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, BookOpen, GraduationCap, School, FileText, BrainCircuit, FileQuestion, Feather, Briefcase, Calendar, TrendingDown, DollarSign, Zap, ChefHat, Target, Brain, PenTool, Book, Video, TrendingUp, ShieldAlert, Footprints, Presentation, Utensils, Home, Camera, Upload, Search, ShieldCheck, User, FileOutput } from 'lucide-react';

interface ServicesProps {
  onBack: () => void;
  onNavigate: (step: any) => void;
}

export default function Services({ onBack, onNavigate }: ServicesProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const services = [
    {
      id: 'cgpa-calculator-file',
      title: 'Stress no more CGPA Calculator',
      description: 'Upload your result screenshot or PDF to calculate your CGPA automatically.',
      icon: <Calculator className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      action: 'Upload Result',
      recommended: true
    },
    {
      id: 'cgpa-calculator',
      title: 'Manual CGPA Calculator',
      description: 'Calculate your CGPA specifically tailored for Nigerian Universities (UNN grading system).',
      icon: <Calculator className="w-6 h-6 text-emerald-500" />,
      color: 'emerald',
      action: 'Check Result',
      recommended: false
    },
    {
      id: 'snap-solve',
      title: 'Snap & Solve',
      description: 'Snap your quiz or exam questions and get ready-to-write answers instantly.',
      icon: <Camera className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      action: 'Snap Now',
      recommended: true
    },
    {
      id: 'upload-solve',
      title: 'Upload & Solve',
      description: 'Upload photos or PDFs of your questions and get ready-to-write answers immediately.',
      icon: <Upload className="w-6 h-6 text-blue-400" />,
      color: 'blue',
      action: 'Upload Now',
      recommended: true
    },
    {
      id: 'object-identifier',
      title: 'Object Identifier',
      description: 'Snap any object, person, or device to identify it and get detailed information.',
      icon: <Search className="w-6 h-6 text-purple-400" />,
      color: 'purple',
      action: 'Identify Now',
      recommended: true
    },
    {
      id: 'edu432-qa',
      title: 'EDU 432: Quality Assurance',
      description: 'Get quiz answers, exam questions, and study material specifically for EDU 432.',
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      color: 'emerald',
      action: 'Start Learning',
      recommended: true
    },
    {
      id: 'image-to-pdf',
      title: 'Convert to PDF',
      description: 'Convert your uploaded photos (max 50 images) or text directly into a PDF document.',
      icon: <FileOutput className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      action: 'Convert Now',
      recommended: true
    },
    {
      id: 'assignment-writer',
      title: 'Assignment Writer',
      description: 'Generate high-quality, plagiarism-free academic assignments with proper structure and citations.',
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      color: 'indigo',
      action: 'Write Assignment',
      recommended: true
    },
    {
      id: 'quiz-writer',
      title: 'Quiz Solver',
      description: 'Get simple, understandable answers for objective and theory quiz questions instantly.',
      icon: <BrainCircuit className="w-6 h-6 text-pink-500" />,
      color: 'pink',
      action: 'Solve Quiz'
    },
    {
      id: 'past-questions',
      title: 'Past Question Generator',
      description: 'Generate authentic UNN & NOCEN CBT-style past questions for any course. Download as PDF.',
      icon: <FileQuestion className="w-6 h-6 text-orange-500" />,
      color: 'orange',
      action: 'Get Questions',
      recommended: true
    },
    {
      id: 'exam-predictor',
      title: 'Exam Question Predictor',
      description: 'Generate high-probability CBT (70 questions) and Theory (10 questions) based on your syllabus.',
      icon: <Target className="w-6 h-6 text-red-500" />,
      color: 'red',
      action: 'Predict Exams'
    },
    {
      id: 'perfect-exam-answer',
      title: 'Perfect Exam Answer',
      description: 'Generate structured, high-scoring answers to impress your lecturers.',
      icon: <PenTool className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      action: 'Write Answer'
    },
    {
      id: 'textbook-to-questions',
      title: 'Textbook to Questions',
      description: 'Convert textbook chapters or notes into possible exam questions (Objective & Theory).',
      icon: <Book className="w-6 h-6 text-teal-500" />,
      color: 'teal',
      action: 'Convert Now'
    },
    {
      id: 'cram-sheet-creator',
      title: 'Fast Revision Cram Sheet',
      description: 'Condense your notes into a one-page cheat sheet with formulas, dates, and definitions.',
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      color: 'yellow',
      action: 'Create Sheet'
    },
    {
      id: 'memory-hack',
      title: 'Memory Hack Generator',
      description: 'Boost retention with mnemonics, memory palaces, and cognitive tricks for any topic.',
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      color: 'purple',
      action: 'Get Hacks'
    },
    {
      id: 'food-budget-planner',
      title: 'Student Food Budget',
      description: 'Plan meals, get shopping lists, and cooking tutorials based on your budget amount.',
      icon: <ChefHat className="w-6 h-6 text-orange-500" />,
      color: 'orange',
      action: 'Plan Budget'
    },
    {
      id: 'cheap-food-finder',
      title: 'Cheap Food Finder',
      description: 'Find the most affordable food spots near you with addresses and prices.',
      icon: <Utensils className="w-6 h-6 text-orange-400" />,
      color: 'orange',
      action: 'Find Food'
    },
    {
      id: 'accommodation-finder',
      title: 'Accommodation Finder',
      description: 'Find lodges, self-cons, and flats near your school with prices and contacts.',
      icon: <Home className="w-6 h-6 text-purple-500" />,
      color: 'purple',
      action: 'Find Lodge'
    },
    {
      id: 'business-demand',
      title: 'Business Demand Detector',
      description: 'Find out exactly what students in your school are willing to pay for right now.',
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      color: 'emerald',
      action: 'Analyze Market'
    },
    {
      id: 'emergency-survival',
      title: 'Emergency Survival Planner',
      description: 'Broke? Stranded? Get a strategy to survive until your next allowance.',
      icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
      color: 'red',
      action: 'Survive Now'
    },
    {
      id: 'situation-escaper',
      title: 'Situation Escaper',
      description: 'Stuck in a mess? Get a step-by-step plan to get out of trouble safely.',
      icon: <Footprints className="w-6 h-6 text-orange-500" />,
      color: 'orange',
      action: 'Escape Plan'
    },
    {
      id: 'presentation-maker',
      title: 'Presentation Maker',
      description: 'Get a slide-by-slide script to nail your next presentation and impress everyone.',
      icon: <Presentation className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      action: 'Create Script'
    },
    {
      id: 'paraphraser',
      title: 'Paraphraser & Humanizer',
      description: 'Rewrite content to sound natural, human, and bypass detection tools.',
      icon: <Feather className="w-6 h-6 text-purple-500" />,
      color: 'purple',
      action: 'Humanize Text'
    },
    {
      id: 'cv-builder',
      title: 'CV & Statement Builder',
      description: 'Create professional CVs and Personal Statements for SIWES, Internships, and NYSC.',
      icon: <Briefcase className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      action: 'Build Now'
    },
    {
      id: 'study-timetable',
      title: 'Study Timetable',
      description: 'Create a balanced, effective study schedule tailored to your courses and time.',
      icon: <Calendar className="w-6 h-6 text-teal-500" />,
      color: 'teal',
      action: 'Generate Schedule'
    },
    {
      id: 'scholarship-finder',
      title: 'Scholarship Finder',
      description: 'Find scholarships tailored to your CGPA, course, and level (Nigeria-focused).',
      icon: <GraduationCap className="w-6 h-6 text-yellow-500" />,
      color: 'yellow',
      action: 'Find Opportunities'
    },
    {
      id: 'carryover-calculator',
      title: 'Carryover Impact',
      description: 'Visualize how failed courses affect your final CGPA and plan your recovery.',
      icon: <TrendingDown className="w-6 h-6 text-red-500" />,
      color: 'red',
      action: 'Calculate Impact'
    },
    {
      id: 'side-hustle',
      title: 'Side Hustle Generator',
      description: 'Discover profitable business ideas based on your skills, course, and location.',
      icon: <DollarSign className="w-6 h-6 text-green-500" />,
      color: 'green',
      action: 'Get Ideas'
    },
    {
      id: 'content-creation-ideas',
      title: 'Content Creation Income',
      description: 'Turn your skills and interests into a profitable content creation side hustle.',
      icon: <Video className="w-6 h-6 text-pink-500" />,
      color: 'pink',
      action: 'Start Creating'
    },
    {
      id: 'note-summarizer',
      title: 'Note Summarizer',
      description: 'Turn lengthy lecture notes into simplified summaries and exam prep material.',
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      color: 'yellow',
      action: 'Summarize'
    },
    {
      id: 'job-finder',
      title: 'Job Finder',
      description: 'Find current available jobs in your preferred state with contact details and company info.',
      icon: <Briefcase className="w-6 h-6 text-blue-400" />,
      color: 'blue',
      action: 'Find Jobs'
    }
  ];

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Student Services</h1>
          <p className="text-slate-400">Tools and utilities to help you succeed in your academic journey.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate(service.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-slate-600 transition-all group flex flex-col relative overflow-hidden"
            >
              {service.recommended && (
                <div className="absolute top-0 right-0">
                  <div className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                    Recommended
                  </div>
                </div>
              )}
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="text-slate-400 text-sm mb-4 flex-1">
                {service.description}
              </p>
              <div className="flex items-center text-slate-300 text-sm font-medium group-hover:text-white transition-colors">
                {service.action} <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </motion.div>
          ))}

          {/* Coming Soon Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 opacity-75">
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
              <School className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">More Coming Soon</h3>
            <p className="text-slate-500 text-sm">
              We are working on adding more student services like Transcript Request and Course Registration Assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

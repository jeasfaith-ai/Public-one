import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, CheckCircle2, BookOpen, PenTool, ShieldCheck, LayoutDashboard, Menu } from 'lucide-react';

interface TourProps {
  onComplete: () => void;
}

export default function Tour({ onComplete }: TourProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Stress No More!",
      description: "Your all-in-one academic companion for UNN students. Let's take a quick tour to help you get started.",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      color: "emerald"
    },
    {
      title: "Generate Project Topics",
      description: "Struggling with a topic? Stress no more will help you find approved, department-specific research topics in seconds.",
      icon: <BookOpen className="w-12 h-12 text-blue-500" />,
      color: "blue"
    },
    {
      title: "Write Your Project",
      description: "From Chapter 1 to References, Stress no more handles your entire project following strict UNN Faculty of Education guidelines.",
      icon: <PenTool className="w-12 h-12 text-purple-500" />,
      color: "purple"
    },
    {
      title: "Defense Coach",
      description: "Prepare for your defense with a personalized script and potential Q&A prepared specifically for your topic.",
      icon: <ShieldCheck className="w-12 h-12 text-orange-500" />,
      color: "orange"
    },
    {
      title: "Academic Excellence",
      description: "Boost your grades with our Quiz Solver, Assignment Writer, Exam Predictor, and Note Summarizer tools.",
      icon: <LayoutDashboard className="w-12 h-12 text-pink-500" />,
      color: "pink"
    },
    {
      title: "Student Life",
      description: "Navigate campus life easily with our Cheap Food Finder, Accommodation Search, and Student Budget Planner.",
      icon: <LayoutDashboard className="w-12 h-12 text-cyan-500" />,
      color: "cyan"
    },
    {
      title: "You're All Set!",
      description: "Explore the platform and stress no more about your academic journey. Good luck!",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      color: "emerald"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-${currentStep.color}-500/10 rounded-full blur-3xl transition-colors duration-500`} />
        
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`w-20 h-20 bg-${currentStep.color}-500/10 rounded-2xl flex items-center justify-center mb-6 border border-${currentStep.color}-500/20 transition-colors duration-500`}>
            {currentStep.icon}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="flex items-center justify-between w-full">
            <div className="flex space-x-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === step ? `w-8 bg-${currentStep.color}-500` : 'w-2 bg-slate-800'}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className={`px-6 py-3 bg-${currentStep.color}-600 hover:bg-${currentStep.color}-500 text-white rounded-xl font-bold transition-all flex items-center shadow-lg shadow-${currentStep.color}-500/20`}
            >
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

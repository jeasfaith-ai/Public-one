import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { generateContentWithRetry } from '../utils/gemini';

interface TopicGeneratorProps {
  key?: string;
  onSelectTopic: (topic: string, department: string) => void;
  onBack: () => void;
}

export default function TopicGenerator({ onSelectTopic, onBack }: TopicGeneratorProps) {
  const [selectedDept, setSelectedDept] = useState('');
  const [interest, setInterest] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);

  const generateTopics = async () => {
    if (!selectedDept) return;
    
    setIsGenerating(true);
    try {
      // Add a bit of randomness to the prompt to force variety
      const randomSeed = Math.random().toString(36).substring(7);
      const prompt = `Generate 5 simple, clear final year project topics for a student in ${selectedDept}. 
      ${interest ? `Interest: ${interest}.` : ''}
      
      RULES:
      1. Simple English. No jargon.
      2. Format: "The Impact of X on Y in Z".
      3. Context: Anambra/Enugu State, Nigeria.
      4. Feasible for undergraduates.
      5. APA 7th style.
      
      Randomness: ${randomSeed}
      
      OUTPUT: ONLY the numbered list of 5 topics. No intro/outro.`;

      const text = await generateContentWithRetry("gemini-3-flash-preview", prompt);
      
      // Clean AI thoughts
      const cleanedText = text
        .replace(/^(here are|certainly|sure|i have|this is|i've generated|let me know|hope this helps|good luck|as an ai|i will generate).*$/gim, '')
        .trim();

      // Parse the numbered list
      const generatedTopics = cleanedText.split(/\d+\./).map(t => t.trim()).filter(t => t.length > 0);
      setTopics(generatedTopics);
    } catch (error: any) {
      console.error("Error generating topics:", error);
      setTopics([
        `Error: ${error.message || "Unknown error occurred."}`,
        `Details: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`,
        "Please check your internet connection and try again."
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 sm:p-6 md:p-12 max-w-4xl mx-auto bg-[#0f172a]"
    >
      <button 
        onClick={onBack}
        className="flex items-center text-slate-400 hover:text-emerald-500 transition-colors mb-6 sm:mb-8 text-sm sm:text-base"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </button>

      <div className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-4">Generate Project Topics</h2>
          <p className="text-sm sm:text-base text-slate-400">
            Select your department and optional area of interest to get tailored project topics.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 bg-slate-900 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-800">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Department</label>
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Area of Interest (Optional)</label>
            <input 
              type="text"
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              placeholder="e.g., Digital Learning, Rural Education, etc."
              className="w-full p-3 rounded-lg border border-slate-700 bg-slate-950 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
          </div>

          <button
            onClick={generateTopics}
            disabled={!selectedDept || isGenerating}
            className="flex items-center justify-center w-full py-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Topics
              </>
            )}
          </button>
        </div>

        {topics.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Suggested Topics</h3>
            <div className="grid gap-4">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => onSelectTopic(topic, selectedDept)}
                  className="text-left p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-900/30 text-emerald-400 font-medium text-xs sm:text-sm mr-3 sm:mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      {index + 1}
                    </span>
                    <span className="text-sm sm:text-base text-slate-300 group-hover:text-white font-medium pt-0.5 sm:pt-1">
                      {topic}
                    </span>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

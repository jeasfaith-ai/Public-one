import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { generateProjectContentStream } from '../utils/gemini';
import { ProjectDetails, ProjectContent } from '../types';
import { INITIAL_PROJECT_CONTENT } from '../constants';
import { clientFetch } from '../utils/api';

interface ProjectWriterProps {
  key?: string;
  details: ProjectDetails;
  onContentGenerated: (content: ProjectContent, project?: any) => void;
  onBack: () => void;
  onNavigate: (step: any) => void;
  userId: string;
  projectId?: string;
}

export default function ProjectWriter({ details, onContentGenerated, onBack, projectId }: ProjectWriterProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Initializing Stress no more...");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // Use a ref to accumulate content to avoid closure staleness in the async loop
  const contentRef = useRef<ProjectContent>({ ...INITIAL_PROJECT_CONTENT });
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const generate = async () => {
      try {
        for await (const update of generateProjectContentStream(details)) {
          setProgress(update.progress);
          setMessage(update.message);
          
          if (update.section && update.content && update.section !== 'done') {
            // Update the specific section in our content object
            contentRef.current = {
              ...contentRef.current,
              [update.section]: update.content
            };
          }
        }
        
        // Save the generated content to the backend immediately
        if (projectId) {
          setMessage("Saving your project...");
          try {
            await clientFetch(`/api/projects/${projectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                topic: details.topic,
                content: contentRef.current,
                details: details
              })
            });
            console.log("Project content saved automatically after generation.");
            setMessage("Project saved successfully!");
          } catch (saveError) {
            console.error("Failed to auto-save project content:", saveError);
            setMessage("Project generated, but auto-save failed. Please save manually.");
          }
        }

        setIsComplete(true);
        // Small delay to show 100% before moving on
        setTimeout(() => {
          onContentGenerated(contentRef.current);
        }, 1000);

      } catch (err: any) {
        console.error("Generation Error:", err);
        setError(err.message || 'Failed to generate project content. Please try again.');
      }
    };

    generate();
  }, [details, onContentGenerated, projectId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Generation Failed</h2>
        <p className="text-slate-400 mb-6 max-w-md">{error}</p>
        <button 
          onClick={onBack} 
          className="flex items-center px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back & Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
      {isComplete ? (
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
      ) : (
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
      )}
      
      <h2 className="text-2xl font-bold text-white mb-2">
        {isComplete ? "Project Completed!" : "STRESS NO MORE is writing..."}
      </h2>
      
      <p className="text-slate-400 mb-8 min-h-[24px]">
        {message}
      </p>

      <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden mb-2 border border-slate-700">
        <motion.div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="flex justify-between w-full text-xs text-slate-500 font-mono">
        <span>0%</span>
        <span>{Math.round(progress)}%</span>
        <span>100%</span>
      </div>

      <div className="mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-800 text-sm text-slate-400 max-w-lg">
        <p>Tip: Writing a full academic project takes time. Please do not close this window.</p>
      </div>
    </div>
  );
}

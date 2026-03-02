import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { ProjectDetails } from '../types';

interface ProjectFormProps {
  key?: string;
  details: ProjectDetails;
  onUpdateDetails: (details: ProjectDetails) => void;
  onNext: () => void;
  onBack: () => void;
  isWriting: boolean;
}

export default function ProjectForm({ details, onUpdateDetails, onNext, onBack, isWriting }: ProjectFormProps) {
  const handleChange = (field: keyof ProjectDetails, value: any) => {
    onUpdateDetails({ ...details, [field]: value });
  };

  const isValid = details.topic && details.department && details.surname && details.firstName && details.regNo;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 sm:p-6 md:p-8 max-w-2xl mx-auto pb-24 sm:pb-32"
    >
      <button 
        onClick={onBack}
        className="flex items-center text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors mb-6 sm:mb-8"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
        <span className="text-sm sm:text-lg">Back</span>
      </button>

      <div className="mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">Project Details</h2>
        <p className="text-base sm:text-lg text-white">
          Enter the details for your project cover page and documentation.
        </p>
      </div>

      <div className="bg-[#0f172a] p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Project Topic</label>
          <textarea 
            value={details.topic} 
            onChange={(e) => handleChange('topic', e.target.value)} 
            className="input-field min-h-[100px]" 
            placeholder="Enter your approved project topic..." 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Department</label>
          <select 
            value={details.department} 
            onChange={(e) => handleChange('department', e.target.value)} 
            className="input-field"
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">University Name</label>
          <input 
            type="text" 
            value={details.university} 
            onChange={(e) => handleChange('university', e.target.value)} 
            className="input-field" 
            placeholder="UNIVERSITY OF NIGERIA, NSUKKA" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Faculty</label>
          <input 
            type="text" 
            value={details.faculty} 
            onChange={(e) => handleChange('faculty', e.target.value)} 
            className="input-field" 
            placeholder="EDUCATION" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Academic Session</label>
          <input 
            type="text" 
            value={details.session} 
            onChange={(e) => handleChange('session', e.target.value)} 
            className="input-field" 
            placeholder="2025/2026" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Submission Date (Month, Year)</label>
          <input 
            type="text" 
            value={details.submissionDate} 
            onChange={(e) => handleChange('submissionDate', e.target.value)} 
            className="input-field" 
            placeholder="NOVEMBER 2022" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Appendix Date (Specific Date)</label>
          <input 
            type="text" 
            value={details.appendixDate} 
            onChange={(e) => handleChange('appendixDate', e.target.value)} 
            className="input-field" 
            placeholder="3rd November, 2022" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Appendix Address (Researcher's Address Block)</label>
          <textarea 
            value={details.appendixAddress} 
            onChange={(e) => handleChange('appendixAddress', e.target.value)} 
            className="input-field min-h-[120px]" 
            placeholder="Department of Political Science,..." 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Study Location (State, LGA, Town)</label>
          <input 
            type="text" 
            value={details.studyLocation} 
            onChange={(e) => handleChange('studyLocation', e.target.value)} 
            className="input-field" 
            placeholder="Anambra State, Oyi LGA, Nteje" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Surname</label>
          <input 
            type="text" 
            value={details.surname} 
            onChange={(e) => handleChange('surname', e.target.value)} 
            className="input-field" 
            placeholder="ACHUFUSI" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">First Name</label>
          <input 
            type="text" 
            value={details.firstName} 
            onChange={(e) => handleChange('firstName', e.target.value)} 
            className="input-field" 
            placeholder="JANE" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Middle Name</label>
          <input 
            type="text" 
            value={details.middleName} 
            onChange={(e) => handleChange('middleName', e.target.value)} 
            className="input-field" 
            placeholder="NWAKAEGO" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Researcher Name (Student Name)</label>
          <input 
            type="text" 
            value={details.researcherName} 
            onChange={(e) => handleChange('researcherName', e.target.value)} 
            className="input-field" 
            placeholder="JANE NWAKAEGO ACHUFUSI" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Registration Number</label>
          <input 
            type="text" 
            value={details.regNo} 
            onChange={(e) => handleChange('regNo', e.target.value)} 
            className="input-field" 
            placeholder="2022632016" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Supervisor Name</label>
          <input 
            type="text" 
            value={details.supervisorName} 
            onChange={(e) => handleChange('supervisorName', e.target.value)} 
            className="input-field" 
            placeholder="Prof./Dr. Name" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Head of Department</label>
          <input 
            type="text" 
            value={details.headOfDepartment} 
            onChange={(e) => handleChange('headOfDepartment', e.target.value)} 
            className="input-field" 
            placeholder="Prof./Dr. Name" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Dean, Faculty of Education</label>
          <input 
            type="text" 
            value={details.deanOfFaculty} 
            onChange={(e) => handleChange('deanOfFaculty', e.target.value)} 
            className="input-field" 
            placeholder="Prof. J.C. Omeje" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Dedication</label>
          <textarea 
            value={details.dedication} 
            onChange={(e) => handleChange('dedication', e.target.value)} 
            className="input-field min-h-[100px]" 
            placeholder="I dedicate this work to... (Leave empty for system to write)" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Acknowledgement</label>
          <textarea 
            value={details.acknowledgement} 
            onChange={(e) => handleChange('acknowledgement', e.target.value)} 
            className="input-field min-h-[100px]" 
            placeholder="I wish to acknowledge... (Leave empty for system to write)" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Preferred Figure Type (Chapter 4)</label>
          <select 
            value={details.figureType} 
            onChange={(e) => handleChange('figureType', e.target.value)} 
            className="input-field"
          >
            <option value="Bar Chart">Bar Chart</option>
            <option value="Diagram">Diagram</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Abstract Length</label>
          <input 
            type="text" 
            value={details.abstractLength || ''} 
            onChange={(e) => handleChange('abstractLength', e.target.value)} 
            className="input-field" 
            placeholder="e.g., 18 lines or 250 words (Default: 18 lines)" 
          />
        </div>
      </div>

      <div className="flex justify-end mt-6 sm:mt-8">
        <button
          onClick={onNext}
          disabled={!isValid || isWriting}
          className="flex items-center justify-center w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-1"
        >
          {isWriting ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span>Project writer is thinking...</span>
            </div>
          ) : (
            <>
              Start Writing
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
            </>
          )}
        </button>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #334155;
          background-color: #1e293b;
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #6ee7b7;
          box-shadow: 0 0 0 1px #6ee7b7;
        }
        .input-field::placeholder {
          color: #64748b;
        }
      `}</style>
    </motion.div>
  );
}

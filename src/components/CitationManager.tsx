import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Book, Globe, FileText, X, Save } from 'lucide-react';
import { Citation } from '../types';

interface CitationManagerProps {
  citations: Citation[];
  onUpdate: (citations: Citation[]) => void;
  onClose: () => void;
}

export default function CitationManager({ citations, onUpdate, onClose }: CitationManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCitation, setNewCitation] = useState<Partial<Citation>>({
    type: 'book',
    author: '',
    year: '',
    title: '',
    source: ''
  });

  const handleAdd = () => {
    if (!newCitation.author || !newCitation.title) return;
    
    const citation: Citation = {
      id: Math.random().toString(36).substr(2, 9),
      author: newCitation.author || '',
      year: newCitation.year || '',
      title: newCitation.title || '',
      source: newCitation.source || '',
      type: newCitation.type as any || 'book'
    };

    onUpdate([...citations, citation]);
    setIsAdding(false);
    setNewCitation({ type: 'book', author: '', year: '', title: '', source: '' });
  };

  const handleDelete = (id: string) => {
    onUpdate(citations.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
      >
        <div className="p-6 border-bottom border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Book className="w-5 h-5 mr-2 text-emerald-500" />
            Citation Manager
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Citation Form */}
          <AnimatePresence>
            {isAdding ? (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 uppercase">Type</label>
                    <select 
                      value={newCitation.type}
                      onChange={e => setNewCitation({...newCitation, type: e.target.value as any})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                    >
                      <option value="book">Book</option>
                      <option value="journal">Journal Article</option>
                      <option value="web">Website</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400 uppercase">Year</label>
                    <input 
                      type="text"
                      placeholder="e.g. 2023"
                      value={newCitation.year}
                      onChange={e => setNewCitation({...newCitation, year: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase">Author(s)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Smith, J. & Doe, A."
                    value={newCitation.author}
                    onChange={e => setNewCitation({...newCitation, author: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase">Title</label>
                  <input 
                    type="text"
                    placeholder="Title of the work"
                    value={newCitation.title}
                    onChange={e => setNewCitation({...newCitation, title: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400 uppercase">Source / Publisher / URL</label>
                  <input 
                    type="text"
                    placeholder="e.g. Oxford Press or https://example.com"
                    value={newCitation.source}
                    onChange={e => setNewCitation({...newCitation, source: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Citation
                  </button>
                </div>
              </motion.div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Citation
              </button>
            )}
          </AnimatePresence>

          {/* Citation List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Your Citations ({citations.length})</h3>
            {citations.length === 0 ? (
              <div className="text-center py-12 text-slate-500 italic">
                No citations added yet.
              </div>
            ) : (
              citations.map((citation) => (
                <div 
                  key={citation.id}
                  className="bg-slate-800/30 p-4 rounded-xl border border-slate-700 flex items-start group"
                >
                  <div className="p-2 bg-slate-800 rounded-lg mr-4">
                    {citation.type === 'book' && <Book className="w-4 h-4 text-blue-400" />}
                    {citation.type === 'journal' && <FileText className="w-4 h-4 text-purple-400" />}
                    {citation.type === 'web' && <Globe className="w-4 h-4 text-emerald-400" />}
                    {citation.type === 'other' && <Plus className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {citation.author} ({citation.year})
                    </p>
                    <p className="text-slate-400 text-xs italic truncate">
                      {citation.title}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-1">
                      {citation.source}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(citation.id)}
                    className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
          <p className="text-xs text-slate-500 text-center">
            Citations will be automatically formatted in APA style in the final PDF.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { clientFetch } from '../utils/api';
import { UserContext } from '../App';

interface SignupProps {
  key?: string;
  onSignup: (user: any) => void;
  onLogin: () => void;
  onBack: () => void;
}

export default function Signup({ onSignup, onLogin, onBack }: SignupProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    department: '',
    regNo: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await clientFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      localStorage.setItem('token', data.token);
      onSignup(data.user);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden py-12 transition-colors">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center text-slate-400 hover:text-emerald-500 transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        <span className="font-medium">Back to Home</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-slate-800 mx-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform -rotate-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Start Your Journey</h2>
          <p className="text-slate-400 mt-2">Create your student account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm mb-6 flex items-center justify-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Full Name</label>
            <input
              required
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="Okeke Maryjane Chidimma"
            />
            <p className="text-xs text-slate-500 mt-1 ml-1">Enter your name as it appears on school records</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="Enter a valid email address"
            />
            <p className="text-xs text-slate-500 mt-1 ml-1">We'll send important updates here</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Department</label>
              <select
                required
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              >
                <option value="">Select Dept</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Gender</label>
              <select
                required
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Reg No</label>
            <input
              required
              value={formData.regNo}
              onChange={e => setFormData({...formData, regNo: e.target.value})}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="2022832829"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-1 ml-1">Create a strong password</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400">
            Already have an account?{' '}
            <button 
              onClick={onLogin}
              className="text-emerald-500 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

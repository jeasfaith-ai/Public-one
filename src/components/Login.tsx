import React, { useState, useContext } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { clientFetch } from '../utils/api';
import { UserContext } from '../App';

interface LoginProps {
  key?: string;
  onLogin: (user: any) => void;
  onSignup: () => void;
  onBack: () => void;
}

export default function Login({ onLogin, onSignup, onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await clientFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('token', data.token);
      onLogin(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden transition-colors">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl" />
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
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform rotate-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-slate-400 mt-2">Continue your academic journey</p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl text-sm mb-6 flex items-center justify-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="Enter your registered email address"
            />
            <p className="text-xs text-slate-500 mt-1 ml-1">Use your university email if available</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white"
              placeholder="••••••••"
            />
            <p className="text-xs text-slate-500 mt-1 ml-1">Must be at least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-400">
            Don't have an account?{' '}
            <button 
              onClick={onSignup}
              className="text-emerald-500 font-bold hover:underline"
            >
              Create Account
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

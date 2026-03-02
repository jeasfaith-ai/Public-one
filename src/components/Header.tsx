import { useContext, useState, useEffect } from 'react';
import { GraduationCap, Wallet, Plus, LogOut, User, Bell, Check } from 'lucide-react';
import { UserContext } from '../App';
import { GenerationStep } from '../types';
import { clientFetch } from '../utils/api';

interface HeaderProps {
  onNavigate: (step: GenerationStep | 'home' | 'login' | 'signup' | 'dashboard' | 'admin' | 'support' | 'editor' | 'topup' | 'services' | 'notifications') => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { user, setUser, logout } = useContext(UserContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await clientFetch('/api/notifications');
      const contentType = res.headers.get("content-type");
      
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
      } else if (!res.ok) {
        console.error('Failed to fetch notifications:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await clientFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  if (!user) return null;

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
          <GraduationCap className="w-8 h-8 text-emerald-500" />
          <span className="text-lg font-bold text-white hidden sm:block uppercase">Stress No More</span>
        </div>

        <nav className="hidden md:flex items-center space-x-6 mx-4">
          <button 
            id="dashboard-nav-desktop"
            onClick={() => onNavigate('dashboard')}
            className="text-sm font-medium text-slate-400 hover:text-emerald-500 transition-colors"
          >
            Dashboard
          </button>
          <button 
            id="support-nav-desktop"
            onClick={() => onNavigate('support')}
            className="text-sm font-medium text-slate-400 hover:text-emerald-500 transition-colors"
          >
            Support
          </button>
          <button 
            id="services-nav-desktop"
            onClick={() => onNavigate('services')}
            className="text-sm font-medium text-slate-400 hover:text-emerald-500 transition-colors"
          >
            Services
          </button>
        </nav>

        <div className="flex items-center space-x-3 md:space-x-4">
          <div id="wallet-balance" className="flex items-center bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <Wallet className="w-4 h-4 text-emerald-500 mr-2" />
            <span className="text-sm font-bold text-slate-200">₦{(user.balance || 0).toLocaleString()}</span>
            <button 
              onClick={() => onNavigate('topup')}
              className="ml-2 p-1 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
              title="Top up wallet"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => onNavigate('notifications')}
              className="p-2 text-slate-400 hover:text-emerald-500 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f172a]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <div id="user-profile" className="flex items-center space-x-2 border-l border-slate-800 pl-4">
            {user.hasFreeAccess && (
              <span className="hidden md:block px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                Premium
              </span>
            )}
            <button 
              onClick={() => onNavigate('dashboard')}
              className="w-8 h-8 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-900/50 transition-colors"
            >
              <User className="w-4 h-4" />
            </button>
            <button 
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Bell, Check, Trash2, Info, CreditCard, Megaphone } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';

export default function NotificationsPage({ onBack }: { key?: string; onBack: () => void }) {
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await clientFetch('/api/notifications');
      const contentType = res.headers.get("content-type");

      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else if (!res.ok) {
        console.error('Failed to fetch notifications:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await clientFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'announcement': return <Megaphone className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col"
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 h-16 sm:h-20 flex items-center gap-3 sm:gap-4">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 animate-pulse">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
              <p className="text-slate-500 text-sm">You don't have any notifications at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  !n.read 
                    ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30 shadow-sm' 
                    : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                }`}
                onClick={() => !n.read && markAsRead(n.id)}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !n.read ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className={`font-bold text-xs sm:text-sm truncate ${!n.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                        {n.title}
                      </h4>
                      {!n.read && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                    <p className={`text-xs sm:text-sm leading-relaxed ${!n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 sm:mt-3">
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-medium">
                        {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!n.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

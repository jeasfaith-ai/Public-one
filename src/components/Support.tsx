import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, User as UserIcon, Loader2 } from 'lucide-react';
import { UserContext } from '../App';
import { clientFetch } from '../utils/api';

export default function Support() {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clientFetch('/api/support/support-contact')
      .then(res => res.ok ? res.json() : { adminId: null })
      .then(data => setAdminId(data.adminId))
      .catch(err => console.error('Error fetching support contact:', err));
  }, []);

  useEffect(() => {
    if (!adminId || !user) return;

    const fetchMessages = () => {
      clientFetch(`/api/support/messages/${adminId}`, {
        headers: { 'x-user-id': user.id.toString() }
      })
        .then(res => res.json())
        .then(data => {
          setMessages(data.messages);
          // Mark as read
          clientFetch('/api/support/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, senderId: adminId })
          });
        });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [adminId, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId) return;

    const content = newMessage;
    setNewMessage('');

    await clientFetch('/api/support/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: adminId,
        content
      })
    });

    // Optimistic update or wait for poll
    const newMsg = {
      id: Date.now(),
      senderId: user.id,
      receiverId: adminId,
      content,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-[calc(100vh-120px)] sm:h-[calc(100vh-80px)] flex flex-col transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 shadow-sm flex items-center shrink-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 shrink-0">
          <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">Customer Support</h2>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">We typically reply within a few minutes</p>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-2 sm:p-3 rounded-2xl ${
                msg.senderId === user.id
                  ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm sm:text-base">{msg.content}</p>
              <span className={`text-[10px] block mt-1 ${msg.senderId === user.id ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-b-2xl border-t border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 sm:p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

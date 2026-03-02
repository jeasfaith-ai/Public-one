import { useState, useEffect } from 'react';
import { clientFetch } from '../utils/api';
import { Loader2, Check, X } from 'lucide-react';

export default function TopUpRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await clientFetch('/api/admin/topup');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await clientFetch(`/api/admin/topup/${id}/approve`, { method: 'POST' });
      fetchRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
      setError('Failed to approve request. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await clientFetch(`/api/admin/topup/${id}/reject`, { method: 'POST' });
      fetchRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError('Failed to reject request. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-red-600 p-8">{error}</div>;
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Top-up Requests</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-0">Review and approve user payments.</p>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No pending requests.</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="py-2 px-3 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                <th className="py-2 px-3 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Bank</th>
                <th className="py-2 px-3 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Transaction ID</th>
                <th className="py-2 px-3 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="py-2 px-3 text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td className="py-3 px-3 text-xs text-slate-900 dark:text-white">
                    <div className="font-medium">{req.name}</div>
                    <div className="text-slate-500 text-[10px] truncate max-w-[120px]">{req.email}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">{req.bank}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:table-cell">{req.transaction_id}</td>
                  <td className="py-3 px-3 whitespace-nowrap text-xs font-bold text-emerald-600 dark:text-emerald-400">₦{req.amount.toLocaleString()}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex space-x-1 sm:space-x-2">
                      <button onClick={() => handleApprove(req.id)} className="p-1.5 sm:p-2 bg-emerald-100 text-emerald-700 rounded-lg sm:rounded-full hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleReject(req.id)} className="p-1.5 sm:p-2 bg-red-100 text-red-700 rounded-lg sm:rounded-full hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

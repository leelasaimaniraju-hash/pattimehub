import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ActivityLog } from '../../types';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Activity } from 'lucide-react';

export const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'activityLogs'));
        const loaded: ActivityLog[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as ActivityLog));
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLogs(loaded);
      } catch (err) {
        console.error('Error fetching activity logs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <DashboardLayout title="System Activity Logs" subtitle="Platform audit trail for security & activity tracking">
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{log.actorName}</td>
                    <td className="p-4 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold uppercase">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-indigo-600">{log.action}</td>
                    <td className="p-4 text-slate-600">{log.description}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No activity logs recorded yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

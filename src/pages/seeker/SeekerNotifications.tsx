import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';

export const SeekerNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'notifications'),
          where('recipientUid', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const loaded: NotificationItem[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as NotificationItem));
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(loaded);
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifs();
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.isRead) {
          batch.update(doc(db, 'notifications', n.notificationId), { isRead: true });
        }
      });
      await batch.commit();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <DashboardLayout title="In-App Notifications" subtitle="Real-time application status updates and job alerts">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-700">
            {notifications.filter((n) => !n.isRead).length} Unread Notifications
          </span>

          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        </div>

        {loading ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.notificationId}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  n.isRead ? 'bg-white border-slate-200' : 'bg-indigo-50/60 border-indigo-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{n.title}</span>
                    {!n.isRead && (
                      <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.notificationId)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No notifications at this time.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

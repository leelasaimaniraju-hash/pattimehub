import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmployerProfile } from '../../types';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Building2, CheckCircle2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export const ManageEmployers: React.FC = () => {
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployers() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'employers'));
        const loaded: EmployerProfile[] = [];
        snap.forEach((doc) => loaded.push(doc.data() as EmployerProfile));
        setEmployers(loaded);
      } catch (err) {
        console.error('Error fetching employers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployers();
  }, []);

  const handleToggleVerification = async (uid: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'verified' ? 'pending' : 'verified';
    try {
      await updateDoc(doc(db, 'employers', uid), {
        verificationStatus: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      setEmployers((prev) =>
        prev.map((e) => (e.employerId === uid ? { ...e, verificationStatus: nextStatus as any } : e))
      );
    } catch (err) {
      console.error('Error updating verification status:', err);
    }
  };

  return (
    <DashboardLayout title="Manage Employer Accounts" subtitle="Verify registered local businesses and company profiles">
      {loading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40"></div>
      ) : employers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="p-4">Company Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Verification Status</th>
                  <th className="p-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employers.map((emp) => (
                  <tr key={emp.employerId} className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div>{emp.companyName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{emp.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{emp.category}</td>
                    <td className="p-4 text-slate-600">{emp.phone}</td>
                    <td className="p-4">
                      <StatusBadge status={emp.verificationStatus} type="employer" />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleVerification(emp.employerId, emp.verificationStatus)}
                        className={`px-3 py-1.5 rounded-xl font-semibold text-xs border ${
                          emp.verificationStatus === 'verified'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-600 text-white border-emerald-600'
                        }`}
                      >
                        {emp.verificationStatus === 'verified' ? 'Revoke Verification' : 'Verify Company'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No registered employer accounts found.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

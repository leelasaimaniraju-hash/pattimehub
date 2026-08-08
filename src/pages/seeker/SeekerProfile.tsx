import React from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit, Sparkles, CheckCircle2 } from 'lucide-react';

export const SeekerProfile: React.FC = () => {
  const { userProfile, userLocation } = useAuth();

  return (
    <DashboardLayout title="Job Seeker Profile" subtitle="Your candidate profile visible to local employers">
      <div className="max-w-3xl space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shadow-indigo-200">
                {userProfile?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{userProfile?.fullName}</h2>
                <span className="inline-flex items-center text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium mt-1">
                  Job Seeker Account
                </span>
              </div>
            </div>

            <Link
              to="/seeker/profile/edit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-center shadow-sm"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-900">{userProfile?.email}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-900">{userProfile?.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 sm:col-span-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <div>
                <span className="text-slate-400 block font-medium">City / GPS Location</span>
                <span className="font-semibold text-slate-900">
                  {userProfile?.city || userLocation?.city || 'Default Location'}
                </span>
              </div>
            </div>
          </div>

          {/* About Bio */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-slate-900">About Me</h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {userProfile?.about || 'No bio added yet. Click edit profile to add a brief introduction for local employers.'}
            </p>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Skills</h3>
            {userProfile?.skills && userProfile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.skills.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No skills listed yet.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

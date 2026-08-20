import React, { useState } from 'react';
import { UserCheck, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const GoogleOnboardingModal: React.FC = () => {
  const { needsGoogleOnboarding, completeGoogleOnboarding, preferredGoogleRole, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(preferredGoogleRole || 'jobSeeker');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('Retail & Shopping');
  const [city, setCity] = useState('');

  // Update selectedRole when preferredGoogleRole changes
  React.useEffect(() => {
    if (preferredGoogleRole) {
      setSelectedRole(preferredGoogleRole);
    }
  }, [preferredGoogleRole]);

  if (!needsGoogleOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeGoogleOnboarding({
      role: selectedRole,
      phone,
      companyName,
      category,
      city,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <span className="inline-block p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3">
            <UserCheck className="w-8 h-8" />
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to Part Time Hub</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please choose how you plan to use Part Time Hub to complete your account setup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role selector cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('jobSeeker')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedRole === 'jobSeeker'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <UserCheck className={`w-6 h-6 mb-2 ${selectedRole === 'jobSeeker' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-semibold text-sm text-slate-900">Job Seeker</div>
                <div className="text-xs text-slate-500 mt-0.5">Find nearby part-time work</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('employer')}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedRole === 'employer'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <Building2 className={`w-6 h-6 mb-2 ${selectedRole === 'employer' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <div className="font-semibold text-sm text-slate-900">Employer</div>
                <div className="text-xs text-slate-500 mt-0.5">Post jobs & hire locally</div>
              </div>
            </button>
          </div>

          {/* Form fields based on role */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="(555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City / Locality</label>
              <input
                type="text"
                required
                placeholder="e.g., New York, NY"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {selectedRole === 'employer' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Shop Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Central Cafe & Bakery"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Industry Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="Retail & Shopping">Retail & Shopping</option>
                    <option value="Restaurant & Food Service">Restaurant & Food Service</option>
                    <option value="Delivery & Logistics">Delivery & Logistics</option>
                    <option value="Tutoring & Education">Tutoring & Education</option>
                    <option value="Event & Hospitality">Event & Hospitality</option>
                    <option value="Office & Administrative">Office & Administrative</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 disabled:opacity-60"
          >
            {loading ? 'Setting up Profile...' : 'Complete Profile'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

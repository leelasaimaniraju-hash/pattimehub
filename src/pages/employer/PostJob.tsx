import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LocationPicker } from '../../components/common/LocationPicker';
import { useAuth } from '../../context/AuthContext';
import { Job } from '../../types';
import { JOB_CATEGORIES, JOB_TYPES, getGeohashForCoords } from '../../utils/location';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PlusCircle, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const PostJob: React.FC = () => {
  const { currentUser, employerProfile, userProfile } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[1]); // Barista / Cafe
  const [jobType, setJobType] = useState(JOB_TYPES[0]); // Part-Time
  const [payAmount, setPayAmount] = useState<number>(18);
  const [payFrequency, setPayFrequency] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [workingDays, setWorkingDays] = useState('Mon - Fri');
  const [hoursPerDay, setHoursPerDay] = useState('4 - 6 hours');
  const [openings, setOpenings] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('Customer Service, Communication');
  const [requirementsInput, setRequirementsInput] = useState('Punctual, Reliable');

  // Location selection state
  const [locationName, setLocationName] = useState(employerProfile?.companyName || 'Store Location');
  const [address, setAddress] = useState(employerProfile?.address || '');
  const [latitude, setLatitude] = useState<number>(40.7128);
  const [longitude, setLongitude] = useState<number>(-74.0060);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      const jobId = `job_${Date.now()}`;
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const requirements = requirementsInput.split(',').map((r) => r.trim()).filter(Boolean);
      const geohash = getGeohashForCoords(latitude, longitude);

      const newJob: Job = {
        jobId,
        title,
        employerId: currentUser.uid,
        employerName: employerProfile?.companyName || userProfile?.fullName || 'Employer',
        category,
        jobType,
        payAmount: Number(payAmount),
        payFrequency,
        workingDays,
        hoursPerDay,
        openings: Number(openings),
        description,
        requiredSkills: skills,
        requirements,
        locationName,
        address,
        latitude,
        longitude,
        geohash,
        status: 'pending', // Awaiting admin review
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'jobs', jobId), newJob);

      // Create activity log
      await setDoc(doc(db, 'activityLogs', `log_${Date.now()}`), {
        logId: `log_${Date.now()}`,
        actorUid: currentUser.uid,
        actorRole: 'employer',
        actorName: employerProfile?.companyName || 'Employer',
        action: 'job_created',
        targetType: 'job',
        targetId: jobId,
        description: `Created new job listing: ${title}`,
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/employer/jobs'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Post a Part-Time Job" subtitle="Publish a location-targeted job vacancy">
      <div className="max-w-4xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              Job vacancy posted successfully! Submitted to admin queue for approval. Redirecting to job manager...
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Basic Job Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening Barista & Cashier"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  {JOB_CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type *</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  {JOB_TYPES.filter((t) => t !== 'All Types').map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Compensation & Shift Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Compensation & Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pay Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pay Frequency *
                </label>
                <select
                  value={payFrequency}
                  onChange={(e) => setPayFrequency(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="hourly">Per Hour</option>
                  <option value="daily">Per Day</option>
                  <option value="weekly">Per Week</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Openings Count *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={openings}
                  onChange={(e) => setOpenings(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Working Days
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon - Fri or Weekends"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hours Per Day
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4 - 6 hours (Evening)"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Location Picker Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> Work Location & GPS Coordinates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Name / Facility
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Street Branch"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="123 Commercial Way, City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <LocationPicker
              initialLat={latitude}
              initialLng={longitude}
              initialAddress={address}
              onLocationSelect={handleLocationSelect}
            />
          </div>

          {/* Description & Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Description & Requirements
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Job Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Explain shift responsibilities, atmosphere, and expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requirements (comma separated)
                </label>
                <input
                  type="text"
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-200"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'Publishing...' : 'Publish Job Listing'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LocationPicker } from '../../components/common/LocationPicker';
import { Job } from '../../types';
import { JOB_CATEGORIES, JOB_TYPES, getGeohashForCoords } from '../../utils/location';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Save, MapPin, CheckCircle2 } from 'lucide-react';

export const EditJob: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [jobType, setJobType] = useState(JOB_TYPES[0]);
  const [payAmount, setPayAmount] = useState<number>(15);
  const [payFrequency, setPayFrequency] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [workingDays, setWorkingDays] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [openings, setOpenings] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');

  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(40.7128);
  const [longitude, setLongitude] = useState<number>(-74.0060);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'jobs', jobId));
        if (snap.exists()) {
          const j = snap.data() as Job;
          setTitle(j.title);
          setCategory(j.category);
          setJobType(j.jobType);
          setPayAmount(j.payAmount);
          setPayFrequency(j.payFrequency);
          setWorkingDays(j.workingDays || '');
          setHoursPerDay(j.hoursPerDay || '');
          setOpenings(j.openings);
          setDescription(j.description);
          setSkillsInput((j.requiredSkills || []).join(', '));
          setRequirementsInput((j.requirements || []).join(', '));
          setLocationName(j.locationName);
          setAddress(j.address);
          setLatitude(j.latitude);
          setLongitude(j.longitude);
        }
      } catch (err) {
        console.error('Error loading job:', err);
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    setSaving(true);
    setError('');

    try {
      const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const requirements = requirementsInput.split(',').map((r) => r.trim()).filter(Boolean);
      const geohash = getGeohashForCoords(latitude, longitude);

      await updateDoc(doc(db, 'jobs', jobId), {
        title,
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
        updatedAt: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => navigate('/employer/jobs'), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Job" subtitle="Update job listing information">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse h-64"></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Job Listing" subtitle="Modify vacancy details or update GPS location">
      <div className="max-w-4xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Job post updated successfully!
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  {JOB_CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Amount ($)</label>
              <input
                type="number"
                step="0.5"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Frequency</label>
              <select
                value={payFrequency}
                onChange={(e) => setPayFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="hourly">Per Hour</option>
                <option value="daily">Per Day</option>
                <option value="weekly">Per Week</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Openings Count</label>
              <input
                type="number"
                min="1"
                required
                value={openings}
                onChange={(e) => setOpenings(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" /> Location Coordinates
            </h3>
            <LocationPicker
              initialLat={latitude}
              initialLng={longitude}
              initialAddress={address}
              onLocationSelect={handleLocationSelect}
            />
          </div>

          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employer/jobs')}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

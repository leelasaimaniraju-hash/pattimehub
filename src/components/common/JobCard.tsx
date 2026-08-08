import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Calendar, Bookmark, CheckCircle2, Building2 } from 'lucide-react';
import { Job } from '../../types';
import { formatDistance } from '../../utils/location';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  isApplied?: boolean;
  onToggleSave?: (jobId: string, event: React.MouseEvent) => void;
  onApply?: (jobId: string, event: React.MouseEvent) => void;
  showActions?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved = false,
  isApplied = false,
  onToggleSave,
  onApply,
  showActions = true,
}) => {
  const formatPay = (amount: number, freq: string) => {
    const formattedAmount = `$${amount.toFixed(2)}`;
    switch (freq) {
      case 'per_hour':
        return `${formattedAmount} / hr`;
      case 'per_day':
        return `${formattedAmount} / day`;
      case 'per_week':
        return `${formattedAmount} / wk`;
      case 'per_month':
        return `${formattedAmount} / mo`;
      default:
        return `${formattedAmount}`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between group relative">
      <div>
        {/* Top Header: Category tag & Save button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {job.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
              {job.jobType}
            </span>
          </div>

          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => onToggleSave(job.jobId, e)}
              className={`p-2 rounded-full transition-colors ${
                isSaved
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {/* Job Title */}
        <Link to={`/jobs/${job.jobId}`} className="block group-hover:text-indigo-600 transition-colors">
          <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-1">{job.title}</h3>
        </Link>

        {/* Employer & Verified status */}
        <div className="flex items-center text-sm text-slate-600 mt-1 mb-4 gap-1.5">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-medium line-clamp-1">{job.employerName}</span>
          <span className="inline-flex items-center text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified
          </span>
        </div>

        {/* Key Info Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>{formatPay(job.payAmount, job.payFrequency)}</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-indigo-700">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
            <span className="truncate">{formatDistance(job.distanceKm)}</span>
          </div>

          {job.workingDays && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{job.workingDays}</span>
            </div>
          )}

          {job.workingHours && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{job.workingHours}</span>
            </div>
          )}
        </div>

        {/* Short description preview */}
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{job.description}</p>
      </div>

      {/* Footer Actions */}
      {showActions && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
          <div className="text-[11px] text-slate-400 truncate">
            {job.address || job.locationName}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/jobs/${job.jobId}`}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Details
            </Link>

            {onApply && (
              <button
                type="button"
                disabled={isApplied}
                onClick={(e) => onApply(job.jobId, e)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shadow-xs ${
                  isApplied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                }`}
              >
                {isApplied ? 'Applied' : 'Apply Now'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

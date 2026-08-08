import React from 'react';
import { JobStatus, ApplicationStatus, EmployerVerificationStatus } from '../../types';

interface StatusBadgeProps {
  status: JobStatus | ApplicationStatus | EmployerVerificationStatus | string;
  type?: 'job' | 'application' | 'employer';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'job' }) => {
  let colorStyle = 'bg-gray-100 text-gray-700 border-gray-200';
  let label = status;

  switch (status) {
    // Job statuses
    case 'approved':
    case 'accepted':
    case 'verified':
      colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = status === 'verified' ? 'Verified Employer' : status === 'approved' ? 'Active / Approved' : 'Accepted';
      break;
    case 'pending':
      colorStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Pending Review';
      break;
    case 'shortlisted':
      colorStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Shortlisted';
      break;
    case 'rejected':
      colorStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Rejected';
      break;
    case 'closed':
    case 'expired':
    case 'hidden':
      colorStyle = 'bg-slate-100 text-slate-600 border-slate-300';
      label = status.charAt(0).toUpperCase() + status.slice(1);
      break;
    case 'withdrawn':
      colorStyle = 'bg-neutral-100 text-neutral-600 border-neutral-200';
      label = 'Withdrawn';
      break;
    case 'suspended':
      colorStyle = 'bg-red-100 text-red-800 border-red-300';
      label = 'Suspended';
      break;
    default:
      label = String(status);
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyle} transition-colors whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {label}
    </span>
  );
};

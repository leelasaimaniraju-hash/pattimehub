export type UserRole = 'jobSeeker' | 'employer' | 'admin';

export type AccountStatus = 'active' | 'suspended';

export type EmployerVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type JobStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'closed' | 'expired' | 'hidden';

export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  photoURL?: string;
  city?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  skills?: string[];
  about?: string;
  preferredCategories?: string[];
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfile {
  employerId: string;
  uid: string;
  companyName: string;
  description: string;
  category: string;
  phone: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  geohash?: string;
  verificationStatus: EmployerVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  jobId: string;
  employerId: string;
  employerName: string;
  title: string;
  description: string;
  category: string;
  jobType: string; // 'part-time', 'hourly', 'weekend', 'evening', 'flexible', 'temporary'
  payAmount: number;
  payFrequency: 'per_hour' | 'per_day' | 'per_week' | 'per_month' | 'hourly' | 'daily' | 'weekly' | string;
  requiredSkills: string[];
  requirements: string[];
  openings: number;
  workingDays?: string;
  workingHours?: string;
  hoursPerDay?: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  geohash: string;
  status: JobStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  // Computed client side:
  distanceKm?: number;
}

export interface JobApplication {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  employerId: string;
  employerName: string;
  jobSeekerId: string;
  jobSeekerName: string;
  jobSeekerEmail: string;
  jobSeekerPhone?: string;
  jobSeekerSkills?: string[];
  jobSeekerAbout?: string;
  appliedAt: string;
  status: ApplicationStatus;
  updatedAt: string;
}

export interface SavedJob {
  savedJobId: string;
  jobSeekerId: string;
  jobId: string;
  createdAt: string;
  jobData?: Job;
}

export interface NotificationItem {
  notificationId: string;
  recipientUid: string;
  title: string;
  message: string;
  type: 'application' | 'status_change' | 'job_approval' | 'job_rejection' | 'general';
  relatedJobId?: string;
  relatedApplicationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactMessage {
  messageId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
}

export interface ActivityLog {
  logId: string;
  actorUid: string;
  actorRole: UserRole;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  createdAt: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  locationName?: string;
  geohash?: string;
}

export interface JobFilterParams {
  keyword: string;
  category: string;
  jobType: string;
  maxDistanceKm: number; // e.g. 2, 5, 10, 15, 25, or 1000 (all)
  minPay: number;
  payFrequency: string;
  sortBy: 'nearest' | 'latest' | 'highest_pay';
  userLat?: number;
  userLng?: number;
}

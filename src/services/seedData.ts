import { doc, setDoc, getDocs, getDoc, collection, query, where, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Job, EmployerProfile, UserProfile } from '../types';
import { getGeohash, calculateHaversineDistance } from '../utils/location';

export const SAMPLE_EMPLOYERS: EmployerProfile[] = [
  {
    employerId: 'emp_starbucks_101',
    uid: 'emp_starbucks_101',
    companyName: 'Starbucks Coffee - Downtown',
    description: 'Premier specialty coffee chain providing flexible morning and weekend barista opportunities for students and local talent.',
    category: 'Restaurant & Food Service',
    phone: '(555) 234-5678',
    address: '100 Main St, Downtown',
    city: 'New York, NY',
    latitude: 40.7138,
    longitude: -74.0080,
    geohash: getGeohash(40.7138, -74.0080),
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    employerId: 'emp_target_102',
    uid: 'emp_target_102',
    companyName: 'Target Retail Store #412',
    description: 'Nationwide department store offering flexible weekend, evening, and customer assistant part-time roles with competitive pay.',
    category: 'Retail & Shopping',
    phone: '(555) 876-5432',
    address: '250 Broadway Ave',
    city: 'New York, NY',
    latitude: 40.7180,
    longitude: -74.0020,
    geohash: getGeohash(40.7180, -74.0020),
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    employerId: 'emp_doordash_103',
    uid: 'emp_doordash_103',
    companyName: 'Swift Express Logistics',
    description: 'Local courier and parcel delivery service hiring evening and weekend delivery drivers with immediate hourly payouts.',
    category: 'Delivery & Logistics',
    phone: '(555) 456-7890',
    address: '88 Commerce Way',
    city: 'New York, NY',
    latitude: 40.7250,
    longitude: -74.0120,
    geohash: getGeohash(40.7250, -74.0120),
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    employerId: 'emp_math_tutors_104',
    uid: 'emp_math_tutors_104',
    companyName: 'Apex Learning & Academy',
    description: 'Private tutoring center specializing in high school and college prep in mathematics, science, and computer coding.',
    category: 'Tutoring & Education',
    phone: '(555) 998-1122',
    address: '500 University Ave',
    city: 'New York, NY',
    latitude: 40.7310,
    longitude: -73.9980,
    geohash: getGeohash(40.7310, -73.9980),
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    employerId: 'emp_events_105',
    uid: 'emp_events_105',
    companyName: 'Metropolitan Event Services',
    description: 'High-end catering and event staging management company seeking energetic hospitality personnel for weekend banquets.',
    category: 'Event & Hospitality',
    phone: '(555) 334-9988',
    address: '777 Park Center',
    city: 'New York, NY',
    latitude: 40.7090,
    longitude: -74.0150,
    geohash: getGeohash(40.7090, -74.0150),
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export function generateSampleJobs(userLat?: number, userLng?: number): Job[] {
  const baseLat = userLat || 40.7128;
  const baseLng = userLng || -74.0060;

  return [
    {
      jobId: 'job_barista_01',
      employerId: 'emp_starbucks_101',
      employerName: 'Starbucks Coffee - Downtown',
      title: 'Part-Time Morning Barista & Cashier',
      description: 'We are seeking friendly, energetic part-time baristas for early morning and weekend shifts (15-20 hrs/week). Duties include brewing specialty drinks, managing cash register, maintaining clean workstations, and delivering exceptional customer service.',
      category: 'Restaurant & Food Service',
      jobType: 'Part-time',
      payAmount: 18.50,
      payFrequency: 'per_hour',
      requiredSkills: ['Customer Service', 'Cash Handling', 'Punctuality', 'Multitasking'],
      requirements: ['Must be at least 18 years old', 'Available 6am - 12pm on Saturdays', 'Friendly attitude'],
      openings: 3,
      workingDays: 'Mon - Sat (Flexible)',
      workingHours: '6:00 AM - 12:00 PM',
      locationName: 'Downtown Cafe Hub',
      address: '100 Main St',
      latitude: baseLat + 0.008,
      longitude: baseLng + 0.005,
      geohash: getGeohash(baseLat + 0.008, baseLng + 0.005),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      jobId: 'job_retail_02',
      employerId: 'emp_target_102',
      employerName: 'Target Retail Store #412',
      title: 'Weekend Sales & Inventory Assistant',
      description: 'Assist store guests with product inquiries, restock shelves, organize aisle displays, and manage inventory checkout during busy weekend store hours.',
      category: 'Retail & Shopping',
      jobType: 'Weekend Only',
      payAmount: 17.00,
      payFrequency: 'per_hour',
      requiredSkills: ['Inventory Management', 'Customer Interaction', 'Stocking'],
      requirements: ['Ability to stand for 5-6 hours', 'Basic computer literacy'],
      openings: 5,
      workingDays: 'Saturday & Sunday',
      workingHours: '10:00 AM - 4:00 PM',
      locationName: 'Central Shopping Mall',
      address: '250 Broadway Ave',
      latitude: baseLat + 0.015,
      longitude: baseLng - 0.012,
      geohash: getGeohash(baseLat + 0.015, baseLng - 0.012),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      jobId: 'job_delivery_03',
      employerId: 'emp_doordash_103',
      employerName: 'Swift Express Logistics',
      title: 'Evening Parcel Delivery Driver / Rider',
      description: 'Deliver food and small parcels within a 5km local radius using your own bicycle, scooter, or motor vehicle. Choose your own hours with guaranteed hourly base rate plus tips.',
      category: 'Delivery & Logistics',
      jobType: 'Evening Shift',
      payAmount: 22.00,
      payFrequency: 'per_hour',
      requiredSkills: ['Local Navigation', 'Driver License / Bike', 'Time Management'],
      requirements: ['Valid driving license or reliable bicycle', 'Smartphone for delivery app navigation'],
      openings: 8,
      workingDays: 'Flexible',
      workingHours: '5:00 PM - 10:00 PM',
      locationName: 'Metropolitan Delivery Zone',
      address: '88 Commerce Way',
      latitude: baseLat - 0.011,
      longitude: baseLng + 0.014,
      geohash: getGeohash(baseLat - 0.011, baseLng + 0.014),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      jobId: 'job_tutor_04',
      employerId: 'emp_math_tutors_104',
      employerName: 'Apex Learning & Academy',
      title: 'High School Math & Science Tutor',
      description: 'Help middle and high school students master Algebra, Geometry, and Physics in one-on-one and small group learning sessions.',
      category: 'Tutoring & Education',
      jobType: 'Hourly Shift',
      payAmount: 25.00,
      payFrequency: 'per_hour',
      requiredSkills: ['Algebra', 'Physics', 'Patience', 'Communication'],
      requirements: ['Strong academic record in Math/Science', 'Previous tutoring experience preferred'],
      openings: 2,
      workingDays: 'Mon, Wed, Fri',
      workingHours: '3:30 PM - 7:30 PM',
      locationName: 'University Learning Center',
      address: '500 University Ave',
      latitude: baseLat + 0.022,
      longitude: baseLng + 0.018,
      geohash: getGeohash(baseLat + 0.022, baseLng + 0.018),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      jobId: 'job_event_05',
      employerId: 'emp_events_105',
      employerName: 'Metropolitan Event Services',
      title: 'Weekend Banquet & Staging Event Staff',
      description: 'Assist with venue setup, tray passing appetizers, guest check-in, and stage breakdown for corporate galas and private celebrations.',
      category: 'Event & Hospitality',
      jobType: 'Temporary / Seasonal',
      payAmount: 20.00,
      payFrequency: 'per_hour',
      requiredSkills: ['Guest Hospitality', 'Physical Fitness', 'Teamwork'],
      requirements: ['Black dress pants & shirt', 'Good physical endurance'],
      openings: 10,
      workingDays: 'Saturday Night',
      workingHours: '4:00 PM - 11:00 PM',
      locationName: 'Plaza Grand Ballroom',
      address: '777 Park Center',
      latitude: baseLat - 0.025,
      longitude: baseLng - 0.019,
      geohash: getGeohash(baseLat - 0.025, baseLng - 0.019),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      jobId: 'job_office_06',
      employerId: 'emp_target_102',
      employerName: 'Target Retail Store #412',
      title: 'Front Desk & Administrative Support (Part-time)',
      description: 'Manage incoming phone calls, organize client appointments, update digital spreadsheets, and assist general office administration.',
      category: 'Office & Administrative',
      jobType: 'Part-time',
      payAmount: 19.00,
      payFrequency: 'per_hour',
      requiredSkills: ['MS Excel / Sheets', 'Phone Etiquette', 'Organization'],
      requirements: ['Punctual', 'Good typing speed (50+ WPM)'],
      openings: 1,
      workingDays: 'Mon - Thu',
      workingHours: '1:00 PM - 5:00 PM',
      locationName: 'Corporate Park Block B',
      address: '250 Broadway Ave',
      latitude: baseLat + 0.035,
      longitude: baseLng - 0.028,
      geohash: getGeohash(baseLat + 0.035, baseLng - 0.028),
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    }
  ];
}

export async function seedSampleDatabaseIfNeeded(userLat?: number, userLng?: number) {
  // Only attempt seeding if a user is authenticated (e.g. admin or initial user)
  if (!auth.currentUser) {
    return;
  }

  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, limit(1));
    const snap = await getDocs(q);

    // If database already has jobs, skip auto seed
    if (!snap.empty) {
      return;
    }

    // Seed Employers
    for (const emp of SAMPLE_EMPLOYERS) {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'employers', emp.employerId), {
        ...emp,
        createdAt: now,
        updatedAt: now,
      });

      // Also create a user record for the employer
      await setDoc(doc(db, 'users', emp.uid), {
        uid: emp.uid,
        fullName: emp.companyName,
        email: `contact@${emp.employerId}.com`,
        phone: emp.phone,
        role: 'employer',
        city: emp.city,
        locationName: `${emp.address}, ${emp.city}`,
        latitude: emp.latitude,
        longitude: emp.longitude,
        geohash: emp.geohash,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      });
    }

    // Seed Jobs
    const jobs = generateSampleJobs(userLat, userLng);
    for (const job of jobs) {
      await setDoc(doc(db, 'jobs', job.jobId), job);
    }
  } catch (err: any) {
    // If not permitted or already exists, silently handle
    if (err?.code !== 'permission-denied') {
      console.warn('Database seed notice:', err?.message || err);
    }
  }
}

/**
 * Robust fetcher for approved public jobs. Returns Firestore data or fallback sample jobs if empty.
 */
export async function getApprovedJobsWithFallback(userLat?: number, userLng?: number): Promise<Job[]> {
  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, where('status', '==', 'approved'));
    const snap = await getDocs(q);

    const loaded: Job[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as Job;
      const dist = userLat !== undefined && userLng !== undefined
        ? calculateHaversineDistance(userLat, userLng, data.latitude, data.longitude)
        : undefined;
      loaded.push({ ...data, distanceKm: dist });
    });

    if (loaded.length > 0) {
      return loaded;
    }
  } catch (err) {
    console.warn('Fetching jobs from Firestore notice:', err);
  }

  // Fallback to sample jobs with calculated distance
  const samples = generateSampleJobs(userLat, userLng);
  return samples.map((job) => ({
    ...job,
    distanceKm: userLat !== undefined && userLng !== undefined
      ? calculateHaversineDistance(userLat, userLng, job.latitude, job.longitude)
      : undefined,
  }));
}

/**
 * Robust fetcher for a single job by ID. Checks Firestore or fallback sample jobs.
 */
export async function getJobByIdWithFallback(jobId: string, userLat?: number, userLng?: number): Promise<{ job: Job | null; employer: EmployerProfile | null }> {
  try {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
      const data = jobSnap.data() as Job;
      const dist = userLat !== undefined && userLng !== undefined
        ? calculateHaversineDistance(userLat, userLng, data.latitude, data.longitude)
        : undefined;

      let employer: EmployerProfile | null = null;
      try {
        const empSnap = await getDoc(doc(db, 'employers', data.employerId));
        if (empSnap.exists()) {
          employer = empSnap.data() as EmployerProfile;
        }
      } catch (e) {
        // employer fetch ignore
      }

      return { job: { ...data, distanceKm: dist }, employer };
    }
  } catch (err) {
    console.warn('Fetching job by ID notice:', err);
  }

  // Check in sample jobs
  const sampleJobs = generateSampleJobs(userLat, userLng);
  const matchedSample = sampleJobs.find((j) => j.jobId === jobId);
  if (matchedSample) {
    const dist = userLat !== undefined && userLng !== undefined
      ? calculateHaversineDistance(userLat, userLng, matchedSample.latitude, matchedSample.longitude)
      : undefined;
    const emp = SAMPLE_EMPLOYERS.find((e) => e.employerId === matchedSample.employerId) || null;
    return { job: { ...matchedSample, distanceKm: dist }, employer: emp };
  }

  return { job: null, employer: null };
}

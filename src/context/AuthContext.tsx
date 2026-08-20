import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile, EmployerProfile, UserRole, UserLocation } from '../types';
import { getCurrentBrowserLocation, getGeohash } from '../utils/location';
import { getFriendlyAuthErrorMessage } from '../utils/authErrors';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  employerProfile: EmployerProfile | null;
  role: UserRole | null;
  loading: boolean;
  userLocation: UserLocation | null;
  needsGoogleOnboarding: boolean;
  setNeedsGoogleOnboarding: (val: boolean) => void;
  preferredGoogleRole: UserRole;
  setPreferredGoogleRole: (role: UserRole) => void;
  requestUserLocation: () => Promise<UserLocation | null>;
  setUserManualLocation: (loc: UserLocation) => void;
  login: (email: string, pass: string) => Promise<UserRole | null>;
  registerJobSeeker: (data: {
    fullName: string;
    email: string;
    pass: string;
    phone?: string;
    city?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  registerEmployer: (data: {
    fullName: string;
    email: string;
    pass: string;
    phone: string;
    companyName: string;
    description: string;
    category: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  loginWithGoogle: (preferredRole?: UserRole) => Promise<UserRole | null>;
  completeGoogleOnboarding: (data: {
    role: UserRole;
    phone?: string;
    companyName?: string;
    description?: string;
    category?: string;
    address?: string;
    city?: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [needsGoogleOnboarding, setNeedsGoogleOnboarding] = useState<boolean>(false);
  const [preferredGoogleRole, setPreferredGoogleRole] = useState<UserRole>('jobSeeker');

  // Attempt default location fetch on app init
  useEffect(() => {
    getCurrentBrowserLocation()
      .then((loc) => setUserLocation(loc))
      .catch((err) => {
        console.log('Location default notice:', err.message);
        // Default to New York if location permission denied initially
        setUserLocation({
          latitude: 40.7128,
          longitude: -74.006,
          city: 'New York, NY',
          locationName: 'New York, NY (Default)',
          geohash: getGeohash(40.7128, -74.006),
        });
      });
  }, []);

  const requestUserLocation = async (): Promise<UserLocation | null> => {
    try {
      const loc = await getCurrentBrowserLocation();
      setUserLocation(loc);
      if (currentUser && userProfile) {
        // Update Firestore profile
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          geohash: loc.geohash,
          updatedAt: new Date().toISOString(),
        });
      }
      return loc;
    } catch (err: any) {
      console.warn('Geolocation error:', err.message);
      return null;
    }
  };

  const setUserManualLocation = (loc: UserLocation) => {
    setUserLocation(loc);
  };

  const fetchUserData = async (user: FirebaseUser): Promise<UserRole | null> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile;
        
        // Admin override check
        let activeRole = profile.role;
        if (
          user.email === 'leelasaimaniraju@gmail.com' ||
          user.email === 'admin@parttimehub.com'
        ) {
          activeRole = 'admin';
        }

        setUserProfile({ ...profile, role: activeRole });
        setRole(activeRole);

        if (activeRole === 'employer') {
          const empRef = doc(db, 'employers', user.uid);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            setEmployerProfile(empSnap.data() as EmployerProfile);
          }
        }
        return activeRole;
      } else {
        // Needs onboarding for Google Sign In
        setNeedsGoogleOnboarding(true);
        if (
          user.email === 'leelasaimaniraju@gmail.com' ||
          user.email === 'admin@parttimehub.com'
        ) {
          setRole('admin');
          return 'admin';
        }
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user);
      } else {
        setUserProfile(null);
        setEmployerProfile(null);
        setRole(null);
        setNeedsGoogleOnboarding(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshUserProfile = async () => {
    if (currentUser) {
      await fetchUserData(currentUser);
    }
  };

  const login = async (email: string, pass: string): Promise<UserRole | null> => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const activeRole = await fetchUserData(res.user);
      return activeRole;
    } finally {
      setLoading(false);
    }
  };

  const registerJobSeeker = async (data: {
    fullName: string;
    email: string;
    pass: string;
    phone?: string;
    city?: string;
    locationName?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = res.user.uid;

      const lat = data.latitude || userLocation?.latitude || 40.7128;
      const lng = data.longitude || userLocation?.longitude || -74.006;
      const geohash = getGeohash(lat, lng);

      const isSpecialAdmin = data.email === 'leelasaimaniraju@gmail.com' || data.email === 'admin@parttimehub.com';
      const assignedRole: UserRole = isSpecialAdmin ? 'admin' : 'jobSeeker';

      const newUser: UserProfile = {
        uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        role: assignedRole,
        city: data.city || 'Default City',
        locationName: data.locationName || 'Default Location',
        latitude: lat,
        longitude: lng,
        geohash,
        skills: [],
        about: '',
        preferredCategories: [],
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), newUser);

      // Create activity log (fail-safe)
      try {
        await setDoc(doc(db, 'activityLogs', `log_${Date.now()}`), {
          logId: `log_${Date.now()}`,
          actorUid: uid,
          actorRole: assignedRole,
          actorName: data.fullName,
          action: 'user_registered',
          targetType: 'user',
          targetId: uid,
          description: `New Job Seeker registered: ${data.fullName}`,
          createdAt: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Non-blocking activity log error:', logErr);
      }

      await fetchUserData(res.user);
    } finally {
      setLoading(false);
    }
  };

  const registerEmployer = async (data: {
    fullName: string;
    email: string;
    pass: string;
    phone: string;
    companyName: string;
    description: string;
    category: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, data.email, data.pass);
      const uid = res.user.uid;

      const lat = data.latitude || userLocation?.latitude || 40.7128;
      const lng = data.longitude || userLocation?.longitude || -74.006;
      const geohash = getGeohash(lat, lng);

      const isSpecialAdmin = data.email === 'leelasaimaniraju@gmail.com' || data.email === 'admin@parttimehub.com';
      const assignedRole: UserRole = isSpecialAdmin ? 'admin' : 'employer';

      const newUser: UserProfile = {
        uid,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        role: assignedRole,
        city: data.city,
        locationName: `${data.address}, ${data.city}`,
        latitude: lat,
        longitude: lng,
        geohash,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newEmployer: EmployerProfile = {
        employerId: uid,
        uid,
        companyName: data.companyName,
        description: data.description,
        category: data.category,
        phone: data.phone,
        address: data.address,
        city: data.city,
        latitude: lat,
        longitude: lng,
        geohash,
        verificationStatus: 'pending', // Requires admin verification
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), newUser);
      await setDoc(doc(db, 'employers', uid), newEmployer);

      // Create activity log (fail-safe)
      try {
        await setDoc(doc(db, 'activityLogs', `log_${Date.now()}`), {
          logId: `log_${Date.now()}`,
          actorUid: uid,
          actorRole: assignedRole,
          actorName: data.companyName,
          action: 'employer_registered',
          targetType: 'employer',
          targetId: uid,
          description: `New Employer registered: ${data.companyName}`,
          createdAt: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('Non-blocking activity log error:', logErr);
      }

      await fetchUserData(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (preferredRole?: UserRole): Promise<UserRole | null> => {
    setLoading(true);
    if (preferredRole) {
      setPreferredGoogleRole(preferredRole);
    }
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setNeedsGoogleOnboarding(true);
        if (
          user.email === 'leelasaimaniraju@gmail.com' ||
          user.email === 'admin@parttimehub.com'
        ) {
          setRole('admin');
          return 'admin';
        }
        return null;
      } else {
        const activeRole = await fetchUserData(user);
        return activeRole;
      }
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleOnboarding = async (data: {
    role: UserRole;
    phone?: string;
    companyName?: string;
    description?: string;
    category?: string;
    address?: string;
    city?: string;
  }) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const uid = currentUser.uid;
      const email = currentUser.email || '';
      const fullName = currentUser.displayName || 'User';

      const lat = userLocation?.latitude || 40.7128;
      const lng = userLocation?.longitude || -74.006;
      const geohash = getGeohash(lat, lng);

      const isSpecialAdmin = email === 'leelasaimaniraju@gmail.com' || email === 'admin@parttimehub.com';
      const assignedRole: UserRole = isSpecialAdmin ? 'admin' : data.role;

      const newUser: UserProfile = {
        uid,
        fullName,
        email,
        phone: data.phone || '',
        role: assignedRole,
        city: data.city || 'City',
        locationName: data.city ? `${data.city}` : 'Default Location',
        latitude: lat,
        longitude: lng,
        geohash,
        photoURL: currentUser.photoURL || undefined,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), newUser);

      if (assignedRole === 'employer') {
        const newEmployer: EmployerProfile = {
          employerId: uid,
          uid,
          companyName: data.companyName || `${fullName}'s Business`,
          description: data.description || 'Part-time opportunity provider',
          category: data.category || 'Retail',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          latitude: lat,
          longitude: lng,
          geohash,
          verificationStatus: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'employers', uid), newEmployer);
      }

      setNeedsGoogleOnboarding(false);
      await fetchUserData(currentUser);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    setEmployerProfile(null);
    setRole(null);
    setNeedsGoogleOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        employerProfile,
        role,
        loading,
        userLocation,
        needsGoogleOnboarding,
        setNeedsGoogleOnboarding,
        preferredGoogleRole,
        setPreferredGoogleRole,
        requestUserLocation,
        setUserManualLocation,
        login,
        registerJobSeeker,
        registerEmployer,
        loginWithGoogle,
        completeGoogleOnboarding,
        resetPassword,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

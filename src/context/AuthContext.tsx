import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

  const fetchUserData = async (user: FirebaseUser, retryCount = 0): Promise<UserRole | null> => {
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

        const resolvedProfile: UserProfile = { ...profile, role: activeRole };
        setUserProfile(resolvedProfile);
        setRole(activeRole);
        localStorage.setItem(`parttime_user_profile_${user.uid}`, JSON.stringify(resolvedProfile));

        if (activeRole === 'employer') {
          try {
            const empRef = doc(db, 'employers', user.uid);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists()) {
              const empData = empSnap.data() as EmployerProfile;
              setEmployerProfile(empData);
              localStorage.setItem(`parttime_emp_profile_${user.uid}`, JSON.stringify(empData));
            }
          } catch (empErr) {
            console.warn('Employer profile fetch note:', empErr);
          }
        }
        return activeRole;
      } else {
        // Document does not exist in Firestore
        // If it's a known admin, auto-bootstrap their profile
        if (
          user.email === 'leelasaimaniraju@gmail.com' ||
          user.email === 'admin@parttimehub.com'
        ) {
          const adminProfile: UserProfile = {
            uid: user.uid,
            fullName: user.displayName || 'System Admin',
            email: user.email || '',
            role: 'admin',
            city: 'New York, NY',
            accountStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUserProfile(adminProfile);
          setRole('admin');
          localStorage.setItem(`parttime_user_profile_${user.uid}`, JSON.stringify(adminProfile));
          setDoc(userRef, adminProfile).catch((e) => console.warn('Admin doc creation note:', e));
          return 'admin';
        }

        // If preferredGoogleRole exists, provision automatically
        if (preferredGoogleRole) {
          const lat = userLocation?.latitude || 40.7128;
          const lng = userLocation?.longitude || -74.006;
          const geohash = getGeohash(lat, lng);
          const fullName = user.displayName || (preferredGoogleRole === 'employer' ? 'Employer' : 'Job Seeker');

          const newProfile: UserProfile = {
            uid: user.uid,
            fullName,
            email: user.email || '',
            role: preferredGoogleRole,
            city: userLocation?.city || 'New York, NY',
            locationName: userLocation?.city || 'New York, NY',
            latitude: lat,
            longitude: lng,
            geohash,
            photoURL: user.photoURL || undefined,
            accountStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setUserProfile(newProfile);
          setRole(preferredGoogleRole);
          localStorage.setItem(`parttime_user_profile_${user.uid}`, JSON.stringify(newProfile));
          setDoc(userRef, newProfile).catch((e) => console.warn('Profile sync note:', e));
          return preferredGoogleRole;
        }

        setNeedsGoogleOnboarding(true);
        return null;
      }
    } catch (err: any) {
      console.warn('Notice while fetching user profile:', err?.message || err);

      // Check if user is known admin first
      if (
        user.email === 'leelasaimaniraju@gmail.com' ||
        user.email === 'admin@parttimehub.com'
      ) {
        const adminProfile: UserProfile = {
          uid: user.uid,
          fullName: user.displayName || 'System Admin',
          email: user.email || '',
          role: 'admin',
          city: 'New York, NY',
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(adminProfile);
        setRole('admin');
        return 'admin';
      }

      // Check local storage for cached profile
      const cached = localStorage.getItem(`parttime_user_profile_${user.uid}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as UserProfile;
          setUserProfile(parsed);
          setRole(parsed.role);

          const cachedEmp = localStorage.getItem(`parttime_emp_profile_${user.uid}`);
          if (cachedEmp) {
            setEmployerProfile(JSON.parse(cachedEmp));
          }
          return parsed.role;
        } catch {
          // ignore parsing error
        }
      }

      // If user has preferred role or fallback profile
      const fallbackRole = preferredGoogleRole || 'jobSeeker';
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        fullName: user.displayName || (fallbackRole === 'employer' ? 'Employer' : 'Job Seeker'),
        email: user.email || '',
        role: fallbackRole,
        city: userLocation?.city || 'New York, NY',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserProfile(fallbackProfile);
      setRole(fallbackRole);

      // Retry once in background
      if (retryCount < 1) {
        setTimeout(() => {
          fetchUserData(user, retryCount + 1).catch(() => {});
        }, 1500);
      }

      return fallbackRole;
    }
  };

  // Centralized user processing for popup, redirect, and state updates
  const processAuthenticatedUser = async (user: FirebaseUser, targetRole?: UserRole): Promise<UserRole | null> => {
    const uid = user.uid;
    const userRef = doc(db, 'users', uid);

    // 1. Check if user is known admin first
    if (
      user.email === 'leelasaimaniraju@gmail.com' ||
      user.email === 'admin@parttimehub.com'
    ) {
      const adminProfile: UserProfile = {
        uid,
        fullName: user.displayName || 'System Admin',
        email: user.email || '',
        role: 'admin',
        city: 'New York, NY',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserProfile(adminProfile);
      setRole('admin');
      localStorage.setItem(`parttime_user_profile_${uid}`, JSON.stringify(adminProfile));
      setDoc(userRef, adminProfile, { merge: true }).catch((e) => console.warn('Admin doc creation note:', e));
      return 'admin';
    }

    // 2. Check if document exists in Firestore safely
    let userSnap = null;
    try {
      userSnap = await getDoc(userRef);
    } catch (docErr) {
      console.warn('Google sign in document fetch note:', docErr);
    }

    if (userSnap && userSnap.exists()) {
      const activeRole = await fetchUserData(user);
      return activeRole;
    }

    // 3. Check local cache
    const cached = localStorage.getItem(`parttime_user_profile_${uid}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as UserProfile;
        setUserProfile(parsed);
        setRole(parsed.role);
        return parsed.role;
      } catch {
        // ignore
      }
    }

    // 4. If targetRole was provided (e.g. from Register Seeker or Register Employer), auto-bootstrap
    if (targetRole) {
      const lat = userLocation?.latitude || 40.7128;
      const lng = userLocation?.longitude || -74.006;
      const geohash = getGeohash(lat, lng);
      const fullName = user.displayName || (targetRole === 'employer' ? 'Employer' : 'Job Seeker');

      const newProfile: UserProfile = {
        uid,
        fullName,
        email: user.email || '',
        phone: user.phoneNumber || '',
        role: targetRole,
        city: userLocation?.city || 'New York, NY',
        locationName: userLocation?.city || 'New York, NY',
        latitude: lat,
        longitude: lng,
        geohash,
        photoURL: user.photoURL || undefined,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUserProfile(newProfile);
      setRole(targetRole);
      localStorage.setItem(`parttime_user_profile_${uid}`, JSON.stringify(newProfile));
      setDoc(userRef, newProfile, { merge: true }).catch((e) => console.warn('Profile sync note:', e));

      if (targetRole === 'employer') {
        const newEmp: EmployerProfile = {
          employerId: uid,
          uid,
          companyName: `${fullName}'s Business`,
          description: 'Part-time opportunity provider',
          category: 'Retail & Shopping',
          phone: user.phoneNumber || '',
          address: userLocation?.city || 'New York, NY',
          city: userLocation?.city || 'New York, NY',
          latitude: lat,
          longitude: lng,
          geohash,
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEmployerProfile(newEmp);
        localStorage.setItem(`parttime_emp_profile_${uid}`, JSON.stringify(newEmp));
        setDoc(doc(db, 'employers', uid), newEmp, { merge: true }).catch((e) => console.warn('Employer sync note:', e));
      }

      // Log registration activity
      try {
        setDoc(doc(db, 'activityLogs', `log_${Date.now()}`), {
          logId: `log_${Date.now()}`,
          actorUid: uid,
          actorRole: targetRole,
          actorName: fullName,
          action: targetRole === 'employer' ? 'employer_registered' : 'seeker_registered',
          targetType: targetRole,
          targetId: uid,
          description: `${fullName} registered with Google as ${targetRole}`,
          createdAt: new Date().toISOString(),
        }).catch(() => {});
      } catch {}

      return targetRole;
    }

    setNeedsGoogleOnboarding(true);
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    // Check for redirect sign-in result (mobile browser compatibility)
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result || !result.user) return;
        const pendingRole = (
          sessionStorage.getItem('parttime_pending_role') ||
          localStorage.getItem('parttime_pending_role') ||
          'jobSeeker'
        ) as UserRole;
        sessionStorage.removeItem('parttime_pending_role');
        localStorage.removeItem('parttime_pending_role');

        await processAuthenticatedUser(result.user, pendingRole);
      })
      .catch((err) => {
        console.warn('Redirect auth result note:', err);
      });

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

    return () => {
      isMounted = false;
      unsubscribe();
    };
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

      setUserProfile(newUser);
      setRole(assignedRole);
      localStorage.setItem(`parttime_user_profile_${uid}`, JSON.stringify(newUser));

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

      setUserProfile(newUser);
      setEmployerProfile(newEmployer);
      setRole(assignedRole);
      localStorage.setItem(`parttime_user_profile_${uid}`, JSON.stringify(newUser));
      localStorage.setItem(`parttime_emp_profile_${uid}`, JSON.stringify(newEmployer));

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
    const targetRole = preferredRole || preferredGoogleRole;
    if (targetRole) {
      setPreferredGoogleRole(targetRole);
      try {
        sessionStorage.setItem('parttime_pending_role', targetRole);
        localStorage.setItem('parttime_pending_role', targetRole);
      } catch {
        // ignore
      }
    }

    try {
      let res;
      try {
        res = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        const errCode = popupErr?.code || '';
        const errMsg = popupErr?.message || '';

        // If popup was blocked by browser on mobile / top-level window, fall back to redirect
        const isIframe = typeof window !== 'undefined' && window.self !== window.top;
        if (errCode === 'auth/popup-blocked' && !isIframe) {
          console.warn('Popup blocked, falling back to signInWithRedirect...');
          await signInWithRedirect(auth, googleProvider);
          return null;
        }

        // Auto-retry if any temporary database closing/hidden state occurs
        if (
          errMsg.includes('closing/hidden') ||
          errMsg.includes('database connection is closing') ||
          errMsg.includes('Database is closing')
        ) {
          console.warn('Database closing notice encountered, retrying signInWithPopup in 300ms...');
          await new Promise((resolve) => setTimeout(resolve, 300));
          res = await signInWithPopup(auth, googleProvider);
        } else {
          throw popupErr;
        }
      }

      if (!res || !res.user) {
        return null;
      }

      return await processAuthenticatedUser(res.user, targetRole);
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

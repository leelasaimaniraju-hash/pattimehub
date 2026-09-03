import firebaseConfigData from '../../firebase-applet-config.json';

export interface AuthErrorInfo {
  title: string;
  message: string;
  isOperationNotAllowed?: boolean;
  isUnauthorizedDomain?: boolean;
  isPopupBlocked?: boolean;
  isDatabaseClosing?: boolean;
  domain?: string;
  projectId?: string;
  consoleUrl?: string;
  isVercel?: boolean;
}

/**
 * Helper to translate Firebase Authentication error codes into actionable, user-friendly messages.
 */
export function getFriendlyAuthErrorMessage(err: any): AuthErrorInfo {
  const code = err?.code || '';
  const rawMessage = err?.message || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const isVercel = currentDomain.endsWith('.vercel.app');
  const projectId = firebaseConfigData.projectId || 'parttime-hub';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  // 1. Database is closing/hidden (IndexedDB visibilitychange bug)
  if (
    rawMessage.includes('Database is closing/hidden') ||
    rawMessage.includes('closing/hidden') ||
    rawMessage.includes('database connection is closing') ||
    rawMessage.includes('Database is closing')
  ) {
    return {
      title: 'Authentication Database Reconnecting',
      message:
        'The browser temporarily paused the database session when switching windows. The Firebase SDK has been updated to prevent this. Please try clicking the button again.',
      isDatabaseClosing: true,
      projectId,
    };
  }

  // 2. Unauthorized Domain
  if (
    code === 'auth/unauthorized-domain' ||
    rawMessage.includes('auth/unauthorized-domain') ||
    rawMessage.includes('unauthorized-domain')
  ) {
    const vercelNote = isVercel
      ? ' Note: Do NOT use wildcard domains like "*.vercel.app" in Firebase Console. You must add your exact domain (e.g., "' + currentDomain + '").'
      : '';

    return {
      title: 'Google Sign-in: Domain Not Authorized in Firebase',
      message: `Firebase blocked Google sign-in because "${currentDomain}" is not yet in the Authorized Domains list for project "${projectId}".${vercelNote}`,
      isUnauthorizedDomain: true,
      domain: currentDomain,
      projectId,
      consoleUrl,
      isVercel,
    };
  }

  // 3. Popup Blocked
  if (
    code === 'auth/popup-blocked' ||
    rawMessage.includes('popup-blocked') ||
    rawMessage.includes('popup was blocked')
  ) {
    return {
      title: 'Sign-in Popup Blocked by Browser',
      message:
        'Your browser or mobile setting blocked the Google authentication popup. Please allow popups for this site, tap the address bar to permit popups, or try again.',
      isPopupBlocked: true,
    };
  }

  // 4. Popup Closed by User
  if (
    code === 'auth/popup-closed-by-user' ||
    rawMessage.includes('popup-closed-by-user')
  ) {
    return {
      title: 'Sign-in Window Closed',
      message: 'The Google sign-in window was closed before completing authentication. Please click the button again to continue.',
      isOperationNotAllowed: false,
    };
  }

  // 5. Cancelled Popup Request
  if (
    code === 'auth/cancelled-popup-request' ||
    rawMessage.includes('cancelled-popup-request')
  ) {
    return {
      title: 'Sign-in Request In Progress',
      message: 'A Google authentication window is already open or another sign-in was in progress. Please complete the sign-in in the open popup or wait a few seconds.',
      isOperationNotAllowed: false,
    };
  }

  // 6. Network Request Failed
  if (
    code === 'auth/network-request-failed' ||
    rawMessage.includes('network-request-failed')
  ) {
    return {
      title: 'Network Connection Issue',
      message: 'Unable to reach Firebase authentication servers. Please verify your internet connection and try again.',
      isOperationNotAllowed: false,
    };
  }

  // 7. Operation Not Allowed (Email/Password or Provider disabled)
  if (
    code === 'auth/operation-not-allowed' ||
    rawMessage.includes('auth/operation-not-allowed') ||
    rawMessage.includes('operation-not-allowed')
  ) {
    return {
      title: 'Authentication Provider Disabled',
      message:
        'This sign-in method is currently not enabled in your Firebase project. In Firebase Console, go to Authentication > Sign-in method, click the provider, and toggle "Enable".',
      isOperationNotAllowed: true,
      projectId,
      consoleUrl,
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      title: 'Email Already Registered',
      message: 'An account with this email address already exists. Please log in instead or use another email.',
      isOperationNotAllowed: false,
    };
  }

  if (code === 'auth/weak-password') {
    return {
      title: 'Weak Password',
      message: 'The password is too weak. Please use at least 6 characters.',
      isOperationNotAllowed: false,
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
      isOperationNotAllowed: false,
    };
  }

  if (
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return {
      title: 'Invalid Credentials',
      message: 'The email address or password you entered is incorrect. Please double check and try again.',
      isOperationNotAllowed: false,
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      title: 'Too Many Attempts',
      message: 'Access to this account has been temporarily disabled due to many failed attempts. Please try again later or reset your password.',
      isOperationNotAllowed: false,
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      title: 'Sign-in Cancelled',
      message: 'The Google sign-in window was closed before completing. Please try again.',
      isOperationNotAllowed: false,
    };
  }

  if (code === 'auth/popup-blocked') {
    return {
      title: 'Popup Blocked',
      message: 'The authentication popup was blocked by your browser. Please allow popups for this site.',
      isOperationNotAllowed: false,
    };
  }

  if (
    code === 'unavailable' ||
    rawMessage.includes('client is offline') ||
    rawMessage.includes('offline') ||
    rawMessage.includes('network-request-failed')
  ) {
    return {
      title: 'Connecting to Firebase...',
      message: 'The connection to Firebase is establishing. Your session is active, and your profile is being synchronized.',
      isOperationNotAllowed: false,
    };
  }

  return {
    title: 'Authentication Error',
    message: rawMessage.replace(/^Firebase:\s*/i, '') || 'An unexpected error occurred during authentication.',
    isOperationNotAllowed: false,
  };
}

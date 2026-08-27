import firebaseConfigData from '../../firebase-applet-config.json';

export interface AuthErrorInfo {
  title: string;
  message: string;
  isOperationNotAllowed?: boolean;
  isUnauthorizedDomain?: boolean;
  domain?: string;
  projectId?: string;
  consoleUrl?: string;
}

/**
 * Helper to translate Firebase Authentication error codes into actionable, user-friendly messages.
 */
export function getFriendlyAuthErrorMessage(err: any): AuthErrorInfo {
  const code = err?.code || '';
  const rawMessage = err?.message || '';
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfigData.projectId || 'parttime-hub';
  const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (
    code === 'auth/unauthorized-domain' ||
    rawMessage.includes('auth/unauthorized-domain') ||
    rawMessage.includes('unauthorized-domain')
  ) {
    return {
      title: 'Google Sign-in: Domain Not Authorized in Firebase',
      message: `Firebase blocked Google sign-in because "${currentDomain}" is not yet in the Authorized Domains list for project "${projectId}".`,
      isUnauthorizedDomain: true,
      domain: currentDomain,
      projectId,
      consoleUrl,
    };
  }

  if (
    code === 'auth/operation-not-allowed' ||
    rawMessage.includes('auth/operation-not-allowed') ||
    rawMessage.includes('operation-not-allowed')
  ) {
    return {
      title: 'Email/Password Authentication Disabled',
      message:
        'Email/Password sign-in is currently not enabled in your Firebase project. To enable it: open the Firebase Console, go to Authentication > Sign-in method, click "Email/Password", and toggle "Enable". In the meantime, you can also continue using Google Sign-In.',
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

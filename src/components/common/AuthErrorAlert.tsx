import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { AuthErrorInfo } from '../../utils/authErrors';

interface AuthErrorAlertProps {
  error: AuthErrorInfo | null;
  onContinueGoogle?: () => void;
  showGoogleAlternative?: boolean;
}

export const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({
  error,
  onContinueGoogle,
  showGoogleAlternative = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const currentDomain =
    error.domain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const consoleSettingsUrl =
    error.consoleUrl ||
    'https://console.firebase.google.com/project/parttime-hub/authentication/settings';

  const handleCopyDomain = () => {
    if (currentDomain && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="mb-6 p-4.5 bg-amber-50/90 border border-amber-200 text-amber-950 rounded-2xl text-xs space-y-3 shadow-xs">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <strong className="font-bold text-amber-900 block text-sm leading-tight">
            {error.title}
          </strong>
          <p className="text-amber-800 text-xs leading-relaxed">{error.message}</p>
        </div>
      </div>

      {/* Unauthorized Domain Resolution Guide */}
      {error.isUnauthorizedDomain && (
        <div className="pt-2 border-t border-amber-200/80 space-y-2.5">
          <div className="bg-white/90 border border-amber-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Your Current Domain to Authorize:</span>
              {copied ? (
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Check className="w-3.5 h-3.5" /> Copied!
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-slate-900 border border-slate-200 select-all overflow-x-auto">
                {currentDomain}
              </code>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Domain'}</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-amber-900 space-y-1.5 pl-0.5">
            <p className="font-bold text-amber-950">Quick 2-Step Fix in Firebase Console:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800">
              <li>
                Open{' '}
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-indigo-700 underline hover:text-indigo-900 inline-flex items-center gap-1"
                >
                  Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains
                  <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                Click <strong>"Add domain"</strong>, paste <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono font-bold text-amber-900">{currentDomain}</code>, and click <strong>Save</strong>.
              </li>
            </ol>
          </div>

          <div className="pt-1 text-[11px] text-slate-600 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200/60">
            💡 <em>Tip:</em> You can also use <strong>Email & Password registration/login</strong> right now on this form!
          </div>
        </div>
      )}

      {/* Operation Not Allowed Resolution Guide */}
      {error.isOperationNotAllowed && (
        <div className="pt-2 border-t border-amber-200/80 space-y-2">
          <p className="text-[11px] font-semibold text-amber-900">How to fix in Firebase Console:</p>
          <ol className="list-decimal list-inside text-[11px] text-amber-800 space-y-1 pl-1">
            <li>
              Open the{' '}
              <a
                href="https://console.firebase.google.com/project/parttime-hub/authentication/providers"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-indigo-700 underline inline-flex items-center gap-1"
              >
                Firebase Console &rarr; Sign-in method
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>Click on <strong>Email/Password</strong> and toggle <strong>Enable</strong></li>
            <li>Click <strong>Save</strong> and return here to register or log in</li>
          </ol>

          {showGoogleAlternative && onContinueGoogle && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onContinueGoogle}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                Continue with Google Instead
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

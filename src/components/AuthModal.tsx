import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onLogin: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  onRegister: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => { ok: true } | { ok: false; error: string };
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const res = onLogin(email, password);
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
      }
    } else {
      const res = onRegister({ name, email, password, confirmPassword });
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
      }
    }
  };

  const fillDemoAccount = () => {
    setMode('login');
    setEmail('demo@akool.studio');
    setPassword('demo1234');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131C] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="auth-modal-title" className="font-display text-xl font-bold text-white">
            {mode === 'login' ? 'Sign in to AKOOL' : 'Create your account'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-[#0B0B10] p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login' ? 'bg-[#5D4DF4] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`cursor-pointer rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'register' ? 'bg-[#5D4DF4] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-slate-300">
                Full Name
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="auth-confirm" className="block text-xs font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                id="auth-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
              />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F3FE6]"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 border-t border-white/[0.08] pt-4 text-center">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="cursor-pointer text-xs font-medium text-[#A5B4FC] hover:text-white"
            >
              Fill Demo Account (demo@akool.studio)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

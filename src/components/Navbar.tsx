import React from 'react';
import { Menu, X, Zap } from 'lucide-react';
import { UserAccount, getPlanById, isSubscriptionActive } from '../utils/authSubscription';

interface NavbarProps {
  currentUser: UserAccount | null;
  savedCount: number;
  onNavigateSection: (sectionId: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAccount: () => void;
  onOpenUpgrade: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  savedCount,
  onNavigateSection,
  onOpenAuth,
  onOpenAccount,
  onOpenUpgrade,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const activePlan =
    currentUser && isSubscriptionActive(currentUser)
      ? getPlanById(currentUser.planId)
      : null;

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0B0B10]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Brand mark matching reference */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onNavigateSection('top');
          }}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D4DF4] rounded-md"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <defs>
              <linearGradient id="akoolLoopGrad" x1="2" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path
              d="M10.5 11.5C7.46 11.5 5 13.96 5 17C5 20.04 7.46 22.5 10.5 22.5C13.9 22.5 15.8 18.9 17.5 16C19.2 13.1 21.1 9.5 24.5 9.5C27.54 9.5 30 11.96 30 15C30 18.04 27.54 20.5 24.5 20.5C21.8 20.5 19.9 18.2 18.6 16"
              stroke="url(#akoolLoopGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="9.5" r="3" stroke="url(#akoolLoopGrad)" strokeWidth="2.8" />
          </svg>
          <span className="font-display text-lg font-extrabold tracking-wider text-white">
            AKOOL
          </span>
        </a>

        {/* Zone 2: Clean single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300"
        >
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('studio');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
          >
            Studio
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('pricing');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
          >
            Pricing
          </a>
          <a
            href="#library"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('library');
            }}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-white"
          >
            Library{savedCount > 0 ? ` (${savedCount})` : ''}
          </a>
          {currentUser ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="whitespace-nowrap shrink-0 cursor-pointer text-slate-200 transition-colors hover:text-white"
            >
              {currentUser.name.split(' ')[0]}
              {activePlan ? ` · ${activePlan.name}` : ' · Free'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-white"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Zone 3: Primary CTA matching screenshot's Upgrade button */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-[#5D4DF4] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#4F3FE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8]"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{activePlan ? 'Plans' : 'Upgrade'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-200 hover:bg-white/5 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/[0.08] bg-[#101018] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-200">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection('studio');
              }}
              className="py-1.5 text-left hover:text-white"
            >
              Studio Tools
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection('pricing');
              }}
              className="py-1.5 text-left hover:text-white"
            >
              Pricing Plans
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection('library');
              }}
              className="py-1.5 text-left hover:text-white"
            >
              Saved Library ({savedCount})
            </button>
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAccount();
                }}
                className="py-1.5 text-left text-[#A5B4FC] hover:text-white"
              >
                Account ({currentUser.name})
              </button>
            ) : (
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="flex-1 rounded-lg border border-white/15 py-2 text-center text-xs font-semibold text-white"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="flex-1 rounded-lg bg-[#5D4DF4] py-2 text-center text-xs font-semibold text-white"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

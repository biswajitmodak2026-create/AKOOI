import React from 'react';
import { LogOut, User, X } from 'lucide-react';
import {
  UserAccount,
  getPlanById,
  getRemainingDays,
  isSubscriptionActive,
} from '../utils/authSubscription';

interface AccountModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  onClose: () => void;
  onLogout: () => void;
  onOpenPricing: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  onOpenPricing,
}) => {
  if (!isOpen || !user) return null;

  const active = isSubscriptionActive(user);
  const plan = active ? getPlanById(user.planId) : null;
  const remaining = getRemainingDays(user.planExpiresAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131C] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="account-modal-title" className="font-display text-xl font-bold text-white">
            Your Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3.5 rounded-xl border border-white/10 bg-[#0B0B10] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5D4DF4]/20 text-[#A5B4FC]">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-[#0B0B10] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Subscription Status</span>
            <span
              className={`text-xs font-semibold ${
                active ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {active ? 'Active' : 'Free Tier'}
            </span>
          </div>
          <p className="mt-1 font-display text-base font-bold text-white">
            {plan ? `${plan.name} ($${plan.priceUsd} / ${plan.billingCycleLabel})` : 'Free Local Access'}
          </p>
          {active && (
            <p className="mt-1 font-mono-tabular text-xs text-slate-400">
              {remaining} days remaining
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="mt-4 w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-2.5 text-xs font-semibold text-white hover:bg-[#4F3FE6]"
          >
            {active ? 'Change or Renew Plan' : 'Upgrade Subscription ($3 / $5 / $50)'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Check } from 'lucide-react';
import {
  PlanId,
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  UserAccount,
  getRemainingDays,
  isSubscriptionActive,
} from '../utils/authSubscription';

interface PricingSectionProps {
  currentUser: UserAccount | null;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  currentUser,
  onSelectPlan,
}) => {
  const activePlanId: PlanId =
    currentUser && isSubscriptionActive(currentUser) ? currentUser.planId : 'free';
  const remainingDays = currentUser ? getRemainingDays(currentUser.planExpiresAt) : 0;

  return (
    <section id="pricing" className="scroll-mt-16 border-t border-white/[0.08] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
            Simple Subscription Plans
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            Choose a pass for 15 days, 1 month, or 1 full year. All creative tools run locally in your browser without external APIs.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = activePlanId === plan.id;
            const isPopular = plan.id === '1m';

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition-colors ${
                  isPopular
                    ? 'border-[#5D4DF4] bg-[#151524]'
                    : 'border-white/10 bg-[#13131C]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold text-white">
                      {plan.name}
                    </h3>
                    {plan.badgeLabel && (
                      <span className="whitespace-nowrap text-xs font-semibold text-[#A5B4FC]">
                        {plan.badgeLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-400">{plan.audienceLabel}</p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display font-mono-tabular text-4xl font-extrabold text-white">
                      ${plan.priceUsd}
                    </span>
                    <span className="text-sm text-slate-400">/ {plan.billingCycleLabel}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 font-mono-tabular">
                    <span className="whitespace-nowrap">{plan.durationDays} days access</span>
                    <span aria-hidden="true">·</span>
                    <span className="whitespace-nowrap">{plan.maxResolution}</span>
                    {plan.savingsNote && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="whitespace-nowrap text-emerald-400">{plan.savingsNote}</span>
                      </>
                    )}
                  </div>

                  <ul className="mt-6 space-y-3 border-t border-white/[0.08] pt-5 text-sm text-slate-300">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#818CF8]" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-7">
                  {isCurrent ? (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-xs font-semibold text-emerald-300">
                      Active Plan · {remainingDays} days remaining
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      className={`w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                        isPopular
                          ? 'bg-[#5D4DF4] text-white hover:bg-[#4F3FE6]'
                          : 'border border-white/15 bg-[#0B0B10] text-white hover:border-[#5D4DF4] hover:bg-[#191926]'
                      }`}
                    >
                      Subscribe for ${plan.priceUsd}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

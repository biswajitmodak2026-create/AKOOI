import React, { useState } from 'react';
import { Building2, CheckCircle2, CreditCard, ShieldCheck, Smartphone, X } from 'lucide-react';
import {
  PaymentMethod,
  SubscriptionPlan,
  UserAccount,
  validatePaymentInput,
} from '../utils/authSubscription';

interface CheckoutModalProps {
  plan: SubscriptionPlan | null;
  currentUser: UserAccount | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onConfirmSubscription: (planId: SubscriptionPlan['id']) => void;
}

const UPI_APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM UPI'] as const;

const NET_BANKING_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
] as const;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  currentUser,
  onClose,
  onRequireAuth,
  onConfirmSubscription,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');

  // UPI state
  const [upiApp, setUpiApp] = useState<string>('GPay');
  const [upiId, setUpiId] = useState<string>('creator@okaxis');

  // Net Banking state
  const [bankName, setBankName] = useState<string>(NET_BANKING_BANKS[0]);
  const [accountHolder, setAccountHolder] = useState<string>(currentUser?.name ?? '');

  // Card state
  const [cardName, setCardName] = useState(currentUser?.name ?? '');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('842');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (plan) {
      setCardName(currentUser?.name ?? '');
      setAccountHolder(currentUser?.name ?? '');
      setError(null);
      setSuccess(false);
    }
    // Only reset modal state when opening a new plan checkout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  if (!plan) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const validation =
      paymentMethod === 'upi'
        ? validatePaymentInput({ method: 'upi', upiId })
        : paymentMethod === 'netbanking'
          ? validatePaymentInput({ method: 'netbanking', bankName, accountHolder })
          : validatePaymentInput({ method: 'card', cardName, cardNumber, expiry, cvc });

    if (!validation.valid) {
      setError(validation.error ?? 'Please check payment details.');
      return;
    }

    setError(null);
    onConfirmSubscription(plan.id);
    setSuccess(true);
  };

  const methodSummary =
    paymentMethod === 'upi'
      ? `UPI (${upiApp} · ${upiId.trim()})`
      : paymentMethod === 'netbanking'
        ? `Net Banking (${bankName})`
        : 'Card';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#13131C] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 id="checkout-title" className="font-display text-xl font-bold text-white">
            Activate {plan.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-bold text-white">
              Subscription Activated
            </h3>
            <p className="mt-1.5 text-sm text-slate-400">
              Your {plan.name} (${plan.priceUsd} / {plan.billingCycleLabel}) is active for {plan.durationDays} days via {methodSummary}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-3 text-sm font-semibold text-white hover:bg-[#4F3FE6]"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0B0B10] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="text-xs text-slate-400">
                  {plan.durationDays} days · {plan.maxResolution} local export
                </p>
              </div>
              <p className="font-display font-mono-tabular text-xl font-bold text-white">
                ${plan.priceUsd}
              </p>
            </div>

            {!currentUser ? (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
                <p className="font-medium">Sign in or create an account first to attach this plan to your profile.</p>
                <button
                  type="button"
                  onClick={onRequireAuth}
                  className="mt-3 w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-2.5 text-xs font-semibold text-white hover:bg-[#4F3FE6]"
                >
                  Login or Register
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirm} className="mt-5 space-y-4">
                {/* Payment Method Switcher: UPI | Net Banking | Card */}
                <div>
                  <span className="block text-xs font-medium text-slate-300">
                    Select Payment Method
                  </span>
                  <div
                    role="tablist"
                    aria-label="Payment methods"
                    className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl bg-[#0B0B10] p-1"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentMethod === 'upi'}
                      onClick={() => {
                        setPaymentMethod('upi');
                        setError(null);
                      }}
                      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                        paymentMethod === 'upi'
                          ? 'bg-[#5D4DF4] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>UPI</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentMethod === 'netbanking'}
                      onClick={() => {
                        setPaymentMethod('netbanking');
                        setError(null);
                      }}
                      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                        paymentMethod === 'netbanking'
                          ? 'bg-[#5D4DF4] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Net Banking</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={paymentMethod === 'card'}
                      onClick={() => {
                        setPaymentMethod('card');
                        setError(null);
                      }}
                      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                        paymentMethod === 'card'
                          ? 'bg-[#5D4DF4] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                {/* UPI Form */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-3.5">
                    <div>
                      <span className="block text-xs font-medium text-slate-300">
                        Choose UPI App
                      </span>
                      <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                        {UPI_APPS.map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => setUpiApp(app)}
                            className={`cursor-pointer rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors ${
                              upiApp === app
                                ? 'border-[#5D4DF4] bg-[#5D4DF4]/20 text-white'
                                : 'border-white/10 bg-[#0B0B10] text-slate-400 hover:text-white'
                            }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="checkout-upi-id" className="block text-xs font-medium text-slate-300">
                        UPI ID / VPA
                      </label>
                      <input
                        id="checkout-upi-id"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="font-mono-tabular mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Net Banking Form */}
                {paymentMethod === 'netbanking' && (
                  <div className="space-y-3.5">
                    <div>
                      <label htmlFor="checkout-bank" className="block text-xs font-medium text-slate-300">
                        Select Bank
                      </label>
                      <select
                        id="checkout-bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
                      >
                        {NET_BANKING_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="checkout-account-holder" className="block text-xs font-medium text-slate-300">
                        Account Holder Name
                      </label>
                      <input
                        id="checkout-account-holder"
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Account holder full name"
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#5D4DF4] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Card Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3.5">
                    <div>
                      <label htmlFor="checkout-name" className="block text-xs font-medium text-slate-300">
                        Cardholder Name
                      </label>
                      <input
                        id="checkout-name"
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="checkout-card" className="block text-xs font-medium text-slate-300">
                        Card Number
                      </label>
                      <div className="relative mt-1.5">
                        <CreditCard className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                          id="checkout-card"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="font-mono-tabular w-full rounded-xl border border-white/10 bg-[#0B0B10] py-2.5 pl-10 pr-3.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="checkout-exp" className="block text-xs font-medium text-slate-300">
                          Expiry
                        </label>
                        <input
                          id="checkout-exp"
                          type="text"
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="font-mono-tabular mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="checkout-cvc" className="block text-xs font-medium text-slate-300">
                          CVC
                        </label>
                        <input
                          id="checkout-cvc"
                          type="text"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value)}
                          className="font-mono-tabular mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B0B10] px-3.5 py-2.5 text-sm text-white focus:border-[#5D4DF4] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <p role="alert" className="text-xs font-medium text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-xl bg-[#5D4DF4] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F3FE6]"
                >
                  Pay ${plan.priceUsd} via {paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'netbanking' ? 'Net Banking' : 'Card'}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Processed locally in-browser · No external payment API called</span>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

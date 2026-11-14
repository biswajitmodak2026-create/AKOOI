import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBSCRIPTION_PLANS,
  applySubscription,
  authenticateUser,
  calculatePlanExpiry,
  createSeedUsers,
  getRemainingDays,
  isSubscriptionActive,
  registerUser,
  validatePaymentInput,
  validateRegistration,
  validateUpiId,
} from './authSubscription';

test('subscription plans match requested $3/15d, $5/1m, and $50/1y tiers', () => {
  assert.equal(SUBSCRIPTION_PLANS.length, 3);
  const p15 = SUBSCRIPTION_PLANS.find((p) => p.id === '15d');
  const p1m = SUBSCRIPTION_PLANS.find((p) => p.id === '1m');
  const p1y = SUBSCRIPTION_PLANS.find((p) => p.id === '1y');

  assert.equal(p15?.priceUsd, 3);
  assert.equal(p15?.durationDays, 15);
  assert.equal(p1m?.priceUsd, 5);
  assert.equal(p1m?.durationDays, 30);
  assert.equal(p1y?.priceUsd, 50);
  assert.equal(p1y?.durationDays, 365);
});

test('registration validation catches invalid email, short password, and mismatched passwords', () => {
  assert.equal(
    validateRegistration({
      name: 'A',
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password1',
    }).valid,
    false
  );
  assert.equal(
    validateRegistration({
      name: 'Alex Morgan',
      email: 'not-an-email',
      password: 'password1',
      confirmPassword: 'password1',
    }).valid,
    false
  );
  assert.equal(
    validateRegistration({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: '123',
      confirmPassword: '123',
    }).valid,
    false
  );
  assert.equal(
    validateRegistration({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password1',
      confirmPassword: 'password2',
    }).valid,
    false
  );
  assert.equal(
    validateRegistration({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      password: 'password1',
      confirmPassword: 'password1',
    }).valid,
    true
  );
});

test('registerUser, authenticateUser, and duplicate email guard work end-to-end', () => {
  const now = 1_700_000_000_000;
  const seed = createSeedUsers(now);

  const reg = registerUser(
    seed,
    {
      name: 'Maya Lin',
      email: 'Maya@Studio.io',
      password: 'secret99',
      confirmPassword: 'secret99',
    },
    now
  );
  assert.equal(reg.ok, true);
  if (!reg.ok) return;

  assert.equal(reg.user.email, 'maya@studio.io');
  assert.equal(reg.user.planId, 'free');

  const dup = registerUser(
    reg.users,
    {
      name: 'Maya Duplicate',
      email: 'maya@studio.io',
      password: 'secret99',
      confirmPassword: 'secret99',
    },
    now
  );
  assert.equal(dup.ok, false);

  const loginOk = authenticateUser(reg.users, 'maya@studio.io', 'secret99');
  assert.equal(loginOk.ok, true);

  const loginFail = authenticateUser(reg.users, 'maya@studio.io', 'wrongpass');
  assert.equal(loginFail.ok, false);
});

test('applySubscription activates 15d, 1m, and 1y plans with accurate expiry math', () => {
  const now = 1_700_000_000_000;
  const seed = createSeedUsers(now);
  const demoId = seed[0].id;

  const sub15 = applySubscription(seed, demoId, '15d', now);
  assert.equal(sub15.ok, true);
  if (!sub15.ok) return;
  assert.equal(getRemainingDays(sub15.user.planExpiresAt, now), 15);
  assert.equal(isSubscriptionActive(sub15.user, now), true);

  const sub1m = applySubscription(sub15.users, demoId, '1m', now);
  assert.equal(sub1m.ok, true);
  if (!sub1m.ok) return;
  assert.equal(getRemainingDays(sub1m.user.planExpiresAt, now), 30);

  const sub1y = applySubscription(sub1m.users, demoId, '1y', now);
  assert.equal(sub1y.ok, true);
  if (!sub1y.ok) return;
  assert.equal(getRemainingDays(sub1y.user.planExpiresAt, now), 365);

  const expiry = calculatePlanExpiry('1y', now);
  assert.equal(isSubscriptionActive(sub1y.user, expiry + 1), false);
});

test('validateUpiId and validatePaymentInput enforce UPI, Net Banking, and Card rules', () => {
  assert.equal(validateUpiId('creator@okaxis'), true);
  assert.equal(validateUpiId('maya.lin_1@ybl'), true);
  assert.equal(validateUpiId('bad-upi'), false);
  assert.equal(validateUpiId('a@1'), false);

  assert.equal(
    validatePaymentInput({ method: 'upi', upiId: 'creator@okicici' }).valid,
    true
  );
  assert.equal(
    validatePaymentInput({ method: 'upi', upiId: 'invalid' }).valid,
    false
  );

  assert.equal(
    validatePaymentInput({
      method: 'netbanking',
      bankName: 'HDFC Bank',
      accountHolder: 'Maya Lin',
    }).valid,
    true
  );
  assert.equal(
    validatePaymentInput({
      method: 'netbanking',
      bankName: 'HDFC Bank',
      accountHolder: 'M',
    }).valid,
    false
  );
});

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AccountModal } from './components/AccountModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { HeroShowcase, StudioTabId } from './components/HeroShowcase';
import { LibrarySection } from './components/LibrarySection';
import { Navbar } from './components/Navbar';
import { PricingSection } from './components/PricingSection';
import { StudioWorkspace } from './components/StudioWorkspace';
import {
  SavedStudioItem,
  SubscriptionPlan,
  UserAccount,
  applySubscription,
  authenticateUser,
  registerUser,
} from './utils/authSubscription';
import {
  loadSavedProjects,
  loadSessionUserId,
  loadStoredUsers,
  saveProjects,
  saveSessionUserId,
  saveStoredUsers,
} from './utils/storage';

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(() => loadStoredUsers());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => loadSessionUserId());
  const [savedProjects, setSavedProjects] = useState<SavedStudioItem[]>(() => loadSavedProjects());

  const [activeTool, setActiveTool] = useState<StudioTabId>('text-to-video');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);

  const currentUser = users.find((u) => u.id === sessionUserId) ?? null;

  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    saveSessionUserId(sessionUserId);
  }, [sessionUserId]);

  useEffect(() => {
    saveProjects(savedProjects);
  }, [savedProjects]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectTool = (tool: StudioTabId) => {
    setActiveTool(tool);
    scrollToSection('studio');
  };

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogin = (email: string, password: string) => {
    const res = authenticateUser(users, email, password);
    if (!res.ok) return res;
    setSessionUserId(res.user.id);
    return { ok: true as const };
  };

  const handleRegister = (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = registerUser(users, input);
    if (!res.ok) return res;
    setUsers(res.users);
    setSessionUserId(res.user.id);
    return { ok: true as const };
  };

  const handleLogout = () => {
    setSessionUserId(null);
  };

  const handleConfirmSubscription = (planId: SubscriptionPlan['id']) => {
    if (!currentUser) return;
    const res = applySubscription(users, currentUser.id, planId);
    if (res.ok) {
      setUsers(res.users);
    }
  };

  const handleSaveProject = (item: SavedStudioItem) => {
    setSavedProjects((prev) => [item, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0B0B10] text-slate-100">
      <Navbar
        currentUser={currentUser}
        savedCount={savedProjects.length}
        onNavigateSection={scrollToSection}
        onOpenAuth={handleOpenAuth}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenUpgrade={() => scrollToSection('pricing')}
      />

      <main>
        <HeroShowcase
          onSelectTool={handleSelectTool}
          onTryFree={() => scrollToSection('studio')}
          onOpenAuthRegister={() => handleOpenAuth('register')}
          isLoggedIn={Boolean(currentUser)}
        />

        <StudioWorkspace
          activeTab={activeTool}
          onChangeTab={setActiveTool}
          onSaveProject={handleSaveProject}
        />

        <PricingSection
          currentUser={currentUser}
          onSelectPlan={(plan) => setCheckoutPlan(plan)}
        />

        <LibrarySection
          items={savedProjects}
          onDeleteItem={handleDeleteProject}
          onJumpToStudio={() => scrollToSection('studio')}
        />
      </main>

      <footer className="border-t border-white/[0.08] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold tracking-wider text-slate-200">AKOOL</span>
            <span aria-hidden="true">·</span>
            <span>Client-side video, voice, and photo studio (zero external APIs)</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#studio" onClick={(e) => { e.preventDefault(); scrollToSection('studio'); }} className="hover:text-slate-300">
              Studio
            </a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="hover:text-slate-300">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => handleOpenAuth('register')}
              className="cursor-pointer hover:text-slate-300"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => handleOpenAuth('login')}
              className="cursor-pointer hover:text-slate-300"
            >
              Login
            </button>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <CheckoutModal
        plan={checkoutPlan}
        currentUser={currentUser}
        onClose={() => setCheckoutPlan(null)}
        onRequireAuth={() => {
          setCheckoutPlan(null);
          handleOpenAuth('login');
        }}
        onConfirmSubscription={handleConfirmSubscription}
      />

      <AccountModal
        isOpen={accountModalOpen}
        user={currentUser}
        onClose={() => setAccountModalOpen(false)}
        onLogout={handleLogout}
        onOpenPricing={() => scrollToSection('pricing')}
      />
    </div>
  );
}

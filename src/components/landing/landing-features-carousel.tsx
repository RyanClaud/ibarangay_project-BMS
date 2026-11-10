'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldAlert,
  Users,
  CreditCard,
  PhoneCall,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  QrCode,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Activity,
  HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface FeatureSlide {
  id: string;
  category: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: React.ElementType;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
  accentColor: string;
  gradientBg: string;
  mockupType: 'clearance' | 'blotter' | 'census' | 'finance' | 'hotline' | 'ai';
}

const FEATURE_SLIDES: FeatureSlide[] = [
  {
    id: 'document-clearance',
    category: 'Digital Governance • RA 11032',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-300',
    badgeBorder: 'border-blue-400/30',
    icon: FileText,
    title: 'Paperless Document Issuance & Instant QR Verification',
    tagline: 'Zero Queues. Fast Approval. Tamper-Proof.',
    description:
      'Residents apply online for Barangay Clearance, Certificate of Residency, Indigency, and Business Permits. Every issued document features an official QR code for instant third-party validation.',
    highlights: [
      'Automated resident census cross-matching',
      'Tamper-proof digital seal with unique QR code',
      'Real-time SMS & in-app status updates',
      'Compliant with Anti-Red Tape Authority (ARTA)',
    ],
    ctaLabel: 'Apply for Clearance',
    ctaHref: '/register',
    accentColor: '#246BDE',
    gradientBg: 'from-[#0B1E38] via-[#102D56] to-[#1A4580]',
    mockupType: 'clearance',
  },
  {
    id: 'incident-blotter',
    category: 'Peace & Order • Lupon Tagapamayapa',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-300',
    badgeBorder: 'border-red-400/30',
    icon: ShieldAlert,
    title: 'Confidential Blotter Reporting & Conciliation Mediation',
    tagline: 'Secure. Objective. Tracked from Hearing to Resolution.',
    description:
      'Empower citizens to report neighborhood incidents, disturbances, or grievances securely. Barangay officials manage mediation schedules, hearing summons, and settlement agreements with full audit trails.',
    highlights: [
      'Private incident submission with attachment support',
      'Lupon Tagapamayapa mediation case management',
      'Automated hearing summons and notice generation',
      'Peace & order crime statistics for LGU Bongabong',
    ],
    ctaLabel: 'File Incident Report',
    ctaHref: '/register',
    accentColor: '#EF4655',
    gradientBg: 'from-[#191C28] via-[#242A42] to-[#2D3854]',
    mockupType: 'blotter',
  },
  {
    id: 'resident-census',
    category: 'Demographics & Social Services',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-400/30',
    icon: Users,
    title: 'Comprehensive Census & Demographic Resident Profiling',
    tagline: 'Accurate Data for Targeted Social Welfare & Subsidies.',
    description:
      'Centralized household census tracking with specialized vulnerability tags. Quickly identify beneficiaries for senior citizen aid, PWD assistance, solo parent benefits, and national 4Ps subsidies.',
    highlights: [
      'Household and purok-level mapping',
      'Specialized vulnerability tags: Senior, PWD, Solo Parent, 4Ps',
      'Instant resident search & identity verification',
      'Strict compliance with RA 10173 Data Privacy Act',
    ],
    ctaLabel: 'Explore Resident Portal',
    ctaHref: '/register',
    accentColor: '#10A875',
    gradientBg: 'from-[#0A2623] via-[#0E4238] to-[#146050]',
    mockupType: 'census',
  },
  {
    id: 'financial-transparency',
    category: 'Treasury & Revenue • Full Accountability',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-400/30',
    icon: CreditCard,
    title: 'Transparent Payment Tracking & Official Fee Auditing',
    tagline: 'Eliminate Discrepancies with Automated Financial Ledgers.',
    description:
      'Digitized collection for regulatory fees, business clearances, and document requests. Generates automated electronic receipts, financial statements, and end-of-day treasury reconciliation.',
    highlights: [
      'Official document pricing per barangay ordinance',
      'Automated digital payment and cash collection logs',
      'Daily, monthly, and annual financial breakdown',
      'COA-compliant auditable accounting records',
    ],
    ctaLabel: 'View Financial Features',
    ctaHref: '/login',
    accentColor: '#8B5CF6',
    gradientBg: 'from-[#1E1438] via-[#2D1B54] to-[#402674]',
    mockupType: 'finance',
  },
  {
    id: 'emergency-responders',
    category: 'Public Safety • 24/7 Hotline Directory',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-400/30',
    icon: PhoneCall,
    title: 'Instant Emergency Hotlines & Disaster Responder Directory',
    tagline: 'Rapid One-Tap Lifeline for Every Resident in Mina de Oro.',
    description:
      'Direct contact directory for Barangay Patrol, Duty Desk, Municipal Disaster Risk Reduction & Management Office (MDRRMO Rescue 911), and local police stations during medical, fire, or weather crises.',
    highlights: [
      'One-tap calling on mobile devices',
      'Configurable contact directory per barangay in Bongabong',
      '24/7 duty desk and disaster response coordination',
      'Fast coordination during typhoon and calamity alerts',
    ],
    ctaLabel: 'Emergency Contacts',
    ctaHref: '/login',
    accentColor: '#0EA5E9',
    gradientBg: 'from-[#07243A] via-[#0B395B] to-[#125380]',
    mockupType: 'hotline',
  },
  {
    id: 'ai-analytics',
    category: 'Smart Governance • Google Gemini AI',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-400/30',
    icon: Sparkles,
    title: 'AI-Powered Demographics & Predictive Executive Insights',
    tagline: 'Data-Driven Local Policies and Intelligent Reporting.',
    description:
      'Harnessing cutting-edge AI models to synthesize community trends, highlight health service needs, forecast barangay clearance demands, and draft comprehensive executive summaries for municipal leaders.',
    highlights: [
      'Automated demographic trend forecasting',
      'Seasonal disaster preparedness recommendations',
      'Automated executive summaries for DILG Bongabong',
      'Genkit and Google Gemini AI integration',
    ],
    ctaLabel: 'See AI Analytics',
    ctaHref: '/login',
    accentColor: '#F59E0B',
    gradientBg: 'from-[#261E0A] via-[#3D3012] to-[#594619]',
    mockupType: 'ai',
  },
];

export function LandingFeaturesCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play interval
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const activeSlide = FEATURE_SLIDES[activeIndex];
  const IconComponent = activeSlide.icon;

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + FEATURE_SLIDES.length) % FEATURE_SLIDES.length);
  };

  return (
    <div
      className="relative w-full max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/10 bg-[#0C2340] text-white transition-all duration-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Slide Tab Bar */}
      <div className="bg-[#08182D] border-b border-white/10 px-4 py-3 overflow-x-auto scrollbar-none flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {FEATURE_SLIDES.map((slide, idx) => {
            const TabIcon = slide.icon;
            const isSelected = idx === activeIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#246BDE] text-white shadow-sm ring-1 ring-white/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className={`size-3.5 ${isSelected ? 'text-white' : 'text-white/60'}`} />
                <span className="hidden sm:inline">{slide.title.split(' ')[0]}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation Arrows & Counter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-medium text-white/80">
            <span className="font-bold text-white">{activeIndex + 1}</span>
            <span className="text-white/40">/</span>
            <span>{FEATURE_SLIDES.length}</span>
          </div>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="flex size-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="flex size-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Body */}
      <div
        className={`relative p-6 sm:p-8 lg:p-10 bg-gradient-to-br ${activeSlide.gradientBg} transition-all duration-700`}
      >
        {/* Subtle decorative civic watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none overflow-hidden hidden md:block">
          <div className="absolute -right-16 -top-16 size-80 rounded-full border-[32px] border-white/20" />
          <div className="absolute -right-28 -bottom-16 size-96 rounded-full border-[48px] border-white/10" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          {/* Left: Text & Features Details */}
          <div className="lg:col-span-7 space-y-5">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${activeSlide.badgeBg} ${activeSlide.badgeText} ${activeSlide.badgeBorder}`}
              >
                <IconComponent className="size-3.5" />
                {activeSlide.category}
              </span>
            </div>

            {/* Slide Title */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {activeSlide.title}
              </h3>
              <p className="text-sm font-semibold text-white/80 mt-1">
                {activeSlide.tagline}
              </p>
            </div>

            {/* Slide Description */}
            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              {activeSlide.description}
            </p>

            {/* Key Capabilities Checklist */}
            <div className="grid sm:grid-cols-2 gap-2.5 pt-2">
              {activeSlide.highlights.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-white/90">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Slide Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
              <Link href={activeSlide.ctaHref}>
                <Button
                  className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm h-11 px-6 rounded-xl shadow-lg hover:shadow-xl gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>{activeSlide.ctaLabel}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  className="border-white/30 text-white bg-white/5 hover:bg-white/15 font-semibold text-sm h-11 px-5 rounded-xl transition-all"
                >
                  Staff Console
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: Realistic UI Visual Mockup Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-white/95 text-slate-900 rounded-2xl p-5 shadow-2xl border border-white/40 backdrop-blur-md transform transition-all duration-500 hover:scale-[1.01]">
              {/* Mockup Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-[#102D56] flex items-center justify-center text-white text-xs font-bold">
                    iB
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#102D56] leading-tight">Barangay Mina de Oro</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Bongabong, Oriental Mindoro</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ● Live System
                </span>
              </div>

              {/* Mockup Dynamic Content */}
              {activeSlide.mockupType === 'clearance' && (
                <div className="py-4 space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-blue-700">Official Document</span>
                      <p className="text-sm font-bold text-slate-900">Barangay Clearance</p>
                      <p className="text-xs text-slate-600">Doc No: BC-2026-08492</p>
                    </div>
                    <div className="size-12 bg-white rounded-lg p-1 border border-blue-200 flex items-center justify-center shadow-xs">
                      <QrCode className="size-10 text-slate-800" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Applicant:</span>
                      <span className="font-semibold text-slate-900">Juan Dela Cruz</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Purok:</span>
                      <span className="font-semibold text-slate-900">Purok 2 (Centro)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Purpose:</span>
                      <span className="font-semibold text-slate-900">Local Employment</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Official Fee:</span>
                      <span className="font-bold text-blue-600">₱50.00 (Paid)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.mockupType === 'blotter' && (
                <div className="py-4 space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-red-700">Incident Blotter</span>
                      <p className="text-sm font-bold text-slate-900">Case #2026-LUP-019</p>
                      <p className="text-xs text-slate-600">Status: Scheduled for Mediation</p>
                    </div>
                    <ShieldAlert className="size-8 text-red-600" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nature:</span>
                      <span className="font-semibold text-slate-900">Noise Disturbance / Property</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">1st Hearing:</span>
                      <span className="font-semibold text-emerald-700">Tomorrow, 9:00 AM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Mediator:</span>
                      <span className="font-semibold text-slate-900">Punong Barangay / Lupon</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.mockupType === 'census' && (
                <div className="py-4 space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">Demographic Registry</span>
                      <p className="text-sm font-bold text-slate-900">52 Verified Residents</p>
                      <p className="text-xs text-slate-600">Mina de Oro Pilot Ward</p>
                    </div>
                    <Users className="size-8 text-emerald-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <p className="text-slate-500 text-[10px]">Seniors (60+)</p>
                      <p className="font-bold text-slate-900 text-sm">14 Records</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <p className="text-slate-500 text-[10px]">PWD Citizens</p>
                      <p className="font-bold text-slate-900 text-sm">6 Records</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <p className="text-slate-500 text-[10px]">Solo Parents</p>
                      <p className="font-bold text-slate-900 text-sm">9 Records</p>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-lg">
                      <p className="text-slate-500 text-[10px]">4Ps Beneficiary</p>
                      <p className="font-bold text-slate-900 text-sm">18 Households</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.mockupType === 'finance' && (
                <div className="py-4 space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700">Barangay Treasury</span>
                      <p className="text-sm font-bold text-slate-900">₱42,850.00 Collected</p>
                      <p className="text-xs text-slate-600">Current Billing Cycle</p>
                    </div>
                    <CreditCard className="size-8 text-purple-600" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Clearance Collections:</span>
                      <span className="font-semibold text-slate-900">₱18,250.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Business Permits:</span>
                      <span className="font-semibold text-slate-900">₱24,600.00</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Audited By:</span>
                      <span className="font-semibold text-slate-900">Barangay Treasurer</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.mockupType === 'hotline' && (
                <div className="py-4 space-y-2.5">
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700">Emergency Dispatch</span>
                      <p className="text-sm font-bold text-slate-900">Public Safety Hotlines</p>
                    </div>
                    <PhoneCall className="size-6 text-sky-600" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-800">Duty Desk:</span>
                      <span className="font-bold text-blue-600">(043) 288-1234</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-800">MDRRMO Rescue:</span>
                      <span className="font-bold text-emerald-600">911 / 0917-123-4567</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-medium text-slate-800">Police Patrol:</span>
                      <span className="font-bold text-red-600">166</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.mockupType === 'ai' && (
                <div className="py-4 space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Genkit AI Analytics</span>
                      <p className="text-sm font-bold text-slate-900">Executive Summary</p>
                      <p className="text-xs text-slate-600">Mina de Oro Demographic Trend</p>
                    </div>
                    <Sparkles className="size-8 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    &ldquo;Senior citizen population increased by 8% this quarter. Recommend expanding medicine allocation at the Barangay Health Center.&rdquo;
                  </p>
                </div>
              )}

              {/* Mockup Footer */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  256-bit SSL Protected
                </span>
                <span>DICT Region IV-B</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sleek Indicator Bar */}
      <div className="bg-[#08182D] px-6 py-3 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Activity className="size-3.5 text-[#246BDE]" />
          <span className="hidden sm:inline">Auto-advancing overview of iBarangay capabilities</span>
          <span className="sm:hidden">Swipe or tap tabs above</span>
        </div>

        <div className="flex items-center gap-1.5">
          {FEATURE_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className="p-0 border-0 outline-none cursor-pointer rounded-full transition-all duration-300 block"
              style={{
                width: idx === activeIndex ? '28px' : '8px',
                height: '7px',
                backgroundColor: idx === activeIndex ? '#246BDE' : 'rgba(255, 255, 255, 0.25)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


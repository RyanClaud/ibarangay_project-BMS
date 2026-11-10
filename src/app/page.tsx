'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  FileText,
  Users,
  Shield,
  Zap,
  Building2,
  Globe,
  Smartphone,
  PhoneCall,
  CheckCircle2,
  Sparkles,
  Lock,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { LandingFeaturesCarousel } from '@/components/landing/landing-features-carousel';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-slate-900 selection:bg-[#246BDE] selection:text-white flex flex-col justify-between">
      {/* Top Municipal Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#102D56]/95 backdrop-blur-md shadow-md py-3 border-b border-white/10'
            : 'bg-[#102D56] py-4 border-b border-white/10'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo & Seal */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex size-11 items-center justify-center rounded-full bg-white/10 ring-2 ring-yellow-400/50 shrink-0 overflow-hidden shadow-sm transition-transform group-hover:scale-105">
              <img
                src="/images/barangay-seal.png"
                alt="iBarangay Official Seal"
                className="size-11 object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white leading-none">
                  iBarangay
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#246BDE] text-white tracking-wide uppercase">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-white/70 font-normal leading-tight mt-0.5">
                Municipality of Bongabong • Oriental Mindoro
              </p>
            </div>
          </Link>

          {/* Action Links */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-white/10 font-medium text-xs sm:text-sm h-10 px-4 rounded-xl"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-xs sm:text-sm h-10 px-5 rounded-xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5">
                <span>Register Portal</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-[#102D56] via-[#123668] to-[#1A4580] text-white">
        {/* Subtle decorative civic ambient rings */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute -top-32 -right-32 size-[500px] rounded-full border-[60px] border-white/20 blur-sm" />
          <div className="absolute top-1/2 -left-32 size-[400px] rounded-full border-[50px] border-blue-400/20 blur-sm" />
        </div>

        <div className="container mx-auto relative z-10 max-w-6xl space-y-10">
          {/* Top Intro Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white/90 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DICT MIMAROPA Region IV-B • LGU Bongabong Pilot System</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              A Smarter, Transparent, and Connected{' '}
              <span className="bg-gradient-to-r from-blue-300 via-sky-200 to-yellow-200 bg-clip-text text-transparent">
                Barangay Experience
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              The integrated digital governance platform for Oriental Mindoro. Request clearances online, track incident blotters, access emergency responders, and manage community records.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm h-11 px-7 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] gap-2">
                  <span>Create Resident Account</span>
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold text-sm h-11 px-7 rounded-xl transition-all"
                >
                  Access Staff Portal
                </Button>
              </Link>
            </div>
          </div>

          {/* Grand Panoramic Civic Banner Showcase - 100% CLEAR, UNCROPPED, VIBRANT */}
          <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/25 bg-white ring-4 ring-black/15 group transition-transform hover:scale-[1.005] duration-300">
            <div className="relative w-full aspect-[1200/380] bg-sky-100 overflow-hidden">
              <img
                src="/images/barangay-hero-banner.jpg"
                alt="iBarangay Digital Barangay Management System"
                className="w-full h-full object-contain sm:object-cover object-center"
              />
            </div>
            {/* Live Status Floating Pill */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-md text-[#102D56] text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full shadow-md border border-slate-200 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official Digital System • Mina de Oro</span>
            </div>
          </div>

          {/* Fast Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-white/80 font-medium mt-1">Online Clearance Workflow</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-300">52+</p>
              <p className="text-xs text-white/80 font-medium mt-1">Verified Census Records</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-yellow-300">24/7</p>
              <p className="text-xs text-white/80 font-medium mt-1">Emergency Hotlines &amp; Desk</p>
            </div>
            <div className="p-4 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/15 text-center shadow-xs">
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-300">RA 10173</p>
              <p className="text-xs text-white/80 font-medium mt-1">Data Privacy Compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feature Showcase Section with Live Interactive Carousel */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 -mt-10 relative z-20">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF2FF] text-[#246BDE] border border-[#BFDBFE]">
              <Sparkles className="size-3.5" />
              SYSTEM CAPABILITIES SHOWCASE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172B4D] tracking-tight">
              Explore What iBarangay Can Do For You
            </h2>
            <p className="text-sm sm:text-base text-[#718096]">
              Designed hand-in-hand with barangay administrators, municipal officials, and local residents to automate frontline public service delivery.
            </p>
          </div>

          {/* Interactive Feature Carousel */}
          <LandingFeaturesCarousel />
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 px-4 sm:px-6 bg-white border-y border-[#E5EAF2]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
              Built for Security, Reliability, and Grassroots Governance
            </h3>
            <p className="text-sm text-[#718096]">
              Adhering strictly to Department of the Interior and Local Government (DILG) standards and Philippine legal frameworks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-3 transition-transform hover:-translate-y-1">
              <div className="size-12 rounded-xl bg-[#EAF2FF] text-[#246BDE] flex items-center justify-center shadow-xs">
                <FileText className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">ARTA &amp; RA 11032 Compliant</h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                Streamlined document turnaround time for clearances, certifications, and business endorsements, eliminating unnecessary physical queuing and red tape.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-3 transition-transform hover:-translate-y-1">
              <div className="size-12 rounded-xl bg-[#ECFDF5] text-[#10A875] flex items-center justify-center shadow-xs">
                <ShieldCheck className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">National Privacy Commission (RA 10173)</h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                Personal demographic and financial records are safeguarded with role-based access control, cryptographic Firestore rules, and encrypted audit trails.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E5EAF2] space-y-3 transition-transform hover:-translate-y-1">
              <div className="size-12 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shadow-xs">
                <Building2 className="size-6" />
              </div>
              <h4 className="text-lg font-bold text-[#172B4D]">Multi-Tenant Municipal Scalability</h4>
              <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
                Architected to serve all barangays across Bongabong and Oriental Mindoro with isolated data partitioning, centralized municipal oversight, and high availability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 px-4 sm:px-6 bg-[#0B1E38] text-white relative overflow-hidden">
        {/* Subtle community hall background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <img
            src="/images/barangay-hall.png"
            alt="Barangay Hall"
            className="w-full h-full object-cover object-center filter brightness-50 contrast-125"
          />
          <div className="absolute inset-0 bg-[#0B1E38]/70" />
        </div>
        <div className="container mx-auto max-w-4xl text-center space-y-6 relative z-10">
          <div className="size-16 rounded-full bg-white/10 ring-4 ring-yellow-400/40 mx-auto flex items-center justify-center">
            <img
              src="/images/barangay-seal.png"
              alt="Seal"
              className="size-14 object-contain"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Ready to Experience the Digital Barangay?
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto">
            Join your neighbors in Barangay Mina de Oro, Bongabong. Create your resident account in under two minutes or log in to manage your records.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-bold text-sm h-11 px-7 rounded-xl shadow-lg transition-transform hover:scale-105">
                Register as Resident
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10 font-semibold text-sm h-11 px-7 rounded-xl"
              >
                Sign In to Existing Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Official Municipal Footer */}
      <footer className="bg-[#0A1D36] text-white/80 border-t border-white/10 py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img src="/images/barangay-seal.png" alt="Seal" className="size-8 object-contain" />
                <span className="text-lg font-bold text-white">iBarangay</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Digital governance and administrative automation platform for the Municipality of Bongabong, Province of Oriental Mindoro.
              </p>
              <div className="text-[11px] text-white/50">
                Region IV-B • MIMAROPA
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Barangay Services
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link href="/register" className="hover:text-white transition-colors">Barangay Clearance</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Certificate of Residency</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Certificate of Indigency</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Business Permit Endorsement</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Security &amp; Governance
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li><Link href="/login" className="hover:text-white transition-colors">Staff Authentication</Link></li>
                <li><span className="text-white/50">Data Privacy Act (RA 10173)</span></li>
                <li><span className="text-white/50">Ease of Doing Business (RA 11032)</span></li>
                <li><span className="text-white/50">Local Government Code (RA 7160)</span></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                Emergency &amp; Support
              </h5>
              <p className="text-xs text-white/70 leading-relaxed">
                Barangay Duty Desk: (043) 288-1234<br />
                MDRRMO Rescue: 911 / 0917-123-4567<br />
                Police Patrol: 166
              </p>
              <p className="text-xs text-white/50 mt-2">
                Mindoro State University (MinSU) Capstone Research Project
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/60">
            <p>© 2026 iBarangay System. All rights reserved. Developed by Ryan Claud.</p>
            <p className="text-[11px] text-white/50">
              Department of Information and Communications Technology (DICT) MIMAROPA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

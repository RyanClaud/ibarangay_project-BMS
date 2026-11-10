'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { EmergencyRespondersDialog } from '@/components/dashboard/emergency-responders-dialog';
import type { BarangayEvent } from '@/lib/types';

interface ResidentInfoCarouselProps {
  onFileComplaint?: () => void;
  onOpenEventDetails?: (event: BarangayEvent) => void;
}

export function ResidentInfoCarousel({
  onFileComplaint,
  onOpenEventDetails,
}: ResidentInfoCarouselProps) {
  const { events, barangayConfig } = useAppContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isRespondersOpen, setIsRespondersOpen] = useState(false);
  const [focusResponder, setFocusResponder] = useState<string | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const barangayName = barangayConfig?.name || 'Mina de Oro';
  const hotlines = barangayConfig?.emergencyHotlines;
  const latestEvent = events && events.length > 0 ? events[0] : null;

  // Format event date nicely
  const formatEventDate = (dateString: string) => {
    try {
      const d = new Date(dateString + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Define the dynamic slides
  const slides = [
    // Slide 1: Latest Upcoming Barangay Event
    {
      id: 'event-slide',
      tag: latestEvent ? 'Upcoming Event Announcement' : 'Barangay Assembly & Events',
      tagBg: 'bg-[#FFA51E]/20 text-[#FFD086] border-[#FFA51E]/30',
      icon: Calendar,
      title: latestEvent
        ? latestEvent.title
        : `Official Community Assembly & Programs for ${barangayName}`,
      description: latestEvent?.description
        ? latestEvent.description
        : 'Stay informed with upcoming civic assemblies, TUPAD programs, community meetings, and health programs.',
      metaItems: latestEvent
        ? [
            { icon: Calendar, text: formatEventDate(latestEvent.date) },
            { icon: Clock, text: latestEvent.time },
            { icon: MapPin, text: latestEvent.location },
          ]
        : [
            { icon: Users, text: 'Open to All Barangay Residents' },
            { icon: MapPin, text: 'Barangay Multi-Purpose Hall' },
          ],
      ctaText: latestEvent ? 'View Event Details' : 'View Calendar',
      ctaAction: () => {
        if (latestEvent && onOpenEventDetails) {
          onOpenEventDetails(latestEvent);
        } else {
          const el = document.getElementById('upcoming-events-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }
      },
      gradient: 'from-[#0B1E38] via-[#102D56] to-[#1A4580]',
      highlightColor: '#246BDE',
    },

    // Slide 2: Online Clearances & Document Processing
    {
      id: 'services-slide',
      tag: 'Digital Barangay Services',
      tagBg: 'bg-[#10A875]/20 text-[#6EE7B7] border-[#10A875]/30',
      icon: FileText,
      title: 'Fast & Hassle-Free Online Document Issuance',
      description:
        'Apply for Barangay Clearance, Certificate of Residency, Indigency, and Business Permits 100% online from your phone or PC.',
      metaItems: [
        { icon: CheckCircle2, text: 'Automated Record Verification' },
        { icon: ShieldCheck, text: 'Secure Official Barangay Seals' },
        { icon: Sparkles, text: 'Real-time Status Alerts' },
      ],
      ctaText: 'Apply for Clearance',
      ctaAction: () => {
        const el = document.getElementById('request-form-section');
        el?.scrollIntoView({ behavior: 'smooth' });
      },
      gradient: 'from-[#0F2942] via-[#0E4466] to-[#166088]',
      highlightColor: '#10A875',
    },

    // Slide 3: Barangay Blotter & Conciliation
    {
      id: 'blotter-slide',
      tag: 'Peace & Order / Public Safety',
      tagBg: 'bg-[#EF4655]/20 text-[#FCA5A5] border-[#EF4655]/30',
      icon: AlertTriangle,
      title: 'Barangay Mediation & Blotter Assistance',
      description:
        'Have a neighborhood dispute, sanitation issue, or disturbance? File an official blotter report for prompt Lupon mediation.',
      metaItems: [
        { icon: ShieldCheck, text: 'Confidential Case Logging' },
        { icon: Users, text: 'Amicable Settlement Hearing' },
        { icon: Clock, text: 'Prompt Officer Action' },
      ],
      ctaText: 'File a Complaint Now',
      ctaAction: () => {
        if (onFileComplaint) {
          onFileComplaint();
        } else {
          window.location.href = '/incident-reports';
        }
      },
      gradient: 'from-[#1A1C29] via-[#242A42] to-[#2D3748]',
      highlightColor: '#EF4655',
    },

    // Slide 4: Emergency Response & Hotlines
    {
      id: 'hotline-slide',
      tag: '24/7 Emergency Assistance',
      tagBg: 'bg-[#3B82F6]/20 text-[#93C5FD] border-[#3B82F6]/30',
      icon: PhoneCall,
      title: `Emergency Hotlines & Public Safety for ${barangayName}`,
      description:
        'For urgent medical situations, fire emergencies, disaster rescue, or security response, reach our duty responders immediately.',
      metaItems: [
        {
          icon: PhoneCall,
          text: `Barangay Duty Desk: ${hotlines?.dutyDesk?.trim() || '(043) 288-1234'}`,
          action: () => {
            setFocusResponder('duty-desk');
            setIsRespondersOpen(true);
          },
        },
        {
          icon: ShieldAlert,
          text: `MDRRMO Rescue: ${hotlines?.mdrrmo?.trim() || '911 / 0917-123-4567'}`,
          action: () => {
            setFocusResponder('mdrrmo');
            setIsRespondersOpen(true);
          },
        },
        {
          icon: ShieldCheck,
          text: `Police / Patrol Station: ${hotlines?.police?.trim() || '166'}`,
          action: () => {
            setFocusResponder('police');
            setIsRespondersOpen(true);
          },
        },
      ],
      ctaText: 'Contact Responders',
      ctaAction: () => {
        setFocusResponder(undefined);
        setIsRespondersOpen(true);
      },
      gradient: 'from-[#0A2540] via-[#103E68] to-[#16558C]',
      highlightColor: '#3B82F6',
    },
  ];

  // Auto advance slides every 6 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  const active = slides[currentSlide];
  const IconComponent = active.icon;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden rounded-2xl border border-white/10 shadow-md transition-all select-none"
    >
      {/* Background Gradient & Ambient Glow */}
      <div
        className={`relative w-full bg-gradient-to-r ${active.gradient} p-4 sm:p-6 md:p-8 text-white transition-all duration-700 ease-in-out min-h-[220px] sm:min-h-[240px] flex flex-col justify-between`}
      >
        {/* Subtle Decorative Civic Watermark Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none overflow-hidden hidden sm:block">
          <div className="absolute -right-10 -top-10 size-72 rounded-full border-[30px] border-white/20" />
          <div className="absolute -right-20 -bottom-10 size-96 rounded-full border-[40px] border-white/10" />
        </div>

        {/* Slide Content Header */}
        <div className="relative z-10 space-y-2.5">
          {/* Top Tag & Slide Counter + Arrows */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${active.tagBg}`}
            >
              <IconComponent className="size-3 sm:size-3.5" />
              {active.tag}
            </span>

            {/* Top Right: Counter and Quick Arrows */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white/90">
                <span>{currentSlide + 1}</span>
                <span className="text-white/40">/</span>
                <span>{slides.length}</span>
              </div>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous slide"
                className="flex size-7 items-center justify-center rounded-lg bg-black/25 text-white/90 hover:bg-black/40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next slide"
                className="flex size-7 items-center justify-center rounded-lg bg-black/25 text-white/90 hover:bg-black/40 transition-colors cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Slide Title */}
          <h3 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white leading-snug max-w-2xl">
            {active.title}
          </h3>

          {/* Slide Description */}
          <p className="text-xs sm:text-sm text-white/85 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-3">
            {active.description}
          </p>

          {/* Meta details (chips/badges) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {active.metaItems.map((meta: any, idx: number) => {
              const MetaIcon = meta.icon;
              return (
                <div
                  key={idx}
                  onClick={meta.action}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-xs px-2.5 py-1 text-[11px] sm:text-xs font-medium text-white/95 border border-white/10",
                    meta.action && "cursor-pointer hover:bg-white/20 active:scale-95 transition-all select-none"
                  )}
                >
                  <MetaIcon className="size-3 sm:size-3.5 text-[#93C5FD]" />
                  <span>{meta.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slide Footer: Action Button & Compact Indicator Dots with NO Overlap */}
        <div className="relative z-10 flex items-center justify-between pt-3 mt-2 border-t border-white/15 gap-3">
          {/* Call to Action Button */}
          <Button
            type="button"
            onClick={active.ctaAction}
            className="rounded-xl bg-white text-[#102D56] hover:bg-[#F0F4FA] font-bold text-xs sm:text-sm h-9 px-4 shadow-sm gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.98] shrink-0 whitespace-nowrap"
          >
            <span>{active.ctaText}</span>
            <ArrowRight className="size-3.5" />
          </Button>

          {/* Sleek Indicator Dots on the right */}
          <div className="flex items-center gap-1.5 shrink-0 py-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="p-0 border-0 outline-none cursor-pointer rounded-full transition-all duration-300 block"
                style={{
                  width: idx === currentSlide ? '22px' : '6px',
                  height: '6px',
                  backgroundColor:
                    idx === currentSlide ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Emergency Responders & Hotlines Modal Dialog */}
      <EmergencyRespondersDialog
        isOpen={isRespondersOpen}
        onClose={() => setIsRespondersOpen(false)}
        barangayConfig={barangayConfig}
        focusResponder={focusResponder}
      />
    </div>
  );
}


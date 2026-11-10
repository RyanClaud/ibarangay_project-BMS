'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Tag,
  User,
  Info,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { PostEventDialog } from '@/components/dashboard/post-event-dialog';
import { CivicMotionBackground } from '@/components/dashboard/civic-motion-background';
import { playNotificationSound } from '@/lib/notification-sound';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { BarangayEvent } from '@/lib/types';

const categoryBadgeColors: Record<string, string> = {
  Assembly: 'bg-[#EAF2FF] text-[#246BDE] border-[#BFDBFE]',
  Community: 'bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]',
  Health: 'bg-[#FFF7ED] text-[#FFA51E] border-[#FED7AA]',
  'Clean-Up': 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
  Sports: 'bg-[#F3E8FF] text-[#8B5CF6] border-[#E9D5FF]',
  Emergency: 'bg-[#FEF2F2] text-[#EF4655] border-[#FECACA]',
  Distribution: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  Other: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
};

export function UpcomingEventsCard() {
  const { events, currentUser, deleteEvent } = useAppContext();
  const { toast } = useToast();

  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<BarangayEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user can manage events
  const canManageEvents =
    currentUser?.role === 'Secretary' ||
    currentUser?.role === 'Barangay Captain' ||
    currentUser?.role === 'Admin' ||
    currentUser?.isSuperAdmin;

  // Format date helper: returns { month: 'NOV', day: '15', full: 'November 15, 2026' }
  const formatEventDate = (dateString: string) => {
    try {
      const dateObj = new Date(dateString + 'T00:00:00');
      const month = dateObj
        .toLocaleDateString('en-US', { month: 'short' })
        .toUpperCase();
      const day = String(dateObj.getDate()).padStart(2, '0');
      const full = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      return { month, day, full };
    } catch {
      return { month: 'EVT', day: '01', full: dateString };
    }
  };

  const handleDeleteEvent = async (event: BarangayEvent) => {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    try {
      setIsDeleting(true);
      await deleteEvent(event.id);
      toast({
        title: 'Event Deleted',
        description: `"${event.title}" has been removed from the calendar.`,
      });
      setSelectedEvent(null);
    } catch (err: any) {
      toast({
        title: 'Failed to delete event',
        description: err.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Limit display to the top 3 nearest upcoming events
  const displayedEvents = (events || []).slice(0, 3);

  return (
    <>
      <div className="relative flex h-full min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl border border-[#E5EAF2] bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
        {/* Right side background community illustration */}
        <div className="absolute right-0 top-0 bottom-0 w-44 sm:w-48 pointer-events-none select-none overflow-hidden hidden sm:block">
          <img
            src="/images/events-illustration.png"
            alt="Community Clean-Up Illustration"
            className="w-full h-full object-cover object-left opacity-90"
          />
          {/* Soft gradient fade on the left edge of illustration */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#246BDE]">
              <Calendar className="size-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#172B4D] tracking-tight">
              Upcoming Events
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {canManageEvents && (
              <button
                type="button"
                onClick={() => setIsPostOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#246BDE] text-white hover:bg-[#1E5CC0] transition-colors shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>Post Event</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (displayedEvents.length > 0) {
                  setSelectedEvent(displayedEvents[0]);
                } else if (canManageEvents) {
                  setIsPostOpen(true);
                }
              }}
              className="text-xs sm:text-sm font-semibold text-[#2474E8] hover:underline flex items-center gap-1 transition-colors"
            >
              View All →
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="relative z-10 flex-1 space-y-3.5 pt-1 max-w-[280px] sm:max-w-[300px]">
          {displayedEvents.length > 0 ? (
            displayedEvents.map((event) => {
              const { month, day } = formatEventDate(event.date);
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-start gap-3.5 group cursor-pointer p-1.5 -mx-1.5 rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  {/* Date Block */}
                  <div className="flex size-12 sm:w-13 sm:h-13 flex-col items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE] shrink-0 border border-[#BFDBFE]/40 transition-transform group-hover:scale-105">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider leading-none text-[#246BDE]">
                      {month}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold leading-tight text-[#102D56] pt-0.5">
                      {day}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="min-w-0 space-y-0.5 flex-1">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#172B4D] leading-tight truncate group-hover:text-[#246BDE] transition-colors">
                      {event.title}
                    </h3>
                    <p className="flex items-center gap-1 text-[11px] sm:text-xs text-[#718096]">
                      <Clock className="size-3 text-[#718096] shrink-0" />
                      <span className="truncate">{event.time}</span>
                    </p>
                    <p className="flex items-center gap-1 text-[11px] sm:text-xs text-[#718096]">
                      <MapPin className="size-3 text-[#718096] shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 space-y-2 text-left">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#F0F4FA] text-[#718096]">
                <CalendarCheck className="size-5" />
              </div>
              <p className="text-xs font-bold text-[#172B4D]">
                No upcoming events scheduled
              </p>
              <p className="text-[11px] text-[#718096] leading-relaxed">
                {canManageEvents
                  ? 'Click "+ Post Event" to publish barangay meetings, health missions, or clean-up activities.'
                  : 'Check back later for official barangay activities and announcements.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Post Event Modal (For Secretary/Staff/Admin) */}
      <PostEventDialog
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
      />

      {/* Event Details Modal with Animated Civic Aura Background */}
      {selectedEvent && (
        <Dialog
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        >
          <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-[#E5EAF2] shadow-2xl bg-white">
            {/* Top Animated Civic Hero Banner with 60fps Motion Canvas */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#071527] via-[#0F294D] to-[#1A4580] p-6 text-white min-h-[170px] flex flex-col justify-between">
              {/* Dynamic 60fps Motion Canvas playing in the background */}
              <CivicMotionBackground particleCount={48} interactive={true} />

              {/* Dynamic Animated Ambient Background Aura */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Glowing Animated Orbs */}
                <div className="absolute -top-12 -right-12 size-48 rounded-full bg-[#246BDE]/30 blur-2xl animate-pulse" />
                <div
                  className="absolute -bottom-12 -left-12 size-48 rounded-full bg-emerald-500/20 blur-2xl animate-pulse"
                  style={{ animationDuration: '4s' }}
                />
                {/* Slow Rotating Official Barangay Seal in Background */}
                <div className="absolute right-2 -bottom-6 size-44 opacity-20 pointer-events-none">
                  <img
                    src="/images/barangay-seal.png"
                    alt=""
                    className="w-full h-full object-contain animate-[spin_80s_linear_infinite]"
                  />
                </div>
                {/* Dynamic Civic Wave Lines */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Content on top of animated aura */}
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-400" />
                    </span>
                    <span>{selectedEvent.category}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-black/35 backdrop-blur-xs px-3 py-1 rounded-full text-xs text-white/95 font-medium border border-white/10">
                    <Calendar className="size-3.5 text-[#93C5FD]" />
                    <span>{formatEventDate(selectedEvent.date).full}</span>
                  </div>
                </div>

                <DialogTitle className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
                  {selectedEvent.title}
                </DialogTitle>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Highlight Grid: Schedule & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F0F6FF] border border-[#BFDBFE]/60 flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#246BDE] text-white shrink-0 shadow-xs">
                    <Clock className="size-4.5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                      Schedule
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[#172B4D] truncate mt-0.5">
                      {selectedEvent.time}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]/60 flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#10A875] text-white shrink-0 shadow-xs">
                    <MapPin className="size-4.5 animate-bounce" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                      Venue / Location
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[#172B4D] truncate mt-0.5">
                      {selectedEvent.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Organizer Card */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#102D56] text-white font-bold text-xs">
                    <User className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#172B4D] leading-tight">
                      {selectedEvent.createdBy}
                    </p>
                    <p className="text-[11px] text-[#718096] leading-tight">
                      Official {selectedEvent.creatorRole}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10A875] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                  <CheckCircle2 className="size-3" />
                  Official Barangay Program
                </span>
              </div>

              {/* Details & Agenda */}
              {selectedEvent.description && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-[#246BDE]" />
                    Event Agenda & Important Instructions:
                  </p>
                  <p className="text-xs text-[#4A5568] leading-relaxed whitespace-pre-wrap bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E5EAF2]">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <DialogFooter className="px-5 sm:px-6 py-3.5 border-t border-[#E5EAF2] bg-[#F8FAFC] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {canManageEvents && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isDeleting}
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="text-xs text-[#EF4655] hover:bg-[#FEF2F2] hover:text-[#DC2626] rounded-xl h-8 px-2.5 gap-1.5"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Delete Event</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    playNotificationSound();
                    toast({
                      title: 'Announcement Chime',
                      description: 'Playing official community alert tone.',
                    });
                  }}
                  className="rounded-xl text-xs border-[#E5EAF2] text-[#172B4D] hover:bg-[#F0F6FF] h-8 px-2.5 gap-1.5"
                  title="Play Announcement Tone"
                >
                  <Volume2 className="size-3.5 text-[#246BDE]" />
                  <span>Tone</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const text = `${selectedEvent.title}\nDate: ${formatEventDate(selectedEvent.date).full}\nTime: ${selectedEvent.time}\nVenue: ${selectedEvent.location}\n${selectedEvent.description || ''}`;
                    navigator.clipboard.writeText(text);
                    toast({
                      title: 'Event Details Copied!',
                      description: 'Event details copied to clipboard.',
                    });
                  }}
                  className="rounded-xl text-xs border-[#E5EAF2] text-[#172B4D] h-8 px-3 gap-1.5"
                >
                  <Copy className="size-3.5 text-[#718096]" />
                  <span>Copy Details</span>
                </Button>
              </div>

              <Button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl text-xs bg-[#102D56] hover:bg-[#1E4D94] text-white h-8 px-4"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

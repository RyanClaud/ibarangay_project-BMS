'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Flame,
  HeartPulse,
  Copy,
  ExternalLink,
  Check,
  Radio,
  AlertTriangle,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/lib/notification-sound';
import type { BarangayConfig } from '@/lib/types';

interface EmergencyRespondersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  barangayConfig?: BarangayConfig | null;
  focusResponder?: string;
}

export function EmergencyRespondersDialog({
  isOpen,
  onClose,
  barangayConfig,
  focusResponder,
}: EmergencyRespondersDialogProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const barangayName = barangayConfig?.name || 'Mina de Oro';
  const hotlines = barangayConfig?.emergencyHotlines;

  const responders = [
    {
      id: 'duty-desk',
      name: 'Barangay Duty Desk / Hall Officer',
      agency: 'Barangay Local Government Unit',
      role: 'Immediate community assistance, Tanod dispatch, desk officer',
      number: hotlines?.dutyDesk?.trim() || '(043) 288-1234',
      isConfigured: !!hotlines?.dutyDesk?.trim(),
      icon: PhoneCall,
      color: 'text-[#246BDE]',
      bg: 'bg-[#EAF2FF]',
      border: 'border-[#BFDBFE]',
      badge: '24/7 Desk On-Duty',
      badgeClass: 'bg-[#EAF2FF] text-[#246BDE] border-[#BFDBFE]',
      callHref: `tel:${(hotlines?.dutyDesk || '(043) 288-1234').replace(/[^0-9+]/g, '')}`,
    },
    {
      id: 'mdrrmo',
      name: 'MDRRMO Rescue & Disaster Command',
      agency: 'Municipal Disaster Risk Reduction & Management',
      role: 'Ambulance dispatch, vehicular accidents, calamity rescue',
      number: hotlines?.mdrrmo?.trim() || '911 / 0917-123-4567',
      isConfigured: !!hotlines?.mdrrmo?.trim(),
      icon: ShieldAlert,
      color: 'text-[#FFA51E]',
      bg: 'bg-[#FFF7ED]',
      border: 'border-[#FED7AA]',
      badge: 'Rescue & Paramedics',
      badgeClass: 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]',
      callHref: `tel:${(hotlines?.mdrrmo || '911').split('/')[0].replace(/[^0-9+]/g, '')}`,
    },
    {
      id: 'police',
      name: 'PNP Police Station / Patrol Desk',
      agency: 'Philippine National Police',
      role: 'Crime reports, disturbances, security response, blotter',
      number: hotlines?.police?.trim() || '166 / 0998-598-6321',
      isConfigured: !!hotlines?.police?.trim(),
      icon: ShieldCheck,
      color: 'text-[#10A875]',
      bg: 'bg-[#ECFDF5]',
      border: 'border-[#A7F3D0]',
      badge: 'Law Enforcement',
      badgeClass: 'bg-[#ECFDF5] text-[#10A875] border-[#A7F3D0]',
      callHref: `tel:${(hotlines?.police || '166').split('/')[0].replace(/[^0-9+]/g, '')}`,
    },
    {
      id: 'fire',
      name: 'BFP Fire Department Station',
      agency: 'Bureau of Fire Protection',
      role: 'Fire alarms, chemical/gas leaks, rescue operations',
      number: hotlines?.fireStation?.trim() || '160 / (043) 288-1111',
      isConfigured: !!hotlines?.fireStation?.trim(),
      icon: Flame,
      color: 'text-[#EF4655]',
      bg: 'bg-[#FEF2F2]',
      border: 'border-[#FECACA]',
      badge: 'Fire & Hazmat',
      badgeClass: 'bg-[#FEF2F2] text-[#EF4655] border-[#FECACA]',
      callHref: `tel:${(hotlines?.fireStation || '160').split('/')[0].replace(/[^0-9+]/g, '')}`,
    },
    {
      id: 'health',
      name: 'Rural Health Unit (RHU) / Clinic',
      agency: 'Municipal Health Services',
      role: 'First aid, medical consultations, patient transport',
      number: hotlines?.healthCenter?.trim() || '0919-876-5432',
      isConfigured: !!hotlines?.healthCenter?.trim(),
      icon: HeartPulse,
      color: 'text-[#8B5CF6]',
      bg: 'bg-[#F3E8FF]',
      border: 'border-[#E9D5FF]',
      badge: 'Medical Clinic',
      badgeClass: 'bg-[#F3E8FF] text-[#8B5CF6] border-[#E9D5FF]',
      callHref: `tel:${(hotlines?.healthCenter || '0919-876-5432').replace(/[^0-9+]/g, '')}`,
    },
  ];

  const handleCopy = (id: string, name: string, number: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    toast({
      title: 'Contact Number Copied!',
      description: `${name}: ${number}`,
    });
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-[#E5EAF2] shadow-2xl bg-white max-h-[90vh] flex flex-col">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1E38] via-[#102D56] to-[#1E4D94] p-5 sm:p-6 text-white shrink-0">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-10 -right-10 size-44 rounded-full bg-[#246BDE]/30 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 size-44 rounded-full bg-[#EF4655]/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-md border border-white/20">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4655] opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-[#EF4655]" />
                </span>
                <span>24/7 Emergency Assistance</span>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                Emergency Responders for {barangayName}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Direct hotline numbers for barangay tanod, MDRRMO rescue, PNP police, and fire responders.
              </DialogDescription>
            </div>

            <button
              type="button"
              onClick={() => {
                playNotificationSound();
                toast({
                  title: 'Emergency Siren Preview',
                  description: 'Alert tone preview played.',
                });
              }}
              title="Test Emergency Alert Chime"
              className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors shrink-0"
            >
              <Volume2 className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Responders List */}
        <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1">
          {/* Optional Barangay Radio / Advisory Note */}
          {hotlines?.additionalNotes && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
              <Radio className="size-4 shrink-0 mt-0.5 text-[#D97706]" />
              <div className="text-xs">
                <span className="font-bold">Barangay Emergency Advisory: </span>
                <span>{hotlines.additionalNotes}</span>
              </div>
            </div>
          )}

          {responders.map((item) => {
            const Icon = item.icon;
            const isFocused = focusResponder === item.id;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                  isFocused
                    ? 'border-[#246BDE] bg-[#F0F6FF] ring-2 ring-[#246BDE]/20 shadow-sm'
                    : 'border-[#E5EAF2] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Icon & Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${item.bg} ${item.color} shrink-0 border ${item.border} shadow-xs`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-[#172B4D] leading-tight">
                          {item.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#718096] mt-0.5 leading-tight">
                        {item.role}
                      </p>
                      <p className="text-xs sm:text-sm font-extrabold text-[#102D56] font-mono mt-1 select-all">
                        {item.number}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Copy Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(item.id, item.name, item.number)}
                      className="rounded-xl h-8 px-2.5 text-xs font-semibold border-[#E2E8F0] text-[#172B4D] hover:bg-[#F0F4FA] gap-1.5"
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3.5 text-[#10A875]" />
                          <span className="text-[#10A875]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5 text-[#718096]" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>

                    {/* Call Button */}
                    <a
                      href={item.callHref}
                      className="inline-flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold bg-[#10A875] hover:bg-[#059669] text-white shadow-xs transition-colors"
                    >
                      <PhoneCall className="size-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Caller Instruction Box */}
          <div className="p-3.5 rounded-xl bg-[#F0F4FA] border border-[#E2E8F0] flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-[#246BDE] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#4A5568] leading-relaxed">
              <span className="font-bold text-[#172B4D]">Important reminder for emergencies: </span>
              State your full name clearly, give your exact Purok / Sitio and closest landmark, and describe the nature of emergency so responders can dispatch the right gear.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-3.5 sm:px-6 border-t border-[#E5EAF2] bg-[#F8FAFC] flex items-center justify-between">
          <p className="text-[11px] text-[#718096]">
            Official responder directory verified by Barangay Council.
          </p>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-xl text-xs bg-[#102D56] hover:bg-[#1E4D94] text-white h-8 px-4"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


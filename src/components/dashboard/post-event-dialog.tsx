'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Tag, Bell, Loader2 } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';
import { useToast } from '@/hooks/use-toast';
import type { EventCategory } from '@/lib/types';

interface PostEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostEventDialog({ isOpen, onClose }: PostEventDialogProps) {
  const { addEvent, currentUser } = useAppContext();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('8:00 AM – 12:00 PM');
  const [location, setLocation] = useState('Barangay Multi-Purpose Hall');
  const [category, setCategory] = useState<EventCategory>('Community');
  const [description, setDescription] = useState('');
  const [notifyResidents, setNotifyResidents] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDate('');
    setTime('8:00 AM – 12:00 PM');
    setLocation('Barangay Multi-Purpose Hall');
    setCategory('Community');
    setDescription('');
    setNotifyResidents(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time.trim() || !location.trim()) {
      toast({
        title: 'Incomplete Details',
        description: 'Please fill in all required event details (title, date, time, and location).',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await addEvent(
        {
          title: title.trim(),
          date,
          time: time.trim(),
          location: location.trim(),
          category,
          description: description.trim(),
        },
        notifyResidents
      );

      toast({
        title: 'Event Posted Successfully!',
        description: notifyResidents
          ? `"${title}" has been published and residents were notified.`
          : `"${title}" has been published to the upcoming events calendar.`,
      });

      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to post event:', err);
      toast({
        title: 'Failed to Post Event',
        description: err.message || 'An error occurred while publishing the event.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6 border-[#E5EAF2] shadow-2xl">
        <DialogHeader className="pb-2 border-b border-[#E5EAF2]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#246BDE]">
              <Calendar className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#172B4D]">
                Post Upcoming Barangay Event
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Publish official activities, assemblies, and programs for residents.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Event Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#172B4D]">
              Event Title <span className="text-[#EF4655]">*</span>
            </Label>
            <Input
              required
              placeholder="e.g. 1st Semester Barangay General Assembly"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-[#E5EAF2] text-sm focus:border-[#246BDE]"
            />
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D] flex items-center gap-1.5">
                <Calendar className="size-3.5 text-[#246BDE]" />
                Event Date <span className="text-[#EF4655]">*</span>
              </Label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border-[#E5EAF2] text-xs focus:border-[#246BDE]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D] flex items-center gap-1.5">
                <Clock className="size-3.5 text-[#246BDE]" />
                Event Time / Hours <span className="text-[#EF4655]">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. 8:00 AM – 12:00 PM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border-[#E5EAF2] text-xs focus:border-[#246BDE]"
              />
            </div>
          </div>

          {/* Location and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D] flex items-center gap-1.5">
                <MapPin className="size-3.5 text-[#246BDE]" />
                Venue / Location <span className="text-[#EF4655]">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Barangay Covered Court"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border-[#E5EAF2] text-xs focus:border-[#246BDE]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#172B4D] flex items-center gap-1.5">
                <Tag className="size-3.5 text-[#246BDE]" />
                Event Category
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as EventCategory)}
              >
                <SelectTrigger className="rounded-xl border-[#E5EAF2] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E5EAF2]">
                  <SelectItem value="Assembly">Barangay Assembly</SelectItem>
                  <SelectItem value="Community">Community Program</SelectItem>
                  <SelectItem value="Health">Health & Medical Mission</SelectItem>
                  <SelectItem value="Clean-Up">Clean-Up Drive & Ecology</SelectItem>
                  <SelectItem value="Sports">Sports & Youth League</SelectItem>
                  <SelectItem value="Emergency">Emergency & Disaster Drill</SelectItem>
                  <SelectItem value="Distribution">Aid & Relief Distribution</SelectItem>
                  <SelectItem value="Other">Other Barangay Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Detailed Statement / Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#172B4D]">
              Event Description & Instructions (Optional)
            </Label>
            <Textarea
              rows={3}
              placeholder="Provide agenda, what to bring, target participants, or special notes for residents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-[#E5EAF2] text-xs focus:border-[#246BDE] resize-none"
            />
          </div>

          {/* Notify Residents Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F0F6FF] border border-[#BFDBFE]/50">
            <input
              type="checkbox"
              id="notify-residents"
              checked={notifyResidents}
              onChange={(e) => setNotifyResidents(e.target.checked)}
              className="size-4 rounded text-[#246BDE] focus:ring-[#246BDE] border-[#CBD5E1] cursor-pointer"
            />
            <label
              htmlFor="notify-residents"
              className="text-xs font-semibold text-[#172B4D] cursor-pointer select-none flex items-center gap-1.5"
            >
              <Bell className="size-3.5 text-[#246BDE]" />
              Notify all residents immediately via in-app notification
            </label>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E5EAF2] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl text-xs border-[#E5EAF2] text-[#718096] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs bg-[#246BDE] hover:bg-[#1E5CC0] text-white font-semibold shadow-xs gap-1.5 px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Calendar className="size-3.5" />
                  Publish Event
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


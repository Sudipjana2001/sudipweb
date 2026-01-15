import { useState } from "react";
import { useDeliverySlots } from "@/hooks/useDeliverySlots";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DeliverySlotSelectorProps {
  onSelect: (slotId: string, date: string, timeSlot: string) => void;
  selectedSlotId?: string;
}

export function DeliverySlotSelector({ onSelect, selectedSlotId }: DeliverySlotSelectorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { data: slots = [] } = useDeliverySlots();

  // Get unique dates that have available slots
  const availableDates = [...new Set(slots.map(s => s.date))];
  
  // Get slots for selected date
  const slotsForDate = selectedDate 
    ? slots.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd') && s.current_orders < s.max_orders)
    : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleSlotSelect = (slot: typeof slots[0]) => {
    onSelect(slot.id, slot.date, slot.time_slot);
  };

  // Generate some default slots if none exist in DB
  const defaultTimeSlots = [
    { id: 'morning', time_slot: '9:00 AM - 12:00 PM', label: 'Morning' },
    { id: 'afternoon', time_slot: '12:00 PM - 4:00 PM', label: 'Afternoon' },
    { id: 'evening', time_slot: '4:00 PM - 8:00 PM', label: 'Evening' },
  ];

  const displaySlots = slotsForDate.length > 0 ? slotsForDate : (selectedDate ? defaultTimeSlots.map(s => ({
    ...s,
    date: format(selectedDate, 'yyyy-MM-dd'),
    max_orders: 50,
    current_orders: 0,
    is_available: true,
    created_at: new Date().toISOString(),
  })) : []);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Select Delivery Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {selectedDate && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Select Time Slot</Label>
          <div className="grid grid-cols-1 gap-2">
            {displaySlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSlotSelect(slot as typeof slots[0])}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg transition-all",
                  selectedSlotId === slot.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-foreground"
                )}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{slot.time_slot}</p>
                  {'max_orders' in slot && (
                    <p className="text-xs text-muted-foreground">
                      {slot.max_orders - slot.current_orders} slots available
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

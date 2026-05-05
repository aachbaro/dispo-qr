/**
 * src/components/agenda/AgendaDayColumn.tsx
 * Layer  : Frontend — composants / agenda
 * Role   : Colonne d'un jour de l'agenda (en-tête + grille 07h–24h + slots).
 *          - Drag vertical sur zone vide → ghost slot → émet onCreateSlot
 *          - Click sur slot existant → émet onSlotClick
 *          - Lecture seule pour les visiteurs (isOwner = false)
 * Used by: Agenda
 */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { localIsoToMinutes, localIsoToTime } from "../../lib/slotDateTime";
import type { AgendaDisplaySlot } from "./Agenda";
import AgendaSlot from "./AgendaSlot";

const DAY_START_HOUR = 7;
const TOTAL_HOURS = 17; // 07h → 24h

interface DayInfo {
  name: string;
  date: string;     // "DD/MM"
  fullDate: string; // "YYYY-MM-DD"
}

interface PendingRange {
  date: string;
  start: string; // "HH:MM"
  end: string;
}

interface Props {
  day: DayInfo;
  slots: AgendaDisplaySlot[];
  isOwner: boolean;
  onCreateSlot: (range: PendingRange) => void;
  onDeleteSlot: (id: number) => void;
  onSlotClick: (slot: AgendaDisplaySlot) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snapToQuarter(totalMinutes: number): number {
  return Math.round(totalMinutes / 15) * 15;
}

function minutesToIso(minutes: number, fullDate: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${fullDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

function computeSlotStyle(start: string, end: string): CSSProperties {
  const startMinutes = localIsoToMinutes(start);
  const endMinutes = localIsoToMinutes(end);
  const dayStartMinutes = DAY_START_HOUR * 60;
  const dayEndMinutes = (DAY_START_HOUR + TOTAL_HOURS) * 60;

  const totalMinutes = dayEndMinutes - dayStartMinutes;
  const topMinutes = Math.max(0, startMinutes - dayStartMinutes);
  const heightMinutes = Math.max(
    0,
    Math.min(endMinutes, dayEndMinutes) - Math.max(startMinutes, dayStartMinutes)
  );

  if (heightMinutes <= 0) return { display: "none" };
  return {
    top: `${(topMinutes / totalMinutes) * 100}%`,
    height: `${(heightMinutes / totalMinutes) * 100}%`,
  };
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export default function AgendaDayColumn({ day, slots, isOwner, onCreateSlot, onDeleteSlot, onSlotClick }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);

  const ghostRef    = useRef<{ start: string; end: string } | null>(null);
  const [ghost, setGhost] = useState<{ start: string; end: string } | null>(null);

  const dragging     = useRef(false);
  const dragStartMin = useRef(0);

  const toMinutes = useCallback((clientY: number): number => {
    if (!gridRef.current) return DAY_START_HOUR * 60;
    const rect = gridRef.current.getBoundingClientRect();
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    return DAY_START_HOUR * 60 + (y / rect.height) * TOTAL_HOURS * 60;
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isOwner) return;
      const target = e.target as HTMLElement;
      if (target.closest(".slot")) return; // ne pas interférer avec un slot

      const startMin = snapToQuarter(toMinutes(e.clientY));
      dragStartMin.current = startMin;
      dragging.current = true;

      const iso = minutesToIso(startMin, day.fullDate);
      ghostRef.current = { start: iso, end: iso };
      setGhost({ start: iso, end: iso });
    },
    [isOwner, toMinutes, day.fullDate]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;

      const currentMin = snapToQuarter(toMinutes(e.clientY));
      const startMin   = Math.min(dragStartMin.current, currentMin);
      const endMin     = Math.max(dragStartMin.current, currentMin);
      if (endMin - startMin < 15) return;

      const next = {
        start: minutesToIso(Math.max(startMin, DAY_START_HOUR * 60), day.fullDate),
        end:   minutesToIso(Math.min(endMin, (DAY_START_HOUR + TOTAL_HOURS) * 60), day.fullDate),
      };
      ghostRef.current = next;
      setGhost({ ...next });
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;

      const current = ghostRef.current;
      ghostRef.current = null;
      setGhost(null);

      if (current) {
        const startMinutes = localIsoToMinutes(current.start);
        const endMinutes = localIsoToMinutes(current.end);
        if (endMinutes - startMinutes >= 15) {
          onCreateSlot({
            date:  day.fullDate,
            start: localIsoToTime(current.start),
            end: localIsoToTime(current.end),
          });
        }
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [day.fullDate, onCreateSlot, toMinutes]);

  const hourLines = Array.from({ length: TOTAL_HOURS }, (_, i) => i);

  return (
    <div className="flex-1 flex flex-col min-w-[70px] border-r border-eb-layout last:border-r-0">
      {/* En-tête */}
      <div className="h-12 shrink-0 flex flex-col items-center justify-center border-b border-eb-layout bg-eb-page">
        <span className="text-[13px] font-medium text-eb-text">{day.name}</span>
        <span className="text-[11px] text-eb-muted">{day.date}</span>
      </div>

      {/* Grille */}
      <div
        ref={gridRef}
        className="flex-1 relative"
        style={{ cursor: isOwner ? "crosshair" : "default" }}
        onMouseDown={onMouseDown}
      >
        {/* Lignes horaires */}
        {hourLines.map((i) => (
          <div key={i} className="absolute w-full border-t border-eb-layout/60"
            style={{ top: `${(i / TOTAL_HOURS) * 100}%` }} />
        ))}

        {/* Ghost slot */}
        {ghost && (
          <div
            className="slot absolute left-0.5 right-0.5 rounded bg-eb-primary/30 pointer-events-none border border-eb-primary/50"
            style={computeSlotStyle(ghost.start, ghost.end)}
          />
        )}

        {/* Slots */}
        {slots.map((slot) => (
          <AgendaSlot
            key={`${slot.type}-${slot.id}`}
            slot={slot}
            isOwner={isOwner}
            style={computeSlotStyle(slot.start, slot.end)}
            onDelete={onDeleteSlot}
            onClick={onSlotClick}
          />
        ))}
      </div>
    </div>
  );
}

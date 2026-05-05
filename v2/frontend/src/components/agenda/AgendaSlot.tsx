/**
 * src/components/agenda/AgendaSlot.tsx
 * Layer  : Frontend — composants / agenda
 * Role   : Bloc visuel d'un créneau ou d'une indisponibilité dans une colonne jour.
 *          Positionné en absolu (top/height calculés par le parent).
 *          - Slot : cliquable (owner → ouvre SlotEditModal), coloré par mission
 *          - Unavailability : semi-transparent, non cliquable
 *          - Bouton × supprime directement sans modal (si onDelete fourni)
 * Used by: AgendaDayColumn
 */

import type { CSSProperties } from "react";
import { localIsoToTime } from "../../lib/slotDateTime";
import type { AgendaDisplaySlot } from "./Agenda";

interface Props {
  slot: AgendaDisplaySlot;
  isOwner: boolean;
  style: CSSProperties;
  onDelete?: (id: number) => void;
  onClick?: (slot: AgendaDisplaySlot) => void;
}

function formatTime(iso: string): string {
  return localIsoToTime(iso);
}

export default function AgendaSlot({ slot, isOwner, style, onDelete, onClick }: Props) {
  const isUnavailability = slot.type === "unavailability";
  const isClickable = isOwner && !isUnavailability && !!onClick;

  return (
    <div
      className={`slot absolute left-0.5 right-0.5 overflow-hidden rounded px-1.5 py-0.5 text-white text-[10px] leading-tight select-none group ${isClickable ? "cursor-pointer" : ""}`}
      style={{
        ...style,
        backgroundColor: slot.color,
        opacity: isUnavailability ? 0.45 : 1,
      }}
      onClick={isClickable ? () => onClick(slot) : undefined}
    >
      <div className="truncate font-medium">
        {formatTime(slot.start)} – {formatTime(slot.end)}
      </div>

      {slot.type === "slot" && slot.title && (
        <div className="truncate opacity-90 text-[9px]">{slot.title}</div>
      )}

      {slot.type === "slot" && slot.mission_title && !slot.title && (
        <div className="truncate opacity-75 text-[9px] italic">{slot.mission_title}</div>
      )}

      {/* Bouton × suppression rapide pour unavailability (pas de modal) */}
      {isOwner && isUnavailability && onDelete && (
        <button
          className="absolute right-0.5 top-0.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-white/70 hover:text-white"
          onClick={(e) => { e.stopPropagation(); onDelete(slot.id); }}
          aria-label="Supprimer"
        >×</button>
      )}
    </div>
  );
}

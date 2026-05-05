/**
 * src/components/agenda/AgendaHeader.tsx
 * Layer  : Frontend — composants / agenda
 * Role   : Barre de navigation de l'agenda (semaine précédente / suivante, label).
 * Props  : weekLabel, isCurrentWeek (désactive le bouton précédent), onPrev, onNext
 * Used by: Agenda
 */

interface Props {
  weekLabel: string;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function AgendaHeader({ weekLabel, isCurrentWeek, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between pb-3 shrink-0">
      <button
        onClick={onPrev}
        disabled={isCurrentWeek}
        className="flex h-8 w-8 items-center justify-center rounded-eb border border-eb-layout text-[18px] text-eb-secondary transition-colors hover:bg-eb-layout disabled:opacity-25 disabled:cursor-not-allowed"
        aria-label="Semaine précédente"
      >
        ‹
      </button>

      <span className="text-[13px] font-medium text-eb-text">{weekLabel}</span>

      <button
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-eb border border-eb-layout text-[18px] text-eb-secondary transition-colors hover:bg-eb-layout"
        aria-label="Semaine suivante"
      >
        ›
      </button>
    </div>
  );
}

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
    <div className="shrink-0 pb-3">
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
        <span className="text-[13px] font-medium text-eb-text">{weekLabel}</span>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onPrev}
            disabled={isCurrentWeek}
            className="flex h-8 w-8 items-center justify-center rounded-eb border border-eb-layout text-[18px] text-eb-secondary transition-colors hover:bg-eb-layout disabled:cursor-not-allowed disabled:opacity-25"
            aria-label="Semaine précédente"
          >
            ‹
          </button>

          <button
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-eb border border-eb-layout text-[18px] text-eb-secondary transition-colors hover:bg-eb-layout"
            aria-label="Semaine suivante"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

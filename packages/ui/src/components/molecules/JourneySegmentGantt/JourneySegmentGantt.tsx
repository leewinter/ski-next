import { useUiTranslation } from '../../../i18n';
import './JourneySegmentGantt.css';

export interface JourneySegmentGanttSegment {
  id: string;
  label: string;
  startMinutes?: number;
  endMinutes?: number;
}

export interface JourneySegmentGanttProps {
  journeyStartMinutes: number;
  journeyEndMinutes: number;
  segments: JourneySegmentGanttSegment[];
}

function formatTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${hours.toString().padStart(2, '0')}${minutes
    .toString()
    .padStart(2, '0')}`;
}

function getSegmentPosition(
  journeyStartMinutes: number,
  journeyEndMinutes: number,
  segment: JourneySegmentGanttSegment,
) {
  const duration = Math.max(journeyEndMinutes - journeyStartMinutes, 1);
  const segmentStart = segment.startMinutes ?? journeyStartMinutes;
  const segmentEnd = segment.endMinutes ?? segmentStart;
  const left =
    ((segmentStart - journeyStartMinutes) / duration) * 100;
  const width = ((segmentEnd - segmentStart) / duration) * 100;

  return {
    left: `${Math.max(0, Math.min(left, 100))}%`,
    width: `${Math.max(2, Math.min(width, 100))}%`,
  };
}

function getTimeRange(segment: JourneySegmentGanttSegment) {
  if (segment.startMinutes === undefined || segment.endMinutes === undefined) {
    return undefined;
  }

  return `${formatTime(segment.startMinutes)}-${formatTime(segment.endMinutes)}`;
}

export function JourneySegmentGantt({
  journeyStartMinutes,
  journeyEndMinutes,
  segments,
}: JourneySegmentGanttProps) {
  const { t } = useUiTranslation();

  return (
    <div
      aria-label={t('journeySegmentGantt.label')}
      className="journey-segment-gantt"
    >
      <div className="journey-segment-gantt__axis">
        <span>{formatTime(journeyStartMinutes)}</span>
        <span className="journey-segment-gantt__axis-line" />
        <span>{formatTime(journeyEndMinutes)}</span>
      </div>

      <div className="journey-segment-gantt__rows">
        {segments.map((segment) => {
          const timeRange = getTimeRange(segment);

          return (
            <div className="journey-segment-gantt__row" key={segment.id}>
              <div className="journey-segment-gantt__label">
                <span className="journey-segment-gantt__label-text">
                  {segment.label}
                </span>
                {timeRange ? (
                  <span className="journey-segment-gantt__label-time">
                    {timeRange}
                  </span>
                ) : null}
              </div>
              <div className="journey-segment-gantt__track">
                <span
                  className="journey-segment-gantt__bar"
                  style={getSegmentPosition(
                    journeyStartMinutes,
                    journeyEndMinutes,
                    segment,
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

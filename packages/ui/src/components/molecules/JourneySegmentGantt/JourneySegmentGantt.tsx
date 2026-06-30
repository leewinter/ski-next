import { useUiTranslation } from '../../../i18n';
import './JourneySegmentGantt.css';

export interface JourneySegmentGanttSegment {
  id: string;
  label: string;
  kind?: 'pickup' | 'dropoff' | 'transfer' | 'positioning' | 'buffer';
  startDateTime?: Date | string;
  endDateTime?: Date | string;
}

export interface JourneySegmentGanttProps {
  journeyStartDateTime: Date | string;
  journeyEndDateTime: Date | string;
  segments: JourneySegmentGanttSegment[];
}

function getDateTimeMs(dateTime?: Date | string) {
  if (!dateTime) {
    return undefined;
  }

  const time = dateTime instanceof Date ? dateTime.getTime() : Date.parse(dateTime);

  return Number.isFinite(time) ? time : undefined;
}

function formatDateTime(dateTime?: Date | string): string | undefined {
  if (!dateTime) {
    return undefined;
  }

  if (dateTime instanceof Date) {
    return `${dateTime.getHours().toString().padStart(2, '0')}${dateTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  const timeMatch = dateTime.match(/T(\d{2}):(\d{2})/);

  return timeMatch ? `${timeMatch[1]}${timeMatch[2]}` : undefined;
}

function getSegmentPosition(
  journeyStartMs: number,
  journeyEndMs: number,
  segment: JourneySegmentGanttSegment,
) {
  const duration = Math.max(journeyEndMs - journeyStartMs, 1);
  const segmentStart = getDateTimeMs(segment.startDateTime) ?? journeyStartMs;
  const segmentEnd = getDateTimeMs(segment.endDateTime) ?? segmentStart;
  const left = ((segmentStart - journeyStartMs) / duration) * 100;
  const width = ((segmentEnd - segmentStart) / duration) * 100;

  return {
    left: `${Math.max(0, Math.min(left, 100))}%`,
    width: `${Math.max(2, Math.min(width, 100))}%`,
  };
}

function getTimeRange(segment: JourneySegmentGanttSegment) {
  const startTime = formatDateTime(segment.startDateTime);
  const endTime = formatDateTime(segment.endDateTime);

  if (!startTime || !endTime) {
    return undefined;
  }

  return `${startTime}-${endTime}`;
}

export function JourneySegmentGantt({
  journeyStartDateTime,
  journeyEndDateTime,
  segments,
}: JourneySegmentGanttProps) {
  const { t } = useUiTranslation();
  const journeyStartMs = getDateTimeMs(journeyStartDateTime) ?? 0;
  const journeyEndMs = getDateTimeMs(journeyEndDateTime) ?? journeyStartMs + 1;

  return (
    <div
      aria-label={t('journeySegmentGantt.label')}
      className="journey-segment-gantt"
    >
      <div className="journey-segment-gantt__axis">
        <span>{formatDateTime(journeyStartDateTime)}</span>
        <span className="journey-segment-gantt__axis-line" />
        <span>{formatDateTime(journeyEndDateTime)}</span>
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
                  className={`journey-segment-gantt__bar journey-segment-gantt__bar--${
                    segment.kind ?? 'transfer'
                  }`}
                  style={getSegmentPosition(
                    journeyStartMs,
                    journeyEndMs,
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

import type { CSSProperties } from 'react';
import { useUiTranslation } from '../../../i18n';
import type { JourneySegmentGanttSegment } from '../JourneySegmentGantt';
import './EditableJourneySegmentGantt.css';

export type EditableJourneySegmentGanttEdge = 'start' | 'end';

export interface EditableJourneySegmentGanttSegment
  extends JourneySegmentGanttSegment {
  startDateTime: Date | string;
  endDateTime: Date | string;
}

export interface EditableJourneySegmentGanttChange {
  edge: EditableJourneySegmentGanttEdge;
  segment: EditableJourneySegmentGanttSegment;
}

export interface EditableJourneySegmentGanttProps {
  journeyStartDateTime: Date | string;
  journeyEndDateTime: Date | string;
  segments: EditableJourneySegmentGanttSegment[];
  onSegmentChange?: (change: EditableJourneySegmentGanttChange) => void;
  stepMinutes?: number;
}

function getDateTimeMs(dateTime?: Date | string) {
  if (!dateTime) {
    return undefined;
  }

  const time = dateTime instanceof Date ? dateTime.getTime() : Date.parse(dateTime);

  return Number.isFinite(time) ? time : undefined;
}

function getDateTimeZoneSuffix(dateTime?: Date | string) {
  if (!dateTime || dateTime instanceof Date) {
    return undefined;
  }

  return dateTime.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1];
}

function getDateTimeZoneOffsetMinutes(dateTime?: Date | string) {
  const suffix = getDateTimeZoneSuffix(dateTime);

  if (!suffix || suffix === 'Z') {
    return 0;
  }

  const sign = suffix.startsWith('-') ? -1 : 1;
  const [hours = '0', minutes = '0'] = suffix.slice(1).split(':');

  return sign * (Number(hours) * 60 + Number(minutes));
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

function getDateTimeFromOffset(
  baseDateTime: Date | string,
  offsetMinutes: number,
) {
  const baseMs = getDateTimeMs(baseDateTime) ?? 0;

  if (baseDateTime instanceof Date) {
    return new Date(baseMs + offsetMinutes * 60000);
  }

  const offset = getDateTimeZoneOffsetMinutes(baseDateTime);
  const localDateTime = new Date(baseMs + offsetMinutes * 60000 + offset * 60000)
    .toISOString()
    .slice(0, 16);
  const suffix = getDateTimeZoneSuffix(baseDateTime);

  return suffix ? `${localDateTime}${suffix}` : localDateTime;
}

function getOffsetMinutes(
  dateTime: Date | string,
  journeyStartMs: number,
): number {
  return Math.round(((getDateTimeMs(dateTime) ?? journeyStartMs) - journeyStartMs) / 60000);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function getSegmentStyle(
  journeyStartMs: number,
  journeyEndMs: number,
  segment: EditableJourneySegmentGanttSegment,
): CSSProperties {
  const duration = Math.max(journeyEndMs - journeyStartMs, 1);
  const segmentStart = getDateTimeMs(segment.startDateTime) ?? journeyStartMs;
  const segmentEnd = getDateTimeMs(segment.endDateTime) ?? segmentStart;
  const left = ((segmentStart - journeyStartMs) / duration) * 100;
  const width = ((segmentEnd - segmentStart) / duration) * 100;

  return {
    '--editable-journey-segment-gantt-left': `${clamp(left, 0, 100)}%`,
    '--editable-journey-segment-gantt-width': `${clamp(width, 2, 100)}%`,
  } as CSSProperties;
}

function getTimeRange(
  segment: EditableJourneySegmentGanttSegment,
) {
  return `${formatDateTime(segment.startDateTime)}-${formatDateTime(
    segment.endDateTime,
  )}`;
}

export function EditableJourneySegmentGantt({
  journeyStartDateTime,
  journeyEndDateTime,
  segments,
  onSegmentChange,
  stepMinutes = 5,
}: EditableJourneySegmentGanttProps) {
  const { t } = useUiTranslation();
  const journeyStartMs = getDateTimeMs(journeyStartDateTime) ?? 0;
  const journeyEndMs = Math.max(
    getDateTimeMs(journeyEndDateTime) ?? journeyStartMs + 60000,
    journeyStartMs + 60000,
  );
  const durationMinutes = Math.max(
    Math.round((journeyEndMs - journeyStartMs) / 60000),
    1,
  );

  const updateSegment = (
    segment: EditableJourneySegmentGanttSegment,
    edge: EditableJourneySegmentGanttEdge,
    offsetMinutes: number,
  ) => {
    const startOffset = getOffsetMinutes(segment.startDateTime, journeyStartMs);
    const endOffset = getOffsetMinutes(segment.endDateTime, journeyStartMs);
    const nextSegment =
      edge === 'start'
        ? {
            ...segment,
            startDateTime: getDateTimeFromOffset(
              journeyStartDateTime,
              clamp(offsetMinutes, 0, endOffset - stepMinutes),
            ),
          }
        : {
            ...segment,
            endDateTime: getDateTimeFromOffset(
              journeyStartDateTime,
              clamp(offsetMinutes, startOffset + stepMinutes, durationMinutes),
            ),
          };

    onSegmentChange?.({ edge, segment: nextSegment });
  };

  return (
    <div
      aria-label={t('editableJourneySegmentGantt.label')}
      className="editable-journey-segment-gantt"
    >
      <div className="editable-journey-segment-gantt__axis">
        <span>{formatDateTime(journeyStartDateTime)}</span>
        <span className="editable-journey-segment-gantt__axis-line" />
        <span>{formatDateTime(journeyEndDateTime)}</span>
      </div>

      <div className="editable-journey-segment-gantt__rows">
        {segments.map((segment) => {
          const startOffset = getOffsetMinutes(segment.startDateTime, journeyStartMs);
          const endOffset = getOffsetMinutes(segment.endDateTime, journeyStartMs);

          return (
            <div className="editable-journey-segment-gantt__row" key={segment.id}>
              <div className="editable-journey-segment-gantt__label">
                <span className="editable-journey-segment-gantt__label-text">
                  {segment.label}
                </span>
                <span className="editable-journey-segment-gantt__label-time">
                  {getTimeRange(segment)}
                </span>
              </div>

              <div
                className="editable-journey-segment-gantt__track"
                style={getSegmentStyle(
                  journeyStartMs,
                  journeyEndMs,
                  segment,
                )}
              >
                <span
                  className={`editable-journey-segment-gantt__bar editable-journey-segment-gantt__bar--${
                    segment.kind ?? 'transfer'
                  }`}
                />
                <input
                  aria-label={`${t(
                    'editableJourneySegmentGantt.adjustSegmentStart',
                  )}: ${segment.label}`}
                  className="editable-journey-segment-gantt__range editable-journey-segment-gantt__range--start"
                  max={durationMinutes}
                  min={0}
                  onChange={(event) =>
                    updateSegment(segment, 'start', event.currentTarget.valueAsNumber)
                  }
                  step={stepMinutes}
                  type="range"
                  value={startOffset}
                />
                <input
                  aria-label={`${t(
                    'editableJourneySegmentGantt.adjustSegmentEnd',
                  )}: ${segment.label}`}
                  className="editable-journey-segment-gantt__range editable-journey-segment-gantt__range--end"
                  max={durationMinutes}
                  min={0}
                  onChange={(event) =>
                    updateSegment(segment, 'end', event.currentTarget.valueAsNumber)
                  }
                  step={stepMinutes}
                  type="range"
                  value={endOffset}
                />
                <span
                  aria-hidden="true"
                  className="editable-journey-segment-gantt__handle editable-journey-segment-gantt__handle--start"
                />
                <span
                  aria-hidden="true"
                  className="editable-journey-segment-gantt__handle editable-journey-segment-gantt__handle--end"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

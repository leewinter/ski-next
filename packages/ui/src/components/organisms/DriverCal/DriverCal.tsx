import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { useUiTranslation } from '../../../i18n';
import type {
  SkiCalDateTime,
  SkiCalJourney,
  SkiCalJourneySegment,
} from '../SkiCal';
import './DriverCal.css';

export interface DriverCalSegmentRow {
  id: string;
  journey: SkiCalJourney;
  segment?: SkiCalJourneySegment;
  label: string;
  kind: NonNullable<SkiCalJourneySegment['kind']> | 'journey';
  startMinutes: number;
  endMinutes: number;
}

export interface DriverCalProps {
  journeys: SkiCalJourney[];
  driverName?: string;
  startDateTime?: SkiCalDateTime;
  endDateTime?: SkiCalDateTime;
  startMinutes?: number;
  endMinutes?: number;
  minorMinutes?: number;
  title?: string;
  updatedLabel?: string;
}

const DEFAULT_START_MINUTES = 0;
const DEFAULT_END_MINUTES = 24 * 60;
const DEFAULT_MINOR_MINUTES = 30;
const PIXELS_PER_MINUTE = 1.08;
const HEADER_SIZE = 74;
const ROW_HEIGHT = 54;
const ROW_GAP = 4;

function getDateTimeMs(dateTime?: SkiCalDateTime) {
  if (!dateTime) {
    return undefined;
  }

  const time = dateTime instanceof Date ? dateTime.getTime() : Date.parse(dateTime);

  return Number.isFinite(time) ? time : undefined;
}

function getMinuteFromDateTime(
  dateTime: SkiCalDateTime | undefined,
  timelineStartMs: number | undefined,
) {
  const dateTimeMs = getDateTimeMs(dateTime);

  if (dateTimeMs === undefined || timelineStartMs === undefined) {
    return undefined;
  }

  return Math.round((dateTimeMs - timelineStartMs) / 60000);
}

function getDateTimeDisplayOffsetMinutes(dateTime?: SkiCalDateTime) {
  if (!dateTime) {
    return 0;
  }

  if (dateTime instanceof Date) {
    return dateTime.getHours() * 60 + dateTime.getMinutes();
  }

  const timeMatch = dateTime.match(/T(\d{2}):(\d{2})/);

  if (!timeMatch) {
    return 0;
  }

  return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
}

function formatTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${hours.toString().padStart(2, '0')}${minutes
    .toString()
    .padStart(2, '0')}`;
}

function getTimeLabels(startMinutes: number, endMinutes: number) {
  const firstHour = Math.ceil(startMinutes / 60) * 60;
  const labels: number[] = [];

  for (let minute = firstHour; minute <= endMinutes; minute += 60) {
    labels.push(minute);
  }

  return labels;
}

function getTimeGridLines(
  startMinutes: number,
  endMinutes: number,
  minorMinutes: number,
) {
  const firstLine = Math.ceil(startMinutes / minorMinutes) * minorMinutes;
  const lines: number[] = [];

  for (let minute = firstLine; minute <= endMinutes; minute += minorMinutes) {
    lines.push(minute);
  }

  return lines;
}

function resolveMinute(
  minuteValue: number | undefined,
  dateTime: SkiCalDateTime | undefined,
  timelineStartMs: number | undefined,
  fallback: number,
) {
  return getMinuteFromDateTime(dateTime, timelineStartMs) ?? minuteValue ?? fallback;
}

function getRows(
  journeys: SkiCalJourney[],
  timelineStartMs: number | undefined,
): DriverCalSegmentRow[] {
  const rows: DriverCalSegmentRow[] = [];

  for (const journey of journeys) {
    const journeyStart = resolveMinute(
      journey.startMinutes,
      journey.startDateTime,
      timelineStartMs,
      0,
    );
    const journeyEnd = resolveMinute(
      journey.endMinutes,
      journey.endDateTime,
      timelineStartMs,
      journeyStart,
    );

    if (!journey.segments?.length) {
      rows.push({
        endMinutes: journeyEnd,
        id: `${journey.id}-journey`,
        journey,
        kind: 'journey',
        label: journey.title,
        startMinutes: journeyStart,
      });
      continue;
    }

    for (const segment of journey.segments) {
      rows.push({
        endMinutes: resolveMinute(
          undefined,
          segment.endDateTime,
          timelineStartMs,
          journeyEnd,
        ),
        id: `${journey.id}-${segment.id}`,
        journey,
        kind: segment.kind ?? 'transfer',
        label: segment.label,
        segment,
        startMinutes: resolveMinute(
          undefined,
          segment.startDateTime,
          timelineStartMs,
          journeyStart,
        ),
      });
    }
  }

  return rows.sort((a, b) => a.startMinutes - b.startMinutes);
}

export function DriverCal({
  journeys,
  driverName,
  startDateTime,
  endDateTime,
  startMinutes = DEFAULT_START_MINUTES,
  endMinutes = DEFAULT_END_MINUTES,
  minorMinutes = DEFAULT_MINOR_MINUTES,
  title,
  updatedLabel,
}: DriverCalProps) {
  const { t } = useUiTranslation();
  const timelineStartMs = getDateTimeMs(startDateTime);
  const displayOffset = getDateTimeDisplayOffsetMinutes(startDateTime);
  const resolvedStartMinutes = timelineStartMs === undefined ? startMinutes : 0;
  const resolvedEndMinutes =
    getMinuteFromDateTime(endDateTime, timelineStartMs) ?? endMinutes;
  const duration = Math.max(resolvedEndMinutes - resolvedStartMinutes, 1);
  const timelineSize = Math.max(duration * PIXELS_PER_MINUTE, 720);
  const rows = useMemo(
    () => getRows(journeys, timelineStartMs),
    [journeys, timelineStartMs],
  );
  const timeLabels = useMemo(
    () => getTimeLabels(resolvedStartMinutes, resolvedEndMinutes),
    [resolvedEndMinutes, resolvedStartMinutes],
  );
  const gridLines = useMemo(
    () =>
      getTimeGridLines(resolvedStartMinutes, resolvedEndMinutes, minorMinutes),
    [minorMinutes, resolvedEndMinutes, resolvedStartMinutes],
  );

  function formatScheduleTime(minute: number) {
    return formatTime(minute + displayOffset);
  }

  function getOffset(minute: number) {
    return ((minute - resolvedStartMinutes) / duration) * timelineSize;
  }

  return (
    <section
      className="driver-cal"
      style={
        {
          '--driver-cal-row-count': Math.max(rows.length, 1),
          '--driver-cal-timeline-size': `${timelineSize}px`,
        } as CSSProperties
      }
    >
      <div className="driver-cal__header">
        <div>
          <h2 className="driver-cal__title">
            {title ?? t('driverCal.title')}
          </h2>
          {driverName ? (
            <div className="driver-cal__meta">{driverName}</div>
          ) : null}
        </div>
        {updatedLabel ? (
          <div className="driver-cal__meta">{updatedLabel}</div>
        ) : null}
      </div>

      <div className="driver-cal__viewport">
        <div className="driver-cal__canvas">
          <div className="driver-cal__corner">{t('driverCal.corner')}</div>

          {gridLines.map((minute) => (
            <span
              className={`driver-cal__grid-line driver-cal__grid-line--time${
                minute % 60 === 0 ? ' driver-cal__grid-line--strong' : ''
              }`}
              key={minute}
              style={{
                left: `calc(var(--driver-cal-header-size) + ${getOffset(minute)}px)`,
              }}
            />
          ))}

          {rows.map((row, index) => (
            <span
              className="driver-cal__grid-line driver-cal__grid-line--row"
              key={`row-${row.id}`}
              style={{
                top: `calc(${HEADER_SIZE}px + ${index} * (${ROW_HEIGHT}px + ${ROW_GAP}px))`,
              }}
            />
          ))}

          <span
            className="driver-cal__grid-line driver-cal__grid-line--row driver-cal__grid-line--strong"
            style={{
              top: `calc(${HEADER_SIZE}px + ${rows.length} * (${ROW_HEIGHT}px + ${ROW_GAP}px))`,
            }}
          />

          {timeLabels.map((minute) => (
            <div
              className="driver-cal__time-label"
              key={minute}
              style={{
                left: `calc(var(--driver-cal-header-size) + ${getOffset(minute)}px)`,
              }}
            >
              {formatScheduleTime(minute)}
            </div>
          ))}

          {rows.map((row, index) => {
            return (
              <div
                className="driver-cal__row-label"
                key={`label-${row.id}`}
                style={{
                  top: `calc(${HEADER_SIZE}px + ${index} * (${ROW_HEIGHT}px + ${ROW_GAP}px))`,
                }}
              >
                <span className="driver-cal__row-title">{row.label}</span>
                <span className="driver-cal__row-meta">{row.journey.title}</span>
              </div>
            );
          })}

          {rows.map((row, index) => {
            const left = getOffset(row.startMinutes);
            const width =
              ((row.endMinutes - row.startMinutes) / duration) * timelineSize;

            return (
              <article
                aria-label={`${row.label}: ${formatScheduleTime(
                  row.startMinutes,
                )}-${formatScheduleTime(row.endMinutes)}`}
                className={`driver-cal__segment driver-cal__segment--${row.kind}`}
                key={row.id}
                style={{
                  left: `calc(var(--driver-cal-header-size) + ${left}px)`,
                  top: `calc(${HEADER_SIZE}px + ${index} * (${ROW_HEIGHT}px + ${ROW_GAP}px) + 8px)`,
                  width: Math.max(width, 18),
                }}
                title={`${row.journey.title}: ${row.label}`}
              >
                <span className="driver-cal__segment-title">{row.label}</span>
                <span className="driver-cal__segment-time">
                  {formatScheduleTime(row.startMinutes)}-
                  {formatScheduleTime(row.endMinutes)}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

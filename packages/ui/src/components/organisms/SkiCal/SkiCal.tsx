import { useMemo, useState } from 'react';
import { useUiTranslation } from '../../../i18n';
import { JourneySegmentGantt, ResourceRequirements } from '../../molecules';
import type { ResourceRequirement } from '../../molecules';
import './SkiCal.css';

export type SkiCalOrientation = 'horizontal' | 'vertical';
export type SkiCalJourneyKind = 'shared' | 'private' | 'positioning';
export type SkiCalJourneyState = 'normal' | 'warning' | 'delayed';
export type SkiCalDateTime = Date | string;

export interface SkiCalResource {
  id: string;
  name: string;
  meta?: string;
  requirements?: ResourceRequirement[];
}

export interface SkiCalJourneySegment {
  id: string;
  label: string;
  kind?: 'pickup' | 'dropoff' | 'transfer' | 'positioning' | 'buffer';
  startMinutes?: number;
  endMinutes?: number;
  startDateTime?: SkiCalDateTime;
  endDateTime?: SkiCalDateTime;
}

export interface SkiCalJourney {
  id: string;
  resourceId: string;
  title: string;
  startMinutes?: number;
  endMinutes?: number;
  startDateTime?: SkiCalDateTime;
  endDateTime?: SkiCalDateTime;
  kind: SkiCalJourneyKind;
  state?: SkiCalJourneyState;
  segments?: SkiCalJourneySegment[];
}

export interface SkiCalProps {
  resources: SkiCalResource[];
  journeys: SkiCalJourney[];
  orientation?: SkiCalOrientation;
  onOrientationChange?: (orientation: SkiCalOrientation) => void;
  showOrientationToggle?: boolean;
  startMinutes?: number;
  endMinutes?: number;
  startDateTime?: SkiCalDateTime;
  endDateTime?: SkiCalDateTime;
  minorMinutes?: number;
  title?: string;
  updatedLabel?: string;
}

interface NormalizedJourneySegment extends SkiCalJourneySegment {
  startMinutes?: number;
  endMinutes?: number;
}

interface NormalizedJourney extends SkiCalJourney {
  startMinutes: number;
  endMinutes: number;
  segments?: NormalizedJourneySegment[];
}

interface PositionedJourney extends NormalizedJourney {
  stack: number;
}

const DEFAULT_START_MINUTES = 0;
const DEFAULT_END_MINUTES = 24 * 60;
const DEFAULT_MINOR_MINUTES = 30;
const DEFAULT_HEADER_SIZE = 72;
const PIXELS_PER_MINUTE = 1.08;
const DEFAULT_EVENT_THICKNESS = 42;
const DEFAULT_EVENT_GAP = 6;

function formatTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${hours.toString().padStart(2, '0')}${minutes
    .toString()
    .padStart(2, '0')}`;
}

function getDateTimeMs(dateTime?: SkiCalDateTime) {
  if (!dateTime) {
    return undefined;
  }

  const time = dateTime instanceof Date ? dateTime.getTime() : Date.parse(dateTime);

  return Number.isFinite(time) ? time : undefined;
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

function resolveMinute(
  minuteValue: number | undefined,
  dateTime: SkiCalDateTime | undefined,
  timelineStartMs: number | undefined,
  fallback: number,
) {
  return getMinuteFromDateTime(dateTime, timelineStartMs) ?? minuteValue ?? fallback;
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

function normalizeJourneys(
  journeys: SkiCalJourney[],
  timelineStartMs: number | undefined,
): NormalizedJourney[] {
  return journeys.map((journey) => {
    const journeyStartMinutes = resolveMinute(
      journey.startMinutes,
      journey.startDateTime,
      timelineStartMs,
      0,
    );
    const journeyEndMinutes = resolveMinute(
      journey.endMinutes,
      journey.endDateTime,
      timelineStartMs,
      journeyStartMinutes,
    );

    return {
      ...journey,
      endMinutes: journeyEndMinutes,
      startMinutes: journeyStartMinutes,
      segments: journey.segments?.map((segment) => ({
        ...segment,
        endMinutes:
          getMinuteFromDateTime(segment.endDateTime, timelineStartMs) ??
          segment.endMinutes,
        startMinutes:
          getMinuteFromDateTime(segment.startDateTime, timelineStartMs) ??
          segment.startMinutes,
      })),
    };
  });
}

function getStackedJourneys(journeys: NormalizedJourney[]): PositionedJourney[] {
  const byResource = new Map<string, NormalizedJourney[]>();

  for (const journey of journeys) {
    const resourceJourneys = byResource.get(journey.resourceId) ?? [];
    resourceJourneys.push(journey);
    byResource.set(journey.resourceId, resourceJourneys);
  }

  return Array.from(byResource.values()).flatMap((resourceJourneys) => {
    const stackEnds: number[] = [];

    return [...resourceJourneys]
      .sort((a, b) => a.startMinutes - b.startMinutes)
      .map((journey) => {
        const stack = stackEnds.findIndex((end) => end <= journey.startMinutes);
        const resolvedStack = stack === -1 ? stackEnds.length : stack;
        stackEnds[resolvedStack] = journey.endMinutes;

        return { ...journey, stack: resolvedStack };
      });
  });
}

function getResourceStackCounts(
  resources: SkiCalResource[],
  journeys: PositionedJourney[],
) {
  const stackCountsByResource = new Map(
    resources.map((resource) => [resource.id, 1]),
  );

  for (const journey of journeys) {
    stackCountsByResource.set(
      journey.resourceId,
      Math.max(stackCountsByResource.get(journey.resourceId) ?? 1, journey.stack + 1),
    );
  }

  return resources.map(
    (resource) => stackCountsByResource.get(resource.id) ?? 1,
  );
}

function getStackCountBefore(index: number, stackCounts: number[]) {
  return stackCounts
    .slice(0, index)
    .reduce((total, stackCount) => total + stackCount, 0);
}

function getResourceStartExpression(index: number, stackCounts: number[]) {
  const previousStacks = getStackCountBefore(index, stackCounts);

  return `calc(var(--header-size) + ${previousStacks} * var(--event-thickness) + ${
    previousStacks + index
  } * var(--event-gap))`;
}

function getResourceSizeExpression(stackCount: number) {
  return `calc(${stackCount} * var(--event-thickness) + ${
    stackCount + 1
  } * var(--event-gap))`;
}

function getResourceAxisSizeExpression(stackCounts: number[]) {
  const totalStacks = stackCounts.reduce(
    (total, stackCount) => total + stackCount,
    0,
  );

  return `calc(${totalStacks} * var(--event-thickness) + ${
    totalStacks + stackCounts.length
  } * var(--event-gap))`;
}

export function SkiCal({
  resources,
  journeys,
  orientation,
  onOrientationChange,
  showOrientationToggle = true,
  startMinutes = DEFAULT_START_MINUTES,
  endMinutes = DEFAULT_END_MINUTES,
  startDateTime,
  endDateTime,
  minorMinutes = DEFAULT_MINOR_MINUTES,
  title,
  updatedLabel,
}: SkiCalProps) {
  const { t } = useUiTranslation();
  const [internalOrientation, setInternalOrientation] =
    useState<SkiCalOrientation>('horizontal');
  const currentOrientation = orientation ?? internalOrientation;
  const timelineStartMs = getDateTimeMs(startDateTime);
  const timeDisplayOffsetMinutes =
    getDateTimeDisplayOffsetMinutes(startDateTime);
  const resolvedStartMinutes = timelineStartMs === undefined ? startMinutes : 0;
  const resolvedEndMinutes =
    getMinuteFromDateTime(endDateTime, timelineStartMs) ?? endMinutes;
  const duration = resolvedEndMinutes - resolvedStartMinutes;
  const timelineSize = Math.max(duration * PIXELS_PER_MINUTE, 960);
  const timeLabels = useMemo(
    () => getTimeLabels(resolvedStartMinutes, resolvedEndMinutes),
    [resolvedEndMinutes, resolvedStartMinutes],
  );
  const timeGridLines = useMemo(
    () =>
      getTimeGridLines(
        resolvedStartMinutes,
        resolvedEndMinutes,
        minorMinutes,
      ),
    [minorMinutes, resolvedEndMinutes, resolvedStartMinutes],
  );
  const resourceIndex = useMemo(
    () =>
      new Map(resources.map((resource, index) => [resource.id, index])),
    [resources],
  );
  const normalizedJourneys = useMemo(
    () => normalizeJourneys(journeys, timelineStartMs),
    [journeys, timelineStartMs],
  );
  const positionedJourneys = useMemo(
    () => getStackedJourneys(normalizedJourneys),
    [normalizedJourneys],
  );
  const resourceStackCounts = useMemo(
    () => getResourceStackCounts(resources, positionedJourneys),
    [positionedJourneys, resources],
  );

  function handleOrientationChange(nextOrientation: SkiCalOrientation) {
    setInternalOrientation(nextOrientation);
    onOrientationChange?.(nextOrientation);
  }

  function formatScheduleTime(minute: number) {
    return formatTime(minute + timeDisplayOffsetMinutes);
  }

  function getJourneyStyle(journey: PositionedJourney) {
    const index = resourceIndex.get(journey.resourceId) ?? 0;
    const resourceStart = getResourceStartExpression(
      index,
      resourceStackCounts,
    );
    const startOffset =
      ((journey.startMinutes - resolvedStartMinutes) / duration) * timelineSize;
    const size =
      ((journey.endMinutes - journey.startMinutes) / duration) * timelineSize;
    const stackOffset = `calc(${journey.stack} * (var(--event-thickness) + var(--event-gap)))`;

    if (currentOrientation === 'horizontal') {
      return {
        height: 'var(--event-thickness)',
        left: `calc(var(--header-size) + ${startOffset}px)`,
        top: `calc(${resourceStart} + var(--event-gap) + ${stackOffset})`,
        width: Math.max(size, 18),
      };
    }

    return {
      height: Math.max(size, 18),
      left: `calc(${resourceStart} + var(--event-gap) + ${stackOffset})`,
      top: `calc(var(--header-size) + ${startOffset}px)`,
      width: 'var(--event-thickness)',
    };
  }

  return (
    <section
      className={`ski-cal ski-cal--${currentOrientation}`}
      style={
        {
          '--header-size': `var(--ski-next-ski-cal-header-size, ${DEFAULT_HEADER_SIZE}px)`,
          '--lane-count': resources.length,
          '--event-thickness': `var(--ski-next-ski-cal-event-thickness, ${DEFAULT_EVENT_THICKNESS}px)`,
          '--event-gap': `var(--ski-next-ski-cal-event-gap, ${DEFAULT_EVENT_GAP}px)`,
          '--resource-axis-size':
            getResourceAxisSizeExpression(resourceStackCounts),
          '--minor-x': `${minorMinutes * PIXELS_PER_MINUTE}px`,
          '--minor-y': `${minorMinutes * PIXELS_PER_MINUTE}px`,
          '--timeline-size': `calc(var(--header-size) + ${timelineSize}px)`,
        } as React.CSSProperties
      }
    >
      <div className="ski-cal__toolbar">
        <div>
          <h2 className="ski-cal__title">{title ?? t('skiCal.title')}</h2>
          {updatedLabel ? (
            <div className="ski-cal__meta">{updatedLabel}</div>
          ) : null}
        </div>

        {showOrientationToggle ? (
          <div
            aria-label={t('skiCal.orientation.label')}
            className="ski-cal__toggle"
            role="group"
          >
            <button
              className="ski-cal__toggle-button"
              data-active={currentOrientation === 'horizontal'}
              onClick={() => handleOrientationChange('horizontal')}
              type="button"
            >
              {t('skiCal.orientation.horizontal')}
            </button>
            <button
              className="ski-cal__toggle-button"
              data-active={currentOrientation === 'vertical'}
              onClick={() => handleOrientationChange('vertical')}
              type="button"
            >
              {t('skiCal.orientation.vertical')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="ski-cal__viewport">
        <div className="ski-cal__canvas">
          <div className="ski-cal__corner">{t('skiCal.corner')}</div>

          {timeGridLines.map((minute) => {
            const offset =
              ((minute - resolvedStartMinutes) / duration) * timelineSize;
            const isStrong = minute % 60 === 0;

            return (
              <span
                className={`ski-cal__grid-line ski-cal__grid-line--time${
                  isStrong ? ' ski-cal__grid-line--strong' : ''
                }`}
                key={`time-${minute}`}
                style={
                  currentOrientation === 'horizontal'
                    ? { left: `calc(var(--header-size) + ${offset}px)` }
                    : { top: `calc(var(--header-size) + ${offset}px)` }
                }
              />
            );
          })}

          {resources.map((resource, index) => {
            const resourceStart = getResourceStartExpression(
              index,
              resourceStackCounts,
            );

            return (
              <span
                className="ski-cal__grid-line ski-cal__grid-line--resource ski-cal__grid-line--strong"
                key={`resource-line-${resource.id}`}
                style={
                  currentOrientation === 'horizontal'
                    ? { top: resourceStart }
                    : { left: resourceStart }
                }
              />
            );
          })}

          {resources.length ? (
            <span
              className="ski-cal__grid-line ski-cal__grid-line--resource ski-cal__grid-line--strong"
              style={
                currentOrientation === 'horizontal'
                  ? {
                      top: `calc(var(--header-size) + var(--resource-axis-size))`,
                    }
                  : {
                      left: `calc(var(--header-size) + var(--resource-axis-size))`,
                    }
              }
            />
          ) : null}

          {timeLabels.map((minute) => {
            const offset =
              ((minute - resolvedStartMinutes) / duration) * timelineSize;

            return (
              <div
                className="ski-cal__time-label"
                key={minute}
                style={
                  currentOrientation === 'horizontal'
                    ? {
                        left: `calc(var(--header-size) + ${offset}px)`,
                        width: 54,
                      }
                    : { top: `calc(var(--header-size) + ${offset}px)` }
                }
              >
                {formatScheduleTime(minute)}
              </div>
            );
          })}

          {resources.map((resource, index) => {
            const resourceStart = getResourceStartExpression(
              index,
              resourceStackCounts,
            );
            const resourceSize = getResourceSizeExpression(
              resourceStackCounts[index] ?? 1,
            );

            return (
              <div
                className="ski-cal__resource-label"
                key={resource.id}
                style={
                  currentOrientation === 'horizontal'
                    ? {
                        height: resourceSize,
                        top: resourceStart,
                      }
                    : {
                        left: resourceStart,
                        width: resourceSize,
                      }
                }
                title={resource.meta}
              >
                <span className="ski-cal__resource-name">
                  {resource.name}
                </span>
                {resource.requirements?.length ? (
                  <ResourceRequirements requirements={resource.requirements} />
                ) : null}
              </div>
            );
          })}

          {positionedJourneys.map((journey) => (
            <article
              className={`ski-cal__journey ski-cal__journey--${
                journey.kind
              } ski-cal__journey--state-${journey.state ?? 'normal'}`}
              key={journey.id}
              style={getJourneyStyle(journey)}
              title={`${journey.title}: ${formatScheduleTime(
                journey.startMinutes,
              )}-${formatScheduleTime(journey.endMinutes)}`}
            >
              <span className="ski-cal__journey-title">{journey.title}</span>
              <span className="ski-cal__journey-time">
                {`${formatScheduleTime(journey.startMinutes)}-${formatScheduleTime(
                  journey.endMinutes,
                )}`}
              </span>
              {journey.segments?.length ? (
                <>
                  <span
                    className="ski-cal__segments"
                    style={
                      {
                        '--segment-count': journey.segments.length,
                      } as React.CSSProperties
                    }
                  >
                    {journey.segments.map((segment) => (
                      <span
                        className={`ski-cal__segment ski-cal__segment--${
                          segment.kind ?? 'transfer'
                        }`}
                        key={segment.id}
                        title={segment.label}
                      />
                    ))}
                  </span>
                  <span className="ski-cal__segment-detail">
                    <JourneySegmentGantt
                      journeyEndMinutes={journey.endMinutes}
                      journeyStartMinutes={journey.startMinutes}
                      segments={journey.segments}
                      timeOffsetMinutes={timeDisplayOffsetMinutes}
                    />
                  </span>
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

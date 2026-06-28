import type { FocusEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUiTranslation } from '../../../i18n';
import { JourneySegmentGantt, ResourceRequirements } from '../../molecules';
import type { ResourceRequirement } from '../../molecules';
import { JourneyDetailsPanel } from '../JourneyDetailsPanel';
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
  onJourneyChange?: (journey: SkiCalJourney) => void;
  onOrientationChange?: (orientation: SkiCalOrientation) => void;
  onResourceChange?: (resource: SkiCalResource) => void;
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

interface SegmentDetailOverlay {
  journeyId: string;
  left: number;
  placement: 'above' | 'below';
  top: number;
}

const DEFAULT_START_MINUTES = 0;
const DEFAULT_END_MINUTES = 24 * 60;
const DEFAULT_MINOR_MINUTES = 30;
const DEFAULT_HEADER_SIZE = 72;
const PIXELS_PER_MINUTE = 1.08;
const DEFAULT_EVENT_THICKNESS = 42;
const DEFAULT_EVENT_GAP = 6;
const RESIZE_STEP_MINUTES = 5;

interface ViewportSize {
  height: number;
  width: number;
}

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

function getDateTimeFromTimelineMinute(
  minute: number,
  timelineStartMs: number | undefined,
) {
  if (timelineStartMs === undefined) {
    return undefined;
  }

  return new Date(timelineStartMs + minute * 60000).toISOString();
}

function getUpdatedDateTime(
  minute: number,
  currentDateTime: SkiCalDateTime | undefined,
  timelineStartMs: number | undefined,
) {
  return (
    getDateTimeFromTimelineMinute(minute, timelineStartMs) ?? currentDateTime
  );
}

function snapMinute(minute: number) {
  return Math.round(minute / RESIZE_STEP_MINUTES) * RESIZE_STEP_MINUTES;
}

function clampMinute(minute: number, min: number, max: number) {
  return Math.min(Math.max(minute, min), max);
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

const legendItems = [
  { color: 'shared', labelKey: 'skiCal.legend.shared' },
  { color: 'private', labelKey: 'skiCal.legend.private' },
  { color: 'positioning', labelKey: 'skiCal.legend.positioning' },
  { color: 'pickup', labelKey: 'skiCal.legend.pickup' },
  { color: 'buffer', labelKey: 'skiCal.legend.buffer' },
  { color: 'warning', labelKey: 'skiCal.legend.warning' },
] as const;

export function SkiCal({
  resources,
  journeys,
  orientation,
  onJourneyChange,
  onOrientationChange,
  onResourceChange,
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const suppressJourneyClickRef = useRef(false);
  const [internalOrientation, setInternalOrientation] =
    useState<SkiCalOrientation>('horizontal');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>();
  const [journeyOverrides, setJourneyOverrides] = useState<
    Record<string, SkiCalJourney>
  >({});
  const [resourceOverrides, setResourceOverrides] = useState<
    Record<string, SkiCalResource>
  >({});
  const [segmentDetailOverlay, setSegmentDetailOverlay] =
    useState<SegmentDetailOverlay>();
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    height: 0,
    width: 0,
  });
  const currentOrientation = orientation ?? internalOrientation;
  const timelineStartMs = getDateTimeMs(startDateTime);
  const timeDisplayOffsetMinutes =
    getDateTimeDisplayOffsetMinutes(startDateTime);
  const resolvedStartMinutes = timelineStartMs === undefined ? startMinutes : 0;
  const resolvedEndMinutes =
    getMinuteFromDateTime(endDateTime, timelineStartMs) ?? endMinutes;
  const duration = resolvedEndMinutes - resolvedStartMinutes;
  const visibleTimelineSize =
    currentOrientation === 'horizontal'
      ? Math.max(viewportSize.width - DEFAULT_HEADER_SIZE, 0)
      : Math.max(viewportSize.height - DEFAULT_HEADER_SIZE, 0);
  const timelineSize = Math.max(
    duration * PIXELS_PER_MINUTE,
    visibleTimelineSize,
    960,
  );
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
  const effectiveResources = useMemo(
    () => resources.map((resource) => resourceOverrides[resource.id] ?? resource),
    [resourceOverrides, resources],
  );
  const resourceIndex = useMemo(
    () =>
      new Map(effectiveResources.map((resource, index) => [resource.id, index])),
    [effectiveResources],
  );
  const effectiveJourneys = useMemo(
    () => journeys.map((journey) => journeyOverrides[journey.id] ?? journey),
    [journeyOverrides, journeys],
  );
  const selectedJourney = useMemo(
    () => effectiveJourneys.find((journey) => journey.id === selectedJourneyId),
    [effectiveJourneys, selectedJourneyId],
  );
  const normalizedJourneys = useMemo(
    () => normalizeJourneys(effectiveJourneys, timelineStartMs),
    [effectiveJourneys, timelineStartMs],
  );
  const positionedJourneys = useMemo(
    () => getStackedJourneys(normalizedJourneys),
    [normalizedJourneys],
  );
  const resourceStackCounts = useMemo(
    () => getResourceStackCounts(effectiveResources, positionedJourneys),
    [effectiveResources, positionedJourneys],
  );

  useEffect(() => {
    const observedViewport = viewportRef.current;

    if (!observedViewport) {
      return undefined;
    }

    const viewportElement: HTMLDivElement = observedViewport;

    function updateViewportSize() {
      setViewportSize({
        height: viewportElement.clientHeight,
        width: viewportElement.clientWidth,
      });
    }

    updateViewportSize();

    const resizeObserver = new ResizeObserver(updateViewportSize);
    resizeObserver.observe(viewportElement);

    return () => resizeObserver.disconnect();
  }, []);

  function handleOrientationChange(nextOrientation: SkiCalOrientation) {
    setInternalOrientation(nextOrientation);
    onOrientationChange?.(nextOrientation);
  }

  function handleJourneySave(journey: SkiCalJourney) {
    setJourneyOverrides((currentOverrides) => ({
      ...currentOverrides,
      [journey.id]: journey,
    }));
    onJourneyChange?.(journey);
  }

  function handleResourceSave(resource: SkiCalResource) {
    setResourceOverrides((currentOverrides) => ({
      ...currentOverrides,
      [resource.id]: resource,
    }));
    onResourceChange?.(resource);
  }

  function getResizedJourney(
    journey: PositionedJourney,
    edge: 'start' | 'end',
    nextMinute: number,
  ): SkiCalJourney {
    const nextStartMinutes =
      edge === 'start'
        ? clampMinute(
            snapMinute(nextMinute),
            resolvedStartMinutes,
            journey.endMinutes - RESIZE_STEP_MINUTES,
          )
        : journey.startMinutes;
    const nextEndMinutes =
      edge === 'end'
        ? clampMinute(
            snapMinute(nextMinute),
            journey.startMinutes + RESIZE_STEP_MINUTES,
            resolvedEndMinutes,
          )
        : journey.endMinutes;

    return {
      ...journey,
      endDateTime: getUpdatedDateTime(
        nextEndMinutes,
        journey.endDateTime,
        timelineStartMs,
      ),
      endMinutes: nextEndMinutes,
      startDateTime: getUpdatedDateTime(
        nextStartMinutes,
        journey.startDateTime,
        timelineStartMs,
      ),
      startMinutes: nextStartMinutes,
    };
  }

  function handleJourneyResizeStart(
    event: PointerEvent<HTMLSpanElement>,
    journey: PositionedJourney,
    edge: 'start' | 'end',
  ) {
    event.preventDefault();
    event.stopPropagation();
    suppressJourneyClickRef.current = true;

    const pointerStart =
      currentOrientation === 'horizontal' ? event.clientX : event.clientY;
    const initialMinute =
      edge === 'start' ? journey.startMinutes : journey.endMinutes;
    let latestJourney = getResizedJourney(journey, edge, initialMinute);

    function handlePointerMove(pointerEvent: globalThis.PointerEvent) {
      const pointerPosition =
        currentOrientation === 'horizontal'
          ? pointerEvent.clientX
          : pointerEvent.clientY;
      const deltaMinutes =
        ((pointerPosition - pointerStart) / timelineSize) * duration;
      latestJourney = getResizedJourney(
        journey,
        edge,
        initialMinute + deltaMinutes,
      );

      setJourneyOverrides((currentOverrides) => ({
        ...currentOverrides,
        [journey.id]: latestJourney,
      }));
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      onJourneyChange?.(latestJourney);

      window.setTimeout(() => {
        suppressJourneyClickRef.current = false;
      }, 0);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp, { once: true });
  }

  function handleJourneyKeyDown(
    event: KeyboardEvent<HTMLElement>,
    journeyId: string,
  ) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelectedJourneyId(journeyId);
    }
  }

  function handleSegmentDetailShow(
    event: FocusEvent<HTMLElement> | MouseEvent<HTMLElement>,
    journey: PositionedJourney,
  ) {
    if (!journey.segments?.length) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const overlayWidth = Math.min(360, window.innerWidth - 40);
    const belowTop = rect.bottom + 6;
    const aboveTop = rect.top - 124;
    const hasRoomBelow = belowTop + 120 < window.innerHeight;
    const left = Math.min(
      Math.max(rect.left + 6, 8),
      Math.max(window.innerWidth - overlayWidth - 8, 8),
    );

    setSegmentDetailOverlay({
      journeyId: journey.id,
      left,
      placement: hasRoomBelow || aboveTop < 8 ? 'below' : 'above',
      top: hasRoomBelow || aboveTop < 8 ? belowTop : aboveTop,
    });
  }

  function handleSegmentDetailHide() {
    setSegmentDetailOverlay(undefined);
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
          '--lane-count': effectiveResources.length,
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

        <div className="ski-cal__toolbar-actions">
          <div className="ski-cal__legend">
            <button
              aria-label={t('skiCal.legend.label')}
              className="ski-cal__legend-trigger"
              type="button"
            >
              {t('skiCal.legend.trigger')}
            </button>
            <div
              aria-label={t('skiCal.legend.label')}
              className="ski-cal__legend-panel"
              role="list"
            >
              {legendItems.map((item) => (
                <span
                  className="ski-cal__legend-item"
                  key={item.labelKey}
                  role="listitem"
                >
                  <span
                    aria-hidden="true"
                    className={`ski-cal__legend-swatch ski-cal__legend-swatch--${item.color}`}
                  />
                  <span>{t(item.labelKey)}</span>
                </span>
              ))}
            </div>
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
      </div>

      <div className="ski-cal__viewport" ref={viewportRef}>
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

          {effectiveResources.map((resource, index) => {
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

          {effectiveResources.length ? (
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

          {effectiveResources.map((resource, index) => {
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
              aria-label={`${journey.title}: ${formatScheduleTime(
                journey.startMinutes,
              )}-${formatScheduleTime(journey.endMinutes)}`}
              className={`ski-cal__journey ski-cal__journey--${
                journey.kind
              } ski-cal__journey--state-${journey.state ?? 'normal'}`}
              key={journey.id}
              onClick={() => {
                if (suppressJourneyClickRef.current) {
                  return;
                }

                setSelectedJourneyId(journey.id);
              }}
              onBlur={handleSegmentDetailHide}
              onFocus={(event) => handleSegmentDetailShow(event, journey)}
              onKeyDown={(event) => handleJourneyKeyDown(event, journey.id)}
              onMouseEnter={(event) => handleSegmentDetailShow(event, journey)}
              onMouseLeave={handleSegmentDetailHide}
              role="button"
              style={getJourneyStyle(journey)}
              tabIndex={0}
              title={`${journey.title}: ${formatScheduleTime(
                journey.startMinutes,
              )}-${formatScheduleTime(journey.endMinutes)}`}
            >
              <span
                aria-label={t('skiCal.resize.start')}
                className="ski-cal__resize-handle ski-cal__resize-handle--start"
                onPointerDown={(event) =>
                  handleJourneyResizeStart(event, journey, 'start')
                }
                role="slider"
                tabIndex={-1}
              />
              <span
                aria-label={t('skiCal.resize.end')}
                className="ski-cal__resize-handle ski-cal__resize-handle--end"
                onPointerDown={(event) =>
                  handleJourneyResizeStart(event, journey, 'end')
                }
                role="slider"
                tabIndex={-1}
              />
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
                </>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {segmentDetailOverlay ? (
        <span
          className={`ski-cal__segment-detail ski-cal__segment-detail--${segmentDetailOverlay.placement}`}
          style={{
            left: segmentDetailOverlay.left,
            top: segmentDetailOverlay.top,
          }}
        >
          {(() => {
            const journey = positionedJourneys.find(
              (positionedJourney) =>
                positionedJourney.id === segmentDetailOverlay.journeyId,
            );

            return journey?.segments?.length ? (
              <JourneySegmentGantt
                journeyEndMinutes={journey.endMinutes}
                journeyStartMinutes={journey.startMinutes}
                segments={journey.segments}
                timeOffsetMinutes={timeDisplayOffsetMinutes}
              />
            ) : null;
          })()}
        </span>
      ) : null}

      <JourneyDetailsPanel
        journey={selectedJourney}
        onClose={() => setSelectedJourneyId(undefined)}
        onResourceChange={handleResourceSave}
        onSave={handleJourneySave}
        open={selectedJourney !== undefined}
        resources={effectiveResources}
      />
    </section>
  );
}

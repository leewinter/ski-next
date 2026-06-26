import { useMemo, useState } from 'react';
import { useUiTranslation } from '../../../i18n';
import { JourneySegmentGantt } from '../../molecules';
import './SkiCal.css';

export type SkiCalOrientation = 'horizontal' | 'vertical';
export type SkiCalJourneyKind = 'shared' | 'private' | 'positioning';

export interface SkiCalResource {
  id: string;
  name: string;
  meta?: string;
}

export interface SkiCalJourneySegment {
  id: string;
  label: string;
  startMinutes?: number;
  endMinutes?: number;
}

export interface SkiCalJourney {
  id: string;
  resourceId: string;
  title: string;
  startMinutes: number;
  endMinutes: number;
  kind: SkiCalJourneyKind;
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
  minorMinutes?: number;
  title?: string;
  updatedLabel?: string;
}

interface PositionedJourney extends SkiCalJourney {
  stack: number;
}

const DEFAULT_START_MINUTES = 0;
const DEFAULT_END_MINUTES = 24 * 60;
const DEFAULT_MINOR_MINUTES = 30;
const HEADER_SIZE = 72;
const HORIZONTAL_LANE_SIZE = 104;
const VERTICAL_LANE_SIZE = 128;
const PIXELS_PER_MINUTE = 1.08;
const EVENT_THICKNESS = 42;
const EVENT_GAP = 6;

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

function getStackedJourneys(journeys: SkiCalJourney[]): PositionedJourney[] {
  const byResource = new Map<string, SkiCalJourney[]>();

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

export function SkiCal({
  resources,
  journeys,
  orientation,
  onOrientationChange,
  showOrientationToggle = true,
  startMinutes = DEFAULT_START_MINUTES,
  endMinutes = DEFAULT_END_MINUTES,
  minorMinutes = DEFAULT_MINOR_MINUTES,
  title,
  updatedLabel,
}: SkiCalProps) {
  const { t } = useUiTranslation();
  const [internalOrientation, setInternalOrientation] =
    useState<SkiCalOrientation>('horizontal');
  const currentOrientation = orientation ?? internalOrientation;
  const duration = endMinutes - startMinutes;
  const timelineSize = Math.max(duration * PIXELS_PER_MINUTE, 960);
  const timeLabels = useMemo(
    () => getTimeLabels(startMinutes, endMinutes),
    [startMinutes, endMinutes],
  );
  const timeGridLines = useMemo(
    () => getTimeGridLines(startMinutes, endMinutes, minorMinutes),
    [endMinutes, minorMinutes, startMinutes],
  );
  const resourceIndex = useMemo(
    () =>
      new Map(resources.map((resource, index) => [resource.id, index])),
    [resources],
  );
  const positionedJourneys = useMemo(
    () => getStackedJourneys(journeys),
    [journeys],
  );
  const laneSize =
    currentOrientation === 'horizontal'
      ? HORIZONTAL_LANE_SIZE
      : VERTICAL_LANE_SIZE;

  function handleOrientationChange(nextOrientation: SkiCalOrientation) {
    setInternalOrientation(nextOrientation);
    onOrientationChange?.(nextOrientation);
  }

  function getJourneyStyle(journey: PositionedJourney) {
    const index = resourceIndex.get(journey.resourceId) ?? 0;
    const startOffset =
      ((journey.startMinutes - startMinutes) / duration) * timelineSize;
    const size =
      ((journey.endMinutes - journey.startMinutes) / duration) * timelineSize;
    const stackOffset = journey.stack * (EVENT_THICKNESS + EVENT_GAP);

    if (currentOrientation === 'horizontal') {
      return {
        height: EVENT_THICKNESS,
        left: HEADER_SIZE + startOffset,
        top:
          HEADER_SIZE +
          index * laneSize +
          EVENT_GAP +
          stackOffset,
        width: Math.max(size, 18),
      };
    }

    return {
      height: Math.max(size, 18),
      left:
        HEADER_SIZE +
        index * laneSize +
        EVENT_GAP +
        stackOffset,
      top: HEADER_SIZE + startOffset,
      width: EVENT_THICKNESS,
    };
  }

  return (
    <section
      className={`ski-cal ski-cal--${currentOrientation}`}
      style={
        {
          '--header-size': `${HEADER_SIZE}px`,
          '--lane-count': resources.length,
          '--lane-size': `${laneSize}px`,
          '--minor-x': `${minorMinutes * PIXELS_PER_MINUTE}px`,
          '--minor-y': `${minorMinutes * PIXELS_PER_MINUTE}px`,
          '--timeline-size': `${HEADER_SIZE + timelineSize}px`,
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
            const offset = ((minute - startMinutes) / duration) * timelineSize;
            const isStrong = minute % 60 === 0;

            return (
              <span
                className={`ski-cal__grid-line ski-cal__grid-line--time${
                  isStrong ? ' ski-cal__grid-line--strong' : ''
                }`}
                key={`time-${minute}`}
                style={
                  currentOrientation === 'horizontal'
                    ? { left: HEADER_SIZE + offset }
                    : { top: HEADER_SIZE + offset }
                }
              />
            );
          })}

          {resources.map((resource, index) => {
            const offset = HEADER_SIZE + index * laneSize;

            return (
              <span
                className="ski-cal__grid-line ski-cal__grid-line--resource ski-cal__grid-line--strong"
                key={`resource-line-${resource.id}`}
                style={
                  currentOrientation === 'horizontal'
                    ? { top: offset }
                    : { left: offset }
                }
              />
            );
          })}

          {resources.length ? (
            <span
              className="ski-cal__grid-line ski-cal__grid-line--resource ski-cal__grid-line--strong"
              style={
                currentOrientation === 'horizontal'
                  ? { top: HEADER_SIZE + resources.length * laneSize }
                  : { left: HEADER_SIZE + resources.length * laneSize }
              }
            />
          ) : null}

          {timeLabels.map((minute) => {
            const offset = ((minute - startMinutes) / duration) * timelineSize;

            return (
              <div
                className="ski-cal__time-label"
                key={minute}
                style={
                  currentOrientation === 'horizontal'
                    ? { left: HEADER_SIZE + offset, width: 54 }
                    : { top: HEADER_SIZE + offset }
                }
              >
                {formatTime(minute)}
              </div>
            );
          })}

          {resources.map((resource, index) => (
            <div
              className="ski-cal__resource-label"
              key={resource.id}
              style={
                currentOrientation === 'horizontal'
                  ? { top: HEADER_SIZE + index * laneSize }
                  : { left: HEADER_SIZE + index * laneSize }
              }
              title={resource.meta}
            >
              {resource.name}
            </div>
          ))}

          {positionedJourneys.map((journey) => (
            <article
              className={`ski-cal__journey ski-cal__journey--${journey.kind}`}
              key={journey.id}
              style={getJourneyStyle(journey)}
              title={`${journey.title}: ${formatTime(
                journey.startMinutes,
              )}-${formatTime(journey.endMinutes)}`}
            >
              <span className="ski-cal__journey-title">{journey.title}</span>
              <span className="ski-cal__journey-time">
                {formatTime(journey.startMinutes)}-{formatTime(journey.endMinutes)}
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
                        className="ski-cal__segment"
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

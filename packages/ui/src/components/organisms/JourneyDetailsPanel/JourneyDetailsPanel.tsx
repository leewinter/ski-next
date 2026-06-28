import { Button, Divider, Drawer, Form, Input, Select, Space } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useUiTranslation } from '../../../i18n';
import type {
  ResourceRequirement,
  ResourceRequirementKind,
} from '../../molecules';
import type {
  SkiCalJourney,
  SkiCalJourneyKind,
  SkiCalJourneySegment,
  SkiCalJourneyState,
  SkiCalResource,
} from '../SkiCal';
import './JourneyDetailsPanel.css';

export interface JourneyDetailsPanelProps {
  journey?: SkiCalJourney;
  open: boolean;
  resources: SkiCalResource[];
  onClose: () => void;
  onResourceChange?: (resource: SkiCalResource) => void;
  onSave?: (journey: SkiCalJourney) => void;
}

type JourneyDetailsFormValue = Omit<SkiCalJourney, 'segments'> & {
  segments?: SkiCalJourneySegment[];
};

const journeyKindOptions: SkiCalJourneyKind[] = [
  'shared',
  'private',
  'positioning',
];
const journeyStateOptions: SkiCalJourneyState[] = [
  'normal',
  'warning',
  'delayed',
];
const segmentKindOptions: NonNullable<SkiCalJourneySegment['kind']>[] = [
  'pickup',
  'transfer',
  'dropoff',
  'positioning',
  'buffer',
];
const DEFAULT_SEGMENT_DURATION_MINUTES = 15;
const requirementKindOptions: ResourceRequirementKind[] = [
  'passenger',
  'babySeat',
  'boosterSeat',
  'luggage',
  'skiBag',
  'note',
];
const TIME_ZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;

function getNumberValue(value: unknown) {
  if (value === '' || value === undefined || value === null) {
    return undefined;
  }

  return Number(value);
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

  return dateTime.match(TIME_ZONE_SUFFIX_PATTERN)?.[1];
}

function applyFallbackTimeZone(
  dateTime: Date | string | undefined,
  fallbackDateTime: Date | string | undefined,
) {
  if (!dateTime || dateTime instanceof Date || getDateTimeZoneSuffix(dateTime)) {
    return dateTime;
  }

  const fallbackTimeZone = getDateTimeZoneSuffix(fallbackDateTime);

  return fallbackTimeZone ? `${dateTime}${fallbackTimeZone}` : dateTime;
}

function getDateTimeInputValue(dateTime?: Date | string) {
  if (!dateTime) {
    return undefined;
  }

  if (dateTime instanceof Date) {
    return dateTime.toISOString().slice(0, 16);
  }

  return dateTime.slice(0, 16);
}

function getDateTimeFromOffset(baseDateTime: Date | string, offsetMinutes: number) {
  const baseMs = getDateTimeMs(baseDateTime);

  if (baseMs === undefined) {
    return undefined;
  }

  return new Date(baseMs + offsetMinutes * 60000).toISOString().slice(0, 16);
}

function getMinuteOffset(dateTime: Date | string | undefined, baseDateTime?: Date | string) {
  const dateTimeMs = getDateTimeMs(dateTime);
  const baseMs = getDateTimeMs(baseDateTime);

  if (dateTimeMs === undefined || baseMs === undefined) {
    return undefined;
  }

  return Math.round((dateTimeMs - baseMs) / 60000);
}

function getJourneyDurationMinutes(journey?: SkiCalJourney) {
  if (!journey) {
    return 1;
  }

  const dateDuration = getMinuteOffset(journey.endDateTime, journey.startDateTime);

  return Math.max(
    dateDuration ??
      ((journey.endMinutes ?? 0) - (journey.startMinutes ?? 0)),
    1,
  );
}

function getSegmentStartOffset(
  segment: SkiCalJourneySegment,
  journey: SkiCalJourney,
) {
  return Math.max(
    getMinuteOffset(segment.startDateTime, journey.startDateTime) ??
      ((segment.startMinutes ?? journey.startMinutes ?? 0) -
        (journey.startMinutes ?? 0)),
    0,
  );
}

function getSegmentEndOffset(
  segment: SkiCalJourneySegment,
  journey: SkiCalJourney,
) {
  return Math.max(
    getMinuteOffset(segment.endDateTime, journey.startDateTime) ??
      ((segment.endMinutes ?? segment.startMinutes ?? journey.startMinutes ?? 0) -
        (journey.startMinutes ?? 0)),
    0,
  );
}

function formatOffsetTime(journey: SkiCalJourney, offsetMinutes: number) {
  const baseMs = getDateTimeMs(journey.startDateTime);

  if (baseMs !== undefined) {
    return new Date(baseMs + offsetMinutes * 60000)
      .toISOString()
      .slice(11, 16);
  }

  const absoluteMinutes = (journey.startMinutes ?? 0) + offsetMinutes;
  const normalized = ((absoluteMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

function prepareFormValue(journey: SkiCalJourney): JourneyDetailsFormValue {
  return {
    ...journey,
    endDateTime: getDateTimeInputValue(journey.endDateTime),
    segments: journey.segments?.map((segment) => {
      const startOffset = getSegmentStartOffset(segment, journey);
      const endOffset = getSegmentEndOffset(segment, journey);

      return {
        ...segment,
        endDateTime:
          getDateTimeInputValue(segment.endDateTime) ??
          (journey.startDateTime
            ? getDateTimeFromOffset(journey.startDateTime, endOffset)
            : undefined),
        endMinutes:
          segment.endMinutes ?? (journey.startMinutes ?? 0) + endOffset,
        startDateTime:
          getDateTimeInputValue(segment.startDateTime) ??
          (journey.startDateTime
            ? getDateTimeFromOffset(journey.startDateTime, startOffset)
            : undefined),
        startMinutes:
          segment.startMinutes ?? (journey.startMinutes ?? 0) + startOffset,
      };
    }),
    startDateTime: getDateTimeInputValue(journey.startDateTime),
  };
}

function normalizeFormValue(
  value: JourneyDetailsFormValue,
  fallbackJourney: SkiCalJourney,
): SkiCalJourney {
  return {
    ...fallbackJourney,
    ...value,
    endDateTime: applyFallbackTimeZone(
      value.endDateTime,
      fallbackJourney.endDateTime,
    ),
    endMinutes: getNumberValue(value.endMinutes) ?? fallbackJourney.endMinutes,
    segments: value.segments?.map((segment) => ({
      ...segment,
      endDateTime: applyFallbackTimeZone(
        segment.endDateTime,
        fallbackJourney.segments?.find(
          (fallbackSegment) => fallbackSegment.id === segment.id,
        )?.endDateTime,
      ),
      endMinutes:
        getNumberValue(segment.endMinutes) ??
        fallbackJourney.segments?.find(
          (fallbackSegment) => fallbackSegment.id === segment.id,
        )?.endMinutes,
      startDateTime: applyFallbackTimeZone(
        segment.startDateTime,
        fallbackJourney.segments?.find(
          (fallbackSegment) => fallbackSegment.id === segment.id,
        )?.startDateTime,
      ),
      startMinutes:
        getNumberValue(segment.startMinutes) ??
        fallbackJourney.segments?.find(
          (fallbackSegment) => fallbackSegment.id === segment.id,
        )?.startMinutes,
    })),
    startDateTime: applyFallbackTimeZone(
      value.startDateTime,
      fallbackJourney.startDateTime,
    ),
    startMinutes: getNumberValue(value.startMinutes) ?? fallbackJourney.startMinutes,
  };
}

export function JourneyDetailsPanel({
  journey,
  open,
  resources,
  onClose,
  onResourceChange,
  onSave,
}: JourneyDetailsPanelProps) {
  const { t } = useUiTranslation();
  const [form] = Form.useForm<JourneyDetailsFormValue>();
  const watchedSegments = Form.useWatch('segments', form);
  const watchedResourceId = Form.useWatch('resourceId', form);
  const selectedResource = useMemo(
    () =>
      resources.find(
        (resource) => resource.id === (watchedResourceId ?? journey?.resourceId),
      ),
    [journey?.resourceId, resources, watchedResourceId],
  );
  const [requirements, setRequirements] = useState<ResourceRequirement[]>([]);
  const journeyDurationMinutes = getJourneyDurationMinutes(journey);

  useEffect(() => {
    if (journey) {
      form.setFieldsValue({
        ...prepareFormValue(journey),
        state: journey.state ?? 'normal',
      });
    } else {
      form.resetFields();
    }
  }, [form, journey]);

  useEffect(() => {
    setRequirements(selectedResource?.requirements ?? []);
  }, [selectedResource?.id, selectedResource?.requirements]);

  function handleSave() {
    if (!journey) {
      return;
    }

    const value = form.getFieldsValue(true);
    if (selectedResource) {
      onResourceChange?.({
        ...selectedResource,
        requirements: requirements
          .filter((requirement) => requirement.quantity > 0)
          .map((requirement) => ({
            ...requirement,
            label: requirement.label?.trim() || undefined,
            quantity: Number(requirement.quantity) || 0,
          })),
      });
    }

    onSave?.(normalizeFormValue(value, journey));
    onClose();
  }

  function updateRequirement(
    requirementId: string,
    patch: Partial<ResourceRequirement>,
  ) {
    setRequirements((currentRequirements) =>
      currentRequirements.map((requirement) =>
        requirement.id === requirementId
          ? {
              ...requirement,
              ...patch,
            }
          : requirement,
      ),
    );
  }

  function addRequirement() {
    const kind: ResourceRequirementKind = 'passenger';

    setRequirements((currentRequirements) => [
      ...currentRequirements,
      {
        id: `requirement-${Date.now()}`,
        kind,
        quantity: 1,
      },
    ]);
  }

  function removeRequirement(requirementId: string) {
    setRequirements((currentRequirements) =>
      currentRequirements.filter(
        (requirement) => requirement.id !== requirementId,
      ),
    );
  }

  function handleSegmentRangeChange(
    index: number,
    edge: 'start' | 'end',
    offsetMinutes: number,
  ) {
    if (!journey) {
      return;
    }

    const segments = [...(form.getFieldValue('segments') ?? [])];
    const segment = segments[index] ?? {};
    const currentStart = getSegmentStartOffset(segment, journey);
    const currentEnd = getSegmentEndOffset(segment, journey);
    const nextStart =
      edge === 'start'
        ? Math.min(offsetMinutes, currentEnd - 1)
        : currentStart;
    const nextEnd =
      edge === 'end'
        ? Math.max(offsetMinutes, currentStart + 1)
        : currentEnd;

    segments[index] = {
      ...segment,
      endDateTime: journey.startDateTime
        ? getDateTimeFromOffset(journey.startDateTime, nextEnd)
        : segment.endDateTime,
      endMinutes: (journey.startMinutes ?? 0) + nextEnd,
      startDateTime: journey.startDateTime
        ? getDateTimeFromOffset(journey.startDateTime, nextStart)
        : segment.startDateTime,
      startMinutes: (journey.startMinutes ?? 0) + nextStart,
    };

    form.setFieldValue('segments', segments);
  }

  return (
    <Drawer
      className="journey-details-panel"
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onClose}>{t('journeyDetailsPanel.cancel')}</Button>
          <Button onClick={handleSave} type="primary">
            {t('journeyDetailsPanel.save')}
          </Button>
        </Space>
      }
      onClose={onClose}
      open={open}
      title={journey?.title ?? t('journeyDetailsPanel.title')}
      width={520}
    >
      {journey ? (
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
        >
          <div className="journey-details-panel__grid">
            <Form.Item
              label={t('journeyDetailsPanel.fields.title')}
              name="title"
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t('journeyDetailsPanel.fields.resource')}
              name="resourceId"
            >
              <Select
                options={resources.map((resource) => ({
                  label: resource.meta ?? resource.name,
                  value: resource.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={t('journeyDetailsPanel.fields.kind')}
              name="kind"
            >
              <Select
                options={journeyKindOptions.map((kind) => ({
                  label: t(`journeyDetailsPanel.kinds.${kind}`),
                  value: kind,
                }))}
              />
            </Form.Item>

            <Form.Item
              label={t('journeyDetailsPanel.fields.state')}
              name="state"
            >
              <Select
                options={journeyStateOptions.map((state) => ({
                  label: t(`journeyDetailsPanel.states.${state}`),
                  value: state,
                }))}
              />
            </Form.Item>

            <Form.Item hidden name="startMinutes">
              <Input />
            </Form.Item>

            <Form.Item hidden name="endMinutes">
              <Input />
            </Form.Item>

            <Form.Item
              label={t('journeyDetailsPanel.fields.startDateTime')}
              name="startDateTime"
            >
              <Input type="datetime-local" />
            </Form.Item>

            <Form.Item
              label={t('journeyDetailsPanel.fields.endDateTime')}
              name="endDateTime"
            >
              <Input type="datetime-local" />
            </Form.Item>
          </div>

          <Divider orientation="left">
            {t('journeyDetailsPanel.resourceRequirements')}
          </Divider>

          <div className="journey-details-panel__requirements">
            {requirements.map((requirement) => (
              <div
                className="journey-details-panel__requirement"
                key={requirement.id}
              >
                <div className="journey-details-panel__requirement-main">
                  <label className="journey-details-panel__field">
                    <span>
                      {t('journeyDetailsPanel.fields.requirementKind')}
                    </span>
                    <Select
                      options={requirementKindOptions.map((kind) => ({
                        label: t(`resourceRequirements.kinds.${kind}`),
                        value: kind,
                      }))}
                      onChange={(kind) =>
                        updateRequirement(requirement.id, { kind })
                      }
                      value={requirement.kind}
                    />
                  </label>

                  <label className="journey-details-panel__field">
                    <span>
                      {t('journeyDetailsPanel.fields.requirementQuantity')}
                    </span>
                    <Input
                      min={0}
                      onChange={(event) =>
                        updateRequirement(requirement.id, {
                          quantity: Number(event.currentTarget.value),
                        })
                      }
                      type="number"
                      value={requirement.quantity}
                    />
                  </label>

                  <Button
                    danger
                    onClick={() => removeRequirement(requirement.id)}
                  >
                    {t('journeyDetailsPanel.removeRequirement')}
                  </Button>
                </div>

                <label className="journey-details-panel__field journey-details-panel__field--full">
                  <span>
                    {t('journeyDetailsPanel.fields.requirementLabel')}
                  </span>
                  <Input.TextArea
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    onChange={(event) =>
                      updateRequirement(requirement.id, {
                        label: event.currentTarget.value,
                      })
                    }
                    value={requirement.label}
                  />
                </label>
              </div>
            ))}

            <Button onClick={addRequirement} type="dashed">
              {t('journeyDetailsPanel.addRequirement')}
            </Button>
          </div>

          <Divider orientation="left">
            {t('journeyDetailsPanel.segments')}
          </Divider>

          <Form.List name="segments">
            {(fields, { add, remove }) => (
              <div className="journey-details-panel__segments">
                {fields.map((field) => (
                  <div
                    className="journey-details-panel__segment"
                    key={field.key}
                  >
                    {journey ? (
                      <SegmentTimelineEditor
                        durationMinutes={journeyDurationMinutes}
                        journey={journey}
                        onRangeChange={(edge, value) =>
                          handleSegmentRangeChange(field.name, edge, value)
                        }
                        segment={watchedSegments?.[field.name]}
                      />
                    ) : null}
                    <Form.Item hidden name={[field.name, 'id']}>
                      <Input />
                    </Form.Item>
                    <div className="journey-details-panel__segment-grid">
                      <Form.Item
                        label={t('journeyDetailsPanel.fields.segmentLabel')}
                        name={[field.name, 'label']}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label={t('journeyDetailsPanel.fields.segmentKind')}
                        name={[field.name, 'kind']}
                      >
                        <Select
                          options={segmentKindOptions.map((kind) => ({
                            label: t(`journeyDetailsPanel.segmentKinds.${kind}`),
                            value: kind,
                          }))}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('journeyDetailsPanel.fields.segmentStartDateTime')}
                        name={[field.name, 'startDateTime']}
                      >
                        <Input type="datetime-local" />
                      </Form.Item>

                      <Form.Item
                        label={t('journeyDetailsPanel.fields.segmentEndDateTime')}
                        name={[field.name, 'endDateTime']}
                      >
                        <Input type="datetime-local" />
                      </Form.Item>
                    </div>

                    <Button danger onClick={() => remove(field.name)}>
                      {t('journeyDetailsPanel.removeSegment')}
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={() =>
                    add({
                      id: `segment-${Date.now()}`,
                      kind: 'transfer',
                      label: t('journeyDetailsPanel.newSegment'),
                      startDateTime: journey?.startDateTime
                        ? getDateTimeFromOffset(journey.startDateTime, 0)
                        : undefined,
                      startMinutes: journey?.startMinutes,
                      endDateTime: journey?.startDateTime
                        ? getDateTimeFromOffset(
                            journey.startDateTime,
                            DEFAULT_SEGMENT_DURATION_MINUTES,
                          )
                        : undefined,
                      endMinutes:
                        (journey?.startMinutes ?? 0) +
                        DEFAULT_SEGMENT_DURATION_MINUTES,
                    })
                  }
                  type="dashed"
                >
                  {t('journeyDetailsPanel.addSegment')}
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      ) : null}
    </Drawer>
  );
}

interface SegmentTimelineEditorProps {
  durationMinutes: number;
  journey: SkiCalJourney;
  segment?: SkiCalJourneySegment;
  onRangeChange: (edge: 'start' | 'end', value: number) => void;
}

function SegmentTimelineEditor({
  durationMinutes,
  journey,
  segment,
  onRangeChange,
}: SegmentTimelineEditorProps) {
  const { t } = useUiTranslation();
  const startOffset = segment ? getSegmentStartOffset(segment, journey) : 0;
  const endOffset = segment
    ? getSegmentEndOffset(segment, journey)
    : DEFAULT_SEGMENT_DURATION_MINUTES;
  const safeStart = Math.max(0, Math.min(startOffset, durationMinutes - 1));
  const safeEnd = Math.max(safeStart + 1, Math.min(endOffset, durationMinutes));
  const left = (safeStart / durationMinutes) * 100;
  const width = ((safeEnd - safeStart) / durationMinutes) * 100;

  return (
    <div className="journey-details-panel__timeline-editor">
      <div className="journey-details-panel__timeline-axis">
        <span>{formatOffsetTime(journey, 0)}</span>
        <span>{formatOffsetTime(journey, durationMinutes)}</span>
      </div>
      <div className="journey-details-panel__timeline-track">
        <span
          className={`journey-details-panel__timeline-bar journey-details-panel__timeline-bar--${
            segment?.kind ?? 'transfer'
          }`}
          style={{
            left: `${left}%`,
            width: `${width}%`,
          }}
        />
        <input
          aria-label={t('journeyDetailsPanel.adjustSegmentStart')}
          className="journey-details-panel__timeline-range"
          max={durationMinutes}
          min={0}
          onChange={(event) =>
            onRangeChange('start', Number(event.currentTarget.value))
          }
          step={5}
          type="range"
          value={safeStart}
        />
        <input
          aria-label={t('journeyDetailsPanel.adjustSegmentEnd')}
          className="journey-details-panel__timeline-range"
          max={durationMinutes}
          min={0}
          onChange={(event) =>
            onRangeChange('end', Number(event.currentTarget.value))
          }
          step={5}
          type="range"
          value={safeEnd}
        />
      </div>
      <div className="journey-details-panel__timeline-values">
        <span>{formatOffsetTime(journey, safeStart)}</span>
        <span>{formatOffsetTime(journey, safeEnd)}</span>
      </div>
    </div>
  );
}

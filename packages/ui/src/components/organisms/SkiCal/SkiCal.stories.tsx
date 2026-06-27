import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { SkiCal } from './SkiCal';
import type {
  SkiCalJourney,
  SkiCalOrientation,
  SkiCalProps,
  SkiCalResource,
} from './SkiCal';

const resources = Array.from({ length: 12 }, (_, index) => ({
  id: `bus-${index + 1}`,
  name: `${index + 1}`,
  meta: `Bus ${index + 1}`,
  requirements:
    index === 0
      ? [
          { color: '#2563eb', id: 'bus-1-passengers', kind: 'passenger', quantity: 1 },
          { color: '#d97706', id: 'bus-1-baby-seat', kind: 'babySeat', quantity: 1 },
        ]
      : index === 1
        ? [{ color: '#7c3aed', id: 'bus-2-booster', kind: 'boosterSeat', quantity: 1 }]
        : index === 5
          ? [
              { color: '#2563eb', id: 'bus-6-passengers', kind: 'passenger', quantity: 2 },
              { color: '#0891b2', id: 'bus-6-ski-bags', kind: 'skiBag', quantity: 4 },
            ]
          : index === 8
            ? [{ color: '#8a5a2b', id: 'bus-9-luggage', kind: 'luggage', quantity: 3 }]
            : undefined,
})) satisfies SkiCalResource[];

function getStoryDateTime(totalMinutes: number) {
  const baseDate = new Date('2026-02-14T00:00:00+01:00');
  baseDate.setMinutes(baseDate.getMinutes() + totalMinutes);

  const year = baseDate.getFullYear();
  const month = (baseDate.getMonth() + 1).toString().padStart(2, '0');
  const day = baseDate.getDate().toString().padStart(2, '0');
  const hours = baseDate.getHours().toString().padStart(2, '0');
  const minutes = baseDate.getMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:00+01:00`;
}

const minuteJourneys: React.ComponentProps<typeof SkiCal>['journeys'] = [
  {
    id: 'j1',
    resourceId: 'bus-1',
    title: 'GVA > Morzine',
    startMinutes: 7 * 60,
    endMinutes: 8 * 60 + 45,
    kind: 'private',
    segments: [
      { id: 'j1-s1', kind: 'pickup', label: 'Airport pickup', startMinutes: 7 * 60, endMinutes: 7 * 60 + 20 },
      { id: 'j1-s2', kind: 'dropoff', label: 'Morzine dropoff', startMinutes: 8 * 60 + 20, endMinutes: 8 * 60 + 45 },
    ],
  },
  {
    id: 'j2',
    resourceId: 'bus-1',
    title: 'Shared arrivals',
    startMinutes: 9 * 60,
    endMinutes: 11 * 60 + 10,
    kind: 'shared',
    segments: [
      { id: 'j2-s1', kind: 'pickup', label: 'GVA', startMinutes: 9 * 60, endMinutes: 9 * 60 + 20 },
      { id: 'j2-s2', kind: 'transfer', label: 'Les Gets', startMinutes: 10 * 60 + 20, endMinutes: 10 * 60 + 35 },
      { id: 'j2-s3', kind: 'dropoff', label: 'Morzine', startMinutes: 10 * 60 + 45, endMinutes: 11 * 60 + 10 },
    ],
  },
  {
    id: 'j3',
    resourceId: 'bus-2',
    title: 'Standby',
    startMinutes: 8 * 60 - 15,
    endMinutes: 8 * 60 + 15,
    kind: 'positioning',
  },
  {
    id: 'j4',
    resourceId: 'bus-2',
    title: 'Morzine > GVA',
    startMinutes: 8 * 60 + 15,
    endMinutes: 10 * 60 + 30,
    kind: 'private',
    segments: [
      { id: 'j4-s1', kind: 'pickup', label: 'Morzine pickup', startMinutes: 8 * 60 + 15, endMinutes: 8 * 60 + 35 },
      { id: 'j4-s2', kind: 'dropoff', label: 'Airport dropoff', startMinutes: 10 * 60 + 10, endMinutes: 10 * 60 + 30 },
    ],
  },
  {
    id: 'j5',
    resourceId: 'bus-4',
    title: 'Shared transfer',
    startMinutes: 10 * 60 + 15,
    endMinutes: 14 * 60 + 20,
    kind: 'shared',
    state: 'warning',
    segments: [
      { id: 'j5-s1', kind: 'pickup', label: 'GVA', startMinutes: 10 * 60 + 15, endMinutes: 10 * 60 + 35 },
      { id: 'j5-buffer', kind: 'buffer', label: 'Delay buffer', startMinutes: 12 * 60, endMinutes: 12 * 60 + 45 },
      { id: 'j5-s2', kind: 'transfer', label: 'Morzine', startMinutes: 12 * 60 + 10, endMinutes: 12 * 60 + 25 },
      { id: 'j5-s3', kind: 'dropoff', label: 'Avoriaz', startMinutes: 13 * 60, endMinutes: 13 * 60 + 25 },
      { id: 'j5-s4', kind: 'positioning', label: 'Depot', startMinutes: 14 * 60, endMinutes: 14 * 60 + 20 },
    ],
  },
  {
    id: 'j7',
    resourceId: 'bus-7',
    title: 'GVA > Avoriaz',
    startMinutes: 15 * 60 + 30,
    endMinutes: 18 * 60 + 45,
    kind: 'shared',
    segments: [
      { id: 'j7-s1', kind: 'pickup', label: 'Airport pickup', startMinutes: 15 * 60 + 30, endMinutes: 15 * 60 + 50 },
      { id: 'j7-s2', kind: 'transfer', label: 'Morzine stop', startMinutes: 17 * 60 + 40, endMinutes: 17 * 60 + 55 },
      { id: 'j7-s3', kind: 'dropoff', label: 'Avoriaz dropoff', startMinutes: 18 * 60 + 25, endMinutes: 18 * 60 + 45 },
    ],
  },
  {
    id: 'j8',
    resourceId: 'bus-10',
    title: 'Private return',
    startMinutes: 13 * 60 + 30,
    endMinutes: 15 * 60,
    kind: 'private',
  },
  {
    id: 'j9',
    resourceId: 'bus-10',
    title: 'GVA > Les Gets',
    startMinutes: 15 * 60 + 30,
    endMinutes: 18 * 60 + 10,
    kind: 'shared',
  },
];

const journeys = minuteJourneys.map((journey) => ({
  ...journey,
  endDateTime:
    journey.endMinutes === undefined
      ? journey.endDateTime
      : getStoryDateTime(journey.endMinutes),
  segments: journey.segments?.map((segment) => ({
    ...segment,
    endDateTime:
      segment.endMinutes === undefined
        ? segment.endDateTime
        : getStoryDateTime(segment.endMinutes),
    startDateTime:
      segment.startMinutes === undefined
        ? segment.startDateTime
        : getStoryDateTime(segment.startMinutes),
  })),
  startDateTime:
    journey.startMinutes === undefined
      ? journey.startDateTime
      : getStoryDateTime(journey.startMinutes),
})) satisfies React.ComponentProps<typeof SkiCal>['journeys'];

const resizeInteractionJourneys = [
  {
    id: 'resize-demo',
    resourceId: 'bus-1',
    title: 'GVA > Morzine',
    startMinutes: 7 * 60,
    endMinutes: 9 * 60,
    kind: 'private',
    segments: [
      {
        id: 'resize-demo-pickup',
        kind: 'pickup',
        label: 'Airport pickup',
        startMinutes: 7 * 60,
        endMinutes: 7 * 60 + 20,
      },
      {
        id: 'resize-demo-dropoff',
        kind: 'dropoff',
        label: 'Morzine dropoff',
        startMinutes: 8 * 60 + 40,
        endMinutes: 9 * 60,
      },
    ],
  },
] satisfies SkiCalJourney[];

const meta: Meta<typeof SkiCal> = {
  title: 'Organisms/SkiCal',
  component: SkiCal,
  args: {
    resources,
    journeys,
    title: 'Skiidy transfer board',
    updatedLabel: 'Updated 9 minutes ago',
    orientation: 'horizontal',
    startDateTime: getStoryDateTime(6 * 60),
    endDateTime: getStoryDateTime(24 * 60 + 4 * 60),
  },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkiCal>;

function SkiCalWithArgs(args: SkiCalProps) {
  const [, updateArgs] = useArgs<SkiCalProps>();

  function handleOrientationChange(orientation: SkiCalOrientation) {
    updateArgs({ orientation });
    args.onOrientationChange?.(orientation);
  }

  function handleJourneyChange(journey: SkiCalJourney) {
    updateArgs({
      journeys: args.journeys.map((currentJourney) =>
        currentJourney.id === journey.id ? journey : currentJourney,
      ),
    });
    args.onJourneyChange?.(journey);
  }

  return (
    <SkiCal
      {...args}
      onJourneyChange={handleJourneyChange}
      onOrientationChange={handleOrientationChange}
    />
  );
}

async function dragResizeHandle(handle: HTMLElement, deltaX: number) {
  const box = handle.getBoundingClientRect();
  const view = handle.ownerDocument.defaultView;

  if (!view) {
    return;
  }

  const startX = box.left + box.width / 2;
  const startY = box.top + box.height / 2;

  handle.dispatchEvent(
    new view.PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      buttons: 1,
      clientX: startX,
      clientY: startY,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  );
  view.dispatchEvent(
    new view.PointerEvent('pointermove', {
      bubbles: true,
      buttons: 1,
      clientX: startX + deltaX,
      clientY: startY,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  );
  view.dispatchEvent(
    new view.PointerEvent('pointerup', {
      bubbles: true,
      button: 0,
      clientX: startX + deltaX,
      clientY: startY,
      pointerId: 1,
      pointerType: 'mouse',
    }),
  );

  await new Promise((resolve) => view.setTimeout(resolve, 50));
}

function getJourneyLabelMinutes(label: string) {
  const timeMatch = label.match(/: (\d{2})(\d{2})-(\d{2})(\d{2})$/);

  if (!timeMatch) {
    return undefined;
  }

  const [, startHour, startMinute, endHour, endMinute] = timeMatch;

  return {
    end: Number(endHour) * 60 + Number(endMinute),
    start: Number(startHour) * 60 + Number(startMinute),
  };
}

export const Default: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: SkiCalWithArgs,
};

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
  render: SkiCalWithArgs,
};

export const Compact: Story = {
  args: {
    orientation: 'horizontal',
  },
  globals: {
    themeMode: 'compact',
  },
  render: SkiCalWithArgs,
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: SkiCalWithArgs,
};

export const ResizeJourneyInteraction: Story = {
  args: {
    endDateTime: undefined,
    endMinutes: 12 * 60,
    journeys: resizeInteractionJourneys,
    orientation: 'horizontal',
    resources: resources.slice(0, 2),
    startDateTime: undefined,
    startMinutes: 6 * 60,
    title: 'Resizable journey demo',
    updatedLabel: 'Drag the journey handles in the story interaction',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const journey = canvas.getByRole('button', {
      name: /GVA > Morzine:/,
    });

    await expect(journey).toBeVisible();
    const initialLabel = journey.getAttribute('aria-label') ?? '';
    const initialTimes = getJourneyLabelMinutes(initialLabel);

    const startHandle = canvas.getAllByRole('slider', {
      name: 'Resize journey start',
    })[0];
    const endHandle = canvas.getAllByRole('slider', {
      name: 'Resize journey end',
    })[0];

    await expect(startHandle).toBeDefined();
    await expect(endHandle).toBeDefined();

    if (!startHandle || !endHandle) {
      throw new Error('Expected SkiCal resize handles to render.');
    }

    const startDelta =
      initialTimes && initialTimes.start <= 6 * 60 + 15 ? 50 : -50;
    const endDelta =
      initialTimes && initialTimes.end >= 12 * 60 - 15 ? -80 : 80;

    await dragResizeHandle(startHandle, startDelta);
    await dragResizeHandle(endHandle, endDelta);

    await expect(journey).not.toHaveAccessibleName(initialLabel);
  },
  render: SkiCalWithArgs,
};

export const OvernightDateTimes: Story = {
  args: {
    endDateTime: '2026-02-15T04:00:00+01:00',
    journeys: [
      {
        id: 'overnight-1',
        resourceId: 'bus-1',
        title: 'Late GVA > Morzine',
        startDateTime: '2026-02-14T23:15:00+01:00',
        endDateTime: '2026-02-15T01:20:00+01:00',
        kind: 'private',
        state: 'warning',
        segments: [
          {
            id: 'overnight-1-pickup',
            kind: 'pickup',
            label: 'Airport pickup',
            startDateTime: '2026-02-14T23:15:00+01:00',
            endDateTime: '2026-02-14T23:35:00+01:00',
          },
          {
            id: 'overnight-1-buffer',
            kind: 'buffer',
            label: 'Weather buffer',
            startDateTime: '2026-02-15T00:10:00+01:00',
            endDateTime: '2026-02-15T00:40:00+01:00',
          },
          {
            id: 'overnight-1-dropoff',
            kind: 'dropoff',
            label: 'Morzine dropoff',
            startDateTime: '2026-02-15T01:00:00+01:00',
            endDateTime: '2026-02-15T01:20:00+01:00',
          },
        ],
      },
      {
        id: 'overnight-2',
        resourceId: 'bus-2',
        title: 'Early return',
        startDateTime: '2026-02-15T02:00:00+01:00',
        endDateTime: '2026-02-15T03:30:00+01:00',
        kind: 'shared',
      },
    ],
    orientation: 'horizontal',
    startDateTime: '2026-02-14T22:00:00+01:00',
    startMinutes: undefined,
    endMinutes: undefined,
  },
  render: SkiCalWithArgs,
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useArgs } from 'storybook/preview-api';
import { SkiCal } from './SkiCal';
import type { SkiCalOrientation, SkiCalProps } from './SkiCal';

const resources = Array.from({ length: 12 }, (_, index) => ({
  id: `bus-${index + 1}`,
  name: `${index + 2}`,
  meta: `Bus ${index + 2}`,
}));

const journeys = [
  {
    id: 'j1',
    resourceId: 'bus-1',
    title: 'GVA > Morzine',
    startMinutes: 7 * 60,
    endMinutes: 8 * 60 + 45,
    kind: 'private',
    segments: [
      { id: 'j1-s1', label: 'Airport pickup', startMinutes: 7 * 60, endMinutes: 7 * 60 + 20 },
      { id: 'j1-s2', label: 'Morzine dropoff', startMinutes: 8 * 60 + 20, endMinutes: 8 * 60 + 45 },
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
      { id: 'j2-s1', label: 'GVA', startMinutes: 9 * 60, endMinutes: 9 * 60 + 20 },
      { id: 'j2-s2', label: 'Les Gets', startMinutes: 10 * 60 + 20, endMinutes: 10 * 60 + 35 },
      { id: 'j2-s3', label: 'Morzine', startMinutes: 10 * 60 + 45, endMinutes: 11 * 60 + 10 },
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
      { id: 'j4-s1', label: 'Morzine pickup', startMinutes: 8 * 60 + 15, endMinutes: 8 * 60 + 35 },
      { id: 'j4-s2', label: 'Airport dropoff', startMinutes: 10 * 60 + 10, endMinutes: 10 * 60 + 30 },
    ],
  },
  {
    id: 'j5',
    resourceId: 'bus-4',
    title: 'Shared transfer',
    startMinutes: 10 * 60 + 15,
    endMinutes: 14 * 60 + 20,
    kind: 'shared',
    segments: [
      { id: 'j5-s1', label: 'GVA', startMinutes: 10 * 60 + 15, endMinutes: 10 * 60 + 35 },
      { id: 'j5-s2', label: 'Morzine', startMinutes: 12 * 60 + 10, endMinutes: 12 * 60 + 25 },
      { id: 'j5-s3', label: 'Avoriaz', startMinutes: 13 * 60, endMinutes: 13 * 60 + 25 },
      { id: 'j5-s4', label: 'Depot', startMinutes: 14 * 60, endMinutes: 14 * 60 + 20 },
    ],
  },
  {
    id: 'j6',
    resourceId: 'bus-4',
    title: 'Delay buffer',
    startMinutes: 12 * 60,
    endMinutes: 12 * 60 + 45,
    kind: 'positioning',
  },
  {
    id: 'j7',
    resourceId: 'bus-7',
    title: 'GVA > Avoriaz',
    startMinutes: 15 * 60 + 30,
    endMinutes: 18 * 60 + 45,
    kind: 'shared',
    segments: [
      { id: 'j7-s1', label: 'Airport pickup', startMinutes: 15 * 60 + 30, endMinutes: 15 * 60 + 50 },
      { id: 'j7-s2', label: 'Morzine stop', startMinutes: 17 * 60 + 40, endMinutes: 17 * 60 + 55 },
      { id: 'j7-s3', label: 'Avoriaz dropoff', startMinutes: 18 * 60 + 25, endMinutes: 18 * 60 + 45 },
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
] satisfies React.ComponentProps<typeof SkiCal>['journeys'];

const meta: Meta<typeof SkiCal> = {
  title: 'Organisms/SkiCal',
  component: SkiCal,
  args: {
    resources,
    journeys,
    title: 'Skiidy transfer board',
    updatedLabel: 'Updated 9 minutes ago',
    orientation: 'horizontal',
    startMinutes: 6 * 60,
    endMinutes: 24 * 60 + 4 * 60,
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

  return (
    <SkiCal {...args} onOrientationChange={handleOrientationChange} />
  );
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

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: SkiCalWithArgs,
};

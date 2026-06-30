import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EditableJourneySegmentGantt,
  type EditableJourneySegmentGanttChange,
  type EditableJourneySegmentGanttProps,
} from './EditableJourneySegmentGantt';

const meta: Meta<typeof EditableJourneySegmentGantt> = {
  title: 'Molecules/EditableJourneySegmentGantt',
  component: EditableJourneySegmentGantt,
  args: {
    journeyStartDateTime: '2026-02-14T06:00:00+01:00',
    journeyEndDateTime: '2026-02-14T10:00:00+01:00',
    stepMinutes: 5,
    segments: [
      {
        id: 'gva-pickup',
        kind: 'pickup',
        label: 'GVA pickup',
        startDateTime: '2026-02-14T06:00:00+01:00',
        endDateTime: '2026-02-14T06:45:00+01:00',
      },
      {
        id: 'morzine-transfer',
        kind: 'transfer',
        label: 'Morzine transfer',
        startDateTime: '2026-02-14T06:45:00+01:00',
        endDateTime: '2026-02-14T09:20:00+01:00',
      },
      {
        id: 'morzine-dropoff',
        kind: 'dropoff',
        label: 'Morzine dropoff',
        startDateTime: '2026-02-14T09:20:00+01:00',
        endDateTime: '2026-02-14T09:45:00+01:00',
      },
      {
        id: 'delay-buffer',
        kind: 'buffer',
        label: 'Delay buffer',
        startDateTime: '2026-02-14T09:45:00+01:00',
        endDateTime: '2026-02-14T10:00:00+01:00',
      },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs<EditableJourneySegmentGanttProps>();

    const handleSegmentChange = (change: EditableJourneySegmentGanttChange) => {
      updateArgs({
        segments: args.segments.map((segment) =>
          segment.id === change.segment.id ? change.segment : segment,
        ),
      });
      args.onSegmentChange?.(change);
    };

    return (
      <EditableJourneySegmentGantt
        {...args}
        onSegmentChange={handleSegmentChange}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof EditableJourneySegmentGantt>;

export const Default: Story = {};

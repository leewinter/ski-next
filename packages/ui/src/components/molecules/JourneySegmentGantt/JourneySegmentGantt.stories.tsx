import type { Meta, StoryObj } from '@storybook/react-vite';
import { JourneySegmentGantt } from './JourneySegmentGantt';

const meta: Meta<typeof JourneySegmentGantt> = {
  title: 'Molecules/JourneySegmentGantt',
  component: JourneySegmentGantt,
  args: {
    journeyStartDateTime: '2026-02-14T09:00:00+01:00',
    journeyEndDateTime: '2026-02-14T11:10:00+01:00',
    segments: [
      {
        id: 'pickup',
        kind: 'pickup',
        label: 'GVA pickup',
        startDateTime: '2026-02-14T09:00:00+01:00',
        endDateTime: '2026-02-14T09:20:00+01:00',
      },
      {
        id: 'les-gets',
        kind: 'transfer',
        label: 'Les Gets stop',
        startDateTime: '2026-02-14T10:20:00+01:00',
        endDateTime: '2026-02-14T10:35:00+01:00',
      },
      {
        id: 'morzine',
        kind: 'dropoff',
        label: 'Morzine dropoff',
        startDateTime: '2026-02-14T10:45:00+01:00',
        endDateTime: '2026-02-14T11:10:00+01:00',
      },
    ],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          background: '#1d202f',
          display: 'inline-block',
          padding: 12,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JourneySegmentGantt>;

export const Default: Story = {};

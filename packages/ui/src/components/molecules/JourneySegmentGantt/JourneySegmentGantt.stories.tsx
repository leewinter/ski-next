import type { Meta, StoryObj } from '@storybook/react-vite';
import { JourneySegmentGantt } from './JourneySegmentGantt';

const meta: Meta<typeof JourneySegmentGantt> = {
  title: 'Molecules/JourneySegmentGantt',
  component: JourneySegmentGantt,
  args: {
    journeyStartMinutes: 9 * 60,
    journeyEndMinutes: 11 * 60 + 10,
    segments: [
      {
        id: 'pickup',
        kind: 'pickup',
        label: 'GVA pickup',
        startMinutes: 9 * 60,
        endMinutes: 9 * 60 + 20,
      },
      {
        id: 'les-gets',
        kind: 'transfer',
        label: 'Les Gets stop',
        startMinutes: 10 * 60 + 20,
        endMinutes: 10 * 60 + 35,
      },
      {
        id: 'morzine',
        kind: 'dropoff',
        label: 'Morzine dropoff',
        startMinutes: 10 * 60 + 45,
        endMinutes: 11 * 60 + 10,
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

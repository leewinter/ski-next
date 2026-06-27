import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from 'antd';
import { JourneyDetailsPanel } from './JourneyDetailsPanel';
import type { SkiCalJourney, SkiCalResource } from '../SkiCal';

const resources: SkiCalResource[] = [
  { id: 'bus-1', name: '1', meta: 'Bus 1' },
  { id: 'bus-2', name: '2', meta: 'Bus 2' },
];

const journey: SkiCalJourney = {
  id: 'journey-1',
  resourceId: 'bus-1',
  title: 'GVA > Morzine',
  startDateTime: '2026-02-14T07:00',
  endDateTime: '2026-02-14T08:45',
  kind: 'private',
  state: 'normal',
  segments: [
    {
      id: 'pickup',
      kind: 'pickup',
      label: 'Airport pickup',
      startDateTime: '2026-02-14T07:00',
      endDateTime: '2026-02-14T07:20',
    },
    {
      id: 'dropoff',
      kind: 'dropoff',
      label: 'Morzine dropoff',
      startDateTime: '2026-02-14T08:20',
      endDateTime: '2026-02-14T08:45',
    },
  ],
};

const meta: Meta<typeof JourneyDetailsPanel> = {
  title: 'Organisms/JourneyDetailsPanel',
  component: JourneyDetailsPanel,
  args: {
    resources,
  },
};

export default meta;
type Story = StoryObj<typeof JourneyDetailsPanel>;

function JourneyDetailsPanelStory(args: Story['args']) {
  const [open, setOpen] = useState(true);
  const [selectedJourney, setSelectedJourney] = useState(journey);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open journey</Button>
      <JourneyDetailsPanel
        {...args}
        journey={selectedJourney}
        onClose={() => setOpen(false)}
        onSave={setSelectedJourney}
        open={open}
        resources={args?.resources ?? resources}
      />
    </>
  );
}

export const Default: Story = {
  render: JourneyDetailsPanelStory,
};

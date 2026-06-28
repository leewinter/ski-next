import type { Meta, StoryObj } from '@storybook/react-vite';
import { DriverCal } from './DriverCal';
import type { SkiCalJourney } from '../SkiCal';

const journeys = [
  {
    id: 'driver-j1',
    resourceId: 'bus-4',
    title: 'GVA > Morzine',
    startDateTime: '2026-02-14T07:00:00+01:00',
    endDateTime: '2026-02-14T09:30:00+01:00',
    kind: 'private',
    segments: [
      {
        id: 'pickup-gva',
        kind: 'pickup',
        label: 'Geneva airport pickup',
        startDateTime: '2026-02-14T07:00:00+01:00',
        endDateTime: '2026-02-14T07:25:00+01:00',
      },
      {
        id: 'transfer-morzine',
        kind: 'transfer',
        label: 'Drive to Morzine',
        startDateTime: '2026-02-14T07:25:00+01:00',
        endDateTime: '2026-02-14T09:10:00+01:00',
      },
      {
        id: 'dropoff-morzine',
        kind: 'dropoff',
        label: 'Morzine dropoff',
        startDateTime: '2026-02-14T09:10:00+01:00',
        endDateTime: '2026-02-14T09:30:00+01:00',
      },
    ],
  },
  {
    id: 'driver-j2',
    resourceId: 'bus-4',
    title: 'Morzine > GVA',
    startDateTime: '2026-02-14T10:15:00+01:00',
    endDateTime: '2026-02-14T12:45:00+01:00',
    kind: 'shared',
    state: 'warning',
    segments: [
      {
        id: 'pickup-morzine',
        kind: 'pickup',
        label: 'Morzine pickup',
        startDateTime: '2026-02-14T10:15:00+01:00',
        endDateTime: '2026-02-14T10:35:00+01:00',
      },
      {
        id: 'delay-buffer',
        kind: 'buffer',
        label: 'Traffic buffer',
        startDateTime: '2026-02-14T10:35:00+01:00',
        endDateTime: '2026-02-14T11:00:00+01:00',
      },
      {
        id: 'transfer-gva',
        kind: 'transfer',
        label: 'Drive to Geneva',
        startDateTime: '2026-02-14T11:00:00+01:00',
        endDateTime: '2026-02-14T12:25:00+01:00',
      },
      {
        id: 'dropoff-gva',
        kind: 'dropoff',
        label: 'Airport dropoff',
        startDateTime: '2026-02-14T12:25:00+01:00',
        endDateTime: '2026-02-14T12:45:00+01:00',
      },
    ],
  },
  {
    id: 'driver-j3',
    resourceId: 'bus-4',
    title: 'Depot standby',
    startDateTime: '2026-02-14T13:30:00+01:00',
    endDateTime: '2026-02-14T14:15:00+01:00',
    kind: 'positioning',
  },
] satisfies SkiCalJourney[];

const meta: Meta<typeof DriverCal> = {
  title: 'Organisms/DriverCal',
  component: DriverCal,
  args: {
    driverName: 'Chris',
    endDateTime: '2026-02-14T15:00:00+01:00',
    journeys,
    startDateTime: '2026-02-14T06:00:00+01:00',
    title: 'Chris driver board',
    updatedLabel: 'Updated 4 minutes ago',
  },
};

export default meta;
type Story = StoryObj<typeof DriverCal>;

export const Default: Story = {};

export const Mobile: Story = {
  globals: {
    viewport: {
      value: 'mobile2',
    },
  },
};

export const Overnight: Story = {
  args: {
    driverName: 'Chris',
    endDateTime: '2026-02-15T03:00:00+01:00',
    journeys: [
      {
        id: 'overnight-driver',
        resourceId: 'bus-4',
        title: 'Late GVA > Morzine',
        startDateTime: '2026-02-14T23:30:00+01:00',
        endDateTime: '2026-02-15T01:30:00+01:00',
        kind: 'private',
        segments: [
          {
            id: 'overnight-pickup',
            kind: 'pickup',
            label: 'Airport pickup',
            startDateTime: '2026-02-14T23:30:00+01:00',
            endDateTime: '2026-02-14T23:50:00+01:00',
          },
          {
            id: 'overnight-transfer',
            kind: 'transfer',
            label: 'Drive to Morzine',
            startDateTime: '2026-02-14T23:50:00+01:00',
            endDateTime: '2026-02-15T01:10:00+01:00',
          },
          {
            id: 'overnight-dropoff',
            kind: 'dropoff',
            label: 'Morzine dropoff',
            startDateTime: '2026-02-15T01:10:00+01:00',
            endDateTime: '2026-02-15T01:30:00+01:00',
          },
        ],
      },
    ],
    startDateTime: '2026-02-14T22:00:00+01:00',
    title: 'Overnight driver board',
  },
};

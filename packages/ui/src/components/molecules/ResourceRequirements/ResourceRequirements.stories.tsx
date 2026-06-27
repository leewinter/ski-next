import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResourceRequirements } from './ResourceRequirements';
import type { ResourceRequirement } from './ResourceRequirements';

const mixedRequirements: ResourceRequirement[] = [
  {
    color: '#2563eb',
    id: 'passengers',
    kind: 'passenger',
    quantity: 1,
  },
  {
    color: '#d97706',
    id: 'baby-seats',
    kind: 'babySeat',
    quantity: 2,
  },
  {
    color: '#0891b2',
    id: 'ski-bags',
    kind: 'skiBag',
    label: 'Ski bags',
    quantity: 4,
  },
];

const meta: Meta<typeof ResourceRequirements> = {
  title: 'Molecules/ResourceRequirements',
  component: ResourceRequirements,
  args: {
    requirements: mixedRequirements,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'inline-block',
          padding: 24,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ResourceRequirements>;

export const Default: Story = {};

export const OperationalColours: Story = {
  args: {
    requirements: mixedRequirements,
  },
};

export const DriverPickupItems: Story = {
  args: {
    requirements: [
      {
        color: '#d97706',
        id: 'baby-seats',
        kind: 'babySeat',
        quantity: 1,
      },
      {
        color: '#7c3aed',
        id: 'booster-seats',
        kind: 'boosterSeat',
        quantity: 2,
      },
      {
        color: '#8a5a2b',
        id: 'luggage',
        kind: 'luggage',
        quantity: 6,
      },
      {
        color: '#0891b2',
        id: 'ski-bags',
        kind: 'skiBag',
        quantity: 3,
      },
    ],
  },
};

export const CustomLabels: Story = {
  args: {
    requirements: [
      {
        color: '#2563eb',
        id: 'lead-passenger',
        kind: 'passenger',
        label: 'Lead passenger pack',
        quantity: 1,
      },
      {
        color: '#dc2626',
        id: 'urgent-note',
        kind: 'note',
        label: 'Driver briefing note',
        quantity: 1,
      },
    ],
  },
};

export const UncolouredFallback: Story = {
  args: {
    requirements: [
      {
        id: 'passengers',
        kind: 'passenger',
        quantity: 2,
      },
      {
        id: 'baby-seats',
        kind: 'babySeat',
        quantity: 1,
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    requirements: [],
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResourceRequirements } from './ResourceRequirements';

const meta: Meta<typeof ResourceRequirements> = {
  title: 'Molecules/ResourceRequirements',
  component: ResourceRequirements,
  args: {
    requirements: [
      {
        id: 'passengers',
        kind: 'passenger',
        quantity: 1,
      },
      {
        id: 'baby-seats',
        kind: 'babySeat',
        quantity: 2,
      },
      {
        id: 'ski-bags',
        kind: 'skiBag',
        label: 'Ski bags',
        quantity: 4,
      },
    ],
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

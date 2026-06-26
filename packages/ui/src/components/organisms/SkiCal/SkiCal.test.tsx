import { expect, test } from '@playwright/experimental-ct-react';
import { SkiCal } from './SkiCal';

const resources = [
  { id: 'bus-1', name: '2' },
  { id: 'bus-2', name: '3' },
];

const journeys = [
  {
    id: 'journey-1',
    resourceId: 'bus-1',
    title: 'GVA > Morzine',
    startMinutes: 7 * 60,
    endMinutes: 9 * 60,
    kind: 'shared' as const,
  },
];

test('renders resources and journeys', async ({ mount }) => {
  const component = await mount(
    <SkiCal resources={resources} journeys={journeys} />,
  );

  await expect(component).toContainText('GVA > Morzine');
  await expect(component).toContainText('2');
  await expect(component).toContainText('3');
});

test('can switch orientation with the built-in toggle', async ({ mount }) => {
  const component = await mount(
    <SkiCal resources={resources} journeys={journeys} />,
  );

  await component.getByRole('button', { name: 'Vertical' }).click();
  await expect(component).toHaveClass(/ski-cal--vertical/);
});

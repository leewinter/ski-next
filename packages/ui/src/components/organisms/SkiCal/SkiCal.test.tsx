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
  await expect(component.locator('.ski-cal')).toHaveClass(/ski-cal--vertical/);
});

test('renders journeys that cross midnight from datetimes', async ({ mount }) => {
  const component = await mount(
    <SkiCal
      endDateTime="2026-02-15T03:00:00+01:00"
      journeys={[
        {
          id: 'overnight',
          resourceId: 'bus-1',
          title: 'Late GVA > Morzine',
          startDateTime: '2026-02-14T23:30:00+01:00',
          endDateTime: '2026-02-15T01:15:00+01:00',
          kind: 'private',
        },
      ]}
      resources={resources}
      startDateTime="2026-02-14T22:00:00+01:00"
    />,
  );

  await expect(component).toContainText('Late GVA > Morzine');
  await expect(component).toContainText('2330-0115');
});

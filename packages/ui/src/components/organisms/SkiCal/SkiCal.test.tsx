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

test('opens journey details and saves edits', async ({ mount, page }) => {
  await mount(
    <SkiCal resources={resources} journeys={journeys} />,
  );

  await page.getByRole('button', { name: /GVA > Morzine/ }).click();
  await expect(page.getByRole('dialog', { name: 'GVA > Morzine' })).toBeVisible();

  await page.getByLabel('Title').fill('Updated transfer');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('Updated transfer')).toBeVisible();
});

test('edits resource requirements from journey details', async ({ mount, page }) => {
  const resourceChanges: unknown[] = [];

  await mount(
    <SkiCal
      journeys={journeys}
      onResourceChange={(resource) => resourceChanges.push(resource)}
      resources={[
        {
          id: 'bus-1',
          name: '2',
          requirements: [
            {
              color: '#d97706',
              id: 'bus-1-baby-seat',
              kind: 'babySeat',
              quantity: 1,
            },
          ],
        },
        { id: 'bus-2', name: '3' },
      ]}
    />,
  );

  await page.getByRole('button', { name: /GVA > Morzine/ }).click();
  await expect(page.getByText('Vehicle requirements')).toBeVisible();

  await page.getByLabel('Quantity').fill('2');
  await page.getByRole('button', { name: 'Save' }).click();

  expect(resourceChanges).toHaveLength(1);
  expect(resourceChanges[0]).toMatchObject({
    requirements: [
      {
        color: '#d97706',
        kind: 'babySeat',
        quantity: 2,
      },
    ],
  });
  await expect(page.getByTitle('Baby seats x 2')).toBeVisible();
});

test('edits segment datetimes from the visual timeline', async ({ mount, page }) => {
  const changes: unknown[] = [];

  await mount(
    <SkiCal
      endDateTime="2026-02-14T10:00:00+01:00"
      journeys={[
        {
          id: 'journey-with-segment',
          resourceId: 'bus-1',
          title: 'GVA > Morzine',
          startDateTime: '2026-02-14T07:00:00+01:00',
          endDateTime: '2026-02-14T09:00:00+01:00',
          kind: 'private',
          segments: [
            {
              id: 'pickup',
              kind: 'pickup',
              label: 'Airport pickup',
              startDateTime: '2026-02-14T07:00:00+01:00',
              endDateTime: '2026-02-14T07:20:00+01:00',
            },
          ],
        },
      ]}
      onJourneyChange={(journey) => changes.push(journey)}
      resources={resources}
      startDateTime="2026-02-14T06:00:00+01:00"
    />,
  );

  await page.getByRole('button', { name: /GVA > Morzine/ }).click();
  await expect(
    page.getByRole('textbox', { name: 'Segment start' }),
  ).toHaveValue('2026-02-14T07:00');

  const segmentEndHandle = page.getByLabel('Adjust segment end');
  await segmentEndHandle.focus();
  await segmentEndHandle.press('ArrowRight');
  await segmentEndHandle.press('ArrowRight');
  await segmentEndHandle.press('ArrowRight');
  await page.getByRole('button', { name: 'Save' }).click();

  expect(changes).toHaveLength(1);
  expect(changes[0]).toMatchObject({
    segments: [
      {
        endDateTime: '2026-02-14T07:35',
      },
    ],
  });
});

test('resizes a journey from the main calendar', async ({ mount, page }) => {
  const changes: Array<{ endMinutes?: number }> = [];

  await mount(
    <SkiCal
      journeys={journeys}
      onJourneyChange={(journey) => changes.push(journey)}
      resources={resources}
      startMinutes={6 * 60}
      endMinutes={12 * 60}
    />,
  );

  const endHandle = page.getByLabel('Resize journey end');
  const box = await endHandle.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2);
  await page.mouse.up();

  expect(changes).toHaveLength(1);
  expect(changes[0]?.endMinutes).toBeGreaterThan(9 * 60);
});

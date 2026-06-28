import { expect, test } from '@playwright/experimental-ct-react';
import { DriverCal } from './DriverCal';

test('renders driver segments as separate rows', async ({ mount }) => {
  const component = await mount(
    <DriverCal
      driverName="Chris"
      endDateTime="2026-02-14T10:00:00+01:00"
      journeys={[
        {
          id: 'journey-1',
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
            {
              id: 'dropoff',
              kind: 'dropoff',
              label: 'Morzine dropoff',
              startDateTime: '2026-02-14T08:40:00+01:00',
              endDateTime: '2026-02-14T09:00:00+01:00',
            },
          ],
        },
      ]}
      startDateTime="2026-02-14T06:00:00+01:00"
    />,
  );

  await expect(component).toContainText('Chris');
  await expect(component).toContainText('Airport pickup');
  await expect(component).toContainText('Morzine dropoff');
  await expect(component.getByLabel('Airport pickup: 0700-0720')).toBeVisible();
  await expect(component.getByLabel('Morzine dropoff: 0840-0900')).toBeVisible();
});

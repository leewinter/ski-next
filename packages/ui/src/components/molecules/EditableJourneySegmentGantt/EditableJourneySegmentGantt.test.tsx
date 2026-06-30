import { expect, test } from '@playwright/experimental-ct-react';
import { EditableJourneySegmentGantt } from './EditableJourneySegmentGantt';
import type { EditableJourneySegmentGanttChange } from './EditableJourneySegmentGantt';

test('renders segment rows and emits updates from resize handles', async ({
  mount,
}) => {
  const changes: EditableJourneySegmentGanttChange[] = [];
  const component = await mount(
    <EditableJourneySegmentGantt
      journeyEndDateTime="2026-02-14T10:00:00+01:00"
      journeyStartDateTime="2026-02-14T06:00:00+01:00"
      onSegmentChange={(change) => changes.push(change)}
      segments={[
        {
          id: 'pickup',
          kind: 'pickup',
          label: 'GVA pickup',
          startDateTime: '2026-02-14T06:00:00+01:00',
          endDateTime: '2026-02-14T06:30:00+01:00',
        },
      ]}
    />,
  );

  await expect(component.getByLabel('Editable journey segment timeline')).toBeVisible();
  await expect(component).toContainText('GVA pickup');
  await expect(component).toContainText('0600-0630');

  await component
    .getByRole('slider', { name: /Adjust segment end: GVA pickup/ })
    .focus();
  await component.page().keyboard.press('ArrowRight');

  expect(changes).toHaveLength(1);
  const firstChange = changes[0];

  expect(firstChange).toBeDefined();
  expect(firstChange?.edge).toBe('end');
  expect(Date.parse(String(firstChange?.segment.endDateTime))).toBeGreaterThan(
    Date.parse('2026-02-14T06:30:00+01:00'),
  );
});

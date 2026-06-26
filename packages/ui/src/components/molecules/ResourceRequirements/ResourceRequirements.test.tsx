import { expect, test } from '@playwright/experimental-ct-react';
import { ResourceRequirements } from './ResourceRequirements';

test('renders compact requirement counts', async ({ mount }) => {
  const component = await mount(
    <ResourceRequirements
      requirements={[
        { id: 'passengers', kind: 'passenger', quantity: 1 },
        { id: 'baby-seats', kind: 'babySeat', quantity: 2 },
      ]}
    />,
  );

  await expect(component).toContainText('x 1');
  await expect(component).toContainText('x 2');
  await expect(component.getByLabel('Vehicle requirements')).toBeVisible();
});

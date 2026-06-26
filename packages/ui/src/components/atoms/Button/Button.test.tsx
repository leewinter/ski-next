import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';
import { ButtonClickHarness } from './Button.test-harness';

test('renders default label and responds to click', async ({ mount }) => {
  const component = await mount(<ButtonClickHarness />);

  await expect(component).toContainText('Submit');
  await component.getByRole('button').click();
  await expect(component).toContainText('Clicked');
});

test('renders a custom label when children are provided', async ({ mount }) => {
  const component = await mount(<Button>Custom label</Button>);
  await expect(component).toContainText('Custom label');
});

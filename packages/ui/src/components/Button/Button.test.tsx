import { test, expect } from '@playwright/experimental-ct-react';
import { Button } from './Button';

test('renders default label and responds to click', async ({ mount }) => {
  let clicked = false;
  const component = await mount(
    <Button type="primary" onClick={() => (clicked = true)} />,
  );

  await expect(component).toContainText('Submit');
  await component.click();
  expect(clicked).toBe(true);
});

test('renders a custom label when children are provided', async ({ mount }) => {
  const component = await mount(<Button>Custom label</Button>);
  await expect(component).toContainText('Custom label');
});

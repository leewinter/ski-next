import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { AppProvider } from '../src/providers/AppProvider';

beforeMount(async ({ App }) => {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
});

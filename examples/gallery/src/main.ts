import { createApp } from '@usevibejs/ui';
import { QueryClient, createVibeQueryPlugin } from '@usevibejs/query';
import App from './App.vibe';
// oxlint-disable-next-line import/no-unassigned-import -- Vite collects this stylesheet.
import './styles.css';

const app = createApp(App);
app.use(
  createVibeQueryPlugin(
    new QueryClient({
      defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
    }),
  ),
);
app.mount('#app');

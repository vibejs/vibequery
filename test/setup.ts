import { environmentManager, focusManager, onlineManager } from '@tanstack/query-core';
import { afterEach } from 'vitest';

environmentManager.setIsServer(() => false);

afterEach(() => {
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
});

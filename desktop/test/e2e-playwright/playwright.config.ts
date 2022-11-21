import type { PlaywrightTestConfig } from '@playwright/test';


const config: PlaywrightTestConfig = {
  workers: 1,
  timeout: 180000
};

export default config;

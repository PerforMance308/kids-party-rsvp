import { execFileSync } from 'node:child_process'
import type { FullConfig } from '@playwright/test'

export default async function globalSetup(_config: FullConfig) {
  execFileSync('cmd.exe', ['/c', 'npm.cmd', 'run', 'db:seed:smoke'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SEED_PASSWORD: process.env.SEED_PASSWORD || 'SmokeTest123!',
    },
  })
}

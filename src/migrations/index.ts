import * as migration_20260415_071808_add_api_keys from './20260415_071808_add_api_keys';

export const migrations = [
  {
    up: migration_20260415_071808_add_api_keys.up,
    down: migration_20260415_071808_add_api_keys.down,
    name: '20260415_071808_add_api_keys'
  },
];

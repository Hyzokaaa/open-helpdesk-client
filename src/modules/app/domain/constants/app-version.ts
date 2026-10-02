// Read from the core client's own manifest, so any build that compiles this source (this repo,
// or a product built on top of it) reports the core client version without extra config.
import { version } from "../../../../../package.json";

export const APP_VERSION: string = version;

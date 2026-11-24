import { previewRoutes } from '@ligeirinho/previewer';
import { scenarioRegistry } from './preview.registry';

// Loaded only when /__preview opens, so the scenarios and their sample data stay out of the app's bundle.
export default previewRoutes(scenarioRegistry);

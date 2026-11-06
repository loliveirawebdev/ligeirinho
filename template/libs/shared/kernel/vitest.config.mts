import { nodeProject } from '../../../tools/vitest/project-presets.mts';

export default nodeProject({ name: 'shared-kernel', projectRoot: import.meta.dirname });

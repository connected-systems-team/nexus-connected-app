// Dependencies - Nexus Lint Rules
import NoInternalImportsRule from './NoInternalImportsRule.mjs';
import NoNexusProjectOrBaseImportsRule from './NoNexusProjectOrBaseImportsRule.mjs';

// ESLint Nexus Lint Rules
const NexusLintRules = {
    rules: {
        'no-internal-imports-rule': NoInternalImportsRule,
        'no-nexus-project-or-base-imports-rule': NoNexusProjectOrBaseImportsRule,
    },
};

// Export - Default
export default NexusLintRules;

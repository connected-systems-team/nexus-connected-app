// Dependencies - Nexus Lint Rules
import NoInternalImportsRule from './NoInternalImportsRule.mjs';
import NoNexusOutsideImportsRule from './NoNexusOutsideImportsRule.mjs';

// ESLint Nexus Lint Rules
const NexusLintRules = {
    rules: {
        'no-internal-imports-rule': NoInternalImportsRule,
        'no-nexus-outside-imports-rule': NoNexusOutsideImportsRule,
    },
};

// Export - Default
export default NexusLintRules;

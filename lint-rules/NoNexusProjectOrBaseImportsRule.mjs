// ESLint rule to disallow imports using the aliases '@project' or '@structure' from files within 'libraries/nexus'
const NoNexusProjectOrBaseImportsRule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                "Disallow imports using the aliases '@project' or '@structure' from files within 'libraries/nexus'.",
            category: 'Possible Errors',
            recommended: false,
        },
        messages: {
            forbiddenImport:
                "Importing from '@project' or '@structure' is not allowed within 'libraries/nexus'.",
        },
    },
    create(context) {
        const filePath = context.getFilename();

        // Normalize file path to always use forward slashes
        const normalizedPath = filePath.replace(/\\/g, '/');

        // Check if the file is within the 'libraries/nexus' directory
        const isInNexusLibrary = normalizedPath.includes('/libraries/nexus/');

        return {
            ImportDeclaration(node) {
                if(!isInNexusLibrary) return;

                const importSource = node.source.value;

                if(
                    typeof importSource === 'string' &&
                    (importSource.startsWith('@project') || importSource.startsWith('@structure'))
                ) {
                    context.report({
                        node,
                        messageId: 'forbiddenImport',
                    });
                }
            },
            CallExpression(node) {
                if(!isInNexusLibrary) return;

                if(
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require'
                ) {
                    const argument = node.arguments[0];
                    if(
                        argument &&
                        argument.type === 'Literal' &&
                        typeof argument.value === 'string' &&
                        (argument.value.startsWith('@project') || argument.value.startsWith('@structure'))
                    ) {
                        context.report({
                            node,
                            messageId: 'forbiddenImport',
                        });
                    }
                }
            },
            ImportExpression(node) {
                if(!isInNexusLibrary) return;

                const argument = node.source;
                if(
                    argument &&
                    argument.type === 'Literal' &&
                    typeof argument.value === 'string' &&
                    (argument.value.startsWith('@project') || argument.value.startsWith('@structure'))
                ) {
                    context.report({
                        node,
                        messageId: 'forbiddenImport',
                    });
                }
            },
        };
    },
};

// Export - Default
export default NoNexusProjectOrBaseImportsRule;

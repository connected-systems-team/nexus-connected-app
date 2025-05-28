# Nexus

Nexus is a shared library containing code that is used across multiple Connected repositories, specifically the `www-connected-app` and `api-connected-app` projects.

## Purpose

This library serves as a central location for:

-   **Shared lint rules** - ESLint rules used across projects
-   **Utilities** - Common helper functions and utilities
-   **Parsers** - Data parsing and transformation logic
-   **Types and Interfaces** - TypeScript definitions shared between projects
-   **Constants** - Shared configuration and constant values
-   **Common logic** - Business logic that needs to be consistent across repositories

## Usage

Nexus is included as a git submodule in both the web and API repositories. This ensures that shared code remains synchronized and consistent across all Connected projects.

## Contributing

When adding code to Nexus, ensure that it is truly shared functionality that will be used by multiple repositories. Project-specific code should remain in the respective project repositories.

I want a webapp that allows me to query a CSV file using KQL. I want to use the @kusto/language-service-next, use the Monaco editor and use @kusto/language-service-next for KQL parsing and suggestions.

Lets create a webui using this stack:

1. solidjs as frontend framework
2. solid-js/store for global state management
3. picocss for styling
4. codemirror to provide the code editor. Try to use the KQL mode from @kusto/language-service-next with it.
5. @tanstack/solid-table@alpha to display results

For development:

1. use bun as the runtime and package manager.
2. use vite as the build tool.
3. use typescript as the language.

For features:

0. It should look like azure data explorer.
1. Support loading a CSV file from local disk using file URI. use the File System Access API for this.
2. Parse the CSV file and store the data in a suitable format for querying - cache it in session storage.
3. Do not show any data preview unless a query is executed.
4. Codemirror should have kql syntax highlighting and suggestions.
5. the KQL database should have the same name as the file name for usage in the kql queries.

Also, Rules:

1. DO NOT generate many documentation files or example files that do not contribute to the main functionality of the app.
2. Focus only on the core files needed to make this work. Just a basic README is sufficient.

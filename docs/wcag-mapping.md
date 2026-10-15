# WCAG mapping strategy

The audit engine stores rule metadata and explicit WCAG tag references instead of inventing them. Automated mappings are normalized into structured criteria references that include:

- WCAG version
- success criterion ID
- level
- principle

If a rule does not supply a defensible mapping, it is marked as unresolved and requires manual review. This keeps the report honest and prevents false claims of conformance.

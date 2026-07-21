# Task: Replace Alhasba Static Data with Dataverse Backend

## Context

The Alhasba module currently relies entirely on static/hardcoded data. New Dataverse tables have been created for this module, and the objective is to migrate the module from static data to Dataverse while preserving all existing functionality and user experience.

## Mandatory First Step (Do Not Skip)

Before making any code changes, perform a complete analysis of:

1. The entire Alhasba module codebase.
2. Current data flow and architecture.
3. All static data files, constants, mock services, and hardcoded datasets.
4. Existing CRUD patterns and service layers.
5. Dataverse connectivity already implemented in the project.
6. Dataverse schema for all Alhasba-related tables.
7. Table relationships, lookup columns, and choice columns.
8. Existing reusable components that may already support Dataverse integration.

## Required Deliverable Before Implementation

Create a detailed implementation plan containing:

### Current State Analysis

* Identify every location where static data is used.
* List all components, services, hooks, repositories, APIs, and pages dependent on static data.
* Document current data models and business logic.

### Dataverse Schema Analysis

For every Alhasba Dataverse table document:

* Table name
* Primary key
* All columns
* Data types
* Choice/Option Set fields
* Lookup fields
* Relationships
* Required fields
* Validation rules

### Mapping Document

Create a complete mapping:

```text
Static Source
    ↓
Dataverse Table
    ↓
Dataverse Columns
    ↓
Application Model
    ↓
UI Components
```

Map every existing static field to its corresponding Dataverse column.

### Implementation Strategy

For each entity/table define:

* Read strategy
* Create strategy
* Update strategy
* Delete strategy
* Filtering strategy
* Search strategy
* Sorting strategy
* Validation strategy
* Error handling strategy

## Implementation Requirements

After the plan is approved, implement the migration.

### CRUD Requirements

Implement full Dataverse CRUD operations for all entities currently backed by static data.

#### Read

* Replace all static reads with Dataverse queries.
* Support existing filtering.
* Support existing searching.
* Support existing sorting.
* Support pagination if required.

#### Create

* Create records in Dataverse.
* Validate required fields.
* Handle choice fields correctly.
* Handle lookup fields correctly.

#### Update

* Update existing Dataverse records.
* Preserve existing business logic.
* Handle concurrency if applicable.

#### Delete

* Delete records from Dataverse.
* Preserve existing validation and restrictions.

### Choice Columns

For every Dataverse Choice/Option Set field:

* Retrieve values dynamically from Dataverse or configured metadata.
* Display labels correctly.
* Save underlying values correctly.
* Support existing UI behavior.

### Lookup Columns

For every Dataverse lookup field:

* Retrieve related records.
* Display friendly names.
* Save lookup references correctly.
* Maintain relationship integrity.

### Connectivity Requirements

Review and reuse existing Dataverse connectivity patterns already present in the codebase where possible.

Ensure:

* Correct API usage.
* Consistent repository/service architecture.
* Proper authentication handling.
* Proper error handling.
* Proper loading states.

### Refactoring Requirements

Remove all:

* Hardcoded datasets
* Mock data sources
* Static constants used as data storage
* Temporary data providers

Replace them with Dataverse-backed implementations.

## Validation Checklist

Implementation is complete only when all items below are true:

### Static Data Removal

* All static data dependencies removed.
* No hardcoded business data remains.
* No mock datasets remain in production code.

### Dataverse Integration

* All reads come from Dataverse.
* All creates save to Dataverse.
* All updates save to Dataverse.
* All deletes execute against Dataverse.

### Choice Fields

* All choice fields display correctly.
* All choice fields save correctly.
* Labels and values map correctly.

### Lookup Fields

* All lookup relationships work correctly.
* Related records load correctly.
* Lookup updates persist correctly.

### Functional Validation

* Existing business behavior remains unchanged.
* Existing workflows continue to work.
* Existing validations continue to work.
* Existing user experience remains unchanged.

### Testing

Perform and document:

* Unit testing
* Integration testing
* CRUD testing
* Choice field testing
* Lookup field testing
* End-to-end testing
* Regression testing

## Definition of Done

The task is considered complete only when:

1. Every Alhasba static data source has been replaced by Dataverse.
2. Full CRUD functionality is operational for all entities.
3. All choice fields are correctly implemented.
4. All lookup relationships are correctly implemented.
5. No hardcoded data remains.
6. Existing functionality is preserved.
7. All tests pass.
8. Documentation is updated.
9. A final implementation summary is provided showing:

   * Static sources removed
   * Dataverse tables integrated
   * CRUD operations implemented
   * Choice fields implemented
   * Lookup fields implemented
   * Validation results
   * Testing results

## Execution Rule

Do not start implementation immediately.

Phase 1:

* Analyze codebase.
* Analyze Dataverse schema.
* Produce detailed implementation plan.
* Identify risks, gaps, and dependencies.

Phase 2:

* Execute implementation after analysis is complete.

Phase 3:

* Validate against the Definition of Done checklist and provide evidence for each completed item.

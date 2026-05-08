---
name: 'REST API Pattern Guidelines'
description: 'REST API conventions and endpoint design rules for scalable, maintainable, developer-friendly APIs.'
applyTo: '**/controllers/**/*.ts'
---

# 1. API DESIGN PRINCIPLES

## Core Rules

- APIs MUST follow RESTful resource-oriented design.
- APIs MUST prioritize consistency and predictability over cleverness.
- APIs MUST use minimal resource identifiers in paths.
- APIs SHOULD avoid unnecessary nested routes.
- APIs MUST be backward-compatible whenever possible.
- APIs SHOULD optimize for frontend and mobile developer experience.

---

# 2. RESOURCE & ENDPOINT DESIGN

## Minimal UUID Principle

- Include ONLY required identifiers in endpoint paths.
- DO NOT include parent resources unless required for context or authorization.

### Preferred

```http
GET /teams/{teamId}
GET /teams/{teamId}/memberships
POST /competitions/{competitionId}/teams
```

### Avoid

```http
GET /competitions/{competitionId}/teams/{teamId}
```

Reason:

- `teamId` already uniquely identifies the resource.
- Deep nesting increases complexity and coupling.

---

## Nested Resource Rules

### Use nesting ONLY when:

- Parent-child relationship is required.
- Authorization depends on parent resource.
- Collection belongs to parent resource.

### Valid

```http
GET /competitions/{competitionId}/teams
POST /teams/{teamId}/memberships
```

### Invalid

```http
GET /users/{userId}/teams/{teamId}/memberships/{membershipId}
```

---

## Action Endpoint Rules

### Use imperative endpoints ONLY for actions

Examples:

```http
POST /teams/memberships/{membershipId}/accept
POST /tickets/{ticketId}/check-in
POST /posts/{postId}/publish
```

### Requirements

- Action MUST represent a business operation.
- Action MUST NOT replace normal CRUD behavior.
- Action endpoints SHOULD use `POST`.

---

# 3. COLLECTIONS, FILTERING & SEARCH

## Collection Retrieval

- Collection endpoints MUST support:
  - pagination
  - filtering
  - sorting

### Example

```http
GET /teams?limit=20&cursor=xxx&sort=createdAt:desc
```

---

## Search Endpoints

### Rules

- Prefer filtering on normal collection endpoints.
- Use `/search` ONLY for specialized or high-complexity queries.

### Preferred

```http
GET /teams?name=alpha
```

### Allowed Specialized Search

```http
GET /teams/search?q=alpha
```

### `/search` SHOULD be used for:

- full-text search
- autocomplete
- admin/HQ tools
- ranking/search engines

---

# 4. HTTP METHODS

| Method | Usage                                 |
| ------ | ------------------------------------- |
| GET    | Read-only operations                  |
| POST   | Resource creation or business actions |
| PUT    | Full replacement updates              |
| PATCH  | Partial updates                       |
| DELETE | Resource deletion                     |

---

## Method Rules

### GET

- MUST be idempotent.
- MUST NOT mutate data.

### POST

- Used for:
  - creation
  - actions
  - workflows

### PUT

- Replaces entire resource.
- MUST be idempotent.

### PATCH

- Used for partial updates only.
- Request body SHOULD contain partial DTO fields.

Example:

```http
PATCH /users/{userId}
```

```json
{
  "fullName": "John Doe"
}
```

### DELETE

- MUST identify resource completely via path.
- MUST NOT require request body.

---

# 5. RESPONSE FORMAT

## Success Response

### Standard Collection Response

```json
{
  "data": [],
  "pagination": {
    "cursor": "next_cursor",
    "hasNextPage": true
  }
}
```

---

## Single Resource Response

```json
{
  "data": {
    "id": "uuid"
  }
}
```

---

# 6. ERROR HANDLING

## Error Response Format

### Standard Error Structure

```json
{
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "Team not found",
    "details": {}
  }
}
```

---

## Validation Error Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload validation failed",
    "details": {
      "email": ["email must be valid"]
    }
  }
}
```

---

# 7. HTTP STATUS CODES

| Status                    | Meaning                  |
| ------------------------- | ------------------------ |
| 200 OK                    | Successful request       |
| 201 Created               | Resource created         |
| 202 Accepted              | Async processing started |
| 204 No Content            | Success without body     |
| 400 Bad Request           | Invalid request          |
| 401 Unauthorized          | Authentication required  |
| 403 Forbidden             | Permission denied        |
| 404 Not Found             | Resource not found       |
| 409 Conflict              | Business conflict        |
| 429 Too Many Requests     | Rate limit exceeded      |
| 500 Internal Server Error | Unexpected server error  |
| 503 Service Unavailable   | Temporary outage         |

---

# 8. PAGINATION RULES

## Preferred Strategy

- Cursor-based pagination SHOULD be preferred for large datasets.

### Example

```http
GET /users?limit=20&cursor=abc123
```

---

## Pagination Requirements

- MUST support configurable limits.
- SHOULD return pagination metadata.
- SHOULD have deterministic sorting.

---

# 9. NAMING CONVENTIONS

## Endpoint Naming

- Use plural resource names.

### Preferred

```http
/users
/teams
/competitions
```

### Avoid

```http
/user
/team
```

---

## Path Naming

- MUST use kebab-case.

### Preferred

```http
/team-memberships
```

### Avoid

```http
/teamMemberships
/team_memberships
```

---

## Query Parameters

- MUST use camelCase.

### Example

```http
GET /users?createdAtFrom=2025-01-01
```

---

# 10. AUTHENTICATION & SECURITY

## Requirements

- APIs MUST validate authentication before authorization.
- Protected endpoints MUST return:
  - `401` if unauthenticated
  - `403` if unauthorized

---

## Security Headers

APIs SHOULD support:

- CORS policies
- rate limiting
- security headers
- request tracing

---

# 11. PERFORMANCE & SCALABILITY

## API Performance Rules

- APIs SHOULD minimize payload size.
- Collection endpoints MUST paginate.
- APIs SHOULD avoid N+1 query patterns.
- Expensive operations SHOULD be asynchronous.

---

## Bulk Operations

### Allowed Patterns

```http
POST /users/bulk-import
PATCH /teams/bulk-update
```

### Requirements

- MUST support partial failure reporting.
- SHOULD support async processing for large jobs.

---

# 12. VERSIONING

## Rules

- APIs SHOULD support backward compatibility.
- Breaking changes MUST require versioning.

---

## Preferred Strategy

```http
/v1/users
/v2/users
```

---

# 13. DOCUMENTATION

## Requirements

- All endpoints MUST have OpenAPI documentation.
- APIs MUST include:
  - request examples
  - response examples
  - error examples
  - authentication requirements

---

# 14. ANTI-PATTERNS

## Forbidden

### Deep Nesting

```http
/users/{userId}/teams/{teamId}/memberships/{membershipId}
```

---

### RPC-style CRUD

```http
POST /create-user
POST /delete-team
```

---

### Inconsistent Naming

```http
/team_memberships
/teamMemberships
```

---

# 15. ENGINEERING PRINCIPLES

## API Philosophy

- Optimize for long-term maintainability.
- Prefer consistency over flexibility.
- Prefer explicitness over magic.
- Design APIs for evolution.
- Developer experience is a first-class requirement.

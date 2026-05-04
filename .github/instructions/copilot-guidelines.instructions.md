---
name: "NestJS Microservice-Ready Guidelines (Event-Driven Auth)"
description: "Guidelines for modular monolith evolving to microservices using Kafka, PostgreSQL, and decoupled data ownership with Repository Pattern."
applyTo: '**'
---

# 1. ARCHITECTURE & DESIGN

## Pattern & Structure
- **Model**: Modular Monolith (Microservice-ready).
- **Bounded Contexts**:
  - `Auth`: Security credentials only.
  - `User`: Personal profiles & metadata.
  - `Search`

## Service Responsibilities
| Service | Owns | Interface |
|---------|------|-----------|
| Auth | `email`, `password_hash` | `IAuthCredentialRepository` |
| User | `full_name`, `avatar_url`, `email` | `IUserProfileRepository` |

## Database Design

### Storage: PostgreSQL
- **Isolation**: Each module = separate database/schema. 
- **Integrity**: STRICTLY NO cross-module SQL joins or FK relationships.
- **IDs**: Use **UUID v7** for all entities and event IDs (for sortability).

### Naming Convention
- **Tables & Columns**: Must use **snake_case** (e.g., `user_id`, `created_at`).
- **Code Property**: Must use **camelCase** (e.g., `userId`, `createdAt`).
- **Mapping**: Always use the `@Column({ name: 'snake_case_name' })` decorator in Entity files.

---

# 2. DATA & REPOSITORY PATTERN

## Requirements (Mandatory)
- NO direct TypeORM `Repository<T>` injection in Services.
- Define **Domain Repository Interface** per module.
- Bind implementations using **DI Tokens** (Symbols or strings, e.g., `AUTH_REPO_TOKEN`).
- Services call interface methods: `.save()`, `.findOneBy()`, etc.

---

# 3. COMMUNICATION

## Synchronous (Internal)
- Use Interface-based DI for inter-module calls.

## Asynchronous (Event-Driven)
- **Transport**: Kafka.
- **Flow**:
  1. `AuthService` creates account → saves via `IAuthCredentialRepository`.
  2. `AuthService` publishes `UserCreated` event via Outbox (Required: `user_id`, `email`; Optional: profile metadata).
  3. `UserService` consumes event → saves via `IUserProfileRepository`.
- **Event Contracts**: Centralized in `src/common/constants/events.ts` using enums.

---

# 4. RELIABILITY

## IDEMPOTENCY
- Consumers MUST be idempotent.
- MUST check existing records before insert/update.
- SHOULD use unique constraints (e.g., `aggregate_id`) or upsert.

## OUTBOX PATTERN

### Requirements
- All events MUST be published using the Outbox Pattern.
- Services MUST NOT emit events directly to Kafka after database operations.

### Prohibited Anti-Pattern
```ts
// ❌ FORBIDDEN
await repository.save(...)
await kafkaService.emit(...)  // Direct Kafka emit not allowed
```

### Outbox Table Schema
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID v7 | `id` | PK |
| `event_type` | String | `eventType` | Index |
| `aggregate_id` | UUID v7 | `aggregateId` | Index |
| `payload` | JSONB | `payload` | |
| `status` | ENUM | `status` | Index (PENDING, etc.) |
| `retry_count` | Integer | `retryCount` | Default: 0 |
| `created_at` | Timestamp| `createdAt` | Index |
| `processed_at`| Timestamp| `processedAt` | Nullable |
| `error_message`| Text | `errorMessage` | Nullable |


### Publisher Implementation
- **Batch processing**: 
  - 1. Fetch PENDING in chunks (e.g., LIMIT 100)
  - 2. For each event:
      - Publish to Kafka.
      - If success: Mark as PROCESSED.
      - If failure: Increment retry_count, mark as FAILED if max retries reached.
  - 3. Repeat until no PENDING events remain.
- **Concurrency**: Use `p-limit` with Promise.all for controlled parallelism.
- **Retry**: Increment `retry_count`; mark FAILED after max attempts.
- **Loop**: Repeat until no PENDING events remain.
- **Performance**:
  - Prefer I/O concurrency over threading
  - DO NOT use Worker Threads for Outbox

---

# 5. CODE QUALITY

## Standards
- **Type Safety**: NO `any` types.
- **Validation**: Strict DTO validation via `class-validator`.
- **Logic Placement**: Business logic in Services; Controllers thin.
- **Functions**: 
  - Functions should be concise and focused on a single task.
  - Avoid large, monolithic functions; break them into smaller, reusable pieces.

---

# 6. INFRASTRUCTURE & SETUP

## DI & Modules
- Shared services (Kafka, PostgreSQL, Outbox) in `src/infrastructure`.
- Inject via DI Tokens, NOT direct type references.

## Environment
- Provide `.env.example` at project root.
- Define all required variables for local development and deployment.
- **NEVER commit real secrets**.

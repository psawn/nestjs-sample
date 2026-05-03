---
name: "NestJS Microservice-Ready Guidelines (Event-Driven Auth)"
description: "Guidelines for modular monolith evolving to microservices using Kafka, PostgreSQL, and decoupled data ownership with Repository Pattern."
applyTo: '**'
---

# Architecture & Design
- **Pattern**: Modular Monolith (Microservice-ready).
- **Bounded Contexts**: `Auth`, `User`, `Search`.
- **Isolation Rule**: 
  - Each module must use its own PostgreSQL Database/Schema.
  - **STRICT**: No cross-module SQL joins or direct Entity relationships (@JoinColumn).
  - Use **UUID v7** for all primary keys, foreign keys, and event IDs.

# Data Ownership & Storage
- **Database**: PostgreSQL (Mandatory for Auth and User services).
- **Auth Service Responsibility**: 
  - Stores **ONLY** security credentials: `email`, `password_hash`, `refresh_tokens`, `social_provider_ids`.
  - Implement interface `IAuthCredentialRepository`
- **User Service Responsibility**: 
  - Stores personal information: `full_name`, `avatar_url`, etc.
  - Links via `user_id` (UUID v7) received through Kafka.
  - Implement interface `IUserProfileRepository`

# Communication Strategy
## Synchronous (Internal)
- Use **Interface-based abstraction (DI tokens)** for inter-module calls.

## Asynchronous (Event-Driven)
- **Primary Transport**: Kafka.
- **Flow**: 
  1. `AuthService`: Creates account -> Saves via `IAuthCredentialRepository`.
  2. `AuthService`: Emits `UserCreated` event (Required: `user_id`, `email`; Optional: profile metadata).
  3. `UserService`: Consumes event -> Saves via `IUserProfileRepository`.

# Implementation Standards
- **Repository Pattern (Mandatory)**:
  - Services MUST NOT inject TypeORM `Repository<T>` directly.
  - Every module must define a **Domain Repository Interface** (e.g., `IAuthCredentialRepository`).
  - Implementation classes must be bound to these interfaces using **DI Tokens**.
  - Logic in Service should only call methods like `.save()`, `.findOneBy()`, etc., from the interface.
- **Idempotency**: All event consumers MUST check for existing records via Repository before processing.
- **Thin Controllers**: Business logic belongs to Services.
- **Validation**: Strict DTO validation using `class-validator`.
- **Event Contracts**: Use centralized `enum` in `src/common/constants/events.ts`.

# Infrastructure
- **Dependency Injection**: 
  - Shared infrastructure (Kafka, Postgres) in `src/infrastructure`.
  - Modules must inject `KafkaService` and repositories via DI Tokens.

# Clean Code
- **Type Safety**: **NO `any`**.
- **DI Tokens**: Always use Symbols or constant strings for injection tokens (e.g., `AUTH_REPO_TOKEN`).

# Environment Configuration
- MUST provide a `.env.example` file at project root.
- This file defines all required environment variables for local development and deployment.
- DO NOT commit real secrets.

# Reliability & Messaging Guarantees

## Outbox Pattern (MANDATORY)
- All events MUST be published using the **Outbox Pattern**.
- Services MUST NOT emit events directly to Kafka after database operations.

## Required Flow
1. Perform business logic and persist data.
2. Persist event into an `outbox` table within the SAME database transaction.
3. Commit transaction.
4. A background worker/process reads from `outbox` and publishes to Kafka.
5. Mark event as `PROCESSED` (or delete) after successful publish.

## Outbox Table Requirements
- Fields:
  - `id` (UUID v7)
  - `event_type`
  - `aggregate_id`
  - `payload` (JSON)
  - `status` (`PENDING`, `PROCESSED`, `FAILED`)
  - `created_at`
  - `processed_at` (nullable)
- MUST support retry (based on `status = PENDING` or `FAILED`).

## Guarantees
- Prevent event loss when Kafka is unavailable.
- Ensure **atomicity** between DB write and event creation.
- Enable retry and recovery.

## Idempotency (Consumer Side)
- Consumers MUST be idempotent.
- MUST check existing records before insert/update.
- SHOULD use unique constraints (e.g., `aggregate_id`) or upsert.

## Anti-Pattern (STRICTLY FORBIDDEN)
- ❌ Emitting Kafka events directly inside service logic after DB save:
```ts
await repository.save(...)
await kafkaService.emit(...) // NOT ALLOWED
```

# Outbox Publisher Implementation (MANDATORY FOR PRODUCTION)

## Processing Strategy
- Process outbox events in batches (e.g., LIMIT 100).
- Do not load all events into memory.
- Process events using controlled concurrency (parallel with limit).
- Do not process events sequentially.

## Concurrency Control
- Use Promise.all with concurrency limit (e.g., p-limit).
- Avoid unbounded parallel execution.

## Retry Strategy
- Track retry_count
- Stop retry after max attempts
- Mark event as FAILED

## Processing Flow

1. Fetch batch of PENDING events (e.g., LIMIT 100).
2. For each event:
    - Publish to Kafka.
    - If success: Mark as PROCESSED.
    - If failure: Increment retry_count, mark as FAILED if max retries reached.
3. Repeat until no PENDING events remain.

## Performance Rules
- Prefer I/O concurrency over threading
- DO NOT use Worker Threads for Outbox
- Optimize with:
    - batching
    - concurrency limit
    - efficient queries

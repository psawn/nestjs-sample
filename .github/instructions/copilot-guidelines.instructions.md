---
name: 'NestJS Microservice-Ready Guidelines (Event-Driven Auth)'
description: 'Guidelines for modular monolith evolving to microservices using Kafka, PostgreSQL, and decoupled data ownership with Repository Pattern.'
applyTo: '**'
---

# 1. ARCHITECTURE & DESIGN

## Pattern & Structure

- **Model**: Modular Monolith (Microservice-ready).
- **Bounded Contexts**:
  - `Auth`: Security credentials only.
  - `User`: Personal profiles & metadata.
  - `Search`: Search functionality.

## Service Responsibilities

| Service | Owns                               | Interface                   |
| ------- | ---------------------------------- | --------------------------- |
| Auth    | `email`, `password_hash`           | `IAuthCredentialRepository` |
| User    | `full_name`, `avatar_url`, `email` | `IUserProfileRepository`    |

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

# 2. DESIGN PATTERNS

## Repository Pattern (MANDATORY)

- NO direct TypeORM `Repository<T>` injection in Services.
- Define **Domain Repository Interface** per module.
- Bind implementations using **DI Tokens** (Symbols or strings, e.g., `AUTH_REPO_TOKEN`).
- Services call interface methods: `.save()`, `.findOneBy()`, etc.

---

# 3. COMMUNICATION

## Synchronous (Internal RPC)

### Transport

- Internal synchronous communication between services MUST use NestJS TCP Transport.
- Services communicate via `ClientProxy.send()` and `@MessagePattern()`.

### TCP Ports

| Service     | TCP Port |
| ----------- | -------- |
| API Gateway | 4000     |
| Auth        | 4001     |
| User        | 4002     |
| Search      | 4003     |

### Rules

- TCP ports MUST be configurable via environment variables.
- Direct database access across services is STRICTLY FORBIDDEN.
- Synchronous communication SHOULD only be used when an immediate response is required, such as:
  - Request/response workflows
  - Internal queries
  - Validation checks
  - RPC-style operations
- Circular service dependencies SHOULD be minimized.
- Event-driven communication SHOULD be preferred for asynchronous workflows.

---

## Asynchronous (Event-Driven)

### Transport

- Kafka MUST be used for asynchronous communication and domain events.
- Services communicate via `ClientProxy.emit()` and `@EventPattern()`.

### Rules

- Services MUST NOT emit Kafka events directly after database writes.
- All Kafka events MUST be published through the Outbox Pattern.
- Kafka SHOULD be used for:
  - Domain events
  - Notifications
  - Event propagation
  - Eventually consistent workflows
  - Background processing

### Flow

1. `AuthService` creates account → saves via `IAuthCredentialRepository`
2. `AuthService` writes `UserCreated` event to Outbox table
3. Outbox Publisher publishes event to Kafka
4. `UserService` consumes event → saves via `IUserProfileRepository`

### Event Contracts

- Event contracts MUST be centralized in:
  - `src/common/constants/events.ts`
- Use enums/constants for:
  - Topic names
  - Event types
  - Message patterns

---

# 4. API GATEWAY

## Responsibilities

- All external HTTP requests MUST go through the API Gateway.
- API Gateway handles:
  - Request entry point
  - Authorization layer
  - Rate limiting
  - Request validation boundary
  - Routing to internal services

## Communication

- Gateway communicates with internal services using NestJS Microservice Transport (ClientProxy)
- Gateway MUST NOT access databases directly
- Gateway MUST NOT contain business logic
- Gateway MUST delegate logic to domain services via message patterns

## Route Rules

| Route Type | Authentication                                |
| ---------- | --------------------------------------------- |
| `/auth/*`  | Public (use `@Public()` decorator)            |
| `/users/*` | JWT Required (use `@UseGuards(JwtAuthGuard)`) |

## Timeout & Resilience

- Recommended timeout: 5000ms
- Gateway SHOULD handle:
  - TimeoutException
  - ServiceUnavailableException
  - RPC transport errors

# 5. AUTHENTICATION

## JWT Implementation (MANDATORY)

### DO NOT USE @nestjs/passport

All authentication MUST be implemented manually without `@nestjs/passport`.

### Required Components

1. **`@Public()` decorator** (`src/common/guards/public.decorator.ts`):
   - Use `SetMetadata(IS_PUBLIC_KEY, true)` to mark routes as public
   - JwtAuthGuard MUST check this metadata and skip authentication when present

2. **`JwtAuthGuard`** (`src/common/guards/jwt-auth.guard.ts`):
   - Implement `CanActivate` interface
   - Inject `JwtService` and `Reflector`
   - Check `@Public()` metadata via Reflector; if present, return `true` immediately
   - Extract Bearer token from `Authorization` header
   - Use `jwtService.verify(token)` to validate JWT
   - On success: set `request.user = { userId: payload.sub, email: payload.email }`
   - On failure: throw `UnauthorizedException`
   - MUST NOT use `PassportStrategy` or `AuthGuard('jwt')`

3. **`JwtService` Configuration**:
   - Algorithm: HS256
   - Secret: from `JWT_ACCESS_SECRET` env variable (required)
   - Expiration: from `JWT_ACCESS_EXPIRES` env variable (default: `1h`)
   - Payload MUST contain: `sub` (user_id), `email`

### JWT Payload Structure

```json
{
  "sub": "uuid-v7-user-id",
  "email": "user@example.com",
  "iat": 1610000000,
  "exp": 1610003600
}
```

### Password Security

- Passwords MUST be hashed using **bcrypt**
- Salt rounds: **10-12**
- Plain text passwords MUST NEVER be stored or logged

### Route Protection Pattern

```ts
// Public route - no auth required
@Public()
@Post('auth/login')
async login(@Body() dto: LoginDto) { ... }

// Protected route - JWT required
@UseGuards(JwtAuthGuard)
@Get('users/:id')
async getUser(@Param('id') id: string) { ... }
```

### Gateway Authentication

- Gateway MUST validate JWT via `JwtAuthGuard` BEFORE forwarding protected requests
- Internal services SHOULD trust validated gateway requests (gateway sets `request.user`)

## Public Routes

- Public endpoints MUST use a custom `@Public()` decorator
- `JwtAuthGuard` MUST skip authentication for routes marked with `@Public()`
- Do NOT use any other mechanism (e.g., `Reflector`) to mark public routes

## Role-Based Access Control (if implemented)

- Use `@Roles('admin')` decorator with `RolesGuard`
- `RolesGuard` must check `user.roles` from validated JWT payload

---

# 6. RELIABILITY

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

| Field           | Type      | Notes                              |
| --------------- | --------- | ---------------------------------- |
| `id`            | UUID v7   | Primary key                        |
| `event_type`    | String    | Index                              |
| `aggregate_id`  | UUID v7   | Index                              |
| `payload`       | JSONB     |                                    |
| `status`        | ENUM      | Index (PENDING, PROCESSED, FAILED) |
| `retry_count`   | Integer   | Default: 0                         |
| `created_at`    | Timestamp | Index                              |
| `processed_at`  | Timestamp | Nullable                           |
| `error_message` | Text      | Nullable                           |

### Publisher Implementation

- **Batch processing**:
  1. Fetch PENDING in chunks (LIMIT 100)
  2. For each event:
     - Publish to Kafka
     - If success: Mark as PROCESSED
     - If failure: Increment retry_count, mark as FAILED if max retries reached
  3. Repeat until no PENDING events remain
- **Concurrency**: Use `p-limit` with `Promise.all` for controlled parallelism
- **Retry**: Increment `retry_count`; mark FAILED after max attempts
- **Loop**: Repeat until no PENDING events remain
- **Performance**:
  - Prefer I/O concurrency over threading
  - DO NOT use Worker Threads for Outbox

---

# 7. CODE QUALITY

## Standards

- **Type Safety**: NO `any` types
- **Validation**: Strict DTO validation via `class-validator`
- **Logic Placement**: Business logic in Services; Controllers thin
- **Functions**: Concise, single-responsibility; avoid large monolithic functions

---

# 8. INFRASTRUCTURE & SETUP

## DI & Modules

- Shared services (Kafka, PostgreSQL, Outbox) in `src/infrastructure`
- Inject via DI Tokens, NOT direct type references

## Environment

- Provide `.env.example` at project root
- Define all required variables for local development and deployment
- **NEVER commit real secrets**

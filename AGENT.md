# AGENT.md

## System Overview

This project follows a **Modular Monolith (Microservice-ready)** architecture.

Bounded contexts:

- Auth
- User
- Search

The system is designed to:

- Be easily split into independent microservices
- Avoid runtime coupling between modules
- Prefer event-driven communication

---

## Core Design Principles

- User is the **source of truth** for user data
- Auth is responsible only for **authentication**
- Search is a **read model** (Elasticsearch)

- No direct dependency between modules
- No cross-module database joins
- All cross-module communication must be:
  - event-driven (preferred)
  - or abstracted via interfaces

---

## Data Flow

### User → Auth (Credential Sync)

- User module emits:
  - UserCreated
  - UserUpdated

- Auth module:
  - Consumes events
  - Stores credential data locally

👉 Auth does NOT call User service at runtime

---

### User → Search (Indexing)

- User module emits events
- Search module updates Elasticsearch

---

## Authentication Flow

### Login

1. Client → Auth
2. Auth:
   - Reads credential from local DB
   - Verifies password
   - Issues JWT

---

### API Request

1. Client → Service
2. Service:
   - Verifies JWT (stateless)
   - Processes request

---

## Scalability Strategy

- Replace interface-based calls with TCP/gRPC when splitting services
- Introduce API Gateway for centralized authentication
- Keep services stateless

---

## Key Decisions

- Event-driven over request-response to reduce coupling
- Local credential store in Auth to avoid runtime dependency
- Stateless JWT for scalability

## Development Workflow

### Code Generation & Quality

- Auto-linting: Every code generation command must be followed by an automated linting/formatting pass (e.g., npm run lint --fix or go fmt).

- Validation: Generated code must adhere to the project's architectural boundaries defined in this document.

- Doc: Doc: MUST use Context7 to ensure all generated code follows the latest official documentation and up-to-date APIs.

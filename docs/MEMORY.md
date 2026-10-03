# TEZLAA - AGENT MEMORY & SYSTEM STATE

## Current Knowledge & Project Constraints
- **Repositories**:
  - `Backend`: Express.js, TypeScript, Prisma, PostgreSQL, Socket.IO.
  - `Flutteruser`: Flutter mobile app for customers (Riverpod, GoRouter).
  - `Flutteradmin`: Flutter mobile/web app for admins, branch managers, and kitchen staff.
- **PayHere Rules**:
  - Never place `PAYHERE_SECRET` in Flutter code.
  - PayHere status codes: `2` (COMPLETED), `0` (PENDING), `-1` (CANCELLED), `-2` (FAILED), `-3` (CHARGEBACK).
- **Socket.IO Event Names**:
  - Canonical: `order:created`, `order:status_updated`.
  - Deprecated aliases: `order:new`, `order:status-updated`, `order:updated` (kept only with client-side deduplication during transition).
- **Admin Error Handling Rules**:
  - Never catch API errors to return `[]` or Rs. 0.
  - Screens must handle `AsyncValue.error` or typed exceptions with a retry CTA.

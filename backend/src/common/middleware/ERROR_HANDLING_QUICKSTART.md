# Error Handling Quick Start

## TL;DR

Use `asyncHandler` to wrap async routes and throw custom errors. The global error handler takes care of the rest.

## Quick Example

```typescript
import { Router } from 'express';
import { asyncHandler } from '../common/middleware';
import { NotFoundError } from '../common/errors';

const router = Router();

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    res.json({ success: true, data: user });
  })
);

export default router;
```

## Available Error Classes

```typescript
import {
  AppError, // Base error (500)
  NotFoundError, // 404
  ValidationError, // 400
  AuthenticationError, // 401
  AuthorizationError, // 403
  ConflictError, // 409
} from '../common/errors';
```

## Usage Patterns

### Simple Route

```typescript
router.get(
  '/resource',
  asyncHandler(async (req, res) => {
    const data = await fetchData();
    res.json({ success: true, data });
  })
);
```

### With Validation

```typescript
router.post(
  '/resource',
  asyncHandler(async (req, res) => {
    if (!req.body.name) {
      throw new ValidationError('Name is required');
    }
    const data = await createResource(req.body);
    res.status(201).json({ success: true, data });
  })
);
```

### With Authentication Check

```typescript
router.get(
  '/protected',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = (req as any).user.userId;
    const data = await getUserData(userId);
    res.json({ success: true, data });
  })
);
```

### Custom Error

```typescript
router.delete(
  '/resource/:id',
  asyncHandler(async (req, res) => {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    if (resource.locked) {
      throw new AppError('Resource is locked', 423, 'RESOURCE_LOCKED');
    }
    await resource.remove();
    res.json({ success: true, message: 'Deleted' });
  })
);
```

## Error Response Format

All errors return:

```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "NOT_FOUND"
  }
}
```

## What Gets Handled Automatically

- Mongoose validation errors → 400
- Invalid ObjectId → 400
- Duplicate key errors → 409
- JWT errors → 401
- All custom AppError instances
- Unexpected errors → 500

## Import Shortcuts

```typescript
// All middleware
import { asyncHandler, errorHandler, authenticate, authorize } from '../common/middleware';

// All errors
import { NotFoundError, ValidationError, AuthenticationError } from '../common/errors';
```

## That's It!

No try-catch needed. Just wrap with `asyncHandler` and throw errors.

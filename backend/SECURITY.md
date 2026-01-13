
# Security Architecture & Database Constraints

## Table of Contents
1. [Tenant Isolation Strategy](#tenant-isolation-strategy)
2. [Required Database Constraints](#required-database-constraints)
3. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
4. [Backend Security Measures](#backend-security-measures)
5. [Rate Limiting Configuration](#rate-limiting-configuration)
6. [Security Testing Checklist](#security-testing-checklist)

---

## Tenant Isolation Strategy

### Multi-Tenancy Model
- **Type**: Row-level multi-tenancy
- **Isolation Key**: `user_id` on all user-scoped tables
- **Enforcement Layers**:
  1. Database constraints (DB level)
  2. Row Level Security policies (DB level)
  3. Query filtering (Application level)
  4. Authorization guards (Application level)

### Security Principle
**Defense in Depth**: Every layer enforces tenant isolation independently. If one layer fails, others prevent data leakage.

---

## Required Database Constraints

### 1. Calculators Table

```sql
-- Primary constraints
ALTER TABLE calculators
  ADD CONSTRAINT calculators_pkey PRIMARY KEY (id),
  ADD CONSTRAINT calculators_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE;

-- Tenant isolation: Ensure user_id is never null
ALTER TABLE calculators
  ALTER COLUMN user_id SET NOT NULL;

-- Business logic constraints
ALTER TABLE calculators
  ADD CONSTRAINT calculators_name_user_unique
    UNIQUE (user_id, name);

-- Index for performance
CREATE INDEX idx_calculators_user_id ON calculators(user_id);
CREATE INDEX idx_calculators_created_at ON calculators(created_at DESC);
```

### 2. Calculator Fields Table

```sql
-- Primary constraints
ALTER TABLE calculator_fields
  ADD CONSTRAINT calculator_fields_pkey PRIMARY KEY (id),
  ADD CONSTRAINT calculator_fields_calculator_fkey
    FOREIGN KEY (calculator_id)
    REFERENCES calculators(id) ON DELETE CASCADE;

-- Unique field names per calculator
ALTER TABLE calculator_fields
  ADD CONSTRAINT calculator_fields_unique_name
    UNIQUE (calculator_id, field_name);

-- Index for performance
CREATE INDEX idx_calculator_fields_calculator_id
  ON calculator_fields(calculator_id);
```

### 3. Calculator Formulas Table

```sql
-- Primary constraints
ALTER TABLE calculator_formulas
  ADD CONSTRAINT calculator_formulas_pkey PRIMARY KEY (id),
  ADD CONSTRAINT calculator_formulas_calculator_fkey
    FOREIGN KEY (calculator_id)
    REFERENCES calculators(id) ON DELETE CASCADE;

-- Unique formula names per calculator
ALTER TABLE calculator_formulas
  ADD CONSTRAINT calculator_formulas_unique_name
    UNIQUE (calculator_id, formula_name);

-- Index for performance
CREATE INDEX idx_calculator_formulas_calculator_id
  ON calculator_formulas(calculator_id);
```

---

## Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculator_formulas ENABLE ROW LEVEL SECURITY;
```

### Calculator Policies

```sql
-- SELECT: Users can only read their own calculators
CREATE POLICY calculators_select_policy ON calculators
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only create calculators for themselves
CREATE POLICY calculators_insert_policy ON calculators
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own calculators
CREATE POLICY calculators_update_policy ON calculators
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own calculators
CREATE POLICY calculators_delete_policy ON calculators
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Calculator Fields Policies

```sql
-- SELECT: Users can only read fields from their calculators
CREATE POLICY calculator_fields_select_policy ON calculator_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_fields.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- INSERT: Users can only add fields to their calculators
CREATE POLICY calculator_fields_insert_policy ON calculator_fields
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_fields.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update fields in their calculators
CREATE POLICY calculator_fields_update_policy ON calculator_fields
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_fields.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete fields from their calculators
CREATE POLICY calculator_fields_delete_policy ON calculator_fields
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_fields.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );
```

### Calculator Formulas Policies

```sql
-- SELECT: Users can only read formulas from their calculators
CREATE POLICY calculator_formulas_select_policy ON calculator_formulas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_formulas.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- INSERT: Users can only add formulas to their calculators
CREATE POLICY calculator_formulas_insert_policy ON calculator_formulas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_formulas.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update formulas in their calculators
CREATE POLICY calculator_formulas_update_policy ON calculator_formulas
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_formulas.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete formulas from their calculators
CREATE POLICY calculator_formulas_delete_policy ON calculator_formulas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calculators
      WHERE calculators.id = calculator_formulas.calculator_id
      AND calculators.user_id = auth.uid()
    )
  );
```

---

## Backend Security Measures

### 1. Query-Level Tenant Isolation

**Location**: `calculators.service.ts:59`

All queries MUST include user_id filtering:
```typescript
// ✅ CORRECT
.eq('user_id', userId)

// ❌ WRONG - Missing user_id filter
.eq('id', id)
```

### 2. Ownership Verification Flow

Every write operation follows this pattern:
1. Extract `userId` from JWT token via `@CurrentUser()` decorator
2. Fetch resource with `.eq('user_id', userId)` filter
3. If not found, throw `NotFoundException` (prevents information leakage)
4. Perform operation

**Example**: `calculators.service.ts:264-265`
```typescript
// Verify calculator exists and user owns it
const existing = await this.findOne(id, userId, accessToken);
```

### 3. Input Validation

**Location**: `dto/calculator.dto.ts`

All DTOs use `class-validator` decorators:
- `@IsString()`, `@IsNumber()`, `@IsBoolean()`, `@IsEnum()`
- `@IsOptional()` for optional fields
- `@Min()`, `@Max()` for numeric bounds
- `@IsArray()`, `@ValidateNested()` for nested objects

### 4. Authentication Guards

**Location**: `calculators.controller.ts:5-6, 20`

```typescript
@UseGuards(ThrottlerGuard)  // Rate limiting
@CurrentUser()               // JWT validation + user extraction
@AccessToken()               // Token extraction for Supabase
```

### 5. Error Handling Strategy

**Principle**: Never leak information about whether a resource exists

```typescript
// ✅ CORRECT - Generic message
throw new NotFoundException(`Calculator not found or access denied: ${id}`);

// ❌ WRONG - Reveals existence
if (!exists) throw new NotFoundException('Calculator not found');
if (!owned) throw new ForbiddenException('Access denied');
```

---

## Rate Limiting Configuration

### Current Configuration

**Location**: `calculators.controller.ts:20`

```typescript
@UseGuards(ThrottlerGuard)
```

### Recommended Settings

**File**: `app.module.ts` or `calculators.module.ts`

```typescript
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,        // 1 second
    limit: 10,        // 10 requests per second
  },
  {
    name: 'medium',
    ttl: 60000,       // 1 minute
    limit: 100,       // 100 requests per minute
  },
  {
    name: 'long',
    ttl: 900000,      // 15 minutes
    limit: 1000,      // 1000 requests per 15 minutes
  },
]),
```

### Per-Endpoint Overrides

```typescript
// Stricter limits for write operations
@Throttle({ short: { limit: 5, ttl: 1000 } })
@Post()
async create() { }

// More lenient for read operations
@Throttle({ short: { limit: 20, ttl: 1000 } })
@Get()
async findAll() { }
```

---

## Security Testing Checklist

### Tenant Isolation Tests

- [ ] **Test 1**: User A cannot read User B's calculators via GET /calculators
- [ ] **Test 2**: User A cannot read User B's calculator via GET /calculators/:id
- [ ] **Test 3**: User A cannot update User B's calculator via PUT /calculators/:id
- [ ] **Test 4**: User A cannot delete User B's calculator via DELETE /calculators/:id
- [ ] **Test 5**: User A cannot add fields to User B's calculator via POST /calculators/:id/fields
- [ ] **Test 6**: User A cannot update User B's fields via PUT /calculators/:id/fields/:fieldId
- [ ] **Test 7**: User A cannot delete User B's fields via DELETE /calculators/:id/fields/:fieldId
- [ ] **Test 8**: User A cannot add formulas to User B's calculator
- [ ] **Test 9**: User A cannot modify User B's formulas
- [ ] **Test 10**: User A cannot execute User B's calculator

### Rate Limiting Tests

- [ ] **Test 11**: Verify 429 response after exceeding rate limit
- [ ] **Test 12**: Verify rate limit resets after TTL expires
- [ ] **Test 13**: Verify different limits for read vs write operations

### Input Validation Tests

- [ ] **Test 14**: Reject invalid enum values for calculatorType
- [ ] **Test 15**: Reject invalid field types
- [ ] **Test 16**: Reject negative display_order values
- [ ] **Test 17**: Reject decimal_places > 10
- [ ] **Test 18**: Reject missing required fields

### Database Constraint Tests

- [ ] **Test 19**: Duplicate calculator names for same user should fail
- [ ] **Test 20**: Duplicate field names within same calculator should fail
- [ ] **Test 21**: Duplicate formula names within same calculator should fail
- [ ] **Test 22**: Calculator creation without user_id should fail
- [ ] **Test 23**: Cascade delete removes all fields and formulas

### RLS Policy Tests

- [ ] **Test 24**: Direct database query as User A cannot access User B's data
- [ ] **Test 25**: Service account can access all data (for admin operations)
- [ ] **Test 26**: Anonymous users cannot access any data

---

## Common Security Pitfalls to Avoid

### ❌ NEVER Do This

1. **Missing user_id filter in queries**
   ```typescript
   // ❌ WRONG
   await client.from('calculators').select('*').eq('id', id);
   ```

2. **Trusting client-provided user_id**
   ```typescript
   // ❌ WRONG
   async create(dto: CreateCalculatorDto, userId: string) {
     // What if client sends different userId in DTO?
     const { userId: clientUserId, ...data } = dto;
   }
   ```

3. **Separate existence check and permission check**
   ```typescript
   // ❌ WRONG - Information leakage
   const calc = await this.findById(id);
   if (!calc) throw new NotFoundException('Not found');
   if (calc.user_id !== userId) throw new ForbiddenException('Access denied');
   ```

4. **Optional user_id filtering**
   ```typescript
   // ❌ WRONG
   let query = client.from('calculators').select('*');
   if (userId) {
     query = query.eq('user_id', userId);
   }
   ```

### ✅ ALWAYS Do This

1. **Filter by user_id in all queries**
   ```typescript
   // ✅ CORRECT
   await client
     .from('calculators')
     .select('*')
     .eq('id', id)
     .eq('user_id', userId)  // Always filter by user_id
     .single();
   ```

2. **Extract user_id from authenticated token only**
   ```typescript
   // ✅ CORRECT
   async create(
     @Body() dto: CreateCalculatorDto,
     @CurrentUser() user: any,  // From JWT token, not client
   ) {
     return this.service.create(dto, user.id, token);
   }
   ```

3. **Single query with combined checks**
   ```typescript
   // ✅ CORRECT - No information leakage
   const calc = await this.findOne(id, userId);  // Returns 404 for both cases
   ```

4. **Mandatory user_id filtering**
   ```typescript
   // ✅ CORRECT
   const query = client
     .from('calculators')
     .select('*')
     .eq('user_id', userId);  // Always present, never conditional
   ```

---

## Audit Log Recommendations

Consider adding audit logging for:
- All write operations (CREATE, UPDATE, DELETE)
- Failed authorization attempts
- Rate limit violations
- Suspicious activity patterns

**Example Table Schema**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  status VARCHAR(20) NOT NULL, -- 'success' | 'failure'
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Review Schedule

- [ ] **Weekly**: Review access patterns in logs
- [ ] **Monthly**: Run security test suite
- [ ] **Quarterly**: Penetration testing
- [ ] **Annually**: Third-party security audit

---

**Last Updated**: 2026-01-06
**Reviewed By**: Development Team
**Next Review**: 2026-02-06

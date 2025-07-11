# RBAC Backend Implementation Plan

## Executive Summary

This document outlines the detailed implementation plan for Role-Based Access Control (RBAC) in the PokeAPIApp backend. The implementation will support the frontend RBAC system already developed and provide secure, scalable access control for Pokemon management operations.

## Current State Analysis

### ✅ **What's Working**
- Basic FastAPI application structure
- Database models and schemas
- Authentication endpoints (login, register, password reset)
- Public Pokemon data endpoints
- Favorites/capture system
- Basic admin endpoints (database status)

### ❌ **What's Missing**
- User role field in database
- Role-based middleware
- Pokemon management endpoints (CREATE, UPDATE, DELETE)
- Admin user management endpoints
- Proper authentication on admin endpoints
- RBAC permission system

### ⚠️ **What Needs Fixing**
- Import errors in some modules
- Missing authentication on sensitive endpoints
- Incomplete requirements.txt (already fixed)
- Database schema updates for roles

## Implementation Phases

### **Phase 4.1: Database Schema Updates**
**Priority**: 🔴 Critical  
**Estimated Time**: 2-3 hours  
**Dependencies**: None

#### Tasks:
1. **Add role field to User model**
   - Add `role` column with default value 'user'
   - Create migration script
   - Update existing users with default role

2. **Create admin user**
   - Script to create default admin account
   - Email: admin@example.com, Password: admin, Role: administrator

3. **Add audit fields**
   - Add `created_at`, `updated_at`, `last_login` timestamps
   - Update models and schemas

#### Implementation Details:
```sql
-- Migration script
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;

-- Create admin user
INSERT INTO users (name, email, password_hash, role, is_active) 
VALUES ('Administrator', 'admin@example.com', '$hashed_password', 'administrator', 1);
```

### **Phase 4.2: RBAC Middleware Implementation**
**Priority**: 🔴 Critical  
**Estimated Time**: 4-5 hours  
**Dependencies**: Phase 4.1

#### Tasks:
1. **Create role enum**
   - Define UserRole enum (VISITOR, USER, ADMINISTRATOR)
   - Update schemas to include role

2. **Implement RBAC middleware**
   - Create `rbac_middleware.py`
   - Role verification functions
   - Permission checking decorators

3. **Update authentication service**
   - Include role in JWT tokens
   - Role-based token validation
   - Current user with role retrieval

#### Implementation Details:
```python
# app/core/rbac.py
from enum import Enum
from functools import wraps
from fastapi import HTTPException, status

class UserRole(str, Enum):
    VISITOR = "visitor"
    USER = "user"
    ADMINISTRATOR = "administrator"

class Permission(str, Enum):
    # Public permissions
    VIEW_POKEMON_LIST = "view_pokemon_list"
    VIEW_POKEMON_DETAILS = "view_pokemon_details"
    
    # User permissions
    CAPTURE_POKEMON = "capture_pokemon"
    MANAGE_PERSONAL_COLLECTION = "manage_personal_collection"
    
    # Admin permissions
    ADD_POKEMON = "add_pokemon"
    EDIT_POKEMON = "edit_pokemon"
    DELETE_POKEMON = "delete_pokemon"
    MANAGE_USERS = "manage_users"

def require_role(required_role: UserRole):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Implementation here
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Implementation here
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

### **Phase 4.3: Pokemon Management Endpoints**
**Priority**: 🔴 Critical  
**Estimated Time**: 6-8 hours  
**Dependencies**: Phase 4.2

#### Tasks:
1. **Create Pokemon management schemas**
   - PokemonCreate, PokemonUpdate schemas
   - Validation for required fields
   - Type and stat validation

2. **Implement Pokemon CRUD endpoints**
   - POST /api/v1/pokemon (Create)
   - PUT /api/v1/pokemon/{id} (Update)
   - DELETE /api/v1/pokemon/{id} (Delete)

3. **Add authentication and authorization**
   - Require admin role for all management operations
   - Proper error handling and responses

#### Implementation Details:
```python
# app/routes/pokemon_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.rbac import require_role, UserRole
from app.schemas.pokemon_schemas import PokemonCreate, PokemonUpdate

router = APIRouter(prefix="/pokemon", tags=["pokemon-management"])

@router.post("/", response_model=PokemonResponse)
@require_role(UserRole.ADMINISTRATOR)
async def create_pokemon(
    pokemon_data: PokemonCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new Pokemon (Admin only)."""
    # Implementation here
    pass

@router.put("/{pokemon_id}", response_model=PokemonResponse)
@require_role(UserRole.ADMINISTRATOR)
async def update_pokemon(
    pokemon_id: int,
    pokemon_data: PokemonUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing Pokemon (Admin only)."""
    # Implementation here
    pass

@router.delete("/{pokemon_id}")
@require_role(UserRole.ADMINISTRATOR)
async def delete_pokemon(
    pokemon_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a Pokemon (Admin only)."""
    # Implementation here
    pass
```

### **Phase 4.4: User Management Endpoints**
**Priority**: 🟡 Medium  
**Estimated Time**: 4-5 hours  
**Dependencies**: Phase 4.2

#### Tasks:
1. **Create user management schemas**
   - UserManagement, RoleUpdate schemas
   - Admin user creation/update schemas

2. **Implement user management endpoints**
   - GET /api/v1/admin/users (List users)
   - PUT /api/v1/admin/users/{id}/role (Update user role)
   - DELETE /api/v1/admin/users/{id} (Delete user)

3. **Add proper authorization**
   - Require admin role
   - Prevent admin from deleting themselves
   - Audit logging for user changes

### **Phase 4.5: Security Hardening**
**Priority**: 🟡 Medium  
**Estimated Time**: 3-4 hours  
**Dependencies**: Phase 4.3

#### Tasks:
1. **Add authentication to existing admin endpoints**
   - Secure /admin/database-status
   - Add rate limiting
   - Add request logging

2. **Implement audit logging**
   - Log all admin operations
   - User role changes
   - Pokemon management operations

3. **Add input validation and sanitization**
   - Validate all Pokemon data
   - Sanitize user inputs
   - Add request size limits

### **Phase 4.6: Testing and Validation**
**Priority**: 🟡 Medium  
**Estimated Time**: 4-5 hours  
**Dependencies**: Phase 4.5

#### Tasks:
1. **Create comprehensive tests**
   - RBAC middleware tests
   - Pokemon management endpoint tests
   - User management endpoint tests
   - Security tests

2. **Integration testing**
   - Test with frontend RBAC system
   - End-to-end admin workflows
   - Error handling scenarios

3. **Performance testing**
   - Load testing for admin endpoints
   - Database performance with roles
   - Memory usage optimization

## Implementation Timeline

### **Week 1: Core RBAC Infrastructure**
- **Day 1-2**: Phase 4.1 (Database Schema Updates)
- **Day 3-5**: Phase 4.2 (RBAC Middleware Implementation)

### **Week 2: Pokemon Management**
- **Day 1-3**: Phase 4.3 (Pokemon Management Endpoints)
- **Day 4-5**: Phase 4.4 (User Management Endpoints)

### **Week 3: Security and Testing**
- **Day 1-2**: Phase 4.5 (Security Hardening)
- **Day 3-5**: Phase 4.6 (Testing and Validation)

## Risk Assessment

### **High Risk**
- **Database migration failures**: Backup strategy required
- **Authentication breaking existing functionality**: Gradual rollout needed
- **Performance impact**: Monitor database queries

### **Medium Risk**
- **Frontend-backend integration issues**: Continuous testing required
- **Security vulnerabilities**: Security review needed
- **User experience degradation**: UX testing required

### **Low Risk**
- **Minor bugs in admin features**: Can be fixed post-deployment
- **Performance optimization**: Can be improved iteratively

## Success Criteria

### **Functional Requirements**
- ✅ Admin users can create, edit, and delete Pokemon
- ✅ Regular users cannot access admin functions
- ✅ All admin operations require authentication
- ✅ Role-based access control works correctly
- ✅ Frontend RBAC system integrates seamlessly

### **Non-Functional Requirements**
- ✅ Response times < 500ms for admin operations
- ✅ 99.9% uptime for admin endpoints
- ✅ Secure authentication and authorization
- ✅ Comprehensive audit logging
- ✅ >90% test coverage for new code

### **Security Requirements**
- ✅ No unauthorized access to admin functions
- ✅ All sensitive operations logged
- ✅ Input validation prevents injection attacks
- ✅ Rate limiting prevents abuse
- ✅ Secure password handling

## Rollback Plan

### **If Critical Issues Occur**
1. **Immediate**: Disable new admin endpoints
2. **Short-term**: Revert database schema changes
3. **Long-term**: Fix issues and re-deploy

### **Rollback Triggers**
- Authentication system failures
- Database corruption
- Security vulnerabilities discovered
- Performance degradation > 50%

## Monitoring and Maintenance

### **Key Metrics to Monitor**
- Admin endpoint response times
- Authentication success/failure rates
- Role-based access violations
- Database query performance
- Error rates for new endpoints

### **Maintenance Tasks**
- Regular security audits
- Performance optimization
- User role cleanup
- Audit log rotation
- Database maintenance

## Next Steps

1. **Get approval** for implementation plan
2. **Set up development environment** with proper testing
3. **Begin Phase 4.1** (Database Schema Updates)
4. **Continuous integration** with frontend team
5. **Regular progress reviews** and adjustments

This plan provides a comprehensive roadmap for implementing RBAC in the backend while maintaining system stability and security.

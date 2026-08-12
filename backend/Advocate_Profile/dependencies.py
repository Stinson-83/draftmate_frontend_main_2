"""
JWT dependency helpers.
Fixes:
- Uses same SECRET_KEY source as auth.py (no duplicate env read)
- Admin role check is ENFORCED (not commented out)
- Returns 401 with clear messages on token issues
"""

import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any

security = HTTPBearer()

# Import the validated secret from auth so there's a single source of truth.
# If JWT_SECRET is missing in production, auth.py raises at import time.
from auth import SECRET_KEY, ALGORITHM


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please refresh or login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing subject.",
        )

    # Reject refresh tokens being used as access tokens
    if payload.get("type") == "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cannot be used for API access.",
        )

    return payload


def get_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Enforces role == 'admin'.
    Admin accounts must be created directly in the DB or via a separate admin provisioning script.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user

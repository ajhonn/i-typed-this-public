from fastapi import HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader

from app.services.settings import get_settings

api_key_scheme = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(api_key: str = Security(api_key_scheme)) -> str:
    configured_key = get_settings().api_key
    if not api_key or api_key != configured_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )
    return api_key

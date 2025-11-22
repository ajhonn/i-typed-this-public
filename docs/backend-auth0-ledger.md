# Auth0 wiring for the hash ledger

Goal: secure `/api/v1/hashes` and `/api/v1/hashes/verify` with short-lived JWTs issued by Auth0 so the frontend never ships long-lived secrets.

## Auth0 setup
- In Auth0, create an **API**:
  - Identifier (audience): `https://i-typed-this-ledger`
  - Signing algorithm: RS256 (keep the JWKS endpoint public).
  - Define permissions: `ledger:write`, `ledger:verify`.
- Create a **Single Page Application**:
  - Callback URL (dev): `http://localhost:5173`
  - Allowed Logout URL (dev): `http://localhost:5173`
  - Allowed Web Origins: `http://localhost:5173`
  - Assign it permissions for the ledger API (write/verify).

### Env vars (backend)
Set these in `backend/.env` (or host secrets):
```
I_TYPED_THIS_AUTH0_DOMAIN=your-tenant.auth0.com
I_TYPED_THIS_AUTH0_AUDIENCE=https://i-typed-this-ledger
I_TYPED_THIS_AUTH0_ISSUER=https://your-tenant.auth0.com/
```

### Env vars (frontend)
Set these in `frontend/.env`:
```
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-spa-client-id
VITE_AUTH0_AUDIENCE=https://i-typed-this-ledger
VITE_AUTH0_SCOPE=ledger:write ledger:verify
```

## FastAPI verification sketch
Use `python-jose` or `authlib` to validate RS256 tokens from the `Authorization: Bearer <jwt>` header. Check:
- `aud` matches `AUTH0_AUDIENCE`
- `iss` matches `AUTH0_ISSUER`
- signature via JWKS
- `exp`/`nbf` validity
- scopes include `ledger:write` for POST `/hashes` and `ledger:verify` for `/verify`.

Example dependency outline:
```py
# pseudo-code sketch
from fastapi import Depends, HTTPException, status
from jose import jwt
import httpx

def get_jwks():
    # cache this in-memory with TTL in real code
    resp = httpx.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
    return resp.json()["keys"]

def verify_token(auth_header: str = Depends(bearer_scheme)):
    token = auth_header.credentials
    unverified = jwt.get_unverified_header(token)
    key = select_key(get_jwks(), unverified["kid"])
    claims = jwt.decode(token, key, audience=AUTH0_AUDIENCE, issuer=AUTH0_ISSUER, options={"verify_aud": True})
    return claims  # contains scope/permissions

def require_scope(scope: str):
    def checker(claims = Depends(verify_token)):
        scopes = claims.get("scope", "").split()
        if scope not in scopes:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="insufficient_scope")
        return claims
    return checker

@router.post("/hashes", dependencies=[Depends(require_scope("ledger:write"))])
```

Ensure CORS allows only your SPA origins and `Authorization` header.

## Frontend token flow (Auth0 SPA SDK)
- Install `@auth0/auth0-spa-js`.
- Initialize once:
  ```ts
  const auth0 = await createAuth0Client({
    domain: import.meta.env.VITE_AUTH0_DOMAIN!,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID!,
    authorizationParams: {
      audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      scope: import.meta.env.VITE_AUTH0_SCOPE,
      redirect_uri: window.location.origin,
    },
    cacheLocation: 'memory', // or 'localstorage' if you need refresh after reloads
    useRefreshTokens: true,
  });
  ```
- Before calling the ledger, fetch an access token:
  ```ts
  const token = await auth0.getTokenSilently();
  const res = await fetch(`${LEDGER_URL}/api/v1/hashes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  ```
- Prompt login via `auth0.loginWithRedirect()` or `loginWithPopup()` when `getTokenSilently` fails (e.g., expired session).

## Migration plan
1. Add Auth0 config to both apps; keep API-key mode temporarily behind a feature flag.
2. Implement JWT validation dependency and scope checks in FastAPI; add tests for valid/expired/wrong-aud/missing-scope.
3. Add the Auth0 SPA client to the frontend transfer flow to attach tokens; surface a clear message when auth is missing and ledger calls are skipped.
4. Tighten CORS and rate limits; enable structured logging for auth failures.
5. Remove API-key fallback after clients are on Auth0.

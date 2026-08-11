"""Smoke tests for shared JWT security helpers — used by every service."""
from shared.security import Role, create_access_token, decode_token


def test_access_token_round_trip():
    token = create_access_token(user_id="11111111-1111-1111-1111-111111111111", email="scientist@novagen.ai", role=Role.SCIENTIST)
    payload = decode_token(token)
    assert payload["sub"] == "11111111-1111-1111-1111-111111111111"
    assert payload["email"] == "scientist@novagen.ai"
    assert payload["role"] == "scientist"
    assert payload["type"] == "access"


def test_tampered_token_fails_to_decode():
    import jwt
    import pytest

    token = create_access_token(user_id="x", email="a@b.com", role=Role.RESEARCHER)
    tampered = token[:-2] + ("aa" if not token.endswith("aa") else "bb")
    with pytest.raises(jwt.InvalidTokenError):
        decode_token(tampered)

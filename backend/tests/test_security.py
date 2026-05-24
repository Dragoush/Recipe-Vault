from datetime import UTC, datetime, timedelta

import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_password_hashing_round_trip_verifies_correct_password_only():
    stored_hash = hash_password("correct horse battery", iterations=1000)

    assert stored_hash.startswith("pbkdf2_sha256$")
    assert verify_password("correct horse battery", stored_hash) is True
    assert verify_password("wrong password", stored_hash) is False


def test_access_token_round_trip_preserves_core_claims():
    issued_at = datetime(2026, 5, 24, 12, 0, tzinfo=UTC)
    expires_at = issued_at + timedelta(minutes=15)
    token = create_access_token(
        secret_key="test-secret",
        subject="user-123",
        role="USER",
        session_id="session-123",
        expires_at=expires_at,
        issued_at=issued_at,
    )

    payload = decode_access_token(
        token,
        secret_key="test-secret",
        now=issued_at + timedelta(minutes=1),
    )

    assert payload["sub"] == "user-123"
    assert payload["role"] == "USER"
    assert payload["session_id"] == "session-123"
    assert payload["type"] == "access"


def test_access_token_rejects_expired_tokens():
    issued_at = datetime(2026, 5, 24, 12, 0, tzinfo=UTC)
    token = create_access_token(
        secret_key="test-secret",
        subject="user-123",
        role="USER",
        session_id="session-123",
        expires_at=issued_at + timedelta(seconds=30),
        issued_at=issued_at,
    )

    with pytest.raises(ValueError, match="expired"):
        decode_access_token(
            token,
            secret_key="test-secret",
            now=issued_at + timedelta(minutes=5),
        )

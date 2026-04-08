# server/utils/session_guard.py

from firebase_admin import firestore

db = firestore.client()


def verify_session(user_id: str, session_id: str) -> bool:
    """
    Check if the incoming session_id matches the one stored
    in Firestore for this user.

    Returns True  → session is valid, allow the request.
    Returns False → another device has logged in, reject the request.

    IMPORTANT:
    - Returns True on Firestore errors (fail open) so users are
      not falsely kicked out due to network lag or Firestore downtime.
    - Returns False only when session_id is missing or when there is
      a confirmed mismatch with Firestore.
    """

    # ── Basic guard: both values must be present ───────────────────
    if not user_id or not session_id:
        return False

    try:
        doc = db.collection("users").document(user_id).get()

        # ── User doc doesn't exist yet (edge case: first login race) ─
        if not doc.exists:
            return True  # fail open — don't punish new users

        data = doc.to_dict()
        stored_session_id = data.get("activeSessionId")

        # ── No session stored yet — fail open ─────────────────────
        # This can happen if registerSession() hasn't completed yet
        if not stored_session_id:
            return True

        # ── Core check: does this device's session match Firestore? ─
        return stored_session_id == session_id

    except Exception as e:
        # ── Fail OPEN on Firestore errors ──────────────────────────
        # If Firestore is slow or down, we don't want to falsely kick
        # out a legitimate user. Log the error and allow the request.
        print(f"⚠️ Session guard error for user {user_id[:8]}...: {e}")
        return True
"""
Failure Classifier Module for RecoverAI.
Categorizes Razorpay payment failure reason strings and error codes into standard recovery buckets.
"""

# Categorization Buckets
BUCKET_TEMPORARY_OUTAGE = "TEMPORARY_BANK_OUTAGE"
BUCKET_CUSTOMER_ACTION = "CUSTOMER_ACTION_REQUIRED"
BUCKET_PERMANENT_FAILURE = "HARD_CARD_FAILURE"
BUCKET_UNKNOWN = "UNKNOWN_FAILURE"

FAILURE_MAP = {
    # Soft / Temporary failures (Bank / Network timeouts)
    "BAD_REQUEST_PAYMENT_TIMED_OUT": (BUCKET_TEMPORARY_OUTAGE, "Bank server response timed out during gateway processing.", True),
    "GATEWAY_ERROR": (BUCKET_TEMPORARY_OUTAGE, "Temporary payment gateway communication failure.", True),
    "ISSUER_DOWN": (BUCKET_TEMPORARY_OUTAGE, "Issuing bank servers are currently undergoing technical difficulties.", True),
    "NETWORK_ERROR": (BUCKET_TEMPORARY_OUTAGE, "Network latency error between gateway and card issuer.", True),
    "BANK_TECHNICAL_GLITCH": (BUCKET_TEMPORARY_OUTAGE, "Inter-bank settlement network timeout.", True),

    # Customer Action Required (Soft/Medium failures - recoverable via Payment Links / Reminders)
    "INSUFFICIENT_FUNDS": (BUCKET_CUSTOMER_ACTION, "Insufficient balance in customer account/card.", True),
    "LOW_BALANCE": (BUCKET_CUSTOMER_ACTION, "Account balance below transaction threshold.", True),
    "AUTHENTICATION_FAILED": (BUCKET_CUSTOMER_ACTION, "3D-Secure 2FA / OTP verification timed out or was incorrectly entered.", True),
    "OTP_EXPIRED": (BUCKET_CUSTOMER_ACTION, "OTP expired before customer entered it.", True),
    "3DS_FAILED": (BUCKET_CUSTOMER_ACTION, "3D Secure authentication dropped by user.", True),
    "PAYMENT_CANCELLED_BY_USER": (BUCKET_CUSTOMER_ACTION, "Customer closed payment drawer before completion.", True),
    "LIMIT_EXCEEDED": (BUCKET_CUSTOMER_ACTION, "Daily or single transaction limit exceeded for this payment instrument.", True),

    # Hard / Permanent failures (Unrecoverable without new card/payment method)
    "CARD_EXPIRED": (BUCKET_PERMANENT_FAILURE, "Credit/debit card is expired.", False),
    "CARD_BLOCKED": (BUCKET_PERMANENT_FAILURE, "Card blocked by issuing bank due to security flag.", False),
    "INVALID_CARD_NUMBER": (BUCKET_PERMANENT_FAILURE, "Card number digits invalid or unrecognized.", False),
    "ACCOUNT_CLOSED": (BUCKET_PERMANENT_FAILURE, "Bank account linked to VPA/card is closed.", False),
    "FRAUD_SUSPECTED": (BUCKET_PERMANENT_FAILURE, "Risk engine flagged transaction as suspicious.", False)
}


def classify_failure(failure_code: str = None, failure_reason: str = None) -> dict:
    """
    Classifies a payment failure given the Razorpay code and optional reason string.
    Returns bucket, description, and recoverability boolean.
    """
    code_key = (failure_code or "").upper().strip()
    reason_key = (failure_reason or "").upper().strip()

    # Search exact code match first
    if code_key in FAILURE_MAP:
        bucket, desc, recoverable = FAILURE_MAP[code_key]
        return {
            "bucket": bucket,
            "description": desc,
            "is_recoverable": recoverable,
            "confidence": 0.95
        }

    # Search pattern in reason string
    for key, (bucket, desc, recoverable) in FAILURE_MAP.items():
        if key in reason_key or key in code_key:
            return {
                "bucket": bucket,
                "description": desc,
                "is_recoverable": recoverable,
                "confidence": 0.85
            }

    # Fuzzy fallbacks based on keyword matches
    if any(k in reason_key for k in ["TIME", "TIMEOUT", "GATEWAY", "DOWN", "SERVER"]):
        return {
            "bucket": BUCKET_TEMPORARY_OUTAGE,
            "description": "Suspected temporary gateway or server connectivity issue.",
            "is_recoverable": True,
            "confidence": 0.70
        }

    if any(k in reason_key for k in ["OTP", "AUTH", "CANCEL", "BALANCE", "FUNDS", "LIMIT"]):
        return {
            "bucket": BUCKET_CUSTOMER_ACTION,
            "description": "Customer input or authorization required to complete payment.",
            "is_recoverable": True,
            "confidence": 0.70
        }

    if any(k in reason_key for k in ["BLOCK", "EXPIRE", "INVALID", "CLOSED", "FRAUD"]):
        return {
            "bucket": BUCKET_PERMANENT_FAILURE,
            "description": "Hard failure on payment instrument. Auto-retry not advisable.",
            "is_recoverable": False,
            "confidence": 0.80
        }

    # Unknown bucket fallback
    return {
        "bucket": BUCKET_UNKNOWN,
        "description": "Unclassified failure code. Engine will analyze historical probability.",
        "is_recoverable": True,
        "confidence": 0.50
    }

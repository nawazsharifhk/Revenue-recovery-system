import json
import time
import hmac
import hashlib
from typing import Dict, Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.database import get_db, ApiConfig
from app.routers.webhooks import razorpay_webhook_listener
from fastapi import Request

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

PRESET_SCENARIOS = {
    "TEMPORARY_TIMEOUT": {
        "event": "payment.failed",
        "title": "Bank Timeout (Soft Failure)",
        "code": "BAD_REQUEST_PAYMENT_TIMED_OUT",
        "description": "Bank server response timed out during gateway processing.",
        "amount": 185000,  # INR 1,850.00
        "method": "upi",
        "email": "priya.sharma@example.com"
    },
    "INSUFFICIENT_FUNDS": {
        "event": "payment.failed",
        "title": "Insufficient Funds (Customer Action Required)",
        "code": "INSUFFICIENT_FUNDS",
        "description": "Insufficient balance in customer linked account.",
        "amount": 499900,  # INR 4,999.00
        "method": "card",
        "email": "vikram.singh@example.com"
    },
    "CARD_BLOCKED": {
        "event": "payment.failed",
        "title": "Card Blocked (Hard Permanent Failure)",
        "code": "CARD_BLOCKED",
        "description": "Card blocked by issuing bank due to security flag.",
        "amount": 125000,  # INR 1,250.00
        "method": "card",
        "email": "neha.gupta@example.com"
    },
    "SUCCESSFUL_CAPTURE": {
        "event": "payment.captured",
        "title": "Payment Captured (Successful Recovery)",
        "code": None,
        "description": "Payment captured successfully after user clicked Payment Link.",
        "amount": 499900,  # INR 4,999.00
        "method": "upi",
        "email": "vikram.singh@example.com"
    }
}


@router.get("/presets")
def get_webhook_presets():
    return PRESET_SCENARIOS


@router.post("/fire")
async def fire_simulated_webhook(
    scenario_key: str = Body(None),
    custom_payload: Dict[str, Any] = Body(None),
    merchant_id: str = Body(None),
    db: Session = Depends(get_db)
):
    """
    Generates a valid Razorpay webhook payload, computes HMAC signature, and processes it through the pipeline.
    """
    m_id = merchant_id or "acc_recoverai_demo"
    config = db.query(ApiConfig).filter(ApiConfig.merchant_id == m_id).first()
    secret = config.webhook_secret if config else "whsec_recoverai_buildathon_secret"

    if custom_payload:
        payload = custom_payload
        if "account_id" not in payload:
            payload["account_id"] = m_id
    else:
        scen = PRESET_SCENARIOS.get(scenario_key or "TEMPORARY_TIMEOUT", PRESET_SCENARIOS["TEMPORARY_TIMEOUT"])
        ts = int(time.time())
        pay_id = f"pay_sim_{m_id[:5]}_{ts}"
        ord_id = f"order_sim_{m_id[:5]}_{ts}"

        payload = {
            "entity": "event",
            "account_id": m_id,
            "event": scen["event"],
            "contains": ["payment"],
            "created_at": ts,
            "payload": {
                "payment": {
                    "entity": {
                        "id": pay_id,
                        "entity": "payment",
                        "amount": scen["amount"],
                        "currency": "INR",
                        "status": "failed" if scen["event"] == "payment.failed" else "captured",
                        "order_id": ord_id,
                        "method": scen["method"],
                        "email": scen["email"],
                        "contact": "+919876543210",
                        "error_code": scen["code"],
                        "error_description": scen["description"]
                    }
                }
            }
        }

    raw_body = json.dumps(payload).encode("utf-8")

    # Compute HMAC SHA256 Signature
    signature = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    # Create mock Request object to invoke webhook listener
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/webhooks/razorpay",
        "headers": [
            (b"x-razorpay-signature", signature.encode("utf-8")),
            (b"content-type", b"application/json")
        ]
    }

    async def receive():
        return {"type": "http.request", "body": raw_body}

    req = Request(scope, receive)

    # Dispatch to Webhook Handler
    result = await razorpay_webhook_listener(request=req, x_razorpay_signature=signature, db=db)

    waterfall = [
        {"step": "1. Webhook Received", "status": "COMPLETED", "detail": f"Event: {payload.get('event')}"},
        {"step": "2. HMAC Signature Verification", "status": "VERIFIED", "detail": f"Signature: {signature[:12]}... (Secret: {secret[:6]}...)"},
        {"step": "3. Failure Classifier", "status": "CLASSIFIED", "detail": f"Bucket: {result.get('failure_bucket', 'N/A')}"},
        {"step": "4. ML Recovery Model Prediction", "status": "EVALUATED", "detail": f"Probability: {result.get('ml_probability', 0.0)*100:.1f}%"},
        {"step": "5. Decision & Action Execution", "status": "EXECUTED", "detail": f"Action: {result.get('action_type', 'RECONCILED')} | Link: {result.get('payment_link_url', 'N/A')}"}
    ]

    return {
        "status": "SUCCESS",
        "signature": signature,
        "payload": payload,
        "result": result,
        "execution_waterfall": waterfall
    }

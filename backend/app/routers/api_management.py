import secrets
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, ApiConfig, ApiLog, AuditLog
from app.razorpay_client import rzp_client

router = APIRouter(prefix="/api/settings", tags=["api_management"])


from typing import Optional

@router.get("/keys")
def get_api_credentials(merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    """
    Returns Razorpay API configuration and Webhook URL information for merchant.
    """
    m_id = merchant_id or "acc_recoverai_demo"
    config = db.query(ApiConfig).filter(ApiConfig.merchant_id == m_id).first()
    if not config:
        # Fallback default seeds per merchant
        mode = "LIVE" if m_id in ["acc_fashion_live", "acc_sub_prod"] else "TEST"
        key_id = f"rzp_{mode.lower()}_{m_id.replace('acc_', '')}"
        config = ApiConfig(
            merchant_id=m_id,
            key_id=key_id,
            key_secret=f"sk_{mode.lower()}_secret_{m_id}",
            webhook_secret=f"whsec_{m_id}_secret_key",
            mode=mode
        )
        db.add(config)
        db.commit()
        db.refresh(config)

    sec = config.key_secret or ""
    masked_secret = sec[:4] + "*" * max(0, len(sec) - 8) + sec[-4:] if len(sec) >= 8 else "********"

    wh_sec = config.webhook_secret or ""
    masked_wh_secret = wh_sec[:4] + "*" * max(0, len(wh_sec) - 8) + wh_sec[-4:] if len(wh_sec) >= 8 else "********"

    webhook_url = "http://localhost:8000/api/webhooks/razorpay"

    return {
        "merchant_id": m_id,
        "key_id": config.key_id,
        "key_secret_masked": masked_secret,
        "webhook_secret_masked": masked_wh_secret,
        "mode": config.mode,
        "is_active": config.is_active,
        "webhook_url": webhook_url,
        "raw_key_secret": config.key_secret,
        "raw_webhook_secret": config.webhook_secret
    }


@router.put("/keys")
def update_api_credentials(payload: dict = Body(...), merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    """
    Updates Razorpay API credentials and webhook secret for merchant.
    """
    m_id = payload.get("merchant_id") or merchant_id or "acc_recoverai_demo"
    config = db.query(ApiConfig).filter(ApiConfig.merchant_id == m_id).first()
    if not config:
        config = ApiConfig(merchant_id=m_id)
        db.add(config)

    config.key_id = payload.get("key_id", config.key_id).strip()
    config.key_secret = payload.get("key_secret", config.key_secret).strip()
    config.webhook_secret = payload.get("webhook_secret", config.webhook_secret).strip()
    config.mode = payload.get("mode", config.mode).upper()
    db.commit()

    rzp_client.update_credentials(config.key_id, config.key_secret, config.webhook_secret, config.mode)

    audit = AuditLog(
        merchant_id=m_id,
        event_type="API_KEYS_UPDATED",
        entity_id=config.key_id,
        actor="Dashboard Admin",
        details=f"Updated Razorpay API Key ID ({config.key_id}) and Webhook Secret for {m_id} in {config.mode} mode."
    )
    db.add(audit)
    db.commit()

    return {
        "merchant_id": m_id,
        "status": "SUCCESS",
        "message": f"Razorpay API configuration updated successfully for {m_id}.",
        "mode": config.mode
    }


@router.post("/test-connection")
def test_razorpay_connection(payload: dict = Body({}), merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    """
    Tests live connection and credentials against Razorpay API servers for merchant.
    """
    m_id = payload.get("merchant_id") or merchant_id or "acc_recoverai_demo"
    res = rzp_client.test_connection()
    res["merchant_id"] = m_id

    api_log = ApiLog(
        merchant_id=m_id,
        endpoint="https://api.razorpay.com/v1/payments",
        method="GET",
        status_code=200 if "CONNECTED" in res["status"] else 401,
        request_summary=f"Key ID: {res['key_id']} (Merchant: {m_id})",
        response_summary=res["message"],
        latency_ms=res["latency_ms"]
    )
    db.add(api_log)
    db.commit()

    return res


@router.post("/rotate-webhook-secret")
def rotate_webhook_secret(payload: dict = Body({}), merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    """
    Generates a new cryptographically strong Webhook Secret for merchant.
    """
    m_id = payload.get("merchant_id") or merchant_id or "acc_recoverai_demo"
    config = db.query(ApiConfig).filter(ApiConfig.merchant_id == m_id).first()
    if not config:
        config = ApiConfig(merchant_id=m_id)
        db.add(config)

    new_secret = "whsec_" + secrets.token_hex(16)
    config.webhook_secret = new_secret
    db.commit()

    rzp_client.update_credentials(config.key_id, config.key_secret, config.webhook_secret, config.mode)

    audit = AuditLog(
        merchant_id=m_id,
        event_type="WEBHOOK_SECRET_ROTATED",
        entity_id=config.key_id,
        actor="Dashboard Admin",
        details=f"Generated new HMAC SHA-256 Webhook Secret for {m_id}."
    )
    db.add(audit)
    db.commit()

    return {
        "merchant_id": m_id,
        "status": "SUCCESS",
        "message": "Webhook secret rotated successfully.",
        "new_webhook_secret": new_secret
    }


@router.get("/logs")
def get_api_execution_logs(limit: int = 30, merchant_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns outgoing and incoming API call execution logs filtered by merchant_id.
    """
    query = db.query(ApiLog)
    if merchant_id:
        query = query.filter(ApiLog.merchant_id == merchant_id)
    
    logs = query.order_by(ApiLog.timestamp.desc()).limit(limit).all()
    result = []
    for l in logs:
        result.append({
            "id": l.id,
            "merchant_id": l.merchant_id,
            "endpoint": l.endpoint,
            "method": l.method,
            "status_code": l.status_code,
            "request_summary": l.request_summary,
            "response_summary": l.response_summary,
            "latency_ms": l.latency_ms,
            "timestamp": l.timestamp.isoformat()
        })
    return {"total": len(result), "logs": result}

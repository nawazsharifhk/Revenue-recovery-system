"""
Decision Engine Module for RecoverAI.
Applies business rules, guardrails, and ML probability scores to determine the optimal recovery action.
"""

from typing import Dict, Any
from app.classifier import classify_failure, BUCKET_PERMANENT_FAILURE, BUCKET_TEMPORARY_OUTAGE, BUCKET_CUSTOMER_ACTION
from app.ml_engine import ml_engine


def decide_recovery_action(
    payment_data: Dict[str, Any],
    rule_config: Dict[str, Any] = None,
    previous_attempt_count: int = 0
) -> Dict[str, Any]:
    """
    Evaluates a payment failure and returns a bounded action:
    - AUTO_RETRY: Backend payment API auto-retry.
    - PAYMENT_LINK: Razorpay Payment Link generated & dispatched.
    - CUSTOMER_MESSAGE: WhatsApp / SMS reminder nudge.
    - DO_NOTHING: Permanent hard failure or max retries exceeded.
    """
    if rule_config is None:
        rule_config = {
            "min_retry_prob": 0.75,
            "min_link_prob": 0.40,
            "max_retries_per_order": 2,
            "auto_link_high_value": True,
            "high_value_threshold": 2000.0
        }

    failure_code = payment_data.get("failure_code")
    failure_reason = payment_data.get("failure_reason")
    amount = float(payment_data.get("amount", 0.0))

    # Step 1: Classify Failure
    classification = classify_failure(failure_code, failure_reason)
    bucket = classification["bucket"]
    is_recoverable = classification["is_recoverable"]

    # Step 2: Check Guardrails (Max Retry Limit)
    max_retries = rule_config.get("max_retries_per_order", 2)
    if previous_attempt_count >= max_retries:
        return {
            "action_type": "DO_NOTHING",
            "ml_probability": 0.0,
            "classification": classification,
            "explanation": f"Max recovery attempt limit ({max_retries}) reached for this transaction. Aborting to protect customer experience.",
            "status": "DO_NOTHING"
        }

    # Hard Failure Guardrail
    if not is_recoverable or bucket == BUCKET_PERMANENT_FAILURE:
        return {
            "action_type": "DO_NOTHING",
            "ml_probability": 0.05,
            "classification": classification,
            "explanation": f"Permanent instrument failure ({classification['description']}). Automated retries prohibited.",
            "status": "DO_NOTHING"
        }

    # Step 3: Run ML Probability Prediction
    ml_features = {
        "amount": amount,
        "payment_method": payment_data.get("payment_method", "card"),
        "failure_bucket": bucket,
        "customer_segment": payment_data.get("customer_segment", "Standard"),
        "lifetime_value": float(payment_data.get("lifetime_value", 1500.0)),
        "hour_of_day": int(payment_data.get("hour_of_day", 14)),
        "past_successes": int(payment_data.get("past_successes", 2)),
        "past_failures": int(payment_data.get("past_failures", 0))
    }

    prob = ml_engine.predict_probability(ml_features)

    # Step 4: Decision Rules Matrix
    min_retry_prob = float(rule_config.get("min_retry_prob", 0.75))
    min_link_prob = float(rule_config.get("min_link_prob", 0.40))
    high_val_thresh = float(rule_config.get("high_value_threshold", 2000.0))

    if bucket == BUCKET_TEMPORARY_OUTAGE and prob >= min_retry_prob:
        action_type = "AUTO_RETRY"
        explanation = f"Temporary bank outage detected with high recovery probability ({prob*100:.1f}% >= {min_retry_prob*100:.0f}%). Scheduled backend API retry."
    elif prob >= min_link_prob or (amount >= high_val_thresh and rule_config.get("auto_link_high_value", True)):
        action_type = "PAYMENT_LINK"
        explanation = f"Moderate recovery probability ({prob*100:.1f}%) and high cart value (INR {amount:,.2f}). Generating Razorpay Payment Link with multi-channel delivery."
    elif prob >= 0.20:
        action_type = "CUSTOMER_MESSAGE"
        explanation = f"Low-to-moderate recovery probability ({prob*100:.1f}%). Triggering gentle customer SMS/WhatsApp payment reminder."
    else:
        action_type = "DO_NOTHING"
        explanation = f"Low recovery probability ({prob*100:.1f}% < 20%). No recovery action recommended."

    return {
        "action_type": action_type,
        "ml_probability": prob,
        "classification": classification,
        "explanation": explanation,
        "status": "PENDING"
    }

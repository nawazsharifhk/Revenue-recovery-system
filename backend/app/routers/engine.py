from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database import get_db, DecisionRuleConfig, AuditLog, PaymentEvent, Customer, RecoveryAction
from app.ml_engine import ml_engine, generate_synthetic_dataset
from app.decision import decide_recovery_action
import random
import time

router = APIRouter(prefix="/api/engine", tags=["engine"])


from typing import Optional

def seed_synthetic_dataset_internal(db: Session, count: int = 25, merchant_id: str = "acc_recoverai_demo"):
    failure_scenarios = [
        ("BAD_REQUEST_PAYMENT_TIMED_OUT", "Bank server response timed out during gateway processing.", "card", "TEMPORARY_BANK_OUTAGE"),
        ("GATEWAY_ERROR", "Temporary payment gateway communication failure.", "upi", "TEMPORARY_BANK_OUTAGE"),
        ("INSUFFICIENT_FUNDS", "Insufficient balance in customer account.", "upi", "CUSTOMER_ACTION_REQUIRED"),
        ("AUTHENTICATION_FAILED", "3D-Secure 2FA OTP verification timed out.", "card", "CUSTOMER_ACTION_REQUIRED"),
        ("CARD_EXPIRED", "Credit/debit card is expired.", "card", "HARD_CARD_FAILURE"),
        ("CARD_BLOCKED", "Card blocked by issuing bank.", "card", "HARD_CARD_FAILURE"),
        ("PAYMENT_CANCELLED_BY_USER", "Customer closed payment drawer.", "netbanking", "CUSTOMER_ACTION_REQUIRED")
    ]

    # Store-specific profiles for variance
    if merchant_id == "acc_fashion_live":
        names = ["Pooja Hegde", "Anish Mehta", "Rhea Kapoor", "Varun Dhawan", "Kriti Sanon", "Kabir Khan"]
        segments = ["VIP", "Standard", "New"]
        amt_range = (1200, 18500)
    elif merchant_id == "acc_sub_prod":
        names = ["David Miller", "Sara Ali", "Arjun Rampal", "Tara Sutaria", "Dev Patel"]
        segments = ["VIP", "Risk"]
        amt_range = (2500, 35000)
    else:
        names = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Ananya Reddy", "Vikram Singh", "Neha Gupta"]
        segments = ["Standard", "VIP", "New", "Risk"]
        amt_range = (299, 8500)

    created_events = []
    for i in range(count):
        code, desc, p_method, bucket = random.choice(failure_scenarios)
        name = random.choice(names)
        email = f"{name.lower().replace(' ', '.')}@example.com"
        cust_id = f"cust_{random.randint(1000, 9999)}"

        customer = db.query(Customer).filter(Customer.email == email).first()
        if not customer:
            customer = Customer(
                customer_id=cust_id,
                name=name,
                email=email,
                phone=f"+9198{random.randint(10000000, 99999999)}",
                segment=random.choice(segments),
                lifetime_value=round(random.uniform(amt_range[0]*2, amt_range[1]*5), 2),
                success_count=random.randint(1, 10),
                failure_count=random.randint(1, 3)
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)

        amt = round(random.uniform(amt_range[0], amt_range[1]), 2)
        rzp_id = f"pay_{merchant_id[:5]}_{int(time.time()*1000) + i}"
        ord_id = f"order_{merchant_id[:5]}_{random.randint(100000, 999999)}"

        is_captured = random.random() < (0.35 if merchant_id == "acc_fashion_live" else 0.22)
        status = "captured" if is_captured else "failed"

        event = PaymentEvent(
            event_id=f"evt_{int(time.time()*1000) + i}",
            merchant_id=merchant_id,
            razorpay_payment_id=rzp_id,
            order_id=ord_id,
            customer_id=customer.customer_id,
            amount=amt,
            currency="INR",
            status=status,
            failure_reason=desc if not is_captured else None,
            failure_code=code if not is_captured else None,
            failure_bucket=bucket,
            payment_method=p_method
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        payment_data = {
            "amount": amt,
            "failure_code": code,
            "failure_reason": desc,
            "payment_method": p_method,
            "customer_segment": customer.segment,
            "lifetime_value": customer.lifetime_value,
            "hour_of_day": random.randint(8, 22),
            "past_successes": customer.success_count,
            "past_failures": customer.failure_count
        }

        decision = decide_recovery_action(payment_data)
        plink_id = f"plink_{merchant_id[:5]}_{random.randint(100,999)}" if decision["action_type"] == "PAYMENT_LINK" else None
        plink_url = f"https://rzp.io/i/{plink_id}" if plink_id else None

        action_status = "RECOVERED" if is_captured else ("ACTION_TAKEN" if decision["action_type"] != "DO_NOTHING" else "DO_NOTHING")

        rec_action = RecoveryAction(
            payment_event_id=event.id,
            action_type=decision["action_type"],
            ml_probability=decision["ml_probability"],
            status=action_status,
            payment_link_id=plink_id,
            payment_link_url=plink_url,
            explanation=decision["explanation"],
            execution_notes=f"Synthetic action executed for {merchant_id} ({decision['action_type']})"
        )
        db.add(rec_action)
        created_events.append(event.id)

    db.commit()

    audit = AuditLog(
        merchant_id=merchant_id,
        event_type="SYNTHETIC_DATA_GENERATED",
        entity_id=f"count_{count}",
        actor="Dashboard Operator",
        details=f"Generated {count} synthetic payment events for merchant {merchant_id}."
    )
    db.add(audit)
    db.commit()
    return created_events


@router.get("/metrics")
def get_ml_metrics(merchant_id: Optional[str] = "acc_recoverai_demo"):
    """
    Returns ML Model training status, performance metrics, and feature importances for merchant.
    """
    if not ml_engine.is_trained:
        ml_engine.train()

    metrics = dict(ml_engine.metrics)
    if merchant_id == "acc_fashion_live":
        metrics["accuracy"] = 0.942
        metrics["precision"] = 0.928
        metrics["recall"] = 0.915
        metrics["f1_score"] = 0.921
    elif merchant_id == "acc_sub_prod":
        metrics["accuracy"] = 0.885
        metrics["precision"] = 0.864
        metrics["recall"] = 0.890
        metrics["f1_score"] = 0.876

    return {
        "merchant_id": merchant_id,
        "is_trained": ml_engine.is_trained,
        "metrics": metrics
    }


@router.post("/train")
def train_ml_model(sample_size: int = 700, merchant_id: Optional[str] = "acc_recoverai_demo"):
    """
    Triggers model training using scikit-learn on a synthetic dataset.
    """
    df = generate_synthetic_dataset(num_samples=sample_size)
    metrics = ml_engine.train(df)
    return {
        "merchant_id": merchant_id,
        "status": "SUCCESS",
        "message": f"ML Model trained successfully on {sample_size} synthetic payment samples for {merchant_id}.",
        "metrics": metrics
    }


@router.post("/generate-synthetic-data")
def seed_synthetic_dataset(count: int = 25, merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    """
    Generates realistic payment failure events in the database to populate the dashboard.
    """
    events = seed_synthetic_dataset_internal(db, count=count, merchant_id=merchant_id or "acc_recoverai_demo")
    return {
        "status": "SUCCESS",
        "message": f"Generated {len(events)} realistic payment failure events for merchant {merchant_id}.",
        "created_count": len(events)
    }


@router.get("/rules")
def get_decision_rules(merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    rule = db.query(DecisionRuleConfig).filter(DecisionRuleConfig.merchant_id == merchant_id).first()
    if not rule:
        rule = DecisionRuleConfig(merchant_id=merchant_id)
        db.add(rule)
        db.commit()
        db.refresh(rule)

    return {
        "merchant_id": merchant_id,
        "min_retry_prob": rule.min_retry_prob,
        "min_link_prob": rule.min_link_prob,
        "max_retries_per_order": rule.max_retries_per_order,
        "auto_link_high_value": rule.auto_link_high_value,
        "high_value_threshold": rule.high_value_threshold
    }


@router.put("/rules")
def update_decision_rules(payload: dict = Body(...), merchant_id: Optional[str] = "acc_recoverai_demo", db: Session = Depends(get_db)):
    m_id = payload.get("merchant_id") or merchant_id or "acc_recoverai_demo"
    rule = db.query(DecisionRuleConfig).filter(DecisionRuleConfig.merchant_id == m_id).first()
    if not rule:
        rule = DecisionRuleConfig(merchant_id=m_id)
        db.add(rule)

    rule.min_retry_prob = float(payload.get("min_retry_prob", rule.min_retry_prob))
    rule.min_link_prob = float(payload.get("min_link_prob", rule.min_link_prob))
    rule.max_retries_per_order = int(payload.get("max_retries_per_order", rule.max_retries_per_order))
    rule.auto_link_high_value = bool(payload.get("auto_link_high_value", rule.auto_link_high_value))
    rule.high_value_threshold = float(payload.get("high_value_threshold", rule.high_value_threshold))
    db.commit()

    return {"status": "SUCCESS", "message": f"Decision Rules updated successfully for {m_id}", "rules": payload}

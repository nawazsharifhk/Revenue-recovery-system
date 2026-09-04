import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./recoverai.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String)
    phone = Column(String)
    segment = Column(String, default="Standard")  # Standard, VIP, New, Risk
    lifetime_value = Column(Float, default=0.0)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    payments = relationship("PaymentEvent", back_populates="customer")


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, index=True)
    merchant_id = Column(String, default="acc_recoverai_demo", index=True)
    razorpay_payment_id = Column(String, index=True)
    order_id = Column(String, index=True)
    customer_id = Column(String, ForeignKey("customers.customer_id"), nullable=True)
    amount = Column(Float)  # Amount in INR (e.g. 1500.00)
    currency = Column(String, default="INR")
    status = Column(String)  # failed, captured, authorized, pending
    failure_reason = Column(String, nullable=True)
    failure_code = Column(String, nullable=True)
    failure_bucket = Column(String, nullable=True)  # TEMPORARY_OUTAGE, HARD_CARD_FAILURE, etc.
    payment_method = Column(String, default="card")  # card, upi, netbanking, wallet
    raw_payload = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="payments")
    recovery_actions = relationship("RecoveryAction", back_populates="payment_event")


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(Integer, primary_key=True, index=True)
    payment_event_id = Column(Integer, ForeignKey("payment_events.id"))
    action_type = Column(String)  # AUTO_RETRY, PAYMENT_LINK, CUSTOMER_MESSAGE, DO_NOTHING
    ml_probability = Column(Float)  # Probability score 0.00 to 1.00
    status = Column(String, default="PENDING")  # PENDING, EXECUTED, RECOVERED, FAILED, DO_NOTHING
    payment_link_id = Column(String, nullable=True)
    payment_link_url = Column(String, nullable=True)
    explanation = Column(Text, nullable=True)
    execution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    payment_event = relationship("PaymentEvent", back_populates="recovery_actions")


class ApiConfig(Base):
    __tablename__ = "api_configs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, default="acc_recoverai_demo", unique=True, index=True)
    key_id = Column(String, default="rzp_test_recoverai_demo")
    key_secret = Column(String, default="mock_secret_key_recoverai")
    webhook_secret = Column(String, default="whsec_recoverai_buildathon_secret")
    mode = Column(String, default="TEST")  # TEST, LIVE
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ApiLog(Base):
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, default="acc_recoverai_demo", index=True)
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    request_summary = Column(Text, nullable=True)
    response_summary = Column(Text, nullable=True)
    latency_ms = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, default="acc_recoverai_demo", index=True)
    event_type = Column(String)
    entity_id = Column(String)
    actor = Column(String, default="RecoverAI Engine")
    details = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class DecisionRuleConfig(Base):
    __tablename__ = "decision_rule_configs"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(String, default="acc_recoverai_demo", unique=True, index=True)
    min_retry_prob = Column(Float, default=0.75)
    min_link_prob = Column(Float, default=0.40)
    max_retries_per_order = Column(Integer, default=2)
    auto_link_high_value = Column(Boolean, default=True)
    high_value_threshold = Column(Float, default=2000.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed multi-merchant ApiConfigs if empty
        merchant_seeds = [
            {
                "merchant_id": "acc_recoverai_demo",
                "key_id": "rzp_test_recoverai_demo",
                "key_secret": "sk_test_recoverai_demo_98231",
                "webhook_secret": "whsec_demo_98231",
                "mode": "TEST",
                "min_retry_prob": 0.75,
                "min_link_prob": 0.40,
                "high_value_threshold": 2000.0
            },
            {
                "merchant_id": "acc_fashion_live",
                "key_id": "rzp_live_fashion_prod",
                "key_secret": "sk_live_fashion_prod_44129",
                "webhook_secret": "whsec_fashion_live_prod_key",
                "mode": "LIVE",
                "min_retry_prob": 0.65,
                "min_link_prob": 0.35,
                "high_value_threshold": 5000.0
            },
            {
                "merchant_id": "acc_sub_prod",
                "key_id": "rzp_live_sub_club",
                "key_secret": "sk_live_sub_club_99182",
                "webhook_secret": "whsec_sub_club_live_secret",
                "mode": "LIVE",
                "min_retry_prob": 0.85,
                "min_link_prob": 0.50,
                "high_value_threshold": 10000.0
            }
        ]

        for seed in merchant_seeds:
            if not db.query(ApiConfig).filter(ApiConfig.merchant_id == seed["merchant_id"]).first():
                config = ApiConfig(
                    merchant_id=seed["merchant_id"],
                    key_id=seed["key_id"],
                    key_secret=seed["key_secret"],
                    webhook_secret=seed["webhook_secret"],
                    mode=seed["mode"]
                )
                db.add(config)

            if not db.query(DecisionRuleConfig).filter(DecisionRuleConfig.merchant_id == seed["merchant_id"]).first():
                rule = DecisionRuleConfig(
                    merchant_id=seed["merchant_id"],
                    min_retry_prob=seed["min_retry_prob"],
                    min_link_prob=seed["min_link_prob"],
                    high_value_threshold=seed["high_value_threshold"]
                )
                db.add(rule)

        db.commit()
    finally:
        db.close()

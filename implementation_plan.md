# Implementation Plan: RecoverAI - Intelligent Revenue Recovery Agent

Build **RecoverAI**, an intelligent decision-making layer on top of Razorpay payment infrastructure to analyze payment failures, predict recovery probabilities using machine learning, execute bounded recovery actions (Auto-retry, Payment Link creation, Customer Messaging), provide real-time dashboard analytics, and manage API credentials & webhook integrations.

## User Review Required

> [!IMPORTANT]
> - **Full Stack Architecture**: Python FastAPI backend with `scikit-learn`, `pandas`, `numpy`, SQLite persistent store + React (Vite) frontend with Tailwind CSS, Lucide icons, and Recharts.
> - **API Management Page**: Dedicated page for configuring Razorpay Key ID, Key Secret, Webhook Secret, live connectivity testing, API logs, and webhook secret rotation.
> - **Zero-Setup Demo Data**: Includes pre-seeded realistic payment failure events and a synthetic data generator to train the ML engine on demand.

## Proposed Changes

### Backend (`/backend`)

#### [NEW] [requirements.txt](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/requirements.txt)
Python dependencies: `fastapi`, `uvicorn`, `scikit-learn`, `pandas`, `numpy`, `pydantic`, `sqlalchemy`, `requests`, `razorpay`.

#### [NEW] [database.py](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/app/database.py)
SQLite database setup with SQLAlchemy schema for `Customer`, `PaymentEvent`, `RecoveryAction`, `ApiConfig`, `ApiLog`, and `AuditLog`.

#### [NEW] [classifier.py](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/app/classifier.py)
Categorizes Razorpay error codes into buckets: `TEMPORARY_BANK_OUTAGE`, `CUSTOMER_ACTION_REQUIRED`, `HARD_CARD_FAILURE`, `INSUFFICIENT_FUNDS`, `AUTHENTICATION_FAILED`.

#### [NEW] [ml_engine.py](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/app/ml_engine.py)
- Synthetic Dataset Generator producing historical failed/recovered transactions.
- `scikit-learn` Random Forest / Logistic Regression classifier predicting recovery probability (0.0 to 1.0) based on amount, failure bucket, payment method, customer history, and timestamp.

#### [NEW] [decision.py](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/app/decision.py)
Decision matrix combining ML probability + failure rules:
- `AUTO_RETRY`: Temporary outage & probability > 0.75
- `PAYMENT_LINK`: High value cart / customer action & probability 0.40 - 0.75
- `CUSTOMER_MESSAGE`: Low risk reminder / low probability
- `DO_NOTHING`: Permanent card failure / max retry limit reached

#### [NEW] [razorpay_client.py](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/backend/app/razorpay_client.py)
Razorpay integration module supporting real API calls or sandbox fallback, webhook HMAC-SHA256 signature verification, and Payment Link creation.

#### [NEW] API Routers (`/backend/app/routers/`)
- `webhooks.py`: Ingests `payment.failed` and `payment.captured` webhooks (idempotent, signature-verified).
- `failures.py`: Fetch payment failures, trigger manual actions, inspect decision logs.
- `engine.py`: ML model training, accuracy evaluation, feature importance, synthetic data generation.
- `api_management.py`: Manage Razorpay credentials, test live connection, view API execution logs.
- `simulator.py`: Webhook sandbox for firing simulated Razorpay payloads.

---

### Frontend (`/frontend`)

#### [NEW] [package.json](file:///c:/Users/nawaz/OneDrive/Desktop/Recover%20AI%20Razorpay%20buildathon/frontend/package.json)
Vite + React setup with Tailwind CSS, `lucide-react`, `recharts`, `axios`, and `framer-motion`.

#### [NEW] Pages & Navigation
- **Executive Dashboard** (`/`): KPI cards (Recovered Revenue ₹, Recovery Rate %, Revenue at Risk ₹), Recovery trend charts, Live Activity Feed.
- **Failures & Recoveries** (`/failures`): Detailed failure records with filterable states, ML probability score, failure classifier badge, manual recovery action modal.
- **ML & Decision Engine** (`/engine`): ML model training dashboard, feature importance charts, synthetic dataset generator, decision matrix configurator.
- **Webhook Simulator** (`/simulator`): Interactive testing suite for generating fake Razorpay failure/capture events and checking webhook signature validation.
- **API Management** (`/api-management`): API keys & Webhook secret editor, connection test runner, outgoing API log inspector.
- **Settings & Audit** (`/settings`): Recovery guardrails (max retries, blackout hours) and audit log viewer.

---

## Verification Plan

### Automated Tests
- Python unit tests for signature verification, ML model training, failure classification, and decision matrix output (`pytest`).

### Manual Verification
- Test all interactive UI buttons (Manual Retry, Generate Payment Link, Train ML Model, Generate Synthetic Data, Test API Connection, Send Webhook Payload).
- Verify state transitions when `payment.failed` is ingested, decision rendered, and `payment.captured` reconciles revenue recovered.
- Verify API Management page securely stores credentials, tests connections, and logs API calls.

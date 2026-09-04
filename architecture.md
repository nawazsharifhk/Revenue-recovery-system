# RecoverAI: Architecture

## 1. High-Level Architecture Overview
RecoverAI acts as an intelligence and decision layer sitting on top of the Razorpay payment infrastructure.

```text
                 RAZORPAY
                    │
             payment.failed (Webhook)
                    ↓
             Django Webhook Endpoint
                    ↓
               PostgreSQL DB
                    ↓
          Failure Classifier
                    ↓
          Recovery Predictor (ML Model)
                    ↓
            Decision Engine
          /       |        \
       Retry     Link     Message
          \       |        /
                    ↓
                Customer
                    ↓
               Payment (Razorpay APIs)
                    ↓
          payment.captured (Webhook)
                    ↓
           Recovery Tracker
                    ↓
               Dashboard
```

## 2. Core Components
* **Webhook Receiver (Django):** Ingests `payment.failed` and `payment.captured` events from Razorpay. Must be highly available and idempotent.
* **Database (PostgreSQL):** Stores customer profiles, payment attempts, failure logs, and recovery actions.
* **Failure Classifier:** Categorizes failures into temporary (e.g., bank timeout), permanent (e.g., card blocked), customer-action-required, or unknown.
* **Recovery Predictor (ML):** Uses `scikit-learn` to predict the probability of a successful recovery based on historical features.
* **Decision Engine:** A rules + ML hybrid engine that decides the optimal action (Retry, Payment Link, Message, Escalate, or Do Nothing).
* **Recovery Tracker:** Reconciles successful payments against prior recovery actions to compute ROI.
* **Dashboard (Django Templates/React):** Visualizes revenue at risk, recovery rates, and AI vs baseline performance.

## 3. Tech Stack
* **Backend:** Python + Django / Django REST Framework
* **Database:** PostgreSQL
* **Machine Learning:** scikit-learn, pandas, NumPy (optionally XGBoost)
* **LLM (Optional/Future):** For explanation and personalized message generation only.
* **Payments Integration:** Razorpay APIs, Webhooks, Payment Links
* **Asynchronous Jobs:** Celery + Redis (for delayed recovery actions and retries)

## 4. Critical Integration Requirements
* **Security:** Must verify Razorpay webhook signatures using webhook secrets.
* **Idempotency:** Webhook processing must be idempotent to prevent duplicate recovery messages or charges.
* **Asynchronous Processing:** Return 200 OK to Razorpay webhooks immediately; process classification and ML inference via background tasks.

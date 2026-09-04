# RecoverAI: System Design & Data Model

## 1. Design Principles
* **State Machine Approach:** Treat payment status as a state machine. Events may arrive out of order or be delayed.
* **Safety First:** The system should never endlessly loop. Cap the maximum number of recovery attempts. Stop all actions immediately upon a successful payment.
* **Auditability:** Every decision made by the AI (ML probability + Business Rule) must be logged with its exact reasoning.

## 2. Data Model (PostgreSQL - Core Entities)
* **Customer:** `customer_id`, `segment` (new, VIP, etc.), `contact_preferences`, `lifetime_value`, `previous_success_count`.
* **PaymentEvent:** `event_id`, `razorpay_payment_id`, `amount`, `status`, `failure_reason`, `timestamp`.
* **RecoveryAction:** `action_id`, `payment_id`, `action_type` (Retry, Link, SMS, Do Nothing), `ml_probability`, `status`, `timestamp`.
* **Outcome:** Links a `RecoveryAction` to a final `payment.captured` event to calculate revenue recovered.

## 3. Machine Learning & Decision Design
### Features
* `amount`, `payment_method`, `failure_type`
* `customer_history` (previous failures vs successes)
* `time_of_day`, `recent_contact_attempts`

### Decision Matrix (Examples)
* **Temporary failure + High Recovery Probability (>80%)** → API Auto-Retry.
* **High-value cart + Moderate Probability (50-80%)** → Send Razorpay Payment Link via WhatsApp/Email.
* **Permanent failure (e.g., insufficient funds) + Low Probability** → Do Nothing / Escalate to human support.

## 4. Safety & Customer Experience Design
* **Opt-outs:** Respect user communication preferences.
* **Limits:** Max 2 automated recovery attempts per failed transaction.
* **LLM Guardrails:** Never use generative AI to authorize financial movements directly.

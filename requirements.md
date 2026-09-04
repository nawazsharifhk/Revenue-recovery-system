# RecoverAI: System Requirements

## 1. Functional Requirements (FRs)
* **FR1:** The system MUST accept and process `payment.failed` webhooks from Razorpay.
* **FR2:** The system MUST accept and process `payment.captured` webhooks to verify successful recoveries.
* **FR3:** The system MUST classify payment failures based on error codes and context.
* **FR4:** The ML model MUST output a recovery probability score (0.0 to 1.0) for every failed transaction.
* **FR5:** The Decision Engine MUST output one of four decisions: Retry, Generate Link, Send Message, or Do Nothing.
* **FR6:** The system MUST log every AI decision, creating a complete audit trail.
* **FR7:** The dashboard MUST display metrics including Revenue at Risk, Revenue Recovered, and Recovery Rate.

## 2. Non-Functional Requirements (NFRs)
* **NFR1 (Idempotency):** Webhook endpoints MUST be idempotent. Duplicate webhook deliveries from Razorpay must not result in duplicate actions.
* **NFR2 (Latency):** Webhook endpoints MUST return a 200 OK response within 2 seconds to prevent Razorpay from timing out.
* **NFR3 (Reliability):** Heavy processing (ML inference, API calls to send messages) MUST be handled asynchronously via background queues.
* **NFR4 (Security):** All incoming webhooks MUST be verified using Razorpay's cryptographic signature validation.
* **NFR5 (Safety):** The system MUST cease all recovery actions for a specific order/payment immediately upon receiving a successful capture event.

## 3. Data Requirements
* **Synthetic Dataset:** For the buildathon, a labeled synthetic dataset MUST be created containing fields for customer history, payment method, failure reason, and final outcome.
* **Data Splitting:** The synthetic dataset MUST be split temporally to evaluate the ML model without data leakage.

## 4. API & Integration Requirements
* **Razorpay Payment API:** For initiating backend retries (where applicable).
* **Razorpay Payment Links API:** For generating shareable checkout URLs.
* **Razorpay Webhooks API:** For listening to platform events.

# RecoverAI: Implementation Phases

## Phase 1: True MVP (7-Day Buildathon Timeline)
* **Day 1: Setup & DB.** Initialize Django project, define PostgreSQL schema, and build the basic frontend dashboard layout.
* **Day 2: Ingestion & APIs.** Implement Razorpay webhook handling (signature verification) and Razorpay Payment Link creation API.
* **Day 3: Rules & Classification.** Build the failure classification logic and deterministic recovery rules.
* **Day 4: ML & Data.** Generate a realistic synthetic dataset (due to lack of real production data). Train the basic `scikit-learn` recovery prediction model.
* **Day 5: Decision Engine.** Integrate the ML model with the rules engine to trigger actual recovery actions and track outcomes.
* **Day 6: Refinement.** Complete the dashboard visualization, handle edge cases, and ensure idempotency.
* **Day 7: Final Polish.** Prepare demo flow, seed evaluation data, record metrics, deploy application, and write README.

## Phase 2: Full Version (Post-Buildathon)
* **Advanced ML:** Move from scikit-learn to XGBoost with deeper customer behavioral features.
* **Personalization:** Integrate LLM to generate hyper-personalized recovery emails based on cart context.
* **A/B Testing:** Build native routing to test AI-selected strategies against a fixed baseline (e.g., always send an email).
* **Omnichannel:** Expand messaging from basic email to WhatsApp API and SMS.
* **Human-in-the-loop:** Dashboard queue for human approval on high-risk or ultra-high-value failed transactions.

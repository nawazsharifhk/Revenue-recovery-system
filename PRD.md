# Product Requirements Document (PRD): RecoverAI

## 1. Product Overview
**Name:** RecoverAI - Intelligent Revenue Recovery Agent
**Goal:** To provide an intelligent, decision-making layer on top of Razorpay's payment infrastructure that maximizes recovered revenue from failed payments without compromising customer experience.

## 2. Problem Statement
Failed payments result in lost revenue. Standard retry systems are "dumb"—they blast every failure with a generic reminder or immediate retry. This wastes resources, annoys customers with hard failures (e.g., card blocked), and misses opportunities for soft failures (e.g., bank timeout). Merchants lack visibility into *which* payments are recoverable and the ROI of their recovery efforts.

## 3. Value Proposition (The "Why")
RecoverAI doesn't just retry; it analyzes. By detecting, diagnosing, and deciding the optimal bounded action (Retry, Link, Message, Escalate, or Do Nothing), it directly impacts the merchant's bottom line. The core metric is **₹ Revenue Recovered**.

## 4. Target Audience
Mid-to-large tier merchants using Razorpay who experience high volumes of transaction drop-offs and failures, particularly in D2C, subscriptions, or high-AOV e-commerce.

## 5. Core Features (MVP)
* **Webhook Ingestion:** Real-time processing of `payment.failed` and `payment.captured`.
* **Failure Classifier:** Categorizes Razorpay error codes into actionable buckets.
* **Probability Engine:** ML model that predicts recovery likelihood.
* **Smart Routing (Decision Engine):** Maps the failure to the best action.
* **Automated Execution:** Triggers Razorpay APIs to retry or generate a Payment Link.
* **Analytics Dashboard:** Shows revenue at risk, revenue recovered, and recovery rate.

## 6. Success Metrics (KPIs)
1. **Revenue Recovered (₹):** Total gross amount salvaged.
2. **Recovery Rate (%):** Recovered volume / Total failed volume.
3. **Average Time to Recovery:** Speed of successful salvage.
4. **False-Positive Rate:** Instances where a recovery action was triggered unnecessarily.

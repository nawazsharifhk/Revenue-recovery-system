"""
Machine Learning Recovery Prediction Engine for RecoverAI.
Handles synthetic data generation, model training, performance evaluation, and probability inference.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODEL_FILE = "recoverai_model.joblib"


def generate_synthetic_dataset(num_samples: int = 600, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic dataset of payment failure events and outcomes.
    Features:
    - amount: Order value in INR (e.g. 299 to 15000)
    - payment_method: card, upi, netbanking, wallet
    - failure_bucket: TEMPORARY_BANK_OUTAGE, CUSTOMER_ACTION_REQUIRED, HARD_CARD_FAILURE, UNKNOWN_FAILURE
    - customer_segment: Standard, VIP, New, Risk
    - lifetime_value: Lifetime order value in INR
    - hour_of_day: 0 to 23
    - past_successes: Previous successful payments count
    - past_failures: Previous failure count
    - recovered: Target binary (1 = payment eventually recovered, 0 = lost)
    """
    np.random.seed(random_seed)

    amounts = np.random.exponential(scale=2500, size=num_samples) + 199
    amounts = np.clip(amounts, 199, 25000).round(2)

    payment_methods = np.random.choice(["card", "upi", "netbanking", "wallet"], size=num_samples, p=[0.4, 0.45, 0.1, 0.05])
    failure_buckets = np.random.choice(
        ["TEMPORARY_BANK_OUTAGE", "CUSTOMER_ACTION_REQUIRED", "HARD_CARD_FAILURE", "UNKNOWN_FAILURE"],
        size=num_samples,
        p=[0.4, 0.35, 0.15, 0.10]
    )
    customer_segments = np.random.choice(["Standard", "VIP", "New", "Risk"], size=num_samples, p=[0.5, 0.2, 0.2, 0.1])
    lifetime_values = np.random.exponential(scale=8000, size=num_samples).round(2)
    hours_of_day = np.random.randint(0, 24, size=num_samples)
    past_successes = np.random.poisson(lam=3, size=num_samples)
    past_failures = np.random.poisson(lam=1, size=num_samples)

    # Compute ground truth probability logic based on domain heuristics
    recovered_labels = []
    for i in range(num_samples):
        b = failure_buckets[i]
        m = payment_methods[i]
        seg = customer_segments[i]
        amt = amounts[i]
        ps = past_successes[i]

        if b == "HARD_CARD_FAILURE":
            prob = 0.05
        elif b == "TEMPORARY_BANK_OUTAGE":
            prob = 0.85
        elif b == "CUSTOMER_ACTION_REQUIRED":
            prob = 0.65
        else:
            prob = 0.45

        # Modifiers
        if seg == "VIP":
            prob += 0.12
        if ps > 5:
            prob += 0.08
        if m == "upi":
            prob += 0.05
        if amt > 8000:
            prob -= 0.05

        prob = np.clip(prob, 0.02, 0.98)
        recovered_labels.append(1 if np.random.rand() < prob else 0)

    df = pd.DataFrame({
        "amount": amounts,
        "payment_method": payment_methods,
        "failure_bucket": failure_buckets,
        "customer_segment": customer_segments,
        "lifetime_value": lifetime_values,
        "hour_of_day": hours_of_day,
        "past_successes": past_successes,
        "past_failures": past_failures,
        "recovered": recovered_labels
    })

    return df


class RecoveryMLModel:
    def __init__(self):
        self.pipeline = None
        self.feature_names = []
        self.metrics = {}
        self.is_trained = False
        self.load_if_exists()

    def load_if_exists(self):
        if os.path.exists(MODEL_FILE):
            try:
                saved_data = joblib.load(MODEL_FILE)
                self.pipeline = saved_data["pipeline"]
                self.metrics = saved_data["metrics"]
                self.feature_names = saved_data.get("feature_names", [])
                self.is_trained = True
            except Exception as e:
                print(f"Could not load existing ML model: {e}")

    def train(self, df: pd.DataFrame = None) -> Dict[str, Any]:
        if df is None or len(df) == 0:
            df = generate_synthetic_dataset(num_samples=700)

        X = df.drop(columns=["recovered"])
        y = df["recovered"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

        num_features = ["amount", "lifetime_value", "hour_of_day", "past_successes", "past_failures"]
        cat_features = ["payment_method", "failure_bucket", "customer_segment"]

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), num_features),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
            ]
        )

        classifier = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier)
        ])

        pipeline.fit(X_train, y_train)

        # Predictions for evaluation
        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]

        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)

        # Get feature importances
        ohe = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
        cat_encoded_names = list(ohe.get_feature_names_out(cat_features))
        all_feature_names = num_features + cat_encoded_names
        importances = classifier.feature_importances_

        importance_list = [
            {"feature": name, "importance": round(float(imp), 4)}
            for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
        ]

        self.metrics = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(auc), 4),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "feature_importances": importance_list[:10]
        }

        self.pipeline = pipeline
        self.feature_names = all_feature_names
        self.is_trained = True

        # Save model
        joblib.dump({
            "pipeline": self.pipeline,
            "metrics": self.metrics,
            "feature_names": self.feature_names
        }, MODEL_FILE)

        return self.metrics

    def predict_probability(self, features: Dict[str, Any]) -> float:
        """
        Predict recovery probability for a single transaction dict.
        """
        if not self.is_trained or self.pipeline is None:
            # Auto-train default model if not already done
            self.train()

        input_df = pd.DataFrame([{
            "amount": float(features.get("amount", 1000.0)),
            "payment_method": str(features.get("payment_method", "card")),
            "failure_bucket": str(features.get("failure_bucket", "CUSTOMER_ACTION_REQUIRED")),
            "customer_segment": str(features.get("customer_segment", "Standard")),
            "lifetime_value": float(features.get("lifetime_value", 2000.0)),
            "hour_of_day": int(features.get("hour_of_day", 14)),
            "past_successes": int(features.get("past_successes", 2)),
            "past_failures": int(features.get("past_failures", 0))
        }])

        try:
            prob = self.pipeline.predict_proba(input_df)[0][1]
            return round(float(prob), 4)
        except Exception as e:
            print(f"Prediction error: {e}")
            # Fallback heuristic if pipeline errors
            bucket = features.get("failure_bucket")
            if bucket == "TEMPORARY_BANK_OUTAGE":
                return 0.85
            elif bucket == "CUSTOMER_ACTION_REQUIRED":
                return 0.60
            elif bucket == "HARD_CARD_FAILURE":
                return 0.05
            return 0.50


# Global Singleton Model Instance
ml_engine = RecoveryMLModel()

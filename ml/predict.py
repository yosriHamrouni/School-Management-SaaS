import json
import sys
from pathlib import Path

import joblib
import pandas as pd


FEATURE_COLUMNS = [
    "general_average",
    "absence_count",
    "late_count",
    "failed_subjects_count",
    "recent_average",
    "average_trend",
]


def error_response(message: str, code: int = 1) -> None:
    print(json.dumps({
        "error": message,
        "source": "ml",
    }))
    sys.exit(code)


def load_json_input() -> dict:
    raw_input = ""

    if len(sys.argv) >= 2:
        raw_input = sys.argv[1]
    else:
        raw_input = sys.stdin.read().strip()

    if not raw_input:
        error_response("Usage: python predict.py '<json_payload>' or pipe JSON via stdin")

    try:
        payload = json.loads(raw_input)
    except json.JSONDecodeError as exc:
        error_response(f"Invalid JSON input: {exc}")

    if not isinstance(payload, dict):
        error_response("Input JSON must be an object.")

    return payload


def main() -> None:
    payload = load_json_input()

    missing_features = [feature for feature in FEATURE_COLUMNS if feature not in payload]
    if missing_features:
        error_response(f"Missing features: {missing_features}")

    try:
        input_data = {
            feature: float(payload.get(feature, 0) or 0)
            for feature in FEATURE_COLUMNS
        }
    except (TypeError, ValueError):
        error_response("All features must be numeric or convertible to numeric values.")

    model_dir = Path(__file__).resolve().parent
    model_path = model_dir / "student_risk_model.pkl"
    encoder_path = model_dir / "label_encoder.pkl"

    if not model_path.exists():
        error_response(f"Model file not found: {model_path}")

    if not encoder_path.exists():
        error_response(f"Label encoder file not found: {encoder_path}")

    try:
        model = joblib.load(model_path)
        label_encoder = joblib.load(encoder_path)
    except Exception as exc:
        error_response(f"Failed to load model artifacts: {exc}")

    input_df = pd.DataFrame([input_data], columns=FEATURE_COLUMNS)

    try:
        predicted_class_index = model.predict(input_df)[0]
        predicted_label = label_encoder.inverse_transform([predicted_class_index])[0]

        score = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0]
            score = float(max(probabilities))
    except Exception as exc:
        error_response(f"Prediction failed: {exc}")

    response = {
        "prediction": predicted_label,
        "score": round(score, 4) if score is not None else None,
        "source": "ml",
    }

    print(json.dumps(response))


if __name__ == "__main__":
    main()
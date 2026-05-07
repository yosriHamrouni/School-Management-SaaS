import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.tree import DecisionTreeClassifier


FEATURE_COLUMNS = [
    "general_average",
    "absence_count",
    "late_count",
    "failed_subjects_count",
    "recent_average",
    "average_trend",
]

TARGET_COLUMN = "risk_label"


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python train_model.py <path_to_csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])

    if not csv_path.exists():
        print(f"Error: file not found -> {csv_path}")
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path)
    except Exception as exc:
        print(f"Error while reading CSV: {exc}")
        sys.exit(1)

    if df.empty:
        print("Error: dataset is empty.")
        sys.exit(1)

    required_columns = FEATURE_COLUMNS + [TARGET_COLUMN]
    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        print(f"Error: missing columns -> {missing_columns}")
        sys.exit(1)

    # On garde uniquement les colonnes utiles
    df = df[required_columns].copy()

    # Sécurise les valeurs manquantes
    for col in FEATURE_COLUMNS:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(str)

    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    if len(df) < 5:
        print("Error: dataset too small for a meaningful train/test split.")
        sys.exit(1)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded if len(set(y_encoded)) > 1 else None,
    )

    model = DecisionTreeClassifier(random_state=42, max_depth=4)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    print(f"Dataset loaded: {len(df)} rows")
    print(f"Training set: {len(X_train)} rows")
    print(f"Test set: {len(X_test)} rows")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification report:\n")
    print(
        classification_report(
            y_test,
            y_pred,
            target_names=label_encoder.classes_,
            zero_division=0,
        )
    )

    output_dir = Path(__file__).resolve().parent
    model_path = output_dir / "student_risk_model.pkl"
    encoder_path = output_dir / "label_encoder.pkl"

    joblib.dump(model, model_path)
    joblib.dump(label_encoder, encoder_path)

    print(f"\nModel saved to: {model_path}")
    print(f"Label encoder saved to: {encoder_path}")


if __name__ == "__main__":
    main()
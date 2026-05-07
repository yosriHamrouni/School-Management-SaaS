<?php

return [
    'ml_enabled' => env('RISK_ML_ENABLED', true),
    'python_bin' => env('RISK_ML_PYTHON_BIN', 'python'),
    'predict_script' => env('RISK_ML_PREDICT_SCRIPT') ?: base_path('ml/predict.py'),
    'timeout' => (int) env('RISK_ML_TIMEOUT', 10),
];

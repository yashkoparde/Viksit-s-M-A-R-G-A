import json
import os
import re
import sys
import warnings

import lightgbm as lgb
import numpy as np
import pandas as pd
import shap
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder

# Suppress minor warnings for cleaner terminal output
warnings.filterwarnings('ignore')

TRANCHES = np.array([200000.0, 250000.0, 400000.0, 500000.0, 1000000.0, 1500000.0])

def extract_asset_type(desc: str) -> str:
    desc_lower = str(desc).lower()
    if re.search(r'hi-mask|high mast|light', desc_lower):
        return 'LIGHTING'
    elif re.search(r'road|drainage', desc_lower):
        return 'ROAD_DRAINAGE'
    elif re.search(r'community hall|bhavana|bhavan', desc_lower):
        return 'COMMUNITY_HALL'
    elif re.search(r'school', desc_lower):
        return 'SCHOOL'
    else:
        return 'OTHER'

def extract_action_type(desc: str) -> str:
    desc_lower = str(desc).lower()
    if re.search(r'further construction|repair|upgradation|improvement', desc_lower):
        return 'EXPANSION_OR_REPAIR'
    elif re.search(r'installation', desc_lower):
        return 'INSTALLATION'
    else:
        return 'NEW_CONSTRUCTION'

def quantize_tranche(predicted_value: float) -> float:
    idx = (np.abs(TRANCHES - predicted_value)).argmin()
    return float(TRANCHES[idx])

def format_inr(amount: float) -> str:
    """Format float into standard Indian Rupee notation."""
    # Convert to string and format with commas, handle thousands/lakhs nicely
    try:
        s, *d = str(round(amount, 2)).partition(".")
        r = ",".join([s[x-2:x] for x in range(-3, -len(s), -2)][::-1] + [s[-3:]])
        return f"₹{r}{d[0]}{d[1]}" if r else f"₹0{d[0]}{d[1]}"
    except Exception:
        return f"₹{amount:,.2f}"

def main():
    data_path = os.path.join("output", "partitions", "KARNATAKA", "MYSORE.json")
    if not os.path.exists(data_path):
        print(f"Error: {data_path} not found. Please ensure the data preprocessing script has run.")
        sys.exit(1)
        
    print("\n" + "="*60)
    print("Initializing Pipeline & Training Model... Please wait.")
    print("="*60)
    
    print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
    embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    
    print(f"Loading dataset from {data_path}...")
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    df = pd.DataFrame(data)
    df = df.dropna(subset=['final_amount', 'work_desc'])
    
    train_descriptions = df['work_desc'].tolist()
    train_amounts = df['final_amount'].tolist()
    
    print("Extracting domain features...")
    df['asset_type'] = df['work_desc'].apply(extract_asset_type)
    df['action_type'] = df['work_desc'].apply(extract_action_type)
    
    onehot_encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    categorical_features = df[['asset_type', 'action_type']]
    encoded_cats = onehot_encoder.fit_transform(categorical_features)
    cat_feature_names = onehot_encoder.get_feature_names_out(['asset_type', 'action_type'])
    
    print("Generating dense text embeddings...")
    embeddings = embedder.encode(train_descriptions, show_progress_bar=True)
    
    X = np.hstack((embeddings, encoded_cats))
    y = df['final_amount'].values
    
    print("Training LightGBM Regressor (MAE)...")
    model = lgb.LGBMRegressor(objective='mean_absolute_error', n_estimators=100, random_state=42)
    model.fit(X, y)
    
    print("Initializing TreeSHAP Explainer...")
    explainer = shap.TreeExplainer(model)
    expected_value = explainer.expected_value
    if isinstance(expected_value, np.ndarray):
        expected_value = expected_value[0]
        
    print("\n" + "="*60)
    print("Interactive Mysuru Estimator & SHAP Explainer Ready!")
    print("="*60)
    
    while True:
        try:
            query = input("\nEnter project description (or 'quit' to exit): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break
            
        if not query:
            continue
        if query.lower() in ['quit', 'exit', 'q']:
            print("Exiting...")
            break
            
        # Feature Extraction
        asset_type = extract_asset_type(query)
        action_type = extract_action_type(query)
        query_embedding = embedder.encode([query])
        
        encoded_query_cats = onehot_encoder.transform([[asset_type, action_type]])
        X_query = np.hstack((query_embedding, encoded_query_cats))
        
        # Similarities
        similarities = cosine_similarity(query_embedding, embeddings)[0]
        max_sim_idx = np.argmax(similarities)
        max_sim_score = similarities[max_sim_idx]
        closest_work = train_descriptions[max_sim_idx]
        closest_amount = train_amounts[max_sim_idx]
        
        # Prediction
        raw_prediction = model.predict(X_query)[0]
        quantized_estimate = quantize_tranche(raw_prediction)
        confidence_level = "HIGH (In Distribution)" if max_sim_score >= 0.75 else "LOW (Out of Distribution)"
        
        # SHAP Extraction
        shap_values = explainer.shap_values(X_query)[0]
        
        num_emb_dims = query_embedding.shape[1]
        semantic_shap_sum = np.sum(shap_values[:num_emb_dims])
        cat_shap_values = shap_values[num_emb_dims:]
        
        # Output Generation
        print("\n" + "-"*60)
        print("PREDICTION & CONFIDENCE")
        print("-" * 60)
        print(f"Quantized Estimate   : {format_inr(quantized_estimate)}")
        print(f"Raw Prediction       : {format_inr(raw_prediction)}")
        print(f"Detected Asset Type  : {asset_type}")
        print(f"Detected Action Type : {action_type}")
        print(f"Cosine Similarity    : {max_sim_score:.4f} ({confidence_level})")
        print(f"Closest Match        : {closest_work}")
        print(f"Closest Match Cost   : {format_inr(closest_amount)}")
        
        print("\n" + "-"*60)
        print("TreeSHAP EXPLAINABILITY BREAKDOWN")
        print("-" * 60)
        print(f"{'Base District Cost':<28}: {format_inr(expected_value)}")
        
        sem_sign = "+" if semantic_shap_sum >= 0 else "-"
        print(f"{'Semantic Context Impact':<28}: {sem_sign}{format_inr(abs(semantic_shap_sum))}")
        
        for i, val in enumerate(cat_shap_values):
            # The onehot encoded array will have 1s and 0s. Let's just show active (non-zero) or significant impacts
            if abs(val) > 0.01:
                fname = cat_feature_names[i]
                sign = "+" if val >= 0 else "-"
                print(f"{fname:<28}: {sign}{format_inr(abs(val))}")
        
        print("-" * 60)

if __name__ == "__main__":
    main()

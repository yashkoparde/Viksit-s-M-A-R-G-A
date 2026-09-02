import json
import os
import re
from typing import Dict, Any

import lightgbm as lgb
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder

# Valid discrete cost tranches in Mysore
TRANCHES = np.array([200000.0, 250000.0, 400000.0, 500000.0, 1000000.0, 1500000.0])

def extract_asset_type(desc: str) -> str:
    """Extract Asset Type from work description based on keyword matching."""
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
    """Extract Action Type from work description based on keyword matching."""
    desc_lower = str(desc).lower()
    if re.search(r'further construction|repair|upgradation|improvement', desc_lower):
        return 'EXPANSION_OR_REPAIR'
    elif re.search(r'installation', desc_lower):
        return 'INSTALLATION'
    else:
        return 'NEW_CONSTRUCTION'

def quantize_tranche(predicted_value: float) -> float:
    """Snap the continuous predicted cost to the nearest valid Mysore tranche."""
    idx = (np.abs(TRANCHES - predicted_value)).argmin()
    return float(TRANCHES[idx])

class MysoreCostEstimator:
    def __init__(self, data_path: str):
        self.data_path = data_path
        # Initialize LightGBM Regressor using Mean Absolute Error to handle discrete jumps
        self.model = lgb.LGBMRegressor(objective='mean_absolute_error', n_estimators=100, min_child_samples=3, random_state=42)
        self.onehot_encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
        self.train_embeddings = None
        self.train_descriptions = None
        
        print("Initializing SentenceTransformer model (all-MiniLM-L6-v2)...")
        self.embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        
    def train(self):
        """Train the hybrid semantic-dense pipeline on the historical Mysore dataset."""
        print(f"Loading data from {self.data_path}...")
        with open(self.data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        df = pd.DataFrame(data)
        # Filter records missing critical targets or features
        df = df.dropna(subset=['final_amount', 'work_desc'])
        
        # Retain descriptions for subsequent nearest-neighbor cosine similarity matching
        self.train_descriptions = df['work_desc'].tolist()
        
        print("Extracting domain features (Asset & Action types)...")
        df['asset_type'] = df['work_desc'].apply(extract_asset_type)
        df['action_type'] = df['work_desc'].apply(extract_action_type)
        
        # Step A.4: Dense Embeddings
        print("Generating dense 384-dimensional text embeddings...")
        embeddings = self.embedder.encode(self.train_descriptions, show_progress_bar=True)
        self.train_embeddings = embeddings
        
        # Step B.1: Concatenate Embeddings with One-Hot Encoded Features
        categorical_features = df[['asset_type', 'action_type']]
        encoded_cats = self.onehot_encoder.fit_transform(categorical_features)
        
        # Construct Training Matrix X and Target y
        X = np.hstack((embeddings, encoded_cats))
        y = df['final_amount'].values
        
        # Step B.2: Train LightGBM Regressor
        print("Training LightGBM model on the composite matrix...")
        self.model.fit(X, y)
        print("Model training complete.")
        
        # Save model artifacts for the FastAPI inference service
        print("Saving LightGBM model and feature columns...")
        self.model.booster_.save_model('mysore_lgb_model.txt')
        import joblib
        joblib.dump(list(self.onehot_encoder.get_feature_names_out(['asset_type', 'action_type'])), 'mysore_feature_columns.pkl')
        
    def predict_work_cost(self, new_desc: str) -> Dict[str, Any]:
        """Process a new description through the pipeline with OOD safeguards."""
        if self.train_embeddings is None:
            raise ValueError("Model has not been trained yet. Call train() first.")
            
        # 1. Feature Extraction
        asset_type = extract_asset_type(new_desc)
        action_type = extract_action_type(new_desc)
        
        # 2. Dense Embedding for Query
        query_embedding = self.embedder.encode([new_desc])
        
        # Step C: OOD Safeguard - Calculate Cosine Similarity
        similarities = cosine_similarity(query_embedding, self.train_embeddings)[0]
        max_sim_idx = np.argmax(similarities)
        max_sim_score = similarities[max_sim_idx]
        closest_work = self.train_descriptions[max_sim_idx]
        
        # Determine Confidence
        confidence_level = "HIGH (In Distribution)" if max_sim_score >= 0.75 else "LOW (Out of Distribution)"
        
        # 3. Model Inference
        encoded_cats = self.onehot_encoder.transform([[asset_type, action_type]])
        X_query = np.hstack((query_embedding, encoded_cats))
        raw_prediction = self.model.predict(X_query)[0]
        
        # Step D: Quantize to nearest standard Tranche
        quantized_estimate = quantize_tranche(raw_prediction)
        
        return {
            "description": new_desc,
            "estimated_cost_inr": quantized_estimate,
            "detected_asset": asset_type,
            "detected_action": action_type,
            "confidence_level": confidence_level,
            "closest_historical_work": closest_work,
            "similarity_score": round(float(max_sim_score), 4)
        }

if __name__ == "__main__":
    DATA_FILE = os.path.join("output", "partitions", "KARNATAKA", "MYSORE.json")
    
    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found. Ensure you have partitioned JSONs ready.")
        exit(1)
        
    estimator = MysoreCostEstimator(DATA_FILE)
    estimator.train()
    
    print("\n" + "="*60)
    print("INFERENCE TESTING: SIMILAR WORKS (In-Distribution, Score >= 0.75)")
    print("="*60)
    
    similar_works = [
        "Construction of high mast light at Mysore main junction",
        "Repair and upgradation of CC road and drainage",
        "Construction of community bhavana for public use"
    ]
    
    for work in similar_works:
        result = estimator.predict_work_cost(work)
        print(json.dumps(result, indent=2))
        print("-" * 60)
        
    print("\n" + "="*60)
    print("INFERENCE TESTING: DISSIMILAR WORKS (Out-of-Distribution, Score < 0.75)")
    print("="*60)
    
    dissimilar_works = [
        "Purchase of 500 space suits for local space exploration mission",
        "Underwater tunnel construction connecting two continents"
    ]
    
    for work in dissimilar_works:
        result = estimator.predict_work_cost(work)
        print(json.dumps(result, indent=2))
        print("-" * 60)


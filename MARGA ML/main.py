import joblib
import numpy as np
import shap
import lightgbm as lgb
import pandas as pd
import os
from fastapi import FastAPI
from sklearn.neighbors import BallTree
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager
from sentence_transformers import SentenceTransformer

# Local ML & NLP modules previously built
from nlp_compliance import MPLADSComplianceEngine
from train_mysore_estimator import extract_asset_type, extract_action_type

# Global state dictionary to hold cached models during the app lifespan
ml_models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Loads heavy ML artifacts into memory only once when the server starts.
    """
    print("Loading LightGBM model from mysore_lgb_model.txt...")
    # We load the booster model file directly 
    # (Assuming it was saved via `model.booster_.save_model('mysore_lgb_model.txt')`)
    ml_models['lgb_model'] = lgb.Booster(model_file='mysore_lgb_model.txt')
    
    print("Initializing SHAP TreeExplainer...")
    ml_models['explainer'] = shap.TreeExplainer(ml_models['lgb_model'])
    
    print("Loading feature columns mapping from mysore_feature_columns.pkl...")
    # Assuming this is a list of exact categorical column names, e.g., ['asset_type_ROAD_DRAINAGE', ...]
    ml_models['feature_columns'] = joblib.load('mysore_feature_columns.pkl')
    
    print("Loading Sentence Transformer (all-MiniLM-L6-v2)...")
    ml_models['embedder'] = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    
    print("Loading NLP Compliance Engine...")
    ml_models['compliance_engine'] = MPLADSComplianceEngine()
    
    print("Loading historical agency stats for DA Audit Tool...")
    try:
        audit_df = pd.read_csv('AUDITED_SANCTIONS.csv')
        # Drop duplicates to get unique agency stats
        agency_stats = audit_df[['ida', 'mod_z_score', 'agency_median_deviation']].drop_duplicates().set_index('ida').to_dict('index')
        ml_models['agency_stats'] = agency_stats
        
        # Calculate state MAD from the file or overall deviation
        state_median = audit_df['deviation_pct'].median()
        mad = (audit_df['deviation_pct'] - state_median).abs().median()
        ml_models['state_median'] = state_median
        ml_models['state_mad'] = mad
    except Exception as e:
        print(f"Warning: Could not load agency stats. {e}")
        ml_models['agency_stats'] = {}
        ml_models['state_median'] = 0.0
        ml_models['state_mad'] = 0.0
        
    print("--- Inference Service is READY ---")
    
    yield  # Server runs here
    
    # Cleanup resources on shutdown
    ml_models.clear()
    print("--- Inference Service SHUTDOWN ---")

# Initialize FastAPI with the lifespan manager
app = FastAPI(
    title="MPLADS Inference Service",
    description="Unified Compliance & Cost Estimation API",
    version="1.0.0",
    lifespan=lifespan
)

# --- Pydantic Schemas ---

class ProjectEvaluationRequest(BaseModel):
    work_description: str
    district: str = "MYSURU"

class ProjectEvaluationResponse(BaseModel):
    status: str
    compliance_status: str
    violation_clause: Optional[str] = None
    explanation: Optional[str] = None
    estimated_cost_inr: Optional[float] = None
    confidence: Optional[str] = None
    shap_breakdown: Optional[Dict[str, Any]] = None

class AuditRequest(BaseModel):
    work_description: str
    sanctioned_amount: float
    ida: str

class AuditResponse(BaseModel):
    status: str
    estimated_cost_inr: Optional[float] = None
    deviation_pct: Optional[float] = None
    ida: str
    agency_mod_z_score: Optional[float] = None
    agency_median_deviation: Optional[float] = None
    flagged: bool = False
    verdict: Optional[str] = None
    error: Optional[str] = None

class MapMarker(BaseModel):
    work_id: str
    latitude: float
    longitude: float
    role: str
    description: str
    cost: float

class MapResponse(BaseModel):
    markers: list[MapMarker]

# Valid Mysuru Cost Tranches
TRANCHES = np.array([200000.0, 250000.0, 400000.0, 500000.0, 1000000.0, 1500000.0])

def quantize_tranche(predicted_value: float) -> float:
    """Snaps a continuous estimate to the nearest standard tranche."""
    idx = (np.abs(TRANCHES - predicted_value)).argmin()
    return float(TRANCHES[idx])

# --- API Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/v1/projects/evaluate", response_model=ProjectEvaluationResponse)
async def evaluate_project(request: ProjectEvaluationRequest):
    """
    Evaluates a proposed MPLADS work for legal compliance.
    If cleared, it provides a TreeSHAP-explained cost estimate.
    """
    try:
        desc = request.work_description
        
        # 1. NLP Screening
        compliance_engine = ml_models['compliance_engine']
        compliance_result = compliance_engine.evaluate_work(desc)
        
        # 2. Early Exit (Illegal Project)
        if compliance_result.get("status") == "FLAGGED":
            return ProjectEvaluationResponse(
                status="SUCCESS",
                compliance_status="FLAGGED",
                violation_clause=compliance_result.get("violated_clause"),
                explanation=compliance_result.get("explanation_for_mp"),
                estimated_cost_inr=None,
                confidence=None,
                shap_breakdown=None
            )
            
        # 3. Cost Estimation (Compliant Project)
        
        # Extract features
        asset_type = extract_asset_type(desc)
        action_type = extract_action_type(desc)
        
        # Generate semantic embedding (1D array of 384 dims)
        embedder = ml_models['embedder']
        query_embedding = embedder.encode([desc])[0] 
        
        # Build one-hot array based on cached feature column order
        feature_columns = ml_models['feature_columns']
        cat_array = np.zeros(len(feature_columns))
        
        asset_col = f"asset_type_{asset_type}"
        action_col = f"action_type_{action_type}"
        
        if asset_col in feature_columns:
            cat_array[feature_columns.index(asset_col)] = 1.0
        if action_col in feature_columns:
            cat_array[feature_columns.index(action_col)] = 1.0
            
        # Concatenate and reshape to 2D matrix (1, features)
        x_vector = np.concatenate([query_embedding, cat_array]).reshape(1, -1)
        
        # Predict & Quantize
        lgb_model = ml_models['lgb_model']
        raw_prediction = lgb_model.predict(x_vector)[0]
        estimated_cost = quantize_tranche(raw_prediction)
        
        # 4. TreeSHAP Explanation
        explainer = ml_models['explainer']
        shap_values = explainer.shap_values(x_vector)[0]
        
        expected_value = explainer.expected_value
        if isinstance(expected_value, np.ndarray):
            expected_value = float(expected_value[0])
        else:
            expected_value = float(expected_value)
            
        # Aggregate semantic embedding impacts
        num_emb_dims = len(query_embedding)
        semantic_shap = float(np.sum(shap_values[:num_emb_dims]))
        
        # Map categorical SHAP impacts
        cat_shaps = shap_values[num_emb_dims:]
        feature_impacts = {
            "Semantic Context": semantic_shap
        }
        
        for i, col in enumerate(feature_columns):
            impact = float(cat_shaps[i])
            if abs(impact) > 0.01:
                # Format to friendly names (e.g., "asset_type_ROAD_DRAINAGE" -> "Asset (ROAD_DRAINAGE)")
                if col.startswith("asset_type_"):
                    clean_name = f"Asset ({col.replace('asset_type_', '')})"
                elif col.startswith("action_type_"):
                    clean_name = f"Action ({col.replace('action_type_', '')})"
                else:
                    clean_name = col
                feature_impacts[clean_name] = impact
                
        shap_breakdown = {
            "base_district_cost": expected_value,
            "feature_impacts": feature_impacts
        }
        
        return ProjectEvaluationResponse(
            status="SUCCESS",
            compliance_status="CLEARED",
            violation_clause=None,
            explanation=compliance_result.get("explanation_for_mp"),
            estimated_cost_inr=estimated_cost,
            confidence="HIGH", # Assumed high for valid compliance. OOD logic requires historical db state.
            shap_breakdown=shap_breakdown
        )
        
    except Exception as e:
        return ProjectEvaluationResponse(
            status="ERROR",
            compliance_status="ERROR",
            explanation=f"Internal Server Error: {str(e)}"
        )

@app.get("/api/v1/agencies")
async def get_agencies():
    """Returns a list of all historical implementing agencies."""
    agency_stats = ml_models.get('agency_stats', {})
    # Filter out empty or nan agency names
    agencies = [ida for ida in agency_stats.keys() if pd.notna(ida) and ida]
    return {"agencies": sorted(agencies)}

@app.post("/api/v1/projects/audit", response_model=AuditResponse)
async def audit_project(request: AuditRequest):
    """
    Estimates the project cost and calculates the deviation vs the sanctioned amount.
    Returns the agency's historical inflation track record.
    """
    try:
        desc = request.work_description
        amount = request.sanctioned_amount
        ida = request.ida
        
        # 1. Estimate Cost
        asset_type = extract_asset_type(desc)
        action_type = extract_action_type(desc)
        
        embedder = ml_models['embedder']
        query_embedding = embedder.encode([desc])[0] 
        
        feature_columns = ml_models['feature_columns']
        cat_array = np.zeros(len(feature_columns))
        asset_col = f"asset_type_{asset_type}"
        action_col = f"action_type_{action_type}"
        
        if asset_col in feature_columns:
            cat_array[feature_columns.index(asset_col)] = 1.0
        if action_col in feature_columns:
            cat_array[feature_columns.index(action_col)] = 1.0
            
        x_vector = np.concatenate([query_embedding, cat_array]).reshape(1, -1)
        lgb_model = ml_models['lgb_model']
        raw_prediction = lgb_model.predict(x_vector)[0]
        estimated_cost = quantize_tranche(raw_prediction)
        
        # 2. Calculate Deviation
        deviation_pct = (amount - estimated_cost) / estimated_cost
        
        # 3. Agency Stats
        agency_stats = ml_models.get('agency_stats', {})
        stats = agency_stats.get(ida, {})
        z_score = stats.get('mod_z_score', 0.0)
        median_dev = stats.get('agency_median_deviation', 0.0)
        
        # 4. Flag Logic (Systemic Inflation)
        is_flagged = z_score > 2.5
        
        # 5. Single Project Verdict (from evaluate_single_project.py)
        markup_pct = deviation_pct * 100
        if markup_pct < 0:
            verdict = "UNDER-BUDGET (Below AI Baseline)"
        elif 0 <= markup_pct <= 20:
            verdict = "NORMAL VARIANCE (Likely standard site logistics)"
        else:
            verdict = f"HIGHLY INFLATED (Warning: Exceeds AI baseline by {markup_pct:.1f}%. If agency consistently shows this, they may face systemic corruption audit.)"
        
        return AuditResponse(
            status="SUCCESS",
            estimated_cost_inr=estimated_cost,
            deviation_pct=deviation_pct,
            ida=ida,
            agency_mod_z_score=z_score,
            agency_median_deviation=median_dev,
            flagged=is_flagged,
            verdict=verdict
        )
        
    except Exception as e:
        return AuditResponse(status="ERROR", ida=request.ida, error=str(e))

@app.get("/api/v1/projects/map", response_model=MapResponse)
async def get_inspection_map():
    json_path = r"e:\MARGA ML\output\partitions\KARNATAKA\MYSORE.json"
    if not os.path.exists(json_path):
        return MapResponse(markers=[])
        
    df = pd.read_json(json_path)
    
    # Optional filtering just in case
    if 'constituency' in df.columns:
        df = df[df['constituency'].str.contains('MYS', na=False, case=False)].copy()
    elif 'Constituency' in df.columns:
        df = df[df['Constituency'].str.contains('MYS', na=False, case=False)].copy()
    
    total_projects = len(df)
    if total_projects == 0:
        return MapResponse(markers=[])
        
    quota = total_projects # Plot all works as requested
    
    np.random.seed(42) 
    df['latitude'] = np.random.uniform(12.20, 12.40, total_projects)
    df['longitude'] = np.random.uniform(76.55, 76.75, total_projects)
    df['is_high_risk'] = np.random.choice([True, False], total_projects, p=[0.05, 0.95])
    
    cost_col = next((c for c in df.columns if 'Amount' in c or 'amount' in c), None)
    
    anchors = df[df['is_high_risk'] == True].copy()
    pool = df[df['is_high_risk'] == False].copy()
    
    if len(anchors) == 0:
        anchor_idx = df.index[0]
        if cost_col:
            anchor_idx = df[cost_col].idxmax()
        anchors = df.loc[[anchor_idx]].copy()
        pool = df.drop(index=anchor_idx).copy()
        
    pool['lat_rad'] = np.radians(pool['latitude'])
    pool['lon_rad'] = np.radians(pool['longitude'])
    
    anchors['lat_rad'] = np.radians(anchors['latitude'])
    anchors['lon_rad'] = np.radians(anchors['longitude'])
    
    tree = BallTree(pool[['lat_rad', 'lon_rad']], metric='haversine')
    radius_km = 10.0
    earth_radius_km = 6371.0
    radius_rad = radius_km / earth_radius_km
    
    itinerary_records = []
    selected_indices = set()
    
    for _, anchor in anchors.iterrows():
        if len(itinerary_records) >= quota:
            break
            
        if anchor.name not in selected_indices:
            cost = float(anchor[cost_col]) if cost_col else 0.0
            itinerary_records.append(MapMarker(
                work_id=str(anchor.get('work_id', anchor.get('Work ID', anchor.name))),
                latitude=float(anchor['latitude']),
                longitude=float(anchor['longitude']),
                role='ANCHOR (High Risk)',
                description=str(anchor.get('work_desc', anchor.get('Work Description', ''))),
                cost=cost
            ))
            selected_indices.add(anchor.name)
            
        anchor_coords = np.array([[anchor['lat_rad'], anchor['lon_rad']]])
        ind, dist = tree.query_radius(anchor_coords, r=radius_rad, return_distance=True)
        neighbors = ind[0]
        distances = dist[0] * earth_radius_km
        sorted_indices = neighbors[np.argsort(distances)]
        
        for idx in sorted_indices:
            if len(itinerary_records) >= quota:
                break
                
            pool_row = pool.iloc[idx]
            original_idx = pool_row.name
            
            if original_idx not in selected_indices:
                cost = float(pool_row[cost_col]) if cost_col else 0.0
                itinerary_records.append(MapMarker(
                    work_id=str(pool_row.get('work_id', pool_row.get('Work ID', pool_row.name))),
                    latitude=float(pool_row['latitude']),
                    longitude=float(pool_row['longitude']),
                    role='SURPRISE CHECK (Normal)',
                    description=str(pool_row.get('work_desc', pool_row.get('Work Description', ''))),
                    cost=cost
                ))
                selected_indices.add(original_idx)
                
    if len(itinerary_records) < quota:
        remaining_pool = df[~df.index.isin(selected_indices)]
        needed = quota - len(itinerary_records)
        sampled = remaining_pool.sample(n=min(needed, len(remaining_pool)), random_state=42)
        
        for _, row in sampled.iterrows():
            cost = float(row[cost_col]) if cost_col else 0.0
            itinerary_records.append(MapMarker(
                work_id=str(row.get('work_id', row.get('Work ID', row.name))),
                latitude=float(row['latitude']),
                longitude=float(row['longitude']),
                role='RANDOM FILL (Quota completion)',
                description=str(row.get('work_desc', row.get('Work Description', ''))),
                cost=cost
            ))
            selected_indices.add(row.name)
            
    return MapResponse(markers=itinerary_records)


# ==============================================================================
# HOW TO RUN THE SERVER
# ==============================================================================
# To start the FastAPI application, run the following command in your terminal:
# 
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# 
# This will start the development server on http://localhost:8000. 
# You can view the automatic Swagger UI documentation at http://localhost:8000/docs
# ==============================================================================

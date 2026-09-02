import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
from sentence_transformers import SentenceTransformer

# Import feature extractors from our estimator script
from train_mysore_estimator import extract_asset_type, extract_action_type

# Terminal colors for reporting
RED = '\033[91m'
GREEN = '\033[92m'
RESET = '\033[0m'

def load_data_and_models():
    """1. Pipeline Initialization"""
    print("Loading CLEANED_SANCTIONS.json...")
    df = pd.read_json('CLEANED_SANCTIONS.json', orient='records')
    
    # Ensure we only process rows that actually have a sanctioned amount and a valid description
    df = df.dropna(subset=['sanctioned_amount', 'work_desc']).reset_index(drop=True)
    # Geo-Fencing Filter (Prevent OOD inference)
    df['work_desc'] = df['work_desc'].astype(str)
    df['state'] = df['state'].astype(str).str.strip().str.upper()
    original_count = len(df)
    
    # Filter strictly to Karnataka
    df = df[df['state'] == 'KARNATAKA'].reset_index(drop=True)
    filtered_count = len(df)
    
    # Attach diagnostic stats to the DataFrame object for reporting later
    df.attrs['diagnostic_stats'] = {
        'original_count': original_count,
        'filtered_count': filtered_count,
        'agencies_retained': df['ida'].nunique()
    }
    
    print("Loading ML models (LightGBM, Feature Columns, SentenceTransformer)...")
    lgb_model = lgb.Booster(model_file='mysore_lgb_model.txt')
    feature_cols = joblib.load('mysore_feature_columns.pkl')
    embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    
    return df, lgb_model, feature_cols, embedder

def generate_ai_baseline(df, lgb_model, feature_cols, embedder):
    """2. Generate the AI Baseline"""
    print("\nGenerating AI Baseline for all projects...")
    descriptions = df['work_desc'].tolist()
    
    # We batch encode the embeddings for speed
    print("Computing semantic embeddings (this may take a moment)...")
    embeddings = embedder.encode(descriptions, show_progress_bar=True)
    
    print("Extracting categorical features and running inference...")
    x_matrix = []
    
    for i, desc in enumerate(descriptions):
        asset_type = extract_asset_type(desc)
        action_type = extract_action_type(desc)
        
        # Build one-hot categorical array mapping to exact order of feature_columns
        cat_array = np.zeros(len(feature_cols))
        asset_col = f"asset_type_{asset_type}"
        action_col = f"action_type_{action_type}"
        
        if asset_col in feature_cols:
            cat_array[feature_cols.index(asset_col)] = 1.0
        if action_col in feature_cols:
            cat_array[feature_cols.index(action_col)] = 1.0
            
        # Concatenate embedding and categorical array
        x_vector = np.concatenate([embeddings[i], cat_array])
        x_matrix.append(x_vector)
        
    x_matrix = np.array(x_matrix)
    
    # Run bulk predict
    predicted_costs = lgb_model.predict(x_matrix)
    df['ml_predicted_cost'] = predicted_costs
    
    return df

def run_rba(df):
    """3. The Residual-Based Aggregation (RBA) Execution (MAD Refactor)"""
    print("\nExecuting Robust Residual-Based Aggregation (MAD Math Pipeline)...")
    
    # Calculate row-level residual
    df['deviation_pct'] = (df['sanctioned_amount'] - df['ml_predicted_cost']) / df['ml_predicted_cost']
    
    # Calculate Robust State Baseline (Median instead of Mean)
    state_median = df['deviation_pct'].median()
    
    # Calculate MAD (Median Absolute Deviation)
    mad = (df['deviation_pct'] - state_median).abs().median()
    
    # Group by DA (Implementing District Authority)
    agency_stats = df.groupby('ida').agg(
        project_count=('work_id', 'count'),
        agency_median_deviation=('deviation_pct', 'median')
    ).reset_index()
    
    # Calculate Modified Z-Score
    if mad == 0:
        agency_stats['mod_z_score'] = 0.0
    else:
        agency_stats['mod_z_score'] = 0.6745 * (agency_stats['agency_median_deviation'] - state_median) / mad
    
    return df, agency_stats, state_median, mad

def generate_report(df, agency_stats, state_median, mad):
    """4. Output & Reporting"""
    print("\n" + "="*95)
    print("GEO-FENCING DIAGNOSTICS")
    print("="*95)
    stats = df.attrs.get('diagnostic_stats', {})
    if stats:
        print(f"Original National Projects   : {stats['original_count']}")
        print(f"Filtered Karnataka Projects  : {stats['filtered_count']}")
        print(f"Active Agencies Retained     : {stats['agencies_retained']}")
    
    print("\n" + "="*95)
    print("STATEWIDE IMPLEMENTING AGENCY AUDIT REPORT")
    print("="*95)
    print(f"Global State Median Deviation: {state_median * 100:>6.2f}%")
    print(f"Global State MAD           : {mad * 100:>6.2f}%")
    print("-" * 95)
    
    print(f"{'AGENCY NAME':<40} | {'PROJECTS':<8} | {'MEDIAN DEV':<10} | {'MOD Z-SCORE':<11} | {'STATUS'}")
    print("-" * 95)
    
    MIN_PROJECTS_THRESHOLD = 10
    
    for _, row in agency_stats.iterrows():
        # Truncate agency name for clean formatting
        ida = str(row['ida'])[:38]
        count = row['project_count']
        median_dev = row['agency_median_deviation'] * 100
        z_score = row['mod_z_score']
        
        # Threshold logic
        if count < MIN_PROJECTS_THRESHOLD:
            z_score_display = "N/A"
            status = "[INSUFFICIENT DATA]"
            
            # Enforce 0.0 Z-score in the dataframe for export
            agency_stats.at[row.name, 'mod_z_score'] = 0.0
        elif z_score > 2.5:
            z_score_display = f"{z_score:.2f}"
            status = f"{RED}[FLAGGED FOR SYSTEMIC INFLATION]{RESET}"
        else:
            z_score_display = f"{z_score:.2f}"
            status = f"{GREEN}[CLEARED]{RESET}"
            
        print(f"{ida:<40} | {count:<8} | {median_dev:>7.2f}%   | {z_score_display:>11} | {status}")
        
    print("="*95)
    
    # Merge agency stats back to the main DataFrame
    df_out = df.merge(agency_stats[['ida', 'mod_z_score', 'agency_median_deviation']], on='ida', how='left')
    
    # Export to CSV
    out_file = "AUDITED_SANCTIONS.csv"
    df_out.to_csv(out_file, index=False)
    print(f"\nFinal enriched dataset successfully exported to {out_file}")

def main():
    try:
        df, lgb_model, feature_cols, embedder = load_data_and_models()
        df = generate_ai_baseline(df, lgb_model, feature_cols, embedder)
        df, agency_stats, state_median, mad = run_rba(df)
        generate_report(df, agency_stats, state_median, mad)
    except FileNotFoundError as e:
        print(f"{RED}Error: Could not find required file. {e}{RESET}")
        print("Please ensure CLEANED_SANCTIONS.json, mysore_lgb_model.txt, and mysore_feature_columns.pkl exist.")

if __name__ == "__main__":
    main()

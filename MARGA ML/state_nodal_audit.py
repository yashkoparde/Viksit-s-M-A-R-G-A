import json
import os
import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

# Terminal colors for reporting
RED = '\033[91m'
GREEN = '\033[92m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def generate_statewide_audit_itinerary(file_path: str) -> pd.DataFrame:
    """
    Ingests datasets, geo-fences to Karnataka, calculates the 1% meta-audit inspection 
    quota, and generates a spatially-clustered itinerary using scikit-learn's BallTree.
    """
    # 1. File Format Handling
    if not os.path.exists(file_path):
        print(f"{RED}Error: Could not find '{file_path}'{RESET}")
        return pd.DataFrame()
        
    print(f"Ingesting statewide infrastructure data from: {file_path}")
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith('.json'):
        df = pd.read_json(file_path, orient='records')
    else:
        print(f"{RED}Unsupported file format. Please provide .json or .csv{RESET}")
        return pd.DataFrame()
        
    # Ensure there is an ID column
    if 'work_id' not in df.columns:
        if 'id' in df.columns:
            df['work_id'] = df['id']
        else:
            df['work_id'] = df.index
            
    # 2. Statewide Geo-Fencing
    if 'state' in df.columns:
        original_count = len(df)
        df['state'] = df['state'].astype(str).str.strip().str.upper()
        df = df[df['state'] == 'KARNATAKA'].reset_index(drop=True)
        print(f"Geo-Fencing applied: Filtered from {original_count} national projects down to {len(df)} Karnataka projects.")
    else:
        print(f"{YELLOW}Warning: No 'state' column found. Assuming dataset is already filtered to Karnataka.{RESET}")

    # 3. Quota Calculation (1% for State Meta-Audit)
    total_projects = len(df)
    if total_projects == 0:
        print(f"{RED}Dataset is empty after filtering.{RESET}")
        return pd.DataFrame()
        
    quota = max(1, int(total_projects * 0.01))
    print(f"Total Active Projects Found: {total_projects}")
    print(f"{CYAN}Required 1% State Audit Quota: {quota} stops{RESET}")
    
    # 4. Generate Synthetic Coordinates and Risk (if missing)
    # Fixed seed for deterministic testing
    np.random.seed(42)
    
    if 'latitude' not in df.columns or 'longitude' not in df.columns:
        print("Generating synthetic spatial coordinates (Karnataka Statewide approximation)...")
        # Karnataka Approximate Box: Lat ~ 11.50 to 18.50, Lon ~ 74.00 to 78.50
        df['latitude'] = np.random.uniform(11.50, 18.50, total_projects)
        df['longitude'] = np.random.uniform(74.00, 78.50, total_projects)
        
    if 'is_high_risk' not in df.columns:
        print("Generating synthetic risk classifications (1% severe anomaly rate)...")
        # 1% probability of being flagged as a severe state-level anomaly
        df['is_high_risk'] = np.random.choice([True, False], total_projects, p=[0.01, 0.99])
        
    # 5. Anchor Separation
    anchors = df[df['is_high_risk'] == True].copy()
    pool = df[df['is_high_risk'] == False].copy()
    
    if len(anchors) == 0:
        print(f"{YELLOW}No severe state-level anchors found. Forcing the top cost project as an anchor.{RESET}")
        if 'sanctioned_amount' in df.columns:
            anchor_idx = df['sanctioned_amount'].idxmax()
        else:
            anchor_idx = df.index[0]
        anchors = df.loc[[anchor_idx]].copy()
        pool = df.drop(index=anchor_idx).copy()
        
    print(f"Severe High-Risk Anchors Identified: {len(anchors)}")
    
    # 6. Local Spatial Clustering via Haversine BallTree
    pool['lat_rad'] = np.radians(pool['latitude'])
    pool['lon_rad'] = np.radians(pool['longitude'])
    
    anchors['lat_rad'] = np.radians(anchors['latitude'])
    anchors['lon_rad'] = np.radians(anchors['longitude'])
    
    # Build BallTree over the normal pool
    tree = BallTree(pool[['lat_rad', 'lon_rad']], metric='haversine')
    
    # Query parameters (15km radius sweep for State Nodal Officers)
    radius_km = 15.0
    earth_radius_km = 6371.0
    radius_rad = radius_km / earth_radius_km
    
    itinerary_records = []
    selected_indices = set()
    
    print("\n" + "="*90)
    print("STATEWIDE SPATIAL ITINERARY ROUTING (15KM REGIONAL SWEEP RADIUS)")
    print("="*90)
    
    for _, anchor in anchors.iterrows():
        if len(itinerary_records) >= quota:
            break
            
        # Register the anchor stop
        if anchor.name not in selected_indices:
            itinerary_records.append({
                'work_id': anchor['work_id'],
                'role': 'STATE ANCHOR (Severe Risk)',
                'latitude': anchor['latitude'],
                'longitude': anchor['longitude']
            })
            selected_indices.add(anchor.name)
            print(f"\n📍 {RED}STATE ANCHOR: Project {anchor['work_id']}{RESET} (Lat: {anchor['latitude']:.4f}, Lon: {anchor['longitude']:.4f})")
            
        # Query the BallTree for normal projects within 15km of this state anchor
        anchor_coords = np.array([[anchor['lat_rad'], anchor['lon_rad']]])
        ind, dist = tree.query_radius(anchor_coords, r=radius_rad, return_distance=True)
        
        # Sort neighbors by distance to plan an efficient regional sweep
        neighbors = ind[0]
        distances = dist[0] * earth_radius_km
        sorted_indices = neighbors[np.argsort(distances)]
        
        for idx in sorted_indices:
            if len(itinerary_records) >= quota:
                break
                
            pool_row = pool.iloc[idx]
            original_idx = pool_row.name
            
            if original_idx not in selected_indices:
                itinerary_records.append({
                    'work_id': pool_row['work_id'],
                    'role': 'STATE SURPRISE CHECK (Normal)',
                    'latitude': pool_row['latitude'],
                    'longitude': pool_row['longitude']
                })
                selected_indices.add(original_idx)
                
                dist_km = distances[np.where(neighbors == idx)[0][0]]
                print(f"   ├── 🔍 {GREEN}STATE SURPRISE CHECK: Project {pool_row['work_id']}{RESET} ({dist_km:.2f} km away)")
                
    # 7. Fallback Quota Completion
    if len(itinerary_records) < quota:
        remaining_pool = df[~df.index.isin(selected_indices)]
        needed = quota - len(itinerary_records)
        sampled = remaining_pool.sample(n=min(needed, len(remaining_pool)), random_state=42)
        
        for _, row in sampled.iterrows():
            itinerary_records.append({
                'work_id': row['work_id'],
                'role': 'RANDOM STATE FILL (Quota completion)',
                'latitude': row['latitude'],
                'longitude': row['longitude']
            })
            print(f"\n🎲 {YELLOW}RANDOM CHECK: Project {row['work_id']} (Quota Completion){RESET}")

    print("="*90)
    print(f"State Itinerary Finalized. {CYAN}Total stops: {len(itinerary_records)} / {quota}{RESET}\n")
    
    return pd.DataFrame(itinerary_records)

if __name__ == "__main__":
    target_file = "CLEANED_SANCTIONS.json"
    
    # Fallback to local files if CLEANED_SANCTIONS missing
    if not os.path.exists(target_file):
        if os.path.exists("MYSORE_2.json"):
             target_file = "MYSORE_2.json"
        elif os.path.exists("MYSORE.json"):
             target_file = "MYSORE.json"
             
    final_itinerary_df = generate_statewide_audit_itinerary(target_file)
    
    if not final_itinerary_df.empty:
        out_csv = "STATE_NODAL_OFFICER_ITINERARY.csv"
        final_itinerary_df.to_csv(out_csv, index=False)
        print(f"Itinerary successfully exported to {out_csv} for the State Nodal Officer.")

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

def generate_local_inspection_itinerary(file_path: str) -> pd.DataFrame:
    """
    Calculates the 10% field inspection quota and generates a spatially-clustered 
    itinerary using scikit-learn's BallTree with the Haversine metric.
    """
    # 1. File Format Handling
    if not os.path.exists(file_path):
        print(f"{RED}Error: Could not find '{file_path}'{RESET}")
        return pd.DataFrame()
        
    print(f"Ingesting infrastructure data from: {file_path}")
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
            
    # 2. Quota Calculation
    total_projects = len(df)
    if total_projects == 0:
        print("Dataset is empty.")
        return pd.DataFrame()
        
    quota = max(1, int(total_projects * 0.10))
    print(f"Total Projects Found: {total_projects}")
    print(f"{CYAN}Required 10% Inspection Quota: {quota} stops{RESET}")
    
    # 3. Generate Synthetic Coordinates and Risk (if missing)
    # Using fixed seeds for deterministic testing
    np.random.seed(42)
    
    if 'latitude' not in df.columns or 'longitude' not in df.columns:
        print("Generating synthetic spatial coordinates (Mysuru Bounding Box)...")
        # Mysuru Box: Lat ~ 12.20 to 12.40, Lon ~ 76.55 to 76.75
        df['latitude'] = np.random.uniform(12.20, 12.40, total_projects)
        df['longitude'] = np.random.uniform(76.55, 76.75, total_projects)
        
    if 'is_high_risk' not in df.columns:
        print("Generating synthetic risk classifications (5% anomaly rate)...")
        # 5% probability of being flagged as a high-risk anomaly
        df['is_high_risk'] = np.random.choice([True, False], total_projects, p=[0.05, 0.95])
        
    # 4. Anchor Separation
    anchors = df[df['is_high_risk'] == True].copy()
    pool = df[df['is_high_risk'] == False].copy()
    
    if len(anchors) == 0:
        print(f"{YELLOW}No high-risk anchors found. Forcing the top cost project as an anchor.{RESET}")
        if 'sanctioned_amount' in df.columns:
            anchor_idx = df['sanctioned_amount'].idxmax()
        else:
            anchor_idx = df.index[0]
        anchors = df.loc[[anchor_idx]].copy()
        pool = df.drop(index=anchor_idx).copy()
        
    print(f"High-Risk Anchors Identified: {len(anchors)}")
    
    # 5. Local Spatial Clustering via Haversine BallTree
    # Haversine requires coordinates in radians
    pool['lat_rad'] = np.radians(pool['latitude'])
    pool['lon_rad'] = np.radians(pool['longitude'])
    
    anchors['lat_rad'] = np.radians(anchors['latitude'])
    anchors['lon_rad'] = np.radians(anchors['longitude'])
    
    # Build BallTree over the normal pool
    tree = BallTree(pool[['lat_rad', 'lon_rad']], metric='haversine')
    
    # Query parameters
    radius_km = 10.0
    earth_radius_km = 6371.0
    radius_rad = radius_km / earth_radius_km
    
    itinerary_records = []
    selected_indices = set()
    
    print("\n" + "="*80)
    print("SPATIAL ITINERARY ROUTING (10KM RADIUS CLUSTERING)")
    print("="*80)
    
    for _, anchor in anchors.iterrows():
        if len(itinerary_records) >= quota:
            break
            
        # Register the anchor stop
        if anchor.name not in selected_indices:
            itinerary_records.append({
                'work_id': anchor['work_id'],
                'role': 'ANCHOR (High Risk)',
                'latitude': anchor['latitude'],
                'longitude': anchor['longitude']
            })
            selected_indices.add(anchor.name)
            print(f"\n📍 {RED}ANCHOR: Project {anchor['work_id']}{RESET} (Lat: {anchor['latitude']:.4f}, Lon: {anchor['longitude']:.4f})")
            
        # Query the BallTree for normal projects within 10km of this anchor
        anchor_coords = np.array([[anchor['lat_rad'], anchor['lon_rad']]])
        ind, dist = tree.query_radius(anchor_coords, r=radius_rad, return_distance=True)
        
        # Sort neighbors by distance to plan an efficient local sweep
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
                    'role': 'SURPRISE CHECK (Normal)',
                    'latitude': pool_row['latitude'],
                    'longitude': pool_row['longitude']
                })
                selected_indices.add(original_idx)
                
                # Fetch exact distance in KM for printing
                dist_km = distances[np.where(neighbors == idx)[0][0]]
                print(f"   ├── 🔍 {GREEN}SURPRISE CHECK: Project {pool_row['work_id']}{RESET} ({dist_km:.2f} km away)")
                
    # 6. Fallback Quota Completion
    # If the spatial clusters didn't yield enough projects to hit the 10% quota
    if len(itinerary_records) < quota:
        remaining_pool = df[~df.index.isin(selected_indices)]
        needed = quota - len(itinerary_records)
        sampled = remaining_pool.sample(n=min(needed, len(remaining_pool)), random_state=42)
        
        for _, row in sampled.iterrows():
            itinerary_records.append({
                'work_id': row['work_id'],
                'role': 'RANDOM FILL (Quota completion)',
                'latitude': row['latitude'],
                'longitude': row['longitude']
            })
            print(f"\n🎲 {YELLOW}RANDOM CHECK: Project {row['work_id']} (Quota Completion){RESET}")

    print("="*80)
    print(f"Itinerary Finalized. {CYAN}Total stops: {len(itinerary_records)} / {quota}{RESET}\n")
    
    return pd.DataFrame(itinerary_records)

if __name__ == "__main__":
    # Pointing to the known dataset from previous interactions
    target_file = "output/partitions/KARNATAKA/MYSORE.json"
    
    # Robust fallback checks in case the user runs this in different directory roots
    if not os.path.exists(target_file):
        if os.path.exists("MYSORE.json"):
            target_file = "MYSORE.json"
        elif os.path.exists("CLEANED_SANCTIONS.json"):
            target_file = "CLEANED_SANCTIONS.json"
            
    final_itinerary_df = generate_local_inspection_itinerary(target_file)
    
    # Optionally save the result
    if not final_itinerary_df.empty:
        out_csv = "FIELD_INSPECTION_ITINERARY.csv"
        final_itinerary_df.to_csv(out_csv, index=False)
        print(f"Itinerary successfully exported to {out_csv} for the Mobile App.")

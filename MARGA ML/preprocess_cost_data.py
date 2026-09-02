import argparse
import json
import logging
import os
import re
from typing import Dict, Any

import numpy as np
import pandas as pd
from dateutil.parser import parse

# Configure anomaly logger
anomalies_logger = logging.getLogger("anomalies")
anomalies_logger.setLevel(logging.INFO)
file_handler = logging.FileHandler("anomalies.log")
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(message)s'))
anomalies_logger.addHandler(file_handler)

def clean_column_names(columns: pd.Index) -> Dict[str, str]:
    """Map raw column headers to normalized snake_case keys."""
    mapping = {}
    for col in columns:
        clean_col = str(col).strip().lower()
        if clean_col.startswith('work id') or clean_col == 'work_id':
            mapping[col] = 'work_id'
        elif clean_col.startswith('work desc'):
            mapping[col] = 'work_desc'
        elif clean_col.startswith('category'):
            mapping[col] = 'category'
        elif clean_col.startswith('mp name'):
            mapping[col] = 'mp_name'
        elif clean_col.startswith('constituer') or clean_col.startswith('constituency'):
            mapping[col] = 'constituency'
        elif clean_col.startswith('state'):
            mapping[col] = 'state'
        elif clean_col.startswith('house'):
            mapping[col] = 'house'
        elif clean_col.startswith('final amou'):
            mapping[col] = 'final_amount'
        elif clean_col.startswith('completed'):
            mapping[col] = 'completed_date'
        elif clean_col.startswith('has image'):
            mapping[col] = 'has_image'
        elif clean_col.startswith('average rating'):
            mapping[col] = 'average_rating'
        elif clean_col.startswith('ida'):
            mapping[col] = 'ida'
        else:
            mapping[col] = re.sub(r'[^a-z0-9_]', '_', clean_col)
    return mapping

def clean_amount(val: Any) -> float:
    """Sanitize and extract final amounts, stripping currency and commas."""
    if pd.isna(val):
        return np.nan
    val_str = str(val).replace(',', '').replace('₹', '').replace('Rs', '').replace('rs', '').strip()
    val_str = re.sub(r'[^\d.-]', '', val_str)
    try:
        return float(val_str)
    except ValueError:
        return np.nan

def clean_text(text: Any) -> Any:
    """Remove extraneous double spaces and unprintable characters while preserving exact casing."""
    if pd.isna(text):
        return None
    text = str(text)
    # Remove unprintable characters
    text = "".join(char for char in text if char.isprintable())
    # Remove extra spaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text if text else None

def extract_agency(ida_str: Any) -> Any:
    """Extract a sanitized agency tag if enclosed in parentheses."""
    if pd.isna(ida_str):
        return None
    ida_str = str(ida_str)
    match = re.search(r'\((.*?)\)', ida_str)
    if match:
        return match.group(1).strip()
    return None

def parse_date(date_val: Any) -> Any:
    """Parse date strings robustly, returning pd.NaT on failure."""
    if pd.isna(date_val):
        return pd.NaT
    try:
        return parse(str(date_val))
    except (ValueError, TypeError):
        return pd.NaT

class ProjectDataPipeline:
    def __init__(self, input_csv: str, output_json: str, split_files: bool):
        self.input_csv = input_csv
        self.output_json = output_json
        self.split_files = split_files
        self.total_rows = 0
        self.valid_rows = 0
        self.dropped_rows = 0
        
    def process(self):
        print(f"Reading data from {self.input_csv}...")
        if not os.path.exists(self.input_csv):
            print(f"Error: Input file {self.input_csv} does not exist.")
            return

        try:
            df = pd.read_csv(self.input_csv)
        except Exception as e:
            print(f"Error reading CSV: {e}")
            return
            
        self.total_rows = len(df)
        
        # 1. Column Normalization
        col_mapping = clean_column_names(df.columns)
        df.rename(columns=col_mapping, inplace=True)
        
        # Ensure all expected columns exist to avoid KeyErrors
        expected_cols = ['work_id', 'work_desc', 'category', 'mp_name', 'constituency', 
                         'state', 'house', 'final_amount', 'completed_date', 'has_image', 
                         'average_rating', 'ida']
                         
        for col in expected_cols:
            if col not in df.columns:
                df[col] = np.nan
                
        # 2. Entity & Categorical Cleaning
        df['state'] = df['state'].apply(lambda x: str(x).upper().strip() if not pd.isna(x) else np.nan)
        df['constituency'] = df['constituency'].apply(lambda x: str(x).upper().strip() if not pd.isna(x) else np.nan)
        df['ida_agency'] = df['ida'].apply(extract_agency)
        
        # 3. Numeric & Currency Sanitization
        df['final_amount'] = df['final_amount'].apply(clean_amount)
        
        # Anomaly detection for amounts
        anomalies_mask = df['final_amount'].isna() | (df['final_amount'] < 0)
        anomalies = df[anomalies_mask]
        
        if not anomalies.empty:
            self.dropped_rows = len(anomalies)
            for _, row in anomalies.iterrows():
                work_id = row.get('work_id', 'Unknown')
                amount = row.get('final_amount', 'NaN')
                anomalies_logger.info(f"Dropped row: Work ID {work_id} - Invalid final_amount: {amount}")
        
        df = df[~anomalies_mask].copy()
        self.valid_rows = len(df)
        
        if self.valid_rows == 0:
            print("No valid rows left to process after filtering anomalies.")
            return

        # 4. Temporal Feature Extraction
        parsed_dates = df['completed_date'].apply(parse_date)
        df['completed_date'] = parsed_dates.dt.strftime('%Y-%m-%d')
        df['completion_year'] = parsed_dates.dt.year.astype('Int64')
        df['completion_month'] = parsed_dates.dt.month.astype('Int64')
        df['completion_quarter'] = parsed_dates.dt.quarter.astype('Int64')
        df['is_fy_end'] = df['completion_month'] == 3
        
        # 5. Boolean & Text Hygiene
        df['has_image'] = df['has_image'].apply(lambda x: True if str(x).strip().lower() == 'true' else False)
        df['work_desc'] = df['work_desc'].apply(clean_text)
        
        # Replace NaN/NaT with None for JSON serialization
        df = df.replace({np.nan: None, pd.NaT: None})
        
        # Generate Hierarchical JSON
        hierarchy = {}
        unique_states = set()
        unique_const = set()
        
        for _, row in df.iterrows():
            state = row['state']
            const = row['constituency']
            
            if not state or not const:
                continue
                
            unique_states.add(state)
            unique_const.add(f"{state}_{const}")
            
            if state not in hierarchy:
                hierarchy[state] = {}
            if const not in hierarchy[state]:
                hierarchy[state][const] = []
                
            record = row.to_dict()
            # Clean up any remaining NaN/NaT explicitly
            for k, v in record.items():
                if pd.isna(v):
                    record[k] = None
                    
            hierarchy[state][const].append(record)
            
        import datetime
        metadata = {
            "total_records": self.valid_rows,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "states_count": len(unique_states),
            "total_constituencies": len(unique_const)
        }
        
        master_json = {
            "metadata": metadata,
            "data": hierarchy
        }
        
        output_dir = os.path.dirname(self.output_json)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
        with open(self.output_json, 'w', encoding='utf-8') as f:
            json.dump(master_json, f, indent=2, ensure_ascii=False)
            
        partitions_dir = None
        if self.split_files:
            partitions_dir = os.path.join(output_dir if output_dir else '.', "partitions")
            for state, constituencies in hierarchy.items():
                for const, records in constituencies.items():
                    const_dir = os.path.join(partitions_dir, str(state).replace(' ', '_'))
                    os.makedirs(const_dir, exist_ok=True)
                    const_file = os.path.join(const_dir, f"{str(const).replace(' ', '_')}.json")
                    with open(const_file, 'w', encoding='utf-8') as f:
                        json.dump(records, f, indent=2, ensure_ascii=False)
                        
        print("\n--- Summary ---")
        print(f"Total rows ingested:        {self.total_rows}")
        print(f"Valid rows processed:       {self.valid_rows}")
        print(f"Anomalous rows dropped:     {self.dropped_rows}")
        print(f"Unique states detected:     {len(unique_states)}")
        print(f"Unique constituencies:      {len(unique_const)}")
        print(f"Master JSON saved to:       {self.output_json}")
        if self.split_files:
            print(f"Partitioned files saved to: {partitions_dir}")


def main():
    parser = argparse.ArgumentParser(description="Preprocess MPLADS/eSAKSHI records for ML downstream tasks.")
    parser.add_argument("--input-csv", type=str, default="data.csv", help="Path to raw CSV")
    parser.add_argument("--output-json", type=str, default="output/clean_mplads_data.json", help="Path to master JSON")
    parser.add_argument("--split-files", action="store_true", help="Emit partitioned state/constituency files")
    
    args = parser.parse_args()
    
    pipeline = ProjectDataPipeline(
        input_csv=args.input_csv,
        output_json=args.output_json,
        split_files=args.split_files
    )
    pipeline.process()

if __name__ == "__main__":
    main()

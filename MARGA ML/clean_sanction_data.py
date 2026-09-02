import re
import sys
import pandas as pd
import numpy as np

class SanctionDataCleaner:
    def __init__(self, raw_df: pd.DataFrame):
        self.df = raw_df.copy()

    def clean(self) -> pd.DataFrame:
        """Executes the full cleaning pipeline on the raw DataFrame."""
        # 1. Drop Redundant Columns
        if 'Sr. No.' in self.df.columns:
            self.df = self.df.drop(columns=['Sr. No.'])

        # 2. Standardize Column Names
        column_mapping = {
            'Work category': 'category',
            'Work': 'raw_work',
            'State': 'state',
            'IDA': 'ida',
            'Hon\'ble Members of Parliament': 'mp_name',
            'Constituency': 'constituency',
            'Work description': 'work_desc',
            'Recommended date': 'recommended_date',
            'Sanction Date': 'sanction_date',
            'Sanction Amount ( ₹ )': 'sanctioned_amount',
            'Work Status': 'status'
        }
        self.df = self.df.rename(columns=column_mapping)

        # 3. Extract work_id via Regex
        def extract_id(val):
            if pd.isna(val):
                return None
            match = re.search(r'/(\d{6})-?', str(val))
            if match:
                return int(match.group(1))
            return None
            
        if 'raw_work' in self.df.columns:
            self.df['work_id'] = self.df['raw_work'].apply(extract_id)
            # Ensure nullable integer type
            self.df['work_id'] = self.df['work_id'].astype('Int64')
            self.df = self.df.drop(columns=['raw_work'])

        # 4. Numeric Sanitization
        def clean_amount(val):
            if pd.isna(val):
                return np.nan
            val_str = str(val).replace(',', '').replace(' ', '').replace('₹', '')
            try:
                return float(val_str)
            except ValueError:
                return np.nan
                
        if 'sanctioned_amount' in self.df.columns:
            self.df['sanctioned_amount'] = self.df['sanctioned_amount'].apply(clean_amount)

        # 5. Temporal Feature Extraction
        def parse_date(val):
            if pd.isna(val) or str(val).strip() == '':
                return pd.NaT
            try:
                # Standard format from sample: 08-Jul-2024
                return pd.to_datetime(val, format='%d-%b-%Y')
            except ValueError:
                try:
                    return pd.to_datetime(val)
                except Exception:
                    return pd.NaT

        if 'recommended_date' in self.df.columns and 'sanction_date' in self.df.columns:
            self.df['recommended_date'] = self.df['recommended_date'].apply(parse_date)
            self.df['sanction_date'] = self.df['sanction_date'].apply(parse_date)

            # Calculate absolute difference in days
            self.df['sanction_delay_days'] = (self.df['sanction_date'] - self.df['recommended_date']).dt.days.abs()

            # Format to ISO standard strings
            self.df['recommended_date'] = self.df['recommended_date'].dt.strftime('%Y-%m-%d')
            self.df['sanction_date'] = self.df['sanction_date'].dt.strftime('%Y-%m-%d')
            
            # Convert delay days to nullable integers
            self.df['sanction_delay_days'] = self.df['sanction_delay_days'].astype('Int64')

        # 6. Text Hygiene
        text_cols = ['work_desc', 'ida', 'constituency']
        for col in text_cols:
            if col in self.df.columns:
                self.df[col] = self.df[col].apply(lambda x: str(x).strip() if pd.notna(x) else x)

        # Reorder columns to put work_id first
        cols_order = ['work_id'] + [c for c in self.df.columns if c != 'work_id']
        self.df = self.df[[c for c in cols_order if c in self.df.columns]]

        return self.df


def main():
    # If a file path is passed via CLI, process the real file
    if len(sys.argv) > 1:
        input_csv = sys.argv[1]
        print(f"Reading raw data from {input_csv}...")
        try:
            raw_df = pd.read_csv(input_csv)
            cleaner = SanctionDataCleaner(raw_df)
            clean_df = cleaner.clean()
            
            out_file = "CLEANED_SANCTIONS.json"
            clean_df.to_json(out_file, orient="records", indent=2)
            print(f"Successfully processed {len(clean_df)} records and saved to {out_file}")
            
        except Exception as e:
            print(f"Error processing {input_csv}: {e}")
            
    else:
        # ---------------------------------------------------------
        # Mock Demonstration Block (Default Behavior)
        # ---------------------------------------------------------
        print("No input CSV provided via CLI. Running demonstration with mock data...")
        
        mock_data = {
            "Sr. No.": ["1", "2", "3"],
            "Work category": ["Normal/Others", "Trust and Society", "Trust and Society"],
            "Work": [
                "WS/\t MP620/2024-2025/133166-Construction of buildings for community cultural activities",
                "WS/\t MP620/2025-2026/133167-Construction of rooms and halls in school and colleges",
                "WS/\t MP620/2024-2025/133190-Construction of buildings for community cultural activities"
            ],
            "State": ["Karnataka", "Karnataka", "Karnataka"],
            "IDA": ["DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)", "DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)", "DHARWAD(DEPUTY COMMISSIONER DHARWAR_IDA)"],
            "Hon'ble Members of Parliament": ["Pralhad Venkatesh Joshi", "Pralhad Venkatesh Joshi", "Pralhad Venkatesh Joshi"],
            "Constituency": ["DHARWAD", "DHARWAD", "DHARWAD"],
            "Work description": [
                "Construction of Community Bhavan at Navalgund TQ Belavatagi Village Pry No 1/A Near Shivanand Math Continue Work",
                "Construction of College room of  CBS Charitable Foudation at Nulvi Vilage Pry No 817/3 Continued work",
                "Construction of Community Bhavan of Veerashaiv Jangam Society (R) at Ward No 21 Chidamarnagar Dharwad"
            ],
            "Recommended date": ["08-Jul-2024", "08-Jul-2024", "08-Jul-2024"],
            "Sanction Date": ["09-Jul-2024", "18-Sep-2025", "23-Sep-2024"],
            "Sanction Amount ( ₹ )": ["497185", "500000", "450000"],
            "Work Status": ["Physical Inspection", "Sanction", "Sanction"]
        }
        
        raw_df = pd.DataFrame(mock_data)
        
        print("\n" + "="*80)
        print("RAW MOCK DATA (Before Cleaning)")
        print("="*80)
        print(raw_df[['Work', 'Recommended date', 'Sanction Date']].head())
        
        # Execute the pipeline
        cleaner = SanctionDataCleaner(raw_df)
        clean_df = cleaner.clean()
        
        print("\n" + "="*80)
        print("CLEANED DATA (After Regex Extraction & Temporal Math)")
        print("="*80)
        print(clean_df[['work_id', 'recommended_date', 'sanction_date', 'sanction_delay_days', 'sanctioned_amount']].head())
        
        out_file = "CLEANED_SANCTIONS.json"
        clean_df.to_json(out_file, orient="records", indent=2)
        print(f"\nSuccessfully exported the cleaned test data to {out_file}")

if __name__ == "__main__":
    main()

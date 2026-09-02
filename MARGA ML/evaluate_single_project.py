import numpy as np
import lightgbm as lgb
import joblib
from sentence_transformers import SentenceTransformer

# Import feature extractors from our estimator script
from train_mysore_estimator import extract_asset_type, extract_action_type

# Terminal colors for reporting
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
RESET = '\033[0m'

# Valid Mysuru Cost Tranches
TRANCHES = np.array([200000.0, 250000.0, 400000.0, 500000.0, 1000000.0, 1500000.0])

def quantize_tranche(predicted_value: float) -> float:
    """Snaps a continuous estimate to the nearest standard tranche."""
    idx = (np.abs(TRANCHES - predicted_value)).argmin()
    return float(TRANCHES[idx])

def main():
    print("="*65)
    print("INITIALIZING MPLADS SINGLE-PROJECT AUDIT TOOL")
    print("="*65)
    
    # 1. Pipeline Initialization
    try:
        print("Loading LightGBM model (`mysore_lgb_model.txt`)...")
        lgb_model = lgb.Booster(model_file='mysore_lgb_model.txt')
        
        print("Loading feature columns (`mysore_feature_columns.pkl`)...")
        feature_cols = joblib.load('mysore_feature_columns.pkl')
        
        print("Loading Sentence Transformer (`all-MiniLM-L6-v2`)...")
        embedder = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    except Exception as e:
        print(f"{RED}Initialization Error: {e}{RESET}")
        print("Ensure 'mysore_lgb_model.txt' and 'mysore_feature_columns.pkl' exist in the directory.")
        return

    print(f"{GREEN}System Ready.{RESET}\n")
    
    # 2. The Interactive Loop
    while True:
        try:
            work_description = input("\nEnter the work description (or 'quit' to exit): ").strip()
            if work_description.lower() in ['quit', 'exit', 'q']:
                print("Exiting tool...")
                break
                
            if not work_description:
                print(f"{YELLOW}Description cannot be empty.{RESET}")
                continue
                
            sanctioned_amount_str = input("Enter the DA's Sanctioned Amount (₹): ").strip()
            # Handle potential commas gracefully
            sanctioned_amount = float(sanctioned_amount_str.replace(',', ''))
            
            # 3. Prediction & Math Logic
            asset_type = extract_asset_type(work_description)
            action_type = extract_action_type(work_description)
            
            # Generate semantic embedding
            query_embedding = embedder.encode([work_description], show_progress_bar=False)[0]
            
            # Build one-hot categorical array mapping
            cat_array = np.zeros(len(feature_cols))
            asset_col = f"asset_type_{asset_type}"
            action_col = f"action_type_{action_type}"
            
            if asset_col in feature_cols:
                cat_array[feature_cols.index(asset_col)] = 1.0
            if action_col in feature_cols:
                cat_array[feature_cols.index(action_col)] = 1.0
                
            # Concatenate embedding and categorical array (1, N shape)
            x_vector = np.concatenate([query_embedding, cat_array]).reshape(1, -1)
            
            # Predict and Quantize to historical tranches
            raw_prediction = lgb_model.predict(x_vector)[0]
            ml_predicted_cost = quantize_tranche(raw_prediction)
            
            # Calculate Markup percentage
            markup_pct = ((sanctioned_amount - ml_predicted_cost) / ml_predicted_cost) * 100
            
            # 4. Terminal Output & Verdict
            print("\n" + "="*65)
            print("PROJECT AUDIT REPORT")
            print("="*65)
            print(f"AI Baseline Cost   : ₹ {ml_predicted_cost:,.2f}")
            print(f"Sanctioned Amount  : ₹ {sanctioned_amount:,.2f}")
            
            # Format markup string with an explicit sign
            markup_str = f"+{markup_pct:.1f}%" if markup_pct > 0 else f"{markup_pct:.1f}%"
            print(f"Calculated Markup  : {markup_str}")
            print("-" * 65)
            
            if markup_pct < 0:
                print(f"{GREEN}[VERDICT: UNDER-BUDGET (Below AI Baseline)]{RESET}")
            elif 0 <= markup_pct <= 20:
                print(f"{YELLOW}[VERDICT: NORMAL VARIANCE (Likely standard site logistics)]{RESET}")
            else:
                print(f"{RED}[VERDICT: HIGHLY INFLATED] - Warning: This project exceeds the AI baseline by {markup_pct:.1f}%. If this agency consistently shows markups this high across 10+ projects, they will trigger a systemic corruption audit.{RESET}")
            print("="*65)
            
        except ValueError:
            print(f"{RED}Invalid input. Please ensure the Sanctioned Amount is a valid number.{RESET}")
        except KeyboardInterrupt:
            print("\nExiting tool...")
            break
        except Exception as e:
            print(f"{RED}An error occurred during evaluation: {e}{RESET}")

if __name__ == "__main__":
    main()

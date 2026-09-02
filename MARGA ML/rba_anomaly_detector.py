import json
import numpy as np
import pandas as pd

class SanctionAuditEngine:
    def __init__(self, state_history_df: pd.DataFrame):
        """
        Initializes the engine with the historical ledger containing columns:
        project_id, agency_id, ml_predicted_cost, sanctioned_amount
        """
        self.state_history_df = state_history_df.copy()
        
        # 1. Project Residuals (Historical Data)
        self.state_history_df['deviation_pct'] = (
            self.state_history_df['sanctioned_amount'] - self.state_history_df['ml_predicted_cost']
        ) / self.state_history_df['ml_predicted_cost']
        
        # 3. State Baseline
        self.state_mean_deviation = self.state_history_df['deviation_pct'].mean()
        self.state_std_deviation = self.state_history_df['deviation_pct'].std()
        
        # Pre-compute agency historical means
        self.agency_means = self.state_history_df.groupby('agency_id')['deviation_pct'].mean()

    def evaluate_sanction(self, project_id: str, agency_id: str, sanctioned_amount: float, ml_predicted_cost: float) -> dict:
        """
        Executes the RBA pipeline for a newly submitted sanction.
        """
        # 1. New Project Residual
        project_deviation_pct = (sanctioned_amount - ml_predicted_cost) / ml_predicted_cost
        
        # 2. Entity Aggregation
        if agency_id in self.agency_means:
            agency_mean_deviation = self.agency_means[agency_id]
        else:
            # Fallback if the agency has absolutely no history
            agency_mean_deviation = project_deviation_pct
            
        # 4. Z-Score Calculation
        if self.state_std_deviation == 0 or pd.isna(self.state_std_deviation):
            z_score = 0.0
        else:
            z_score = (agency_mean_deviation - self.state_mean_deviation) / self.state_std_deviation
            
        # 5. Threshold
        is_flagged = z_score > 3.0
        status = "FLAGGED" if is_flagged else "CLEARED"
        
        if is_flagged:
            explanation = (
                f"Over its historical projects, {agency_id} sanctioned budgets "
                f"{agency_mean_deviation * 100:.1f}% higher than the ML-predicted baseline, "
                f"deviating {z_score:.2f} standard deviations from the state norm."
            )
        else:
            explanation = (
                f"{agency_id} operates within normal state variances "
                f"(Z-Score: {z_score:.2f}, Historical Mean: {agency_mean_deviation * 100:.1f}%)."
            )
            
        return {
            "project_id": project_id,
            "agency_id": agency_id,
            "status": status,
            "project_deviation_pct": round(project_deviation_pct, 4),
            "agency_historical_mean": round(agency_mean_deviation, 4),
            "agency_z_score": round(z_score, 2),
            "explanation": explanation
        }

if __name__ == "__main__":
    # ==========================================
    # 1. Mock Data Generation
    # ==========================================
    np.random.seed(42)
    
    # AGENCY_CLEAN: 50 historical projects, mean deviation ~ +2%
    clean_ml_costs = np.random.uniform(200000, 1500000, 50)
    clean_deviations = np.random.normal(0.02, 0.01, 50)
    clean_sanctioned = clean_ml_costs * (1 + clean_deviations)
    
    # AGENCY_CORRUPT: 50 historical projects, mean deviation ~ +19%
    corrupt_ml_costs = np.random.uniform(200000, 1500000, 50)
    corrupt_deviations = np.random.normal(0.19, 0.01, 50)
    corrupt_sanctioned = corrupt_ml_costs * (1 + corrupt_deviations)
    
    # AGENCY_OTHER (State Baseline padding): 400 projects, mean deviation ~ +3%
    other_ml_costs = np.random.uniform(200000, 1500000, 400)
    other_deviations = np.random.normal(0.03, 0.02, 400)
    other_sanctioned = other_ml_costs * (1 + other_deviations)
    
    # Combine into DataFrame
    data = []
    for i in range(50):
        data.append({"project_id": f"CLN-{i}", "agency_id": "AGENCY_CLEAN", "ml_predicted_cost": clean_ml_costs[i], "sanctioned_amount": clean_sanctioned[i]})
        data.append({"project_id": f"CRP-{i}", "agency_id": "AGENCY_CORRUPT", "ml_predicted_cost": corrupt_ml_costs[i], "sanctioned_amount": corrupt_sanctioned[i]})
    
    for i in range(400):
        data.append({"project_id": f"OTH-{i}", "agency_id": "AGENCY_OTHER", "ml_predicted_cost": other_ml_costs[i], "sanctioned_amount": other_sanctioned[i]})
        
    history_df = pd.DataFrame(data)
    
    # ==========================================
    # 2. Instantiate the Engine
    # ==========================================
    print("\nInitializing SanctionAuditEngine with historical state ledger...")
    engine = SanctionAuditEngine(history_df)
    
    print(f"Global State Mean Deviation: {engine.state_mean_deviation * 100:.2f}%")
    print(f"Global State Std Deviation : {engine.state_std_deviation * 100:.2f}%")
    
    # ==========================================
    # 3. Testing AGENCY_CLEAN
    # ==========================================
    print("\n" + "="*80)
    print("TESTING AGENCY_CLEAN (Single Project Deviates Highly, But History is Clean)")
    print("="*80)
    
    # Scenario: The ML predicts 500k, but the agency sanctions 575k (+15%).
    # Because their *historical* mean is safe, RBA protects them from a false positive.
    clean_eval = engine.evaluate_sanction(
        project_id="PROJ-NEW-CLN",
        agency_id="AGENCY_CLEAN",
        ml_predicted_cost=500000.0,
        sanctioned_amount=575000.0
    )
    print(json.dumps(clean_eval, indent=2))
    
    # ==========================================
    # 4. Testing AGENCY_CORRUPT
    # ==========================================
    print("\n" + "="*80)
    print("TESTING AGENCY_CORRUPT (Single Project is Normal, But History is Corrupt)")
    print("="*80)
    
    # Scenario: The ML predicts 500k, and the agency sanctions exactly 500k (+0%).
    # Because their *historical* mean is wildly inflated, RBA still flags them for an audit.
    corrupt_eval = engine.evaluate_sanction(
        project_id="PROJ-NEW-CRP",
        agency_id="AGENCY_CORRUPT",
        ml_predicted_cost=500000.0,
        sanctioned_amount=500000.0 
    )
    print(json.dumps(corrupt_eval, indent=2))
    print("-" * 80)

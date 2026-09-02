
---

### Copy-Paste Prompt for the AI Coding Model

```markdown
You are a senior data engineer and ML pipelines architect. Write a robust, production-grade Python data ingestion and preprocessing script named `preprocess_cost_data.py` that processes historical civil works project data (such as MPLADS/eSAKSHI records) from a CSV into a clean, hierarchical JSON dataset optimized for downstream LightGBM/TreeSHAP cost estimation models.

DO NOT execute any installation or download commands in terminal/bash. Assume all dependencies are provided in a standalone `requirements.txt`.

---

### 1. Data Schema & Input Specification
The script will ingest a CSV file containing columns matching this profile:
- `Work ID`: Unique project identifier (Integer / Clean String)
- `Work Desc`: Project scope / text description (e.g., "Upgradation of CC Road", "Construction of Community Hall")
- `Category`: Project category (e.g., "Normal/Others", "Drinking Water")
- `MP Name`: Sponsoring representative name
- `Constituency`: Parliamentary / Assembly constituency name (e.g., "CHITTOOR", "KADAPA")
- `State`: State / UT name (e.g., "Andhra Pradesh")
- `House`: "Lok Sabha" / "Rajya Sabha"
- `Final Amount`: Historical executed / sanctioned project cost (Target variable for ML)
- `Completed Date`: Project completion or sanction date string (e.g., "2025-01-31", "2024-10-2")
- `Has Image`: Verification image flag (Boolean / String "TRUE"/"FALSE")
- `Average Rating`: Rating/score float (may contain NaN / missing values)
- `IDA`: Implementing District Authority descriptor (e.g., "CHITTOOR(DISTRICT COLLECTOR CHITTOOR_IDA)")

---

### 2. Data Cleaning & Normalization Requirements
Implement clean, modular functions (or a class `ProjectDataPipeline`) performing the following steps:

1. **Column Normalization:**
   - Strip leading/trailing whitespaces from column headers and map them to snake_case keys (`work_id`, `work_desc`, `category`, `mp_name`, `constituency`, `state`, `house`, `final_amount`, `completed_date`, `has_image`, `average_rating`, `ida`).
   - Tolerate truncated headers (e.g., handle `Constituer` as `constituency`, `Final Amou` as `final_amount`, `Completed` as `completed_date`).

2. **Entity & Categorical Cleaning:**
   - Standardize `state` and `constituency` strings: convert to Title Case or standardized UPPERCASE, strip trailing spaces, and normalize accidental spelling/whitespace inconsistencies so records group together reliably without fragmentation.
   - Clean `ida`: Keep the raw string, but also extract a sanitized agency tag if enclosed in parentheses.

3. **Numeric & Currency Sanitization:**
   - Clean `final_amount`: Strip currency signs (₹, Rs), commas, or non-numeric characters. Convert to float. Drop or route records with negative or null final amounts to an `anomalies.log`.

4. **Temporal Feature Extraction (Crucial for Seasonal ML Baselines):**
   - Parse `completed_date` flexibly using ISO formats (`YYYY-MM-DD` or `YYYY-M-D`).
   - Extract and add auxiliary temporal features to each record:
     - `completion_year` (Integer)
     - `completion_month` (Integer 1-12)
     - `completion_quarter` (Integer 1-4)
     - `is_fy_end` (Boolean: True if month == 3, accounting for fiscal year-end budget surges)

5. **Boolean & Text Hygiene:**
   - Parse `has_image` into a strict Python boolean (`True`/`False`).
   - Clean `work_desc`: Remove extraneous double spaces, newline characters, and unprintable characters while preserving exact casing for downstream NLP/NER tasks.

---

### 3. Output Organization & Structure
The primary goal is separating and partitioning the data hierarchically by State and Constituency to facilitate local baselining and distributed model training.

1. **Hierarchical Master JSON:**
   Save a nested output file `clean_mplads_data.json` with the following structure:
   ```json
   {
     "metadata": {
       "total_records": 1000,
       "generated_at": "ISO-8601-TIMESTAMP",
       "states_count": 28,
       "total_constituencies": 543
     },
     "data": {
       "ANDHRA PRADESH": {
         "CHITTOOR": [
           {
             "work_id": 134703,
             "work_desc": "Upgradation of CC Road...",
             "category": "Normal/Others",
             "mp_name": "DAGGUMALLI PRASADA RAO",
             "house": "Lok Sabha",
             "final_amount": 499993.0,
             "completed_date": "2025-01-31",
             "completion_year": 2025,
             "completion_month": 1,
             "completion_quarter": 1,
             "is_fy_end": false,
             "has_image": true,
             "average_rating": null,
             "ida": "CHITTOOR(DISTRICT COLLECTOR CHITTOOR_IDA)"
           }
         ],
         "KADAPA": [ ... ]
       }
     }
   }

```

2. **Partitioned Storage (Optional Flag):**
* Provide a CLI flag `--split-files` that, when enabled, additionally saves individual JSON files partitioned by directory:
`output/partitions/<STATE>/<CONSTITUENCY>.json`



---

### 4. Code Quality & Execution Standards

* Use `argparse` for flexible CLI execution:
* `--input-csv`: Path to raw CSV (default: `data.csv`)
* `--output-json`: Path to master JSON (default: `output/clean_mplads_data.json`)
* `--split-files`: Boolean flag to emit partitioned state/constituency files.


* Handle edge cases: Empty values (`NaN`, empty strings, nulls) must serialize cleanly to `null` in JSON rather than `NaN` (which breaks standard JSON specifications).
* Print a clear summary table to terminal showing:
* Total rows ingested
* Valid rows processed vs. dropped/anomalous rows
* Number of unique states and constituencies detected.


* Implement clear type hints, comprehensive docstrings, and safe file I/O operations.

```

***

### `requirements.txt`

Save the following lines into a file named `requirements.txt`:

```text
pandas>=2.0.0
numpy>=1.24.0
python-dateutil>=2.8.2
pydantic>=2.0.0

```


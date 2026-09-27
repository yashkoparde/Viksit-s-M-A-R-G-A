import uvicorn
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from nlp_compliance import MPLADSComplianceEngine

app = FastAPI()
engine = MPLADSComplianceEngine()

class EvaluationRequest(BaseModel):
    description: str

@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/evaluate")
async def evaluate_description(request: EvaluationRequest):
    if not request.description:
        return {"error": "No description provided"}
    
    result = engine.evaluate_work(request.description)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)

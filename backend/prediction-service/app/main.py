from fastapi import FastAPI

from app.api.routes import router as prediction_router

app = FastAPI(title="NovaGen Prediction Service", version="1.0.0")
app.include_router(prediction_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "prediction-service"}

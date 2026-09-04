import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, SessionLocal
from app.routers import webhooks, failures, engine, api_management, simulator
from app.routers.engine import seed_synthetic_dataset

app = FastAPI(
    title="RecoverAI - Intelligent Revenue Recovery Engine",
    description="Intelligent decision-making layer on top of Razorpay payment infrastructure",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(webhooks.router)
app.include_router(failures.router)
app.include_router(engine.router)
app.include_router(api_management.router)
app.include_router(simulator.router)


@app.on_event("startup")
def on_startup():
    """
    Initialize database schema and seed initial demo data if empty.
    """
    init_db()
    db = SessionLocal()
    try:
        from app.database import PaymentEvent
        if db.query(PaymentEvent).count() == 0:
            print("Seeding initial dataset for RecoverAI demo...")
            seed_synthetic_dataset(count=30, db=db)
    finally:
        db.close()


@app.get("/")
def root_status():
    return {
        "service": "RecoverAI Agent API",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

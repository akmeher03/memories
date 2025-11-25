import logging
import sys
import routers.rag_agent
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

# Force Python to flush output immediately
sys.stdout = sys.stderr

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# Remove existing handlers to avoid duplicates
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# Create console handler that writes directly to stderr
handler = logging.StreamHandler(sys.stderr)
handler.setLevel(logging.DEBUG)

# Create formatter
formatter = logging.Formatter(
    '[%(asctime)s] %(levelname)-8s %(name)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
handler.setFormatter(formatter)
root_logger.addHandler(handler)

# Get application logger
logger = logging.getLogger(__name__)
print("✓✓✓ LOGGING CONFIGURED ✓✓✓", file=sys.stderr, flush=True)

# Create FastAPI app instance
app = FastAPI()


Instrumentator().instrument(app).expose(app) 

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.rag_agent.router, tags=["RAG Agent"])

@app.get("/")
def read_root():
    return {"msg": "Server is running!"}

from fastapi import FastAPI
from routers import route
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(route)



app.add_middleware(
    CORSMiddleware ,
    allow_origins=["http://127.0.0.1:8000"],
    allow_credentials=True , 
    allow_method=["*"] ,
    allow_headers=["*"]
)




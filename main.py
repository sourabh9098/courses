from fastapi import FastAPI
from routers import route
from fastapi.middleware.cors import CORSMiddleware

# from fastapi.staticfiles import StaticFiles



app = FastAPI()
app.include_router(route)


# app.mount("/", StaticFiles(directory="static", html=True), name="static")


app.add_middleware(
    CORSMiddleware ,
    # allow_origins=["http://127.0.0.1:8000"],
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"]
)




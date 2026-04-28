# make connection between databse.py and postgresSQL
# jishe ham engine kehnte hain 

import os
from dotenv import load_dotenv

from sqlalchemy import create_engine , text
from sqlalchemy.orm import sessionmaker

load_dotenv()


# Engine -> Connection
try:
    engine = create_engine(os.getenv("DATABASE_URL"))
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()
        print("DB CONNECT successfully : Database version" , version[0])
except Exception as e:
    print("Error coonecting to the databse" , e)
    exit(1)

DATABASE_URL = os.getenv("DATABASE_URL")

# engine 
engine = create_engine(DATABASE_URL)


# session
Session = sessionmaker(bind=engine)

#dependency
def ger_db():
    db = Session()
    try:
        yield db # genrator function. # yaha ye courser ko rook kar rakhta hain jab tk query run hoti hian 
    finally:
        db.close() # ALyas close the session or database connection after use  # database ko close karte hian 

# database ko kyu close karte hain , kyki security reson (data leak), limit end ho jaygi , 


print(DATABASE_URL)


# fatch fatchall 
# fatch one 
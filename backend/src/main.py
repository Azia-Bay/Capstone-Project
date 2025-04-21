from fastapi import FastAPI, Request
from bluesky import RealTimeData
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import time
import mysql.connector
from mysql.connector import errorcode
import subprocess
import json
from asyncio import sleep
from predictor import DisasterPredictor, LSTMClassifier
from multiprocessing import Process
from datetime import datetime, timezone, timedelta
import threading
# use Celery for cron job in the future.
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TABLES ={}

TABLES['disaster_data'] = (
    "CREATE TABLE `disaster_data` ("
    "   `tweet_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,"
    "   `tweet` VARCHAR(1000) NOT NULL,"
    "   `model` enum('1', '2', '3', '4', '5') NOT NULL,"
    "   `state` VARCHAR(100),"
    "   `city` VARCHAR(100),"
    "   `latitude` VARCHAR(100),"
    "   `longitude` VARCHAR(100),"
    "   `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
    ") ENGINE=InnoDB;"
)


TABLES['non_disaster_data'] = (
    "CREATE TABLE `non_disaster_data` ("
    "   `tweet_id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,"
    "   `tweet` VARCHAR(1000) NOT NULL"
    ") ENGINE=InnoDB;"
)

DB_NAME = "crisis_nlp_db"
time.sleep(2)
cnx = mysql.connector.connect(
  host="db",
  autocommit=True
)

cursor = cnx.cursor()

def create_database(cursor):
    try:
        cursor.execute(
            "CREATE DATABASE {} DEFAULT CHARACTER SET 'utf8mb4' COLLATE 'utf8mb4_general_ci'".format(DB_NAME))
    except mysql.connector.Error as err:
        print("Failed creating database: {}".format(err))
        exit(1)

try:
    cursor.execute("USE {}".format(DB_NAME))
except mysql.connector.Error as err:
    print("Database {} does not exists.".format(DB_NAME))
    if err.errno == errorcode.ER_BAD_DB_ERROR:
        create_database(cursor)
        print("Database {} created successfully.".format(DB_NAME))
        cnx.database = DB_NAME
    else:
        print(err)
        exit(1)

for table_name in TABLES:
    table_description = TABLES[table_name]
    try:
        print("Creating table {}: ".format(table_name), end='')
        cursor.execute(table_description)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
            print("already exists.")
        else:
            print(err.msg)
    else:
        print("OK")

cursor_lock = threading.Lock()
cnx_lock = threading.Lock()
@app.middleware("ping")
async def ping_my_sql(request:Request, call_next):
    try:
        response = await call_next(request)
        return response
    except:
        with cnx_lock and cursor_lock:
            cnx.ping(reconnect=True, attempts=2, delay=2)
            cursor = cnx.cursor()
            cursor.execute("USE {}".format(DB_NAME))
        print("FAILED AT DB CONNECTION RECONNECT")
        response = await call_next(request)
        return response

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/disaster-data")
def get_disaster_data():
    with cursor_lock:
        cursor.execute("SELECT * FROM disaster_data")
        # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
        res = cursor.fetchall()
        
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            temp["model"] = row[2]
            temp["state"] = row[3]
            temp["city"] = row[4]
            temp["latitude"] = row[5]
            temp["longitude"] = row[6]
            temp["timestamp"] = row[7]
            data.append(temp)
        return data

@app.get("/descending-disaster-data")
def get_descending_disaster_data():
    with cursor_lock:
        cursor.execute("SELECT * FROM disaster_data ORDER BY timestamp DESC")
        # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
        res = cursor.fetchall()
        
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            temp["model"] = row[2]
            temp["state"] = row[3]
            temp["city"] = row[4]
            temp["latitude"] = row[5]
            temp["longitude"] = row[6]
            temp["timestamp"] = row[7]
            data.append(temp)
        return data

@app.get("/descending-disaster-data/id")
def get_latest_descending_disaster_data(tweet_id:str):
    with cursor_lock:
        query = f"SELECT * FROM disaster_data WHERE tweet_id > {tweet_id} ORDER BY timestamp DESC"
        cursor.execute(query)
        # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
        res = cursor.fetchall()
        
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            temp["model"] = row[2]
            temp["state"] = row[3]
            temp["city"] = row[4]
            temp["latitude"] = row[5]
            temp["longitude"] = row[6]
            temp["timestamp"] = row[7]
            data.append(temp)
        return data
# called from the frontend
# Example URL to CALL: http://localhost:8000/datetime?start="2025-03-31T15:15:00"&end="2025-03-31T15:16:00" 
@app.get("/datetime")
def get_date_time(start:str, end:str):
    # start and end given in the following format "yyyy-mm-ddThr:min:sec"
    with cursor_lock:
        query = f"SELECT * FROM disaster_data WHERE timestamp BETWEEN {start} AND {end}"
        cursor.execute(query)

        res = cursor.fetchall()
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            temp["model"] = row[2]
            temp["state"] = row[3]
            temp["city"] = row[4]
            temp["latitude"] = row[5]
            temp["longitude"] = row[6]
            temp["timestamp"] = row[7]
            data.append(temp)
        return data

@app.get("/nondisaster-data")
def get_nondisaster_data():
    with cursor_lock:
        cursor.execute("SELECT * FROM non_disaster_data")
        # gets data in this format [(tweet_id, tweet, model, latitude, longitude, timestamp)]
        res = cursor.fetchall()
        
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            data.append(temp)
        return data


async def data_generator():
    while(True):
        tzinfo = timezone(timedelta(hours=-5))
        start = (datetime.now() - timedelta(hours=0, minutes=1, seconds=1)).strftime('%Y-%m-%dT%H:%M:%S')
        end = datetime.now(tzinfo).strftime('%Y-%m-%dT%H:%M:%S')
        query = f"SELECT * FROM disaster_data WHERE timestamp BETWEEN \"{start}\" AND \"{end}\""
        res = []
        with cursor_lock:
            cursor.execute(query)
            res = cursor.fetchall()
        
        data = []
        for row in res:
            temp = {}
            temp["tweet_id"] = row[0]
            temp["tweet"] = row[1]
            temp["model"] = row[2]
            temp["state"] = row[3]
            temp["city"] = row[4]
            temp["latitude"] = row[5]
            temp["longitude"] = row[6]
            temp["timestamp"] = row[7]
            data.append(temp)
        json_data = json.dumps(data)
        yield f"event: newTweets\ndata: {json_data}\n\n"
        await sleep(60)
        
        

@app.get("/stream")
async def stream():
    return StreamingResponse(data_generator(), media_type="text/event-stream")

def start_data_processing():
    subprocess.run(["python", "./src/data_processing.py"])

def start_server():
    uvicorn.run(app=app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    data_process = Process(target=start_data_processing)
    server_process = Process(target=start_server)
    data_process.start()
    server_process.start()

    server_process.join()
    data_process.join()

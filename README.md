# Capstone-Project

# Run Application

docker compose up --build

# Run Application in Background

docker compose up --build -d

# Stop the application

docker compose down

# View The current services running and container names

docker ps

# View and follow logs of a particular container (Replace CONTAINER_NAME with container name found in docker ps)

docker logs -f CONTAINER_NAME

# View Logs of a container

docker logs CONTAINER_NAME

# GET all data

http://localhost:8000/disaster-data

# GET non disaster data

http://localhost:8000/nondisaster-data

# Connect to real time data processing stream

http://localhost:8000

# Frontend

http://localhost

Run this locally with

installing docker and docker compose on machine

Create data volume

docker volume create app-data

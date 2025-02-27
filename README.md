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

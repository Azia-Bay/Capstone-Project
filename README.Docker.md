### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`

Build without logs by running:
`docker compose up --build -d`

Frontend will be available at http://localhost:80

Backend will be available at http://localhost:8000

DB will be exposed programatically to port 3306

Stop the Application with docker compose down

use `docker ps` to see what containers are available

use `docker logs -f [CONTAINER_NAME]` to follow logs of a particular container frontend, backend or db.

You can use the docker for development purposes without having to install any packages.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References

- [Docker's Python guide](https://docs.docker.com/language/python/)

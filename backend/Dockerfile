# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

#ARG PYTHON_VERSION=3.13.2
# Using a more stable Python version since 3.13.2 is not compatible with thinc.
ARG PYTHON_VERSION=3.10
FROM python:${PYTHON_VERSION}-slim as base

# Prevents Python from writing pyc files.
# ENV PYTHONDONTWRITEBYTECODE=1


# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
# ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required by spaCy and others
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libelf-dev \
    libc6-dev \ 
    autoconf \
    automake \
    wget \
    python3-dev \
    libatlas-base-dev \
    libblas-dev \
    liblapack-dev \
    libomp-dev \
    build-essential \
    zlib1g-dev \
    cmake \
    libssl-dev \
    ninja-build \
    git \
    && rm -rf /var/lib/apt/lists/*  # Clean up to reduce image size

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/go/dockerfile-user-best-practices/
# ARG UID=10001
# RUN adduser \
#     --disabled-password \
#     --gecos "" \
#     --home "/nonexistent" \
#     --shell "/sbin/nologin" \
#     --no-create-home \
#     --uid "${UID}" \
#     appuser

# Optionally upgrade pip, setuptools, and wheel to avoid issues
RUN pip install --upgrade pip setuptools wheel

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.cache/pip to speed up subsequent builds.
# Leverage a bind mount to requirements.txt to avoid having to copy them into
# into this layer.
#RUN --mount=type=cache,target=/root/.cache/pip \
    #--mount=type=bind,source=requirements.txt,target=requirements.txt \
    #--mount=type=bind,source=constraints.txt,target=constraints.txt \
    #python -m pip install --no-cache-dir -r requirements.txt
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
#RUN pip install --no-cache-dir \
        #-r requirements.txt \
        #-c constraints.txt

# Install spaCy using the --no-cache-dir and -prefer-binary flags and the English model.
# RUN TMPDIR=/var/tmp pip install --no-cache-dir --prefer-binary spacy
# RUN TMPDIR=/var/tmp python -m spacy download en_core_web_trf
RUN pip install --no-cache-dir --prefer-binary spacy
RUN python -m spacy download en_core_web_trf
# Switch to the non-privileged user to run the application.
# USER appuser

# Copy the source code into the container.
COPY . /app
# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD ["python", "./src/main.py"]

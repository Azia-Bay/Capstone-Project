FROM python:3.13.2

COPY crontab /etc/cron.d/my-cron

RUN chmod 644 /etc/cron.d/my-cron

COPY ./pythonScript.sh /app/pythonScript.sh

RUN chmod +x /app/pythonScript.sh

RUN apt update

RUN apt install cron -y

COPY ./call_process_data.py /app/call_process_data.py

WORKDIR /app 

COPY requirements.txt /app

RUN pip install --no-cache-dir -r requirements.txt

ENTRYPOINT cron -f
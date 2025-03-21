#!/bin/bash

date >> /var/log/cron.log

/usr/local/bin/python3 /app/call_process_data.py >> /var/log/cron.log 2>&1

import requests

job = requests.post('http://backend:8000/process-data')

print(job.text)
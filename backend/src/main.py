from fastapi import FastAPI
import uvicorn
import spacy
from geopy.geocoders import Nominatim

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

def locate(text):
    nlp = spacy.load('en_core_web_sm')
    text = text.upper()
    doc = nlp(text)
    locations = {}
    for item in doc.ents:
        if item.label_ == 'GPE':
            locations[item.text] = locations.get(item.text, 0) + 1
    if locations:
        max_gpe = max(locations, key=locations.get)
        return max_gpe
    else:
        return None
    
def coordinates(location):
    loc = Nominatim(user_agent="GetLoc")
    getLoc = loc.geocode(location)
    return (getLoc.latitude, getLoc.longitude)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
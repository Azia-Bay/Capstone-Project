from fastapi import FastAPI
import uvicorn
import spacy
from geopy.geocoders import Nominatim
from transformers import pipeline

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}

def extract_locations(text):
    nlp = spacy.load('en_core_web_trf')
    text = text.upper()
    doc = nlp(text)
    locations = {}
    for item in doc.ents:
        if item.label_ == 'GPE':
            locations[item.text] = locations.get(item.text, 0) + 1
    return locations if locations else None
    
def classify_relevant_state(text, locations):
    if not locations:
        return None
    
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    # Run zero-shot classification with locations as candidate labels
    result = classifier(text, candidate_labels=list(locations.keys()))
    return result["labels"][0]  # Return the highest-ranked location
    
def locate_disaster(text, locations):
    if not locations:
        return None, None

    #US states to detect
    us_states = {
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
    }
    
    #Get the most mentioned location
    if len(locations) > 1:
        most_mentioned = classify_relevant_state(text, locations)
    else:
        most_mentioned = max(locations, key=locations.get)

    #If it's a state, return
    if most_mentioned in us_states:
        return most_mentioned, most_mentioned 
    
    #Get state if we only have a city name using Geopy
    geolocator = Nominatim(user_agent="GetLoc")
    location = geolocator.geocode(most_mentioned)
    if location:
        address = location.address.split(", ")
        for part in address:
            if part in us_states:
                return most_mentioned, part

    return most_mentioned, None
    
def get_coordinates(location):
    loc = Nominatim(user_agent="GetLoc")
    getLoc = loc.geocode(location)
    return (getLoc.latitude, getLoc.longitude) if getLoc else None

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, log_level="info")
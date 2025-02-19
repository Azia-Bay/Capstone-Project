from datetime import datetime, timedelta
from json import dumps
from random import choice, randint, random

# constants
DATETIME_START = datetime(2024, 1, 1)
DATETIME_END = datetime(2025, 1, 1)

TIME_ELAPSED = DATETIME_END - DATETIME_START
MINUTES_ELAPSED = int(TIME_ELAPSED.total_seconds() / 60)

POSTS_PER_MINUTE = 5

NUM_POSTS = MINUTES_ELAPSED * POSTS_PER_MINUTE
NUM_DISASTERS = 27

DISASTER_DURATION_MINUTES_MIN = int(timedelta(weeks=1).total_seconds() / 60)
DISASTER_DURATION_MINUTES_MAX = int(timedelta(weeks=4).total_seconds() / 60)

LOCATIONS = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
             "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
             "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
             "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
             "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"]

DISASTER_TYPES = [1, 2, 3, 4, 5]

TRANQUIL_POSITIVE_SENTIMENT_RATIO = 0.9
DISASTER_POSITIVE_SENTIMENT_RATIO = 0.5

# randomization
def random_location():
    return choice(LOCATIONS)

def random_disaster_type():
    return choice(DISASTER_TYPES)

def random_sentiment_score(disaster=None):
    ratio = TRANQUIL_POSITIVE_SENTIMENT_RATIO
    ratio = DISASTER_POSITIVE_SENTIMENT_RATIO if disaster else ratio
    return 1 if random() <= ratio else 0

# data generation
def generate_disasters():
    print("Generating disasters ...")

    disasters = []

    tenths = 0

    for i in range(NUM_DISASTERS):
        disaster = {}
        
        minutes_elapsed = randint(0, MINUTES_ELAPSED - 1)
        time_elapsed = timedelta(minutes=minutes_elapsed)

        minutes_duration = randint(DISASTER_DURATION_MINUTES_MIN,
                                   DISASTER_DURATION_MINUTES_MAX)
        time_duration = timedelta(minutes=minutes_duration)
        
        disaster["start"] = DATETIME_START + time_elapsed
        disaster["end"] = disaster["start"] + time_duration
        disaster["location"] = random_location()
        disaster["type"] = random_disaster_type()

        disasters.append(disaster)

        # display progress
        percentage = (tenths + 1) * 0.1
        if i + 1 >= NUM_DISASTERS * percentage:
            tenths += 1
            ellipses = "..." if tenths < 10 else ""
            print(f"{int(percentage * 100)}% complete {ellipses}")
    
    return disasters

def generate_sample_data(disasters=[]):
    print("Generating sample data ...")

    data = {}

    tenths = 0

    post_id = 0
    datetime = DATETIME_START

    while datetime != DATETIME_END:
        for i in range(POSTS_PER_MINUTE):
            # find ongoing disasters
            ongoing_disasters = []
            for disaster in disasters:
                if datetime < disaster["start"] or datetime > disaster["end"]:
                    continue
                ongoing_disasters.append(disaster)
            
            # choose specific ongoing disaster if multiple
            disaster = choice(ongoing_disasters) if ongoing_disasters else None
            
            # set data row
            timestamp = str(datetime)
            location = disaster["location"] if disaster else random_location()
            text_content = "Lorem ipsum"
            disaster_type = disaster["type"] if disaster else 0
            sentiment_score = random_sentiment_score(disaster)

            data[post_id] = {
                "timestamp": timestamp,
                "location": location,
                "text_content": text_content,
                "disaster_type": disaster_type,
                "sentiment_score": sentiment_score}

            # display progress
            percentage = (tenths + 1) * 0.1
            if post_id + 1 >= NUM_POSTS * percentage:
                tenths += 1
                ellipses = "..." if tenths < 10 else ""
                print(f"{int(percentage * 100)}% complete {ellipses}")
            
            # increment key
            post_id += 1
        
        # increment datetime
        datetime += timedelta(minutes=1)
    
    return data

# output
def write_sample_data(data = {}):
    print("Writing sample data ...")
    with open("sample_data.json", "w") as outputFile:
        json = dumps(data, indent=4)
        outputFile.write(json)

# main
disasters = generate_disasters()
data = generate_sample_data(disasters)
write_sample_data(data)
print("Sample data generation completed. See sample_data.json.")

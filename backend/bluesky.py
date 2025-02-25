import requests
import time
import csv

class RealTimeData:
    earthquake_search = ['earthquake', 'quake', 'tremor']
    flood_search = ['flood', 'torrent']
    hurricane_search = ['hurricane']
    tornado_search = ['tornado', 'windstorm']
    wildfire_search = ['wildfire', 'forest fire', 'inferno']

    disaster_map = {1:earthquake_search, 2:flood_search, 3:hurricane_search, 4:tornado_search, 5:wildfire_search}

    def __init__(self):
        self.payload = {'q':'', 'limit': 100, 'lang': 'en'}
        self.times = {}
    
    def processPosts(self, search_queries, disaster_type):
        visited = set()
        posts = []
        if self.times.get(disaster_type):
            self.payload['since'] = self.times[disaster_type]
        else:
            if self.payload.get('since'):
                del self.payload['since']
        
        for query in search_queries:
            self.payload['q'] = query
            res = requests.get('https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts', params=self.payload)
            self.times[disaster_type] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            res = res.json()
            for post in res['posts']:
                if post['uri'] not in visited:
                    postDetails = ""
                    if post['record']:
                        record = post['record']
                        if record.get('text'):
                            postDetails += record['text'] + " "
                        if record.get('embed'):
                            if record['embed'].get('external'):
                                postDetails += record['embed']['external'].get('title', "") + " "
                                postDetails += record['embed']['external'].get('description', "") + " "
                            images = record['embed'].get('images')
                            media = record['embed'].get('media')
                            if media and media.get('images'):
                                if images:
                                    images = images + media.get('images')
                                else:
                                    images = media.get('images')
                            if images:
                                for image in images:
                                    if image.get('alt'):
                                        postDetails += image['alt'] + " "
                    if post.get('embed'):
                        if post['embed'].get('external'):
                            postDetails += post['embed']['external'].get('title', "") + " "
                            postDetails += post['embed']['external'].get('description', "") + " "
                    postDetails = postDetails.strip()
                    
                    if postDetails == "":
                        print(post)
                        print("ERROR: NOT GETTING DATA FROM POST")
                    else:
                        posts.append(postDetails)
                visited.add(post['uri'])
        return posts
    
    def get_data(self, disaster_type : int):
        return self.processPosts(self.disaster_map[disaster_type], disaster_type)

    def get_all(self):
        posts = []
        for i in range(1, 6):
            posts = posts + self.get_data(i)
        return posts

test = RealTimeData()

with open('data.csv', 'w', newline='') as csvfile:
    spamwriter = csv.writer(csvfile)
    spamwriter.writerow(["Blusky Tweets"])
    for i in range(5):
        data = test.get_all()
        for d in data:
            spamwriter.writerow([d])
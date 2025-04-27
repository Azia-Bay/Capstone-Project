import { useState, useEffect } from "react";
import { Tweet } from "../types/Tweet";

import DisasterCard from "./disaster_card";

interface DisasterListProps {
	tweets: Tweet[];
}

export default function DisasterList({ tweets }) {
    const [posts, setPosts] = useState<Tweet[]>([]);
	const [disasters, setDisasters] = useState<Tweet[]>([]);

    //useEffect(() => {setDisasters([null, null, null, null, null])}, []);
    useEffect(() => {
        let curDay = new Date();
        curDay.setTime(curDay.getTime() - (1000 * 60 * 60 * 5));
		const today = curDay.toISOString().split("T")[0];
		// Keep only the latest tweet per (state, model) for today
		const latestByType: { [key: string]: Tweet } = {};
        for(const tweet of tweets){
            if (tweet.state === "None" || !tweet.state) {
                console.log("Skipping tweet with state 'None' or empty state");
                continue;
            }
            let tweetTime = new Date(tweet.timestamp)
            tweetTime.setTime(tweetTime.getTime() - (1000 * 60 * 60 * 5))
			let tweetDate = tweetTime.toISOString().split("T")[0];
            // console.log(tweetDate)
			if (tweetDate === today) {
				const key = `${tweet.city && tweet.city !== "None" ? `${tweet.city},` : ""} ${tweet.state}-${tweet.model}`;
				if (
					!latestByType[key] ||
					new Date(tweet.timestamp) > new Date(latestByType[key].timestamp)
				) {
					latestByType[key] = tweet;
				}
			}
            else{
                break;
            }
		};
        // let tempDisasters = Object.values(latestByType);
        // tempDisasters = tempDisasters.splice(0, Math.min(tempDisasters.length, 20))
		setDisasters(Object.values(latestByType));
        console.log("Filtered tweets going into disasters:", Object.values(latestByType));
        console.log("useEffect triggered");
	}, [tweets]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "8px",
                width: "100%"}}>
            <h2 style={{fontSize: "16px", fontWeight: "bold", margin: "0px"}}>
                Ongoing disasters
            </h2>

            <div
                style={{
                    borderLeft: "solid 1px #D4DBE2",
                    borderRight: "solid 1px #D4DBE2",
                    borderTop: "solid 1px #D4DBE2",
                    display: disasters.length === 0 ? "none" : "flex",
                    flexDirection: "column"}}>
                {disasters.length === 0 ? (
                    <p>No ongoing disasters at the moment.</p>
                    ) : (
                    disasters.map((tweet) => <DisasterCard key={tweet.tweet_id} tweet={tweet} />)
                    )}
            </div>
        </div>
    );
}
 
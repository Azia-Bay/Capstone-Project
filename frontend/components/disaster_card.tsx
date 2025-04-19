import { Tweet } from "../types/Tweet";

interface DisasterCardProps {
	tweet: Tweet;
}

const disasterTypeMap: { [key: number]: string } = {
    "1": "Earthquake",
    "2": "Flood",
    "3": "Hurricane",
    "4": "Tornado",
    "5": "Wildfire",
};

export default function DisasterCard({ tweet }: DisasterCardProps) {
    if (tweet.state === "None" || !tweet.state) return null;
    
    const title = `${tweet.city && tweet.city !== "None" ? `${tweet.city},` : ""} ${tweet.state}: ${disasterTypeMap[tweet.model] || "Unknown"} - ${new Date(
        tweet.timestamp
      ).toLocaleString("default", {
        month: "long",
        year: "numeric",
      })}`;
    
      const detected = `First detected: ${new Date(tweet.timestamp).toUTCString()}`;
    
      const latest = `Latest: "${tweet.tweet}"`;
    
    return (
        <div
            style={{
                borderBottom: "solid 1px #D4DBE2",
                display: "flex",
                flexDirection: "column",
                minHeight: "100px",
                padding: "8px",
                rowGap: "8px"}}>
            <div
                style={{
                    borderBottom: "solid 1.5px black",
                    fontSize: "18px",
                    fontWeight: "bold",
                    width: "fit-content"}}>
                {title}
            </div>
            <div style={{fontSize: "16px", fontWeight: "300"}}>{detected}</div>
            <div style={{fontSize: "16px", fontWeight: "300"}}>{latest}</div>
        </div>
    );
}

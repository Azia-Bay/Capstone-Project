import { useState, useEffect } from "react";

import Papa from "papaparse";

export default function Sidebar() {
	const [tweets, setTweets] = useState([]);
	const [visibleCount, setVisibleCount] = useState(3); // Start with 3 tweets

	useEffect(() => {
		fetch("/preprocessed_data_utf8.csv")
		  .then(response => response.text())
		  .then(csvData => {
			Papa.parse(csvData, {
			  delimiter: "\t", // Handle tab-separated format
			  header: true,
			  skipEmptyLines: true,
			  complete: function (result) {
				console.log("Parsed CSV Data:", result.data.slice(0, 10)); // Debugging
				
				if (result.data.length > 0 && result.data[0]["text"]) {
				  setTweets(result.data.map(row => row["text"])); // Store all tweets
				} else {
				  console.warn("No valid tweets found.");
				}
			  },
			});
		  });
	  }, []);

	const loadMoreTweets = () => {
		setVisibleCount((prevCount) => Math.min(prevCount + 5, 8)); // Load 5 more tweets
	};
    
    return(
        <aside
            style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "25px",
                maxWidth: "300px",
                minWidth: "300px"}}>
            <div style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "8px"}}>
                <h2
                    style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        margin: "0px"}}>
                    Latest disaster posts processed
                </h2>

                <div
                    style={{
                        borderLeft: "solid 1px #D4DBE2",
                        borderRight: "solid 1px #D4DBE2",
                        borderTop: "solid 1px #D4DBE2"}}>
                    {tweets.slice(0, visibleCount).map((tweet, index) => (
                        <div
                            key={index}
                            style={{
                                borderBottom: "solid 1px #D4DBE2",
                                fontSize: "16px",
                                minHeight: "80px",
                                padding: "8px",
                                width: "100%"}}>
                            {tweet}
                        </div>
                    ))}
                </div>
                
                <div>
                    {visibleCount < 8 && (
                        <div
                            style={{
                                borderBottom: "solid 1px black",
                                cursor: "pointer",
                                display: "inline-block",
                                fontSize: "16px",
                                fontWeight: "300"}}
                            onClick={loadMoreTweets}>
                            More
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    rowGap: "8px"}}>
                    <h2
                        style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            margin: "0px"}}>
                        Disaster trend
                    </h2>
                    
                    <div
                        style={{
                            alignContent: "center",
                            border: "solid 1px #D4DBE2",
                            fontWeight: "100",
                            height: "200px",
                            textAlign: "center"}}>
                        Line graph here
                    </div>
            </div>
        </aside>
    );
}

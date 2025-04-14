import { useState, useEffect } from "react";
import axios from 'axios';
import Papa from "papaparse";
import { Tweet } from "../types/Tweet";

export default function Sidebar({newPosts}) {
    const numVisiblePosts = 3;
	const [posts, setPosts] = useState([]);

    const morePopupPostsPerPage = 50;
    const [showMorePopup, setShowMorePopup] = useState(false);
    const [morePopupPageIndex, setMorePopupPageIndex] = useState(0);

    function openMorePopup() {
        setShowMorePopup(true);
        setMorePopupPageIndex(0);
    }

	useEffect(() => {
        axios.get(`http://${process.env.NEXT_PUBLIC_BASE_URL}:8000/descending-disaster-data`).then(res => {
            let initPosts = [];
            res.data.forEach((tweet) => {
                initPosts.push(tweet.tweet);
            })
            setPosts(initPosts.splice(0, Math.min(initPosts.length, 50)));
        })

		// fetch("/preprocessed_data_utf8.csv")
		//   .then(response => response.text())
		//   .then(csvData => {
		// 	Papa.parse(csvData, {
		// 	  delimiter: "\t", // Handle tab-separated format
		// 	  header: true,
		// 	  skipEmptyLines: true,
		// 	  complete: function (result) {
		// 		console.log("Parsed CSV Data:", result.data.slice(0, 10)); // Debugging
				
		// 		if (result.data.length > 0 && result.data[0]["text"]) {
		// 		  setPosts(result.data.map(row => row["text"])); // Store all posts
		// 		} else {
		// 		  console.warn("No valid posts found.");
		// 		}
		// 	  },
		// 	});
		//   });
	  }, []);

    useEffect(() => {
        let tempNewPosts = [];
        newPosts.forEach((tweet : Tweet) => {
            tempNewPosts.push(tweet.tweet);
        })
        let tempPosts = tempNewPosts.concat(posts);
        setPosts(tempPosts.splice(0, Math.min(tempPosts.length, 50)));
    }, [newPosts])
    
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
                    {posts.slice(0, numVisiblePosts).map((post, index) => (
                        <div
                            key={index}
                            style={{
                                borderBottom: "solid 1px #D4DBE2",
                                fontSize: "16px",
                                minHeight: "80px",
                                padding: "8px",
                                width: "100%"}}>
                            {post}
                        </div>
                    ))}
                </div>
                
                <div>
                    {numVisiblePosts < 8 && (
                        <div
                            style={{
                                borderBottom: "solid 1px black",
                                cursor: "pointer",
                                display: "inline-block",
                                fontSize: "16px",
                                fontWeight: "300"}}
                            onClick={openMorePopup}>
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

            <div
                style={{
                    background: "rgba(0, 0, 0, 0.5)",
                    display: showMorePopup ? "inherit" : "none",
                    height: "100%",
                    left: "0px",
                    padding: "50px",
                    position: "fixed",
                    top: "0px",
                    width: "100%",
                    zIndex: "1001"}}>
                <div
                    style={{
                        background: "white",
                        borderRadius: "8px",
                        boxShadow: "2px 2px 10px rgba(0, 0, 0, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        width: "100%"}}>
                    <button
                        style={{
                            color: "white",
                            cursor: "pointer",
                            backgroundColor: "red",
                            border: "none",
                            borderRadius: "50%",
                            fontSize: "14px",
                            fontWeight: "bold",
                            height: "20px",
                            marginLeft: "calc(100% - 20px - 5px)",
                            marginTop: "5px",
                            width: "20px"}}
                        onClick={() => setShowMorePopup(false)}>
                        X
                    </button>

                    <div style={{
                        fontSize: "16px",
                        marginLeft: "15px",
                        marginRight: "15px"}}>
                        {(morePopupPageIndex * morePopupPostsPerPage + 1).toLocaleString()} - {Math.min(posts.length, ((morePopupPageIndex + 1) * morePopupPostsPerPage)).toLocaleString()} of {posts.length.toLocaleString()} posts
                    </div>

                    <div style={{
                        columnGap: "8px",
                        display: "flex",
                        flexDirection: "row",
                        fontSize: "16px",
                        marginLeft: "15px",
                        marginRight: "15px"}}>
                        <div
                            style={{
                                borderBottom: "solid 1px black",
                                cursor: "pointer",
                                display: "inline-block",
                                fontSize: "16px",
                                fontWeight: "300"}}
                            onClick={() => setMorePopupPageIndex(Math.max(0, morePopupPageIndex - 1))}>
                            Prev
                        </div>

                        <div
                            style={{
                                borderBottom: "solid 1px black",
                                cursor: "pointer",
                                display: "inline-block",
                                fontSize: "16px",
                                fontWeight: "300"}}
                            onClick={() => setMorePopupPageIndex(Math.min(Math.floor((posts.length - 1) / morePopupPostsPerPage), morePopupPageIndex + 1))}>
                            Next
                        </div>
                    </div>

                    <div
                        style={{
                            borderTop: "solid 1px #D4DBE2",
                            marginTop: "15px",
                            maxHeight: "calc(100% - 100px)",
                            overflowY: "scroll"}}>
                        {posts.slice(morePopupPageIndex * morePopupPostsPerPage, morePopupPageIndex * morePopupPostsPerPage + morePopupPostsPerPage).map((post, index) => (
                            <div
                                key={index}
                                style={{
                                    borderBottom: "solid 1px #D4DBE2",
                                    fontSize: "16px",
                                    padding: "8px 15px",
                                    width: "100%"}}>
                                {(morePopupPageIndex * morePopupPostsPerPage + index + 1).toLocaleString()}. {post}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}

import { Lato } from "next/font/google";
import { useEffect, useState} from 'react';
import Head from "next/head"
import { Tweet } from "../types/Tweet";
import Header from "../components/header";
import Navbar from "../components/navbar";
import DisasterMap from "../components/disaster_map";
import DisasterList from "../components/disaster_list";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import axios from "axios";
import { usePolling } from "../components/usePolling";

const lato = Lato({
	subsets: ["latin"],
	weight: ["100", "300", "400"]
});
useState
export default function Home() {
	const [allTweets, setAllTweets] = useState<Tweet[]>([]);
	
	usePolling(60000);

	useEffect(() => {
		axios
		  .get(`http://${process.env.NEXT_PUBLIC_BASE_URL}/descending-disaster-data`)
		  .then((res) => {
			setAllTweets(res.data);
		  })
		  .catch((error) => console.error("Error fetching disaster data:", error));
		
	}, []);

	const [newTweets, setNewTweets] = useState<Tweet[]>([]);
	// const allDisasterTweets = [...allTweets, ...newTweets]; 
	
	return (
		<div
			className={`h-screen w-screen flex flex-col ${lato.className}`}
			style={{minHeight: "125vh"}}>
			<Head>
				<title>Bluesky Disaster Analytics | Dashboard</title>
			</Head>

			<Header />
			<Navbar />
			<main
				style={{
					columnGap: "25px",
					display: "flex",
					flexDirection: "row",
					marginLeft: "200px",
					marginTop: "50px",
					padding: "25px",
					paddingBottom: "200px"}}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						rowGap: "25px",
						width: "100%"}}>
					<DisasterMap tweets={allTweets}/>
					{<DisasterList tweets={allTweets}/> }
				</div>
				<Sidebar newPosts={allTweets}/>
			</main>
			<Footer />

			<style jsx global>{`
				html,
				body {
					padding: 0;
					margin: 0;
					font-family:
						var(--font-lato),
						sans-serif;
				}
				* {
					box-sizing: border-box;
				}
			`}</style>
		</div>
	);
}

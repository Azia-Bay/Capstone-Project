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

const lato = Lato({
	subsets: ["latin"],
	weight: ["100", "300", "400"]
});
useState
export default function Home() {
	const [newTweets, setNewTweets] = useState<Tweet[]>([]);
	useEffect(() => {
		const setUpStream = async () => {
			const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
			await sleep(2000)
			// Create EventSource for SSE endpoint
			const eventSource = new EventSource(`http://${process.env.NEXT_PUBLIC_BASE_URL}:8000/stream`);

			eventSource.onopen = () => {
				console.log('EventSource connected')
			}

			//eventSource can have event listeners based on the type of event.
			//Bydefault for message type of event it have the onmessage method which can be used directly or this same can be achieved through explicit eventlisteners
			eventSource.addEventListener('newTweets', function (event) {
				let streamedTweets : Tweet[] = JSON.parse(event.data);
				let tempNewTweets = streamedTweets.concat(newTweets);
				setNewTweets(tempNewTweets);
				console.log('new tweets:', newTweets);
			});

			//In case of any error, if eventSource is not closed explicitely then client will retry the connection a new call to backend will happen and the cycle will go on.
			eventSource.onerror = (error) => {
				console.error('EventSource failed', error)
				eventSource.close()
			}
		}
		setUpStream()
	
	}, []) 
	
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
					<DisasterMap />
					{/* <DisasterList /> */}
				</div>
				<Sidebar newPosts={newTweets}/>
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

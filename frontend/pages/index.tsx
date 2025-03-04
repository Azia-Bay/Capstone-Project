import { Lato } from "next/font/google";

import Head from "next/head"

import Header from "../components/header";
import Navbar from "../components/navbar";
import DisasterMap from "../components/disaster_map";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";

const lato = Lato({
	subsets: ["latin"],
	weight: ["100", "300", "400"]
});

export default function Home() {
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
					padding: "25px",
					marginLeft: "200px",
					marginTop: "50px"}}>
				<DisasterMap />
				<Sidebar />
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

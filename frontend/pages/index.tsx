import { Lato } from "next/font/google";

import Head from "next/head"

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
					paddingBottom: "200px",
					marginLeft: "200px",
					marginTop: "50px"}}>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						rowGap: "25px",
						width: "100%"}}>
					<DisasterMap />
					<DisasterList />
				</div>
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

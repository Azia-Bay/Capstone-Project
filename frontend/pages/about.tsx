import { Lato } from "next/font/google";

import Head from "next/head"

import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400"]
});

export default function About() {
    class Developer {
        name: string;
        role: string;
        link: string;
        img: string;

        constructor(name: string, role: string, link: string, img: string = null) {
            this.name = name;
            this.role = role;
            this.link = link;
            this.img = img;
        }
    };

    var developers = [
        new Developer("Azia Bay-Asen", "Team Leader", "https://www.linkedin.com/in/aziabay/"),
        new Developer("Alex Miller", "Scrum Master", "https://www.linkedin.com/in/alexandra-miller-454b98251/"),
        new Developer("Abbas Khawaja", "Frontend Developer", "https://www.linkedin.com/in/abbas-khawaja/"),
        new Developer("Vikranth Chinnam", "Backend Developer", "https://www.linkedin.com/in/vikranth-chinnam-553a21256/"),
        new Developer("Akshay Nagarajan", "Data Scientist", "https://www.linkedin.com/in/akshay-nagarajan/")
    ];

    return (
        <div className={lato.className}>
            <Head>
                <title>Bluesky Disaster Analytics | About</title>
            </Head>

            <Header />
            <Navbar />
            <main
                style={{
                    display: "flex",
                    flexDirection: "column",
					marginLeft: "200px",
					marginTop: "50px",
					padding: "25px",
					paddingBottom: "200px",
                    rowGap: "25px"}}>
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
                        About
                    </h2>

                    <div
                        style={{
                            border: "solid 1px #D4DBE2",
                            fontSize: "16px",
                            maxWidth: "800px",
                            padding: "8px"}}>
                        <a href="/" style={{color: "#2068d3", fontWeight: "bold"}}>Bluesky Disaster Analytics</a> is a service provided by students at the University of Texas at Dallas, seeking to proliferate the efficient and widespread publication of information related to natural disasters in the effort to counterbalance or minimize the magnitude of lives lost or upheaved. All information displayed was provided using near real-time data scraped from the Bluesky social media platform.
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
                        Developers
                    </h2>

                    {developers.map((developer, index) => (
                        <div
                            key={index}
                            style={{
                                border: "solid 1px #D4DBE2",
                                columnGap: "15px",
                                display: "flex",
                                flexDirection: "row",
                                maxWidth: "300px",
                                padding: "15px"}}>
                            <img
                                src={developer.img}
                                alt="Developer profile picture"
                                style={{
                                    borderRadius: "100%",
                                    maxHeight: "75px",
                                    maxWidth: "75px",
                                    minHeight: "75px",
                                    minWidth: "75px"}} />
                            
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    rowGap: "8px",
                                    width: "100%"}}>
                                <a
                                    href={developer.link}
                                    target="_blank"
                                    style={{
                                        borderBottom: "solid 1.5px black",
                                        color: "inherit",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        textDecoration: "inherit",
                                        width: "fit-content"}}>
                                    {developer.name}
                                </a>

                                <div style={{fontSize: "16px", fontWeight: "300"}}>
                                    {developer.role}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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

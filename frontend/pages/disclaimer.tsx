import { Lato } from "next/font/google";
import Head from "next/head"
import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400"]
});

export default function Disclaimer() {
    return (
        <div className={lato.className} style={{minHeight: "125vh"}}>
            <Head>
                <title>Bluesky Disaster Analytics | Disclaimer</title>
            </Head>

            <Header />
            <Navbar />
            
            <main style={{
                marginLeft: "200px", // Matches navbar width
                marginTop: "70px",   // Provides space below fixed header (50px + extra padding)
                padding: "20px 40px"
            }}>
                <h1 style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    marginBottom: "20px"
                }}>Disclaimer</h1>
                
                <div style={{
                    backgroundColor: "#EBF5FF",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "30px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                }}>
                    <h2 style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        marginBottom: "15px"
                    }}>AI-Generated Data Disclaimer</h2>
                    
                    <p style={{marginBottom: "15px"}}>
                        The graph data displayed on Bluesky Disaster Analytics is generated using an artificial intelligence trained model. 
                        While we strive to ensure the accuracy and reliability of this data, please note the following:
                    </p>
                    
                    <ul style={{
                        listStyleType: "disc",
                        paddingLeft: "25px",
                        marginBottom: "15px"
                    }}>
                        <li style={{marginBottom: "8px"}}>The data presented is derived from algorithmic processing and may not reflect complete real-world conditions.</li>
                        <li style={{marginBottom: "8px"}}>Our AI models continuously improve but may contain inaccuracies, approximations, or limitations.</li>
                        <li style={{marginBottom: "8px"}}>The information should be used as a supplementary resource and not as the sole basis for critical decision-making.</li>
                        <li style={{marginBottom: "8px"}}>We recommend verifying important data points with multiple sources before taking action based on our analytics.</li>
                    </ul>
                    
                    <p>
                        Bluesky Disaster Analytics makes no warranties, express or implied, regarding the accuracy, completeness, reliability, 
                        or suitability of the AI-generated data. Users rely on this information at their own risk.
                    </p>
                </div>
                
                <div style={{marginBottom: "30px"}}>
                    <h2 style={{
                        fontSize: "22px",
                        fontWeight: "bold",
                        marginBottom: "15px"
                    }}>General Disclaimer</h2>
                    
                    <p>
                        The information contained on Bluesky Disaster Analytics website is for general information purposes only. 
                        We assume no responsibility for errors or omissions in the contents of the website.
                    </p>
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
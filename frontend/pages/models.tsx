import { Lato } from "next/font/google";

import Header from "../components/header";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

const lato = Lato({
    subsets: ["latin"],
    weight: ["300", "400"]
});

export default function Models() {
    return (
        <div className={lato.className} style={{minHeight: "125vh"}}>
            <Header />
            <Navbar />
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

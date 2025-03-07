import Navbutton from "../components/navbutton";

export default function Navbar() {
    return (
        <aside
            style={{
                borderRight: "solid 1px #D4DBE2",
                display: "flex",
                flexDirection: "column",
                fontSize: "20px",
                height: "100%",
                marginTop: "50px",
                padding: "25px",
                position: "fixed",
                rowGap: "8px",
                top: "0px",
                width: "200px"}}>
            <Navbutton innerHTML="Dashboard" navPath="/" />
            <Navbutton innerHTML="Data" navPath="/data" />
            <Navbutton innerHTML="Models" navPath="/models" />
            <Navbutton innerHTML="About" navPath="/about" />
            <Navbutton innerHTML="Disclaimer" navPath="/disclaimer" />
        </aside>
    );
}

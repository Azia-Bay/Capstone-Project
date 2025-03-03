export default function Header() {
    return (
        <div
            style={{
                alignItems: "center",
                background: "white",
                borderBottom: "solid 1px #D4DBE2",
                display: "flex",
                fontSize: "18px",
                height: "50px",
                paddingLeft: "8px",
                paddingRight: "25px",
                position: "fixed",
                width: "100%"}}>
            <header
                style={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "row",
                    width: "100%"}}>
                <div
                    style={{
                        alignItems: "center",
                        display: "flex",
                        flexDirection: "row",
                        columnGap: "8px"}}>
                    <img
                        src="/favicon.png"
                        alt="Bluesky favicon"
                        style={{width: "35px"}} />
                    <h1 style={{fontSize: "24px", fontWeight: "bold"}}>
                        Bluesky Disaster Analytics
                    </h1>
                    <div>Powered by AI</div>
                    <div style={{textDecoration: "underline"}}>Disclaimer</div>
                </div>
                <div style={{marginLeft: "auto"}}>
                    Last updated: 10:15 AM (2 minutes ago)
                </div>
            </header>
        </div>
    );
}

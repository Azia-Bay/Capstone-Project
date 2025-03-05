import { useState, useEffect } from "react";

export default function Header() {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(p => p.type === "timeZoneName");
    const timeZoneAbbr = timeZonePart ? timeZonePart.value : "";

    const [clock, setClock] = useState("");
    const [minutesAgo, setMinutesAgo] = useState(0);
    const epoch = new Date().getTime();

    useEffect(() => {
        const start = performance.now();
        var secondsElapsed = 0;
        
        const updateClock = () => {
            var datetime = new Date(epoch + (performance.now() - start));
            var localTimeString = datetime.toLocaleTimeString();
            
            var time = localTimeString.substring(0, localTimeString.length - 6);
            var unit = localTimeString.substring(localTimeString.length - 2);

            setClock((prevClock: string) => {
                var newClock = time + " " + unit + " " + timeZoneAbbr;

                if (secondsElapsed == 0) {
                    setMinutesAgo(0);
                    return newClock;
                }

                if (prevClock && prevClock != newClock) setMinutesAgo(1);
                else setMinutesAgo(0);
                return prevClock;
            });

            secondsElapsed++;
            secondsElapsed %= 60;
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                alignItems: "center",
                background: "white",
                borderBottom: "solid 1px #D4DBE2",
                display: "flex",
                fontSize: "18px",
                height: "50px",
                paddingLeft: "15px",
                paddingRight: "25px",
                position: "fixed",
                top: "0px",
                width: "100%",
                zIndex: "1"}}>
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
                    <a href="/">
                        <img
                            src="/favicon.png"
                            alt="Bluesky favicon"
                            style={{width: "35px"}} />
                    </a>
                    <a
                        href="/"
                        style={{color: "inherit", textDecoration: "inherit"}}>
                        <h1 style={{fontSize: "24px", fontWeight: "bold"}}>
                            Bluesky Disaster Analytics
                        </h1>
                    </a>
                    <div>Powered by AI</div>
                    <a
                        href="/disclaimer"
                        style={{color: "inherit", textDecoration: "inherit"}}>
                        <div style={{textDecoration: "underline"}}>
                            Disclaimer
                        </div>
                    </a>
                </div>
                <div style={{marginLeft: "auto"}}>
                    Last updated: {clock} ({minutesAgo} minute{minutesAgo === 1 ? "" : "s"} ago)
                </div>
            </header>
        </div>
    );
}

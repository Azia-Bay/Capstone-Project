import { useState, useEffect } from "react";

import DisasterCard from "./disaster_card";

export default function DisasterList() {
	const [disasters, setDisasters] = useState([]);

    useEffect(() => setDisasters([null, null, null, null, null]));

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                rowGap: "8px",
                width: "100%"}}>
            <h2 style={{fontSize: "16px", fontWeight: "bold", margin: "0px"}}>
                Ongoing disasters
            </h2>

            <div
                style={{
                    borderLeft: "solid 1px #D4DBE2",
                    borderRight: "solid 1px #D4DBE2",
                    borderTop: "solid 1px #D4DBE2",
                    display: disasters.length === 0 ? "none" : "flex",
                    flexDirection: "column"}}>
                {disasters.map((_, index) => (
                    <DisasterCard key={index} />
                ))}
            </div>
        </div>
    );
}
 
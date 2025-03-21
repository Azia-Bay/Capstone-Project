export default function DisasterCard() {
    var title: string = "Florida: Earthquake - February 2025";
    var detected: string = "First detected: 02-07-2025 01:41:15 UTC";
    var latest: string = "Latest: \"Hurricane Maria was devastating for both Puerto Rico and the Virgin Islands Of the combined 35 million people the vast majority of the island is without power cell service or potable water 58 of PRs 69 hospitals lack power or fuel\"";

    return (
        <div
            style={{
                borderBottom: "solid 1px #D4DBE2",
                display: "flex",
                flexDirection: "column",
                minHeight: "100px",
                padding: "8px",
                rowGap: "8px"}}>
            <div
                style={{
                    borderBottom: "solid 1.5px black",
                    fontSize: "18px",
                    fontWeight: "bold",
                    width: "fit-content"}}>
                {title}
            </div>
            <div style={{fontSize: "16px", fontWeight: "300"}}>{detected}</div>
            <div style={{fontSize: "16px", fontWeight: "300"}}>{latest}</div>
        </div>
    );
}

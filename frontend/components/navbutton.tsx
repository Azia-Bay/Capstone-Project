import { usePathname } from "next/navigation";

export default function Navbutton({innerHTML, navPath}: any) {
	var page: String = usePathname().toLowerCase();

    var fontWeight = navPath == page ? "bold" : "regular";

    return (
        <div className="text" style={{fontWeight: fontWeight}}>{innerHTML}</div>
    );
}

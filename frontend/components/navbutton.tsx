import { usePathname } from "next/navigation";

export default function Navbutton({innerHTML, navPath}: any) {
	var page: String = usePathname().toLowerCase();

    var fontWeight = navPath == page ? "bold" : "regular";

    return (
        <div style={{fontWeight: fontWeight}}>
            <a
                href={navPath}
                style={{color: "inherit", textDecoration: "inherit"}}>
                {innerHTML}
            </a>
        </div>
    );
}

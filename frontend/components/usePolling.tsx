import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePolling(ms: number) {
    const router = useRouter();
    useEffect(() => {
        const intervalId = setInterval(() => {
            router.refresh();
        }, ms)
        console.log("POLLING NEW DATA")
        return () => clearInterval(intervalId);
    }, []);
    
}
// Helper hook to get userId from localStorage
import { useEffect, useState } from "react";

export function useUserId(): number | null {
	const [userId, setUserId] = useState<number | null>(null);
	useEffect(() => {
		if (typeof window !== "undefined") {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				try {
					const userObj = JSON.parse(userStr);
					setUserId(userObj.id_usuario || userObj.id);
				} catch {
					setUserId(null);
				}
			}
		}
	}, []);
	return userId;
}

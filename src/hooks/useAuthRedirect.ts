"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useAuthRedirect(expectedRole: string) {
	const router = useRouter();
	const path = usePathname();

	useEffect(() => {
		const role = localStorage.getItem("role");
		if (!role) {
			router.replace("/auth/login");
			return;
		}

		// Si el rol es diferente al esperado, lo manda a su dashboard
		if (role !== expectedRole) {
			if (role === "ADMINISTRADOR")
				router.replace("/admin");
			else if (role === "PSICOLOGO")
				router.replace("/psicologo");
			else if (role === "ESTUDIANTE")
				router.replace("/student");
			else router.replace("/auth/login");
		}
	}, [expectedRole, router, path]);
}

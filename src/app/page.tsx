// src/app/page.tsx

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
	const router = useRouter();

	useEffect(() => {
		// Si ya hay sesión, redirige por rol
		const role = localStorage.getItem("role");
		if (role === "ADMIN") router.replace("/admin");
		else if (role === "PSICOLOGO" || role === "psicologo")
			router.replace("/psicologo");
		else if (role === "ESTUDIANTE")
			router.replace("/student");
		else router.replace("/auth/login");
	}, [router]);

	return (
		<div className="flex justify-center items-center bg-gradient-to-br from-violet-100 to-fuchsia-100 h-screen">
			<h1 className="font-bold text-violet-600 text-2xl">
				Cargando...
			</h1>
		</div>
	);
}

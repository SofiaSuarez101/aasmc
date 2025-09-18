"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

export default function CreateUserPage() {
	const router = useRouter();
	const [form, setForm] = useState({
		nombre: "",
		apellido: "",
		email: "",
		contrasena: "",
		id_rol: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement
		>
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		try {
			const payload = {
				...form,
				id_rol: Number(form.id_rol),
			};
			const res = await fetch(`${API_URL}/users`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Error creando usuario");
			router.push("/admin/users");
		} catch (err: any) {
			setError(err.message || "Error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="bg-white shadow mx-auto mt-10 p-8 rounded-lg max-w-lg">
			<h2 className="mb-6 font-bold text-xl">
				Crear usuario
			</h2>
			<form
				onSubmit={handleSubmit}
				className="space-y-4">
				<Input
					name="nombre"
					placeholder="Nombre"
					value={form.nombre}
					onChange={handleChange}
					required
				/>
				<Input
					name="apellido"
					placeholder="Apellido"
					value={form.apellido}
					onChange={handleChange}
					required
				/>
				<Input
					name="email"
					placeholder="Email"
					type="email"
					value={form.email}
					onChange={handleChange}
					required
				/>
				<Input
					name="contrasena"
					placeholder="Contraseña"
					type="password"
					value={form.contrasena}
					onChange={handleChange}
					required
				/>
				<select
					name="id_rol"
					value={form.id_rol}
					onChange={handleChange}
					required
					className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
					<option value="">Selecciona un rol</option>
					<option value="2">Psicologo</option>
					<option value="3">Estudiante</option>
				</select>
				{error && (
					<div className="text-red-500 text-sm">
						{error}
					</div>
				)}
				<Button
					type="submit"
					disabled={loading}
					className="w-full">
					{loading ? "Creando..." : "Crear usuario"}
				</Button>
			</form>
		</div>
	);
}

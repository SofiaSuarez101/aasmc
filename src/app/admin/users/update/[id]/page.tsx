"use client";

import {
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:3000";

export default function UpdateUserPage() {
	const router = useRouter();
	const params = useParams();
	const userId = params?.id;

	const { data: roles = [], isLoading: loadingRoles } =
		useQuery({
			queryKey: ["roles"],
			queryFn: async () => {
				const res = await axios.get(`${API_URL}/roles`);
				return res.data;
			},
		});

	const { data: user, isLoading: loadingUser } = useQuery({
		queryKey: ["user", userId],
		enabled: !!userId,
		queryFn: async () => {
			const res = await axios.get(
				`${API_URL}/users/${userId}`
			);
			return res.data;
		},
	});

	const [form, setForm] = useState({
		nombre: "",
		apellido: "",
		email: "",
		id_rol: "",
	});
	const [error, setError] = useState("");

	useEffect(() => {
		if (user) {
			setForm({
				nombre: user.nombre || "",
				apellido: user.apellido || "",
				email: user.email || "",
				id_rol: user.id_rol ? String(user.id_rol) : "",
			});
		}
	}, [user]);

	const updateMutation = useMutation({
		mutationFn: async (data: typeof form) => {
			// Only send changed fields (PATCH)
			const patchData: Record<string, any> = {};
			if (data.nombre !== user?.nombre)
				patchData.nombre = data.nombre;
			if (data.apellido !== user?.apellido)
				patchData.apellido = data.apellido;
			if (data.email !== user?.email)
				patchData.email = data.email;
			if (data.id_rol !== String(user?.id_rol))
				patchData.id_rol = Number(data.id_rol);
			// If nothing changed, do nothing
			if (Object.keys(patchData).length === 0) return;
			await axios.patch(
				`${API_URL}/users/${userId}`,
				patchData
			);
		},
		onSuccess: () => {
			router.push("/admin/users");
		},
		onError: (err: any) => {
			setError(
				err?.response?.data?.message ||
					"Error actualizando usuario"
			);
		},
	});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement
		>
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		updateMutation.mutate(form);
	};

	return (
		<div className="bg-white shadow mx-auto mt-10 p-8 rounded-lg max-w-lg">
			<h2 className="mb-6 font-bold text-xl">
				Editar usuario
			</h2>
			{loadingUser || loadingRoles ? (
				<div className="py-8 text-center">Cargando...</div>
			) : (
				<form
					onSubmit={handleSubmit}
					className="space-y-4">
					<div>
						<label
							htmlFor="nombre"
							className="block mb-1 font-medium text-sm">
							Nombre
						</label>
						<Input
							id="nombre"
							name="nombre"
							placeholder="Nombre"
							value={form.nombre}
							onChange={handleChange}
							required
						/>
					</div>
					<div>
						<label
							htmlFor="apellido"
							className="block mb-1 font-medium text-sm">
							Apellido
						</label>
						<Input
							id="apellido"
							name="apellido"
							placeholder="Apellido"
							value={form.apellido}
							onChange={handleChange}
							required
						/>
					</div>
					<div>
						<label
							htmlFor="email"
							className="block mb-1 font-medium text-sm">
							Email
						</label>
						<Input
							id="email"
							name="email"
							placeholder="Email"
							type="email"
							value={form.email}
							onChange={handleChange}
							required
						/>
					</div>
					<div>
						<label
							htmlFor="id_rol"
							className="block mb-1 font-medium text-sm">
							Rol
						</label>
						<select
							id="id_rol"
							name="id_rol"
							value={form.id_rol}
							onChange={handleChange}
							required
							className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
							<option value="">Selecciona un rol</option>
							{roles.map((role: any) => (
								<option
									key={role.id_rol}
									value={role.id_rol}>
									{role.nombre_rol}
								</option>
							))}
						</select>
					</div>
					{error && (
						<div className="text-red-500 text-sm">
							{error}
						</div>
					)}
					<Button
						type="submit"
						disabled={updateMutation.isPending}
						className="w-full">
						{updateMutation.isPending
							? "Actualizando..."
							: "Actualizar usuario"}
					</Button>
				</form>
			)}
		</div>
	);
}

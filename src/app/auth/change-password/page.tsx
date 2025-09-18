"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [currentPassword, setCurrentPassword] =
		useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] =
		useState(false);
	const [showNewPassword, setShowNewPassword] =
		useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const apiUrl = process.env.NEXT_PUBLIC_API_URL;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		setLoading(true);

		try {
			await axios.post(
				`${apiUrl}/users/change-password`,
				{
					email,
					current_password: currentPassword,
					new_password: newPassword,
				},
				{ withCredentials: true }
			);
			setSuccess(
				"Contraseña cambiada exitosamente. Por favor inicia sesión nuevamente."
			);
			setTimeout(() => {
				router.push("/auth/login");
			}, 2000);
		} catch (err) {
			if (axios.isAxiosError(err)) {
				setError(
					err.response?.data?.detail ||
						"Error al cambiar la contraseña. Verifica tus datos."
				);
			} else {
				setError(
					"Error al cambiar la contraseña. Verifica tus datos."
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex md:flex-row flex-col bg-[#f6f8fa] min-h-screen">
			{/* Imagen UFPS izquierda */}
			<div className="hidden md:flex flex-1 justify-center items-center bg-gray-200">
				<img
					src="/robot.png"
					alt="Campus UFPS"
					className="w-full max-w-2xl h-full object-cover"
				/>
			</div>
			{/* Formulario derecha */}
			<div className="flex flex-1 justify-center items-center bg-[#f6f8fa] px-4 py-16">
				<div className="flex flex-col gap-5 bg-white shadow-lg px-10 py-10 rounded-2xl w-full max-w-md">
					<h1 className="mb-0 font-bold text-red-900 text-2xl md:text-3xl">
						Synapsis
					</h1>
					<p className="mb-2 text-red-500 text-base">
						Cambiar contraseña
					</p>
					{error && (
						<p className="bg-red-50 mb-2 p-2 border border-red-200 rounded text-red-500 text-sm text-center">
							{error}
						</p>
					)}
					{success && (
						<p className="bg-green-50 mb-2 p-2 border border-green-200 rounded text-green-600 text-sm text-center">
							{success}
						</p>
					)}
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-4">
						<div>
							<label className="block mb-1 font-medium text-red-700 text-sm">
								Correo electrónico
							</label>
							<div className="relative">
								<Mail className="top-1/2 left-3 absolute w-5 h-5 text-red-400 -translate-y-1/2" />
								<input
									type="email"
									placeholder="sofianuñez@ufps.edu.co"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="bg-red-50 py-2 pl-10 border border-red-200 rounded-md outline-none focus:ring-2 focus:ring-red-300 w-full text-red-800"
									required
								/>
							</div>
						</div>
						<div>
							<label className="block mb-1 font-medium text-red-700 text-sm">
								Contraseña actual
							</label>
							<div className="relative">
								<Lock className="top-1/2 left-3 absolute w-5 h-5 text-red-400 -translate-y-1/2" />
								<input
									type={
										showCurrentPassword
											? "text"
											: "password"
									}
									placeholder="********"
									value={currentPassword}
									onChange={(e) =>
										setCurrentPassword(e.target.value)
									}
									className="bg-red-50 py-2 pr-10 pl-10 border border-red-200 rounded-md outline-none focus:ring-2 focus:ring-red-300 w-full text-red-800"
									required
								/>
								<button
									type="button"
									className="top-1/2 right-3 absolute text-red-400 hover:text-red-500 -translate-y-1/2"
									onClick={() =>
										setShowCurrentPassword((s) => !s)
									}
									tabIndex={-1}>
									{showCurrentPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>
						<div>
							<label className="block mb-1 font-medium text-red-700 text-sm">
								Nueva contraseña
							</label>
							<div className="relative">
								<Lock className="top-1/2 left-3 absolute w-5 h-5 text-red-400 -translate-y-1/2" />
								<input
									type={
										showNewPassword ? "text" : "password"
									}
									placeholder="********"
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									className="bg-red-50 py-2 pr-10 pl-10 border border-red-200 rounded-md outline-none focus:ring-2 focus:ring-red-300 w-full text-red-800"
									required
								/>
								<button
									type="button"
									className="top-1/2 right-3 absolute text-red-400 hover:text-red-500 -translate-y-1/2"
									onClick={() =>
										setShowNewPassword((s) => !s)
									}
									tabIndex={-1}>
									{showNewPassword ? (
										<EyeOff className="w-5 h-5" />
									) : (
										<Eye className="w-5 h-5" />
									)}
								</button>
							</div>
						</div>
						<div className="flex gap-3 mt-2">
							<button
								type="submit"
								className="flex-1 bg-red-700 hover:bg-red-800 shadow py-2 rounded-md font-bold text-white transition"
								disabled={loading}>
								{loading ? (
									<span className="flex justify-center items-center gap-2">
										<span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
										Cambiando...
									</span>
								) : (
									"Cambiar contraseña"
								)}
							</button>
							<button
								type="button"
								className="flex-1 bg-red-900 hover:bg-red-950 shadow py-2 rounded-md font-medium text-white"
								onClick={() => router.push("/auth/login")}
								tabIndex={-1}>
								Volver al login
							</button>
						</div>
					</form>
					<p className="mt-2 text-red-300 text-xs text-center">
						&copy; {new Date().getFullYear()} Synapsis
					</p>
				</div>
			</div>
		</div>
	);
}

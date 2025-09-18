"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

export default function PasswordPage() {
	const [currentPassword, setCurrentPassword] =
		useState("");
	const [newPassword, setNewPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");
	const [showModal, setShowModal] = useState(false);

	// Get userId from localStorage
	let userId: string | null = null;
	if (typeof window !== "undefined") {
		const userStr = localStorage.getItem("user");
		if (userStr) {
			try {
				const userObj = JSON.parse(userStr);
				userId = userObj.id_usuario?.toString() || null;
			} catch {
				userId = null;
			}
		}
	}

	// Handler for form submit: just show modal
	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSuccess("");
		setError("");
		setShowModal(true);
	};

	// Handler for confirming modal
	const handleConfirm = async () => {
		setShowModal(false);
		setLoading(true);
		setSuccess("");
		setError("");
		if (!userId) {
			setError(
				"No se pudo obtener el usuario actual. Inicie sesión nuevamente."
			);
			setLoading(false);
			return;
		}
		try {
			// Send currentPassword as well if backend supports it, otherwise just send new_password
			const res = await fetch(
				`${API_URL}/users/${userId}/password`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						new_password: newPassword,
						current_password: currentPassword, // include for future backend support
					}),
				}
			);
			if (!res.ok)
				throw new Error(
					"No se pudo actualizar la contraseña"
				);
			setSuccess("Contraseña actualizada correctamente");
			setNewPassword("");
			setCurrentPassword("");
		} catch (err: any) {
			setError(err.message || "Error desconocido");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex justify-center items-center min-h-[60vh]">
			<Card className="p-8 w-full max-w-md">
				<h2 className="mb-6 font-bold text-xl">
					Actualizar contraseña
				</h2>
				<form
					onSubmit={handleFormSubmit}
					className="flex flex-col gap-4">
					<div>
						<label className="block mb-1 font-medium">
							Contraseña actual
						</label>
						<Input
							type="password"
							value={currentPassword}
							onChange={(e) =>
								setCurrentPassword(e.target.value)
							}
							required
							minLength={4}
							placeholder="Ingrese su contraseña actual"
						/>
					</div>
					<div>
						<label className="block mb-1 font-medium">
							Nueva contraseña
						</label>
						<Input
							type="password"
							value={newPassword}
							onChange={(e) =>
								setNewPassword(e.target.value)
							}
							required
							minLength={4}
							placeholder="Ingrese la nueva contraseña"
						/>
					</div>
					<Button
						type="submit"
						disabled={loading}>
						{loading
							? "Actualizando..."
							: "Actualizar contraseña"}
					</Button>
					{success && (
						<div className="mt-2 text-green-600 text-sm">
							{success}
						</div>
					)}
					{error && (
						<div className="mt-2 text-red-600 text-sm">
							{error}
						</div>
					)}
				</form>
			</Card>
			{showModal && (
				<div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40">
					<Card className="p-6 w-full max-w-sm">
						<h3 className="mb-4 font-semibold text-lg">
							¿Confirmar cambio de contraseña?
						</h3>
						<p className="mb-6 text-sm">
							¿Está seguro que desea cambiar su contraseña?
						</p>
						<div className="flex justify-end gap-4">
							<Button
								variant="outline"
								onClick={() => setShowModal(false)}
								disabled={loading}>
								Cancelar
							</Button>
							<Button
								onClick={handleConfirm}
								disabled={loading}>
								Confirmar
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	);
}

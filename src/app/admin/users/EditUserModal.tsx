import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface EditUserModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user: any;
	onSave: (data: {
		nombre: string;
		apellido: string;
		email: string;
	}) => void;
	onChangePassword?: (password: string) => Promise<void>;
	isSaving: boolean;
}

export function EditUserModal({
	open,
	onOpenChange,
	user,
	onSave,
	onChangePassword,
	isSaving,
}: EditUserModalProps) {
	const [form, setForm] = useState({
		nombre: "",
		apellido: "",
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [passwordSuccess, setPasswordSuccess] =
		useState("");

	useEffect(() => {
		if (user) {
			setForm({
				nombre: user.nombre || "",
				apellido: user.apellido || "",
				email: user.email || "",
				password: "",
			});
		}
	}, [user]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
		if (e.target.name === "password") {
			setPasswordError("");
			setPasswordSuccess("");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		if (!form.nombre || !form.apellido || !form.email) {
			setError("Todos los campos son obligatorios");
			return;
		}
		onSave({
			nombre: form.nombre,
			apellido: form.apellido,
			email: form.email,
		});
		if (
			form.password &&
			form.password.length > 0 &&
			onChangePassword
		) {
			try {
				await onChangePassword(form.password);
				setPasswordSuccess(
					"Contraseña actualizada correctamente"
				);
				setPasswordError("");
				setForm((f) => ({ ...f, password: "" }));
			} catch (err: any) {
				setPasswordError(
					err?.response?.data?.detail ||
						err?.response?.data?.message ||
						"Error actualizando contraseña"
				);
				setPasswordSuccess("");
			}
		}
	};

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full max-w-md">
				<SheetHeader>
					<SheetTitle>Editar usuario</SheetTitle>
				</SheetHeader>
				<form
					onSubmit={handleSubmit}
					className="space-y-4 mt-4">
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
							htmlFor="password"
							className="block mb-1 font-medium text-sm">
							Nueva contraseña
						</label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="Dejar en blanco para no cambiar"
							value={form.password}
							onChange={handleChange}
							autoComplete="new-password"
						/>
						{passwordError && (
							<div className="text-red-500 text-sm">
								{passwordError}
							</div>
						)}
						{passwordSuccess && (
							<div className="text-green-600 text-sm">
								{passwordSuccess}
							</div>
						)}
					</div>
					{error && (
						<div className="text-red-500 text-sm">
							{error}
						</div>
					)}
					<SheetFooter>
						<Button
							type="submit"
							disabled={isSaving}
							className="w-full">
							{isSaving
								? "Guardando..."
								: "Guardar cambios"}
						</Button>
						<SheetClose asChild>
							<Button
								type="button"
								variant="outline"
								className="mt-2 w-full">
								Cancelar
							</Button>
						</SheetClose>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	);
}

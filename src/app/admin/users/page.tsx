"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip";
import {
	useQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { EditUserModal } from "./EditUserModal";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:3000";

interface User {
	id_usuario: number;
	nombre: string;
	apellido: string;
	email: string;
	id_rol: number;
}

interface Role {
	id_rol: number;
	nombre_rol: string;
}

function UsersPage() {
	const [editUser, setEditUser] = useState<User | null>(
		null
	);
	const [isSaving, setIsSaving] = useState(false);
	const queryClient = useQueryClient();
	const router = useRouter();

	const {
		data: users = [],
		isLoading: loadingUsers,
		refetch: refetchUsers,
	} = useQuery<User[]>({
		queryKey: ["users"],
		queryFn: async () => {
			const res = await axios.get(`${API_URL}/users/`);
			return res.data;
		},
	});

	const { data: roles = [], isLoading: loadingRoles } =
		useQuery<Role[]>({
			queryKey: ["roles"],
			queryFn: async () => {
				const res = await axios.get(`${API_URL}/roles`);
				return res.data;
			},
		});

	const [userToDelete, setUserToDelete] =
		useState<User | null>(null);

	const deleteMutation = useMutation({
		mutationFn: async (user_id: number) => {
			await axios.delete(`${API_URL}/users/${user_id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["users"],
			});
		},
	});

	const getRoleName = (id_rol: number) =>
		roles.find((r) => r.id_rol === id_rol)?.nombre_rol ||
		id_rol;

	const isAdmin = (user: User) =>
		getRoleName(user.id_rol) === "ADMINISTRADOR";

	const handleEditSave = async (data: {
		nombre: string;
		apellido: string;
		email: string;
	}) => {
		if (!editUser) return;
		setIsSaving(true);
		try {
			await axios.patch(
				`${API_URL}/users/${editUser.id_usuario}`,
				data
			);
			setEditUser(null);
			queryClient.invalidateQueries({
				queryKey: ["users"],
			});
		} catch (e) {
			// Manejo de error opcional
		} finally {
			setIsSaving(false);
		}
	};

	const handleChangePassword = async (password: string) => {
		if (!editUser) return;
		await axios.put(
			`${API_URL}/users/${editUser.id_usuario}/password`,
			{
				new_password: password,
			}
		);
	};

	return (
		<div className="mx-auto py-8 max-w-4xl">
			<EditUserModal
				open={!!editUser}
				onOpenChange={(open) =>
					setEditUser(open ? editUser : null)
				}
				user={editUser}
				onSave={handleEditSave}
				onChangePassword={handleChangePassword}
				isSaving={isSaving}
			/>
			<ConfirmDialog
				open={!!userToDelete}
				title="Eliminar usuario"
				description={`¿Estás seguro de eliminar a ${userToDelete?.nombre} ${userToDelete?.apellido}? Esta acción no se puede deshacer.`}
				confirmText="Eliminar"
				cancelText="Cancelar"
				onConfirm={() => {
					if (userToDelete) {
						deleteMutation.mutate(userToDelete.id_usuario);
					}
					setUserToDelete(null);
				}}
				onCancel={() => setUserToDelete(null)}
			/>
			<div className="flex justify-between items-center mb-8">
				<h1 className="font-bold text-2xl">Usuarios</h1>
				<Button asChild>
					<Link href="/admin/users/create-users">
						Crear usuario
					</Link>
				</Button>
			</div>
			{loadingUsers || loadingRoles ? (
				<div className="py-10 text-center">Cargando...</div>
			) : (
				<div className="gap-6 grid grid-cols-1 md:grid-cols-2">
					{users.map((user) => (
						<Card
							key={user.id_usuario}
							className="flex flex-col gap-3 p-6">
							<div className="flex items-center gap-3 mb-2">
								<Image
									src={"/ufpsafuera.jpg"}
									alt={user.nombre}
									width={48}
									height={48}
									className="rounded-full w-12 h-12 object-cover"
								/>
								<div>
									<div className="font-semibold text-lg">
										{user.nombre} {user.apellido}
									</div>
									<div className="text-gray-700 text-sm">
										Email:
										<span className="font-medium">
											{user.email}
										</span>
									</div>
									<div className="text-gray-700 text-sm">
										Rol:
										<span className="font-medium">
											{getRoleName(user.id_rol)}
										</span>
									</div>
								</div>
							</div>
							<div className="flex gap-2 mt-3">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setEditUser(user)}>
									Editar
								</Button>
								<Button
									variant="secondary"
									size="sm"
									onClick={() =>
										router.push(
											`/admin/users/details/${user.id_usuario}`
										)
									}>
									Detalles
								</Button>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<span>
												<Button
													variant="destructive"
													size="sm"
													onClick={() =>
														setUserToDelete(user)
													}
													disabled={isAdmin(user)}>
													Eliminar
												</Button>
											</span>
										</TooltipTrigger>
										{isAdmin(user) && (
											<TooltipContent>
												No se puede eliminar un
												ADMINISTRADOR
											</TooltipContent>
										)}
									</Tooltip>
								</TooltipProvider>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

export default function UsersPageWrapper() {
	return <UsersPage />;
}

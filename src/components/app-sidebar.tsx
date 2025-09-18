"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Calendar,
	MessageSquare,
	FileText,
	User,
	LogOut,
	Bell,
} from "lucide-react";
import { useUserId } from "@/hooks/useUserId";
import { useNotificationsModal } from "@/components/notifications-modal-context";
import { useNotifications } from "@/hooks/useNotifications";

const menuByRole: Record<string, any[]> = {
	administrador: [
		{
			title: "Usuarios",
			href: "/admin/users",
			icon: User,
		},
		{
			title: "Citas",
			href: "/admin/citas",
			icon: Calendar,
		},
		{
			title: "Cambiar contraseña",
			href: "/admin/password",
			icon: User,
		},
	],
	psicologo: [
		{
			title: "Mi calendario",
			href: "/psicologo",
			icon: Calendar,
		},
		{
			title: "Citas",
			href: "/psicologo/citas",
			icon: FileText,
		},
		{
			title: "Cambiar contraseña",
			href: "/psicologo/password",
			icon: User,
		},
	],
	estudiante: [
		{
			title: "Mi calendario",
			href: "/student/calendario",
			icon: Calendar,
		},
		{
			title: "Chat",
			href: "/student/chat",
			icon: MessageSquare,
		},
		{
			title: "Mi perfil",
			href: "/student/detalles",
			icon: User,
		},
		{
			title: "Cambiar contraseña",
			href: "/student/password",
			icon: User,
		},
	],
};

export function AppSidebar() {
	const path = usePathname() || "/";
	const router = useRouter();
	const [role, setRole] = useState<string | null>(null);
	const [user, setUser] = useState<any>(null);
	const { open, setOpen } = useNotificationsModal();
	const userId = useUserId();
	const { unreadCount } = useNotifications(userId);

	useEffect(() => {
		const storedRole = localStorage
			.getItem("role")
			?.toLowerCase();
		const storedUser = localStorage.getItem("user");
		setRole(storedRole ?? "");
		if (storedUser) setUser(JSON.parse(storedUser));
	}, []);

	const menuItems = menuByRole[role || ""] || [];

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		localStorage.removeItem("role");
		router.push("/auth/login");
	};

	return (
		<aside className="flex flex-col bg-white shadow-none border-r w-56 h-screen">
			<div className="flex flex-col gap-0 px-6 pt-7 pb-3">
				<img
					src="/personajes.png"
					alt="Robot"
					className="mx-auto mb-2 w-12 h-12"
				/>
				<span className="font-semibold text-red-700 text-sm leading-tight">
					Synapsis
				</span>
				{user && (
					<>
						<span className="mt-1 font-medium text-[15px] text-red-900 leading-none">
							{user.nombre} {user.apellido}
						</span>
						<span className="mt-0.5 text-[13px] text-red-400 capitalize">
							{role}
						</span>
					</>
				)}
				<hr className="mt-3 mb-2 border-red-200" />
				<div className="relative">
					<button
						className="relative flex items-center gap-1 ml-auto text-red-500 hover:text-red-700"
						title="Ver notificaciones"
						onClick={() => setOpen(true)}
						type="button">
						<Bell className="w-5 h-5" />
						{unreadCount > 0 && (
							<span className="inline-flex -top-1 -right-1 absolute justify-center items-center bg-red-600 px-1.5 py-0.5 rounded-full min-w-[18px] font-bold text-[10px] text-white">
								{unreadCount}
							</span>
						)}
					</button>
				</div>
			</div>
			<nav className="flex flex-col flex-1 gap-1">
				{menuItems.map(({ title, href, icon: Icon }) => {
					const isActive =
						path === href ||
						(path.startsWith(href) && href !== "/admin");
					return (
						<Link
							key={href}
							href={href}
							className={`flex items-center gap-2 px-7 py-2 rounded-lg text-[15px] font-medium transition
								${
									isActive
										? "bg-red-100 text-red-700"
										: "text-red-700 hover:bg-red-50"
								}`}>
							<Icon
								className={`w-5 h-5
									${isActive ? "stroke-red-700" : "stroke-red-400"}`}
								strokeWidth={2}
							/>
							<span>{title}</span>
						</Link>
					);
				})}
			</nav>
			<div className="flex-0 mt-auto px-4 pb-6">
				<button
					onClick={handleLogout}
					className="flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-md w-full font-medium text-[15px] text-red-400 hover:text-red-700 transition">
					<LogOut className="stroke-red-400 w-5 h-5" />
					Cerrar sesión
				</button>
			</div>
		</aside>
	);
}

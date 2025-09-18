// src/app/dashboard/layout.tsx
"use client";
import "@/styles/globals.css";
import React from "react";
import {
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	useAuthRedirect("ESTUDIANTE");
	return (
		<div className="flex h-screen">
			<SidebarProvider>
				<AppSidebar />

				<div className="flex flex-col flex-1 overflow-hidden">
					<header className="p-4 border-b">
						<SidebarTrigger className="hover:bg-gray-100 p-2 rounded-md" />
					</header>

					<main className="flex-1 bg-gray-50 p-6 overflow-auto">
						{children}
					</main>
				</div>
			</SidebarProvider>
		</div>
	);
}

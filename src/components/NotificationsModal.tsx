// Modal for notifications, rendered once at the root, controlled by context
"use client";
import React from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetClose,
} from "@/components/ui/sheet";
import { useNotificationsModal } from "@/components/notifications-modal-context";
import { useUserId } from "@/hooks/useUserId";
import { NotificationsPanel } from "@/components/notifications-panel";

export function NotificationsModal() {
	const { open, setOpen } = useNotificationsModal();
	const userId = useUserId();
	return (
		<Sheet
			open={open}
			onOpenChange={setOpen}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Notificaciones</SheetTitle>
				</SheetHeader>
				{userId && <NotificationsPanel userId={userId} />}
				<SheetClose asChild>
					{/* Use a single button, not a button inside a button */}
					<span className="block bg-red-100 mt-4 py-2 rounded-lg w-full text-red-700 text-center cursor-pointer select-none">
						Cerrar
					</span>
				</SheetClose>
			</SheetContent>
		</Sheet>
	);
}

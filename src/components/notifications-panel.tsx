"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationsPanelProps {
	userId: number;
}

export const NotificationsPanel: React.FC<
	NotificationsPanelProps
> = ({ userId }) => {
	const { notifications, markAsRead, deleteOne, clearAll } =
		useNotifications(userId);

	return (
		<div className="bg-white shadow p-4 rounded-lg w-full max-w-md">
			<h2 className="mb-4 font-bold text-lg">
				Notificaciones
			</h2>
			<div className="flex justify-end mb-2">
				<Button
					size="sm"
					variant="outline"
					onClick={clearAll}>
					Eliminar todas
				</Button>
			</div>
			{notifications.length === 0 ? (
				<div className="text-gray-500">
					No tienes notificaciones.
				</div>
			) : (
				<ul className="space-y-2 pr-1 max-h-[70vh] overflow-y-auto">
					{notifications.map((n) => (
						<li
							key={n.id_notificacion}
							className={`py-3 px-3 rounded-md border ${
								n.leida
									? "bg-gray-50 border-gray-200"
									: "bg-red-50 border-red-100"
							}`}>
							<div className="flex justify-between items-start gap-3">
								<div className="min-w-0">
									<div
										className={`font-medium break-words whitespace-pre-wrap ${
											n.leida
												? "text-gray-700"
												: "text-red-800"
										}`}>
										{n.titulo}
									</div>
									<div className="mt-1 text-gray-400 text-xs">
										{format(
											parseISO(n.fecha_creacion),
											"dd/MM/yyyy HH:mm"
										)}
									</div>
									{n.descripcion && (
										<div className="mt-2 text-gray-700 text-sm break-words whitespace-pre-wrap">
											{n.descripcion}
										</div>
									)}
								</div>
								<div className="flex flex-col flex-shrink-0 gap-2">
									{!n.leida && (
										<Button
											size="sm"
											variant="outline"
											onClick={() =>
												markAsRead(n.id_notificacion)
											}>
											Marcar como leída
										</Button>
									)}
									<Button
										size="sm"
										variant="destructive"
										onClick={() =>
											deleteOne(n.id_notificacion)
										}>
										Eliminar
									</Button>
								</div>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
};

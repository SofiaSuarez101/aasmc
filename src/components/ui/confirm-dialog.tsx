"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
	open: boolean;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title = "¿Estás seguro?",
	description = "Esta acción no se puede deshacer.",
	confirmText = "Eliminar",
	cancelText = "Cancelar",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(v) => !v && onCancel()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="z-50 fixed inset-0 bg-black/40" />
				<DialogPrimitive.Content className="top-1/2 left-1/2 z-50 fixed bg-white shadow-lg p-6 rounded-lg w-full max-w-md -translate-x-1/2 -translate-y-1/2">
					<DialogPrimitive.Title className="mb-2 font-bold text-lg">
						{title}
					</DialogPrimitive.Title>
					<DialogPrimitive.Description className="mb-4 text-gray-700">
						{description}
					</DialogPrimitive.Description>
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={onCancel}>
							{cancelText}
						</Button>
						<Button
							variant="destructive"
							onClick={onConfirm}>
							{confirmText}
						</Button>
					</div>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

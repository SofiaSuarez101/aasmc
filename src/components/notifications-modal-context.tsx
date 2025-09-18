// Provides a context and hook to open the notifications modal from anywhere
"use client";
import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
} from "react";

interface NotificationsModalContextType {
	open: boolean;
	setOpen: (open: boolean) => void;
}

const NotificationsModalContext = createContext<
	NotificationsModalContextType | undefined
>(undefined);

export function NotificationsModalProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	return (
		<NotificationsModalContext.Provider
			value={{ open, setOpen }}>
			{children}
		</NotificationsModalContext.Provider>
	);
}

export function useNotificationsModal() {
	const ctx = useContext(NotificationsModalContext);
	if (!ctx)
		throw new Error(
			"useNotificationsModal must be used within NotificationsModalProvider"
		);
	return ctx;
}

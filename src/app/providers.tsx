"use client";
import {
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { NotificationsModalProvider } from "@/components/notifications-modal-context";

export default function Providers({
	children,
}: {
	children: ReactNode;
}) {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<QueryClientProvider client={queryClient}>
			<NotificationsModalProvider>
				{children}
			</NotificationsModalProvider>
		</QueryClientProvider>
	);
}

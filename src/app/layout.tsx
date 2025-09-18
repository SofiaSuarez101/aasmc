import "@/styles/globals.css";

import { NotificationsModal } from "@/components/NotificationsModal";

import Providers from "./providers";

export const metadata = {
	title: "Synapsis",
	description: "Agendamiento de tutorías e IA",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es">
			<head>
				{/* Aquí Next insertará automáticamente los <meta> de metadata */}
				<link
					rel="icon"
					href="/favicon.ico"
					type="image/x-icon"
				/>
			</head>
			<body className="bg-gray-100 text-gray-900">
				<Providers>
					<NotificationsModal />
					{children}
				</Providers>
			</body>
		</html>
	);
}

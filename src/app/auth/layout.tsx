"use client";

import React, { ReactNode } from "react";

interface LoginLayoutProps {
	children: ReactNode;
}

export default function LoginLayout({
	children,
}: LoginLayoutProps) {
	return (
		<div className="flex justify-center items-center bg-gray-50 min-h-screen">
			{children}
		</div>
	);
}

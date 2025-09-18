import { NextRequest, NextResponse } from "next/server";
import axios from "axios";


const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;

	// Handle /notifications/user/{userId} route
	if (slug.length === 2 && slug[0] === "user") {
		const userId = slug[1];
		try {
			const res = await axios.get(
				`${API_URL}/notifications/user/${userId}`
			);
			return NextResponse.json(res.data);
		} catch (err: any) {
			return NextResponse.json(
				{ error: "Error fetching notifications" },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json(
		{ error: "Invalid route" },
		{ status: 404 }
	);
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;

	// Handle /notifications/{notificationId}/read route
	if (slug.length === 2 && slug[1] === "read") {
		const notificationId = slug[0];
		try {
			const res = await axios.patch(
				`${API_URL}/notifications/${notificationId}/read`
			);
			return NextResponse.json(res.data);
		} catch (err: any) {
			return NextResponse.json(
				{ error: "Error marking as read" },
				{ status: 500 }
			);
		}
	}

	return NextResponse.json(
		{ error: "Invalid route" },
		{ status: 404 }
	);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ slug: string[] }> }
) {
	const { slug } = await params;
	if (slug.length === 2 && slug[0] === "user") {
		const userId = slug[1];
		try {
			const res = await axios.delete(
				`${API_URL}/notifications/user/${userId}`
			);
			return NextResponse.json(res.data ?? {}, {
				status: 204,
			});
		} catch (err: any) {
			return NextResponse.json(
				{ error: "Error clearing notifications" },
				{ status: 500 }
			);
		}
	}
	return NextResponse.json(
		{ error: "Invalid route" },
		{ status: 404 }
	);
}

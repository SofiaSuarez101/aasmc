import { NextResponse } from "next/server";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

export async function GET() {
	const res = await fetch(`${API_URL}/users`);
	const data = await res.json();
	return NextResponse.json(data);
}

export async function POST(req: Request) {
	const data = await req.json();
	const res = await fetch(`${API_URL}/users`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	const resData = await res.json();
	return NextResponse.json(resData, { status: res.status });
}

export async function DELETE(req: Request) {
	const { user_id } = await req.json();
	const res = await fetch(`${API_URL}/users/${user_id}`, {
		method: "DELETE",
	});
	return NextResponse.json({}, { status: res.status });
}

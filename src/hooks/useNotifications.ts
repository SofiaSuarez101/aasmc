"use client";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import axios from "axios";

export interface Notification {
	id_notificacion: number;
	titulo: string;
	descripcion?: string;
	leida: boolean;
	fecha_creacion: string;
	id_estudiante?: number;
	id_psicologo?: number;
}

// Resolve base API URL (HTTP) with local override for dev convenience
const API_URL = (() => {
	const env = (
		process.env.NEXT_PUBLIC_API_URL || "/api"
	).toString();
	if (typeof window !== "undefined") {
		const host = window.location.hostname;
		const isLocal =
			host === "localhost" || host === "127.0.0.1";
		if (isLocal && !process.env.NEXT_PUBLIC_API_URL)
			return "http://localhost:8000";
	}
	return env;
})();

// Derive WebSocket notifications URL from explicit env or transform API_URL
// Priority:
// 1. Explicit NEXT_PUBLIC_NOTIFICATIONS_WS_URL
// 2. Transform NEXT_PUBLIC_API_URL (http->ws, https->wss)
// 3. Local dev fallback ws://localhost:8000
const NOTIFICATIONS_WS_URL_BASE = (() => {
	const explicit =
		process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL;
	if (explicit) return explicit.replace(/\/$/, "");
	// If API_URL already includes protocol, convert; else assume http
	const candidate = API_URL;
	if (
		candidate.startsWith("http://") ||
		candidate.startsWith("https://")
	) {
		if (candidate.startsWith("https://"))
			return candidate.replace("https://", "wss://");
		return candidate.replace("http://", "ws://");
	}
	if (typeof window !== "undefined") {
		const host = window.location.host;
		const isSecure = window.location.protocol === "https:";
		return `${isSecure ? "wss" : "ws"}://${host}`;
	}
	return "ws://localhost:8000";
})();

function toWsUrl(httpUrl: string) {
	if (httpUrl.startsWith("https://"))
		return httpUrl.replace("https://", "wss://");
	if (httpUrl.startsWith("http://"))
		return httpUrl.replace("http://", "ws://");
	return `ws://${httpUrl}`;
}

export function useNotifications(userId?: number | null) {
	const [notifications, setNotifications] = useState<
		Notification[]
	>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	const [connected, setConnected] =
		useState<boolean>(false);
	const wsRef = useRef<WebSocket | null>(null);
	const pingTimerRef = useRef<ReturnType<
		typeof setInterval
	> | null>(null);
	const reconnectTimerRef = useRef<ReturnType<
		typeof setTimeout
	> | null>(null);
	const reconnectAttemptsRef = useRef<number>(0);

	const token = useMemo(
		() =>
			typeof window !== "undefined"
				? localStorage.getItem("token")
				: null,
		[]
	);

	const fetchList = useCallback(async () => {
		if (!userId) return;
		const res = await axios.get<Notification[]>(
			`${API_URL}/notifications/user/${userId}`
		);
		setNotifications(res.data);
		setUnreadCount(res.data.filter((n) => !n.leida).length);
	}, [userId]);

	const scheduleReconnect = useCallback(() => {
		if (reconnectTimerRef.current) return;
		const attempt = (reconnectAttemptsRef.current =
			reconnectAttemptsRef.current + 1);
		const delay = Math.min(
			30000,
			1000 * Math.pow(2, attempt)
		);
		reconnectTimerRef.current = setTimeout(() => {
			reconnectTimerRef.current = null;
			// Try again
			connect();
		}, delay);
	}, []);

	const clearHeartbeat = useCallback(() => {
		if (pingTimerRef.current) {
			clearInterval(pingTimerRef.current);
			pingTimerRef.current = null;
		}
	}, []);

	const connect = useCallback(() => {
		if (!token) return;
		try {
			const url = `${NOTIFICATIONS_WS_URL_BASE}/ws/notifications?token=${encodeURIComponent(
				token
			)}`;
			const ws = new WebSocket(url);
			wsRef.current = ws;
			ws.onopen = () => {
				setConnected(true);
				reconnectAttemptsRef.current = 0;
				clearHeartbeat();
				pingTimerRef.current = setInterval(() => {
					try {
						wsRef.current?.send("ping");
					} catch {}
				}, 25000);
			};
			ws.onclose = (evt) => {
				setConnected(false);
				clearHeartbeat();
				// Log close code to help diagnose (e.g., 4401 unauthorized)
				if (typeof window !== "undefined") {
					// eslint-disable-next-line no-console
					console.debug("WS closed:", {
						code: (evt as CloseEvent).code,
						reason: (evt as CloseEvent).reason,
					});
				}
				// Attempt reconnects if token still present
				if (token) scheduleReconnect();
			};
			ws.onerror = () => {
				setConnected(false);
			};
			ws.onmessage = (evt) => {
				try {
					const msg = JSON.parse(evt.data);
					if (msg.type === "unread_count") {
						setUnreadCount(msg.count ?? 0);
					} else if (msg.type === "notification_new") {
						const n: Notification = msg.data;
						setNotifications((prev) => [n, ...prev]);
						setUnreadCount((c) => c + (n.leida ? 0 : 1));
					} else if (msg.type === "notification_read") {
						const id = msg.id as number;
						setNotifications((prev) =>
							prev.map((n) =>
								n.id_notificacion === id
									? { ...n, leida: true }
									: n
							)
						);
						setUnreadCount((c) => Math.max(0, c - 1));
					} else if (msg.type === "notification_deleted") {
						const id = msg.id as number;
						setNotifications((prev) => {
							const next = prev.filter(
								(n) => n.id_notificacion !== id
							);
							setUnreadCount(
								next.filter((n) => !n.leida).length
							);
							return next;
						});
					} else if (msg.type === "notifications_cleared") {
						setNotifications([]);
						setUnreadCount(0);
					}
				} catch {}
			};
		} catch {
			// If constructor fails, schedule reconnect
			scheduleReconnect();
		}
	}, [token, scheduleReconnect, clearHeartbeat]);

	useEffect(() => {
		// Initial fetch of list
		fetchList().catch(() => {});
	}, [fetchList]);

	useEffect(() => {
		connect();
		return () => {
			clearHeartbeat();
			if (reconnectTimerRef.current) {
				clearTimeout(reconnectTimerRef.current);
				reconnectTimerRef.current = null;
			}
			wsRef.current?.close();
			wsRef.current = null;
		};
	}, [connect, clearHeartbeat]);

	const markAsRead = useCallback(async (id: number) => {
		await axios.patch(
			`${API_URL}/notifications/${id}/read`
		);
		setNotifications((prev) =>
			prev.map((n) =>
				n.id_notificacion === id ? { ...n, leida: true } : n
			)
		);
		setUnreadCount((c) => Math.max(0, c - 1));
	}, []);

	const deleteOne = useCallback(async (id: number) => {
		await axios.delete(`${API_URL}/notifications/${id}`);
		setNotifications((prev) => {
			const next = prev.filter(
				(n) => n.id_notificacion !== id
			);
			setUnreadCount(next.filter((n) => !n.leida).length);
			return next;
		});
	}, []);

	const clearAll = useCallback(async () => {
		if (!userId) return;
		await axios.delete(
			`${API_URL}/notifications/user/${userId}`
		);
		setNotifications([]);
		setUnreadCount(0);
	}, [userId]);

	return {
		notifications,
		unreadCount,
		connected,
		refresh: fetchList,
		markAsRead,
		deleteOne,
		clearAll,
	};
}

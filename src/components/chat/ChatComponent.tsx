"use client";
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { SendHorizonal, Bot, User } from "lucide-react";
import {
	useTypewriter,
	Cursor,
} from "react-simple-typewriter";
import { useUserId } from "@/hooks/useUserId";

interface ChatMessage {
	role: "user" | "agent";
	content: string;
}

const AGENT_API_URL =
	process.env.NEXT_PUBLIC_AGENT_API_URL ||
	"http://localhost:8100";
// Backend no longer requires API key; JWT is issued openly

const ChatComponent: React.FC = () => {
	const [messages, setMessages] = useState<ChatMessage[]>(
		[]
	);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [token, setToken] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isWarming, setIsWarming] = useState(true); // <-- NUEVO
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const userId = useUserId();

	// Scroll al último mensaje
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({
			behavior: "smooth",
		});
	}, [messages, loading]);

	// Autenticación y warmup
	const fetchToken = async (): Promise<string | null> => {
		// Manejar falta de configuración para evitar spinner infinito
		try {
			const res = await axios.post(
				`${AGENT_API_URL}/token`,
				{},
				{ timeout: 15000 }
			);
			setToken(res.data.access_token);
			setIsWarming(false); // <--- Listo!
			return res.data.access_token;
		} catch {
			setError("No se pudo autenticar con el agente.");
			setIsWarming(false);
			return null;
		}
	};

	// Llama al backend apenas monta el componente (si falta API key, mostrará error y desactivará warmup)
	useEffect(() => {
		if (!token) {
			fetchToken();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Envío de mensaje
	const handleSend = async () => {
		if (!input.trim() || loading) return;

		setLoading(true);
		setError(null);

		// Agregar mensaje del usuario
		const newUserMessage: ChatMessage = {
			role: "user",
			content: input,
		};
		const newMessages = [...messages, newUserMessage];
		setMessages(newMessages);

		// Construir contexto
		const contexto = newMessages
			.map((m) =>
				m.role === "user"
					? `Estudiante: ${m.content}`
					: `Agente: ${m.content}`
			)
			.join("\n");

		// Token válido
		let currentToken = token;
		if (!currentToken) {
			currentToken = await fetchToken();
			if (!currentToken) {
				setLoading(false);
				return;
			}
		}

		const consult = async (
			tk: string
		): Promise<boolean> => {
			try {
				const headers: Record<string, string> = {
					Authorization: `Bearer ${tk}`,
					"Content-Type": "application/json",
				};
				if (userId) headers["X-User-Id"] = String(userId);
				const res = await axios.post(
					`${AGENT_API_URL}/consultar`,
					{ pregunta: input, contexto },
					{
						headers,
						timeout: 30000,
					}
				);
				const agentMsg =
					typeof res.data === "string"
						? res.data
						: JSON.stringify(res.data);
				setMessages((prev) => [
					...prev,
					{ role: "agent", content: agentMsg },
				]);
				return true;
			} catch (err: any) {
				// Reintentar con token nuevo si expiró
				if (err?.response?.status === 401) {
					const newTk = await fetchToken();
					if (newTk) {
						setToken(newTk);
						return await consult(newTk);
					}
				}
				setError(
					err?.response?.data?.error ||
						"Error consultando al agente"
				);
				setMessages((prev) => [
					...prev,
					{
						role: "agent",
						content:
							"Ocurrió un error al consultar al agente.",
					},
				]);
				return false;
			}
		};

		await consult(currentToken);
		setInput("");
		setLoading(false);
	};

	const handleKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Enter") handleSend();
	};

	return (
		<div className="relative flex flex-col bg-[#fff1f2] w-full h-[100dvh]">
			{/* Header */}
			<header className="top-0 z-10 sticky flex items-center gap-2 bg-white shadow-sm px-6 py-4 border-red-200 border-b">
				<Bot
					size={22}
					className="text-red-400"
				/>
				<h2 className="font-semibold text-red-800 text-base">
					Synapsis
					<span className="opacity-60 ml-2 text-red-400 text-xs">
						(asistente virtual)
					</span>
				</h2>
			</header>
			{/* Zona de mensajes */}
			<div className="flex flex-col flex-1 gap-4 px-0 sm:px-0 py-6 overflow-y-auto">
				{/* Mensaje de "Calentando" */}
				{isWarming && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}>
						<p className="mt-10 text-red-400 text-base text-center animate-pulse">
							<span className="font-semibold">
								⏳ Iniciando agente... (puede tardar unos
								segundos si está en modo gratuito)
							</span>
						</p>
					</motion.div>
				)}
				{/* Mensaje de bienvenida */}
				{!isWarming && messages.length === 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}>
						<p className="mt-8 text-red-400 text-lg text-center">
							<Bot
								className="inline mr-2 mb-1 text-red-400"
								size={24}
							/>
							<span className="font-medium text-red-700">
								¡Hola! Soy Synapsis, tu asistente virtual de
								confianza.
							</span>
							<br />
							<span className="text-red-400 text-base">
								¿En qué puedo ayudarte hoy?
							</span>
						</p>
					</motion.div>
				)}
				{/* Mensajes normales */}
				<AnimatePresence>
					{messages.map((msg, i) => (
						<motion.div
							key={i}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 25,
							}}
							className={`w-full flex ${
								msg.role === "user"
									? "justify-end"
									: "justify-start"
							}`}>
							<div
								className={`max-w-2xl w-full flex ${
									msg.role === "user"
										? "justify-end"
										: "justify-start"
								}`}>
								<div
									className={`rounded-xl px-5 py-3 text-base shadow-sm border
										${
											msg.role === "user"
												? "bg-red-500 text-white border-red-200 rounded-br-md ml-auto"
												: "bg-white text-red-900 border-red-100 rounded-bl-md mr-auto"
										}
									`}>
									{msg.role === "agent" ? (
										<Typewriter text={msg.content} />
									) : (
										msg.content
									)}
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
				{/* Indicador pensando */}
				{loading && (
					<div className="flex justify-start w-full">
						<div className="bg-white px-5 py-3 border border-red-100 rounded-xl max-w-2xl text-red-400 animate-pulse">
							Pensando...
						</div>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>
			{/* Input */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSend();
				}}
				className="bottom-0 z-10 sticky flex gap-2 bg-white shadow-sm p-4 border-t border-red-200">
				<Input
					placeholder="Escribe tu pregunta o ejercicio..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={loading || !token || isWarming}
					className="flex-1 bg-red-50 border border-red-200 focus:ring-2 focus:ring-red-200 text-base"
					autoFocus
				/>
				<Button
					type="submit"
					disabled={
						loading || !input.trim() || !token || isWarming
					}
					className="bg-red-600 hover:bg-red-700 shadow-sm px-5 rounded-full font-semibold text-white">
					<SendHorizonal
						size={20}
						className="mr-1"
					/>
					Enviar
				</Button>
			</form>
			{/* Toast error */}
			<AnimatePresence>
				{error && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						className="bottom-24 absolute inset-x-0 flex justify-center">
						<div className="bg-red-600 shadow px-6 py-3 rounded-xl font-semibold text-white">
							{error}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

/* ────────── Typewriter helper ────────── */
function Typewriter({ text }: { text: string }) {
	const safe =
		typeof text === "string" ? text : JSON.stringify(text);
	const [out] = useTypewriter({
		words: [safe],
		loop: 1,
		typeSpeed: 15,
		deleteSpeed: 100,
		delaySpeed: 10,
	});
	return (
		<span>
			{out} <Cursor />
		</span>
	);
}

export default ChatComponent;

"use client";

import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { BookOpen, MoreVertical } from "lucide-react";
import moment from "moment";
import "moment/locale/es";
import "@/styles/calendar.css";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetClose,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Panel derecho de próximas citas
function ProximasCitas({ events }: { events: any[] }) {
	return (
		<aside className="bg-white shadow-xl p-6 rounded-2xl w-full md:w-[320px] min-w-[250px]">
			<h3 className="mb-4 font-semibold text-md text-violet-600">
				Próximas citas
			</h3>
			<div className="flex flex-col gap-3">
				{events.map((ev) => (
					<div
						key={ev.id}
						className="flex items-center gap-3 bg-violet-50 px-3 py-2 rounded-xl">
						<div className="bg-white shadow p-2 rounded-lg">
							{ev.icon}
						</div>
						<div>
							<div className="font-bold text-violet-900 text-sm">
								{ev.title}
							</div>
							<div className="text-gray-400 text-xs">
								{moment(ev.start).format(
									"dddd, DD MMM YYYY"
								)}
							</div>
							<div className="text-gray-500 text-xs capitalize">
								{moment(ev.start).format("HH:mm")} -
								{moment(ev.end).format("HH:mm")}
							</div>
							<div className="text-gray-700 text-xs">
								{ev.PSICOLOGO}
							</div>
						</div>
					</div>
				))}
			</div>
		</aside>
	);
}

// Evento con menú contextual
export function EventContentFC({
	event,
	menuOpenId,
	setMenuOpenId,
	onCancel,
	onReschedule,
	canReschedule,
}: {
	event: any;
	menuOpenId: string | null;
	setMenuOpenId: (id: string | null) => void;
	onCancel: (event: any) => void;
	onReschedule: (event: any) => void;
	canReschedule: boolean;
}) {
	const open = menuOpenId === event.id;
	const { title, extendedProps } = event;
	const { icon, PSICOLOGO, color } = extendedProps || {};
	return (
		<div
			tabIndex={0}
			onClick={(e) => {
				e.stopPropagation();
				setMenuOpenId(open ? null : event.id);
			}}
			onBlur={() => setMenuOpenId(null)}
			className="group relative cursor-pointer custom-event-box"
			style={{
				background: color || "#e0e7ef",
				borderRadius: "16px",
				border: `1.5px solid ${
					event.borderColor || "#c7d2fe"
				}`,
				minHeight: 72,
				padding: "1.1rem 1.1rem 0.8rem 1.1rem",
				boxShadow: "0 2px 12px 0 rgba(60,60,60,0.07)",
				color: event.textColor || "#3730a3",
				fontWeight: 600,
				fontSize: "1rem",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				position: "relative",
				overflow: "visible",
				outline: "none",
			}}>
			<div className="flex items-center gap-2">
				<span className="mr-1 text-xl">{icon}</span>
				<span className="font-bold text-[1rem]">
					{title}
				</span>
				<MoreVertical className="ml-auto w-5 h-5 text-gray-400 group-hover:text-violet-700 transition select-none" />
			</div>
			<div className="mt-2 font-normal text-gray-600 text-xs leading-tight">
				{PSICOLOGO}
			</div>
			{open && (
				<div className="top-full left-0 z-50 absolute bg-white shadow-xl mt-2 py-2 border border-gray-200 rounded-lg min-w-[180px] animate-fade-in">
					<button
						disabled={!canReschedule}
						className="block hover:bg-violet-50 px-4 py-2 w-full disabled:text-gray-400 text-left transition disabled:cursor-not-allowed"
						onClick={() => {
							setMenuOpenId(null);
							onReschedule(event);
						}}>
						Reprogramar cita
					</button>
					<button
						className="block hover:bg-violet-50 px-4 py-2 w-full text-left transition"
						onClick={() => {
							setMenuOpenId(null);
							onCancel(event);
						}}>
						Cancelar cita
					</button>
				</div>
			)}
		</div>
	);
}

export default function TutoriaCalendarComponent() {
	const calendarRef = useRef<any>(null);
	const [calendarView, setCalendarView] =
		useState("timeGridWeek");
	const [currentDate, setCurrentDate] = useState(
		new Date()
	);
	const [menuOpenId, setMenuOpenId] = useState<
		string | null
	>(null);
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [showReschedule, setShowReschedule] =
		useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [selectedEvent, setSelectedEvent] =
		useState<any>(null);
	const [confirmLoading, setConfirmLoading] =
		useState(false);
	const [form, setForm] = useState<{
		modalidad?: string;
		fecha_hora_inicio?: string;
		fecha_hora_fin?: string;
	}>({});

	// --- STATE for Crear Cita ---
	const [showCreate, setShowCreate] = useState(false);
	const [createForm, setCreateForm] = useState<{
		id_psicologo?: number;
		fecha_hora_inicio?: string;
		fecha_hora_fin?: string;
	}>({});
	const [createDate, setCreateDate] = useState("");
	const [createSlots, setCreateSlots] = useState<
		{ inicio: string; fin: string }[]
	>([]);
	const [availableDates, setAvailableDates] = useState<
		string[]
	>([]);
	const [psicologos, setPsicologos] = useState<
		{ id: number; nombre: string }[]
	>([]);
	const [loadingDates, setLoadingDates] = useState(false);
	const [loadingSlots, setLoadingSlots] = useState(false);
	const [createLoading, setCreateLoading] = useState(false);

	// --- STATE for Reprogramar Cita ---
	const [rescheduleDate, setRescheduleDate] = useState("");
	const [rescheduleSlots, setRescheduleSlots] = useState<
		{ inicio: string; fin: string }[]
	>([]);
	const [
		rescheduleLoadingDates,
		setRescheduleLoadingDates,
	] = useState(false);
	const [
		rescheduleLoadingSlots,
		setRescheduleLoadingSlots,
	] = useState(false);

	// --- Get user id from localStorage ---
	const [userId, setUserId] = useState<number | null>(null);
	useEffect(() => {
		if (typeof window !== "undefined") {
			const userStr = localStorage.getItem("user");
			if (userStr) {
				try {
					const userObj = JSON.parse(userStr);
					setUserId(userObj.id_usuario || userObj.id);
				} catch {
					setUserId(null);
				}
			}
		}
	}, []);

	useEffect(() => {
		if (!userId) return;
		const fetchTutorias = async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`${apiUrl}/citas/estudiante/${userId}`
				);
				const citas = await res.json();
				const mappedEvents = citas.map(
					(t: any, idx: number) => ({
						id: t.id_cita?.toString() || idx.toString(),
						title: `Cita ${t.id_cita}`,
						start: t.fecha_hora_inicio,
						end: t.fecha_hora_fin,
						color: "#fee2e2",
						borderColor: "#ef4444",
						textColor: "#b91c1c",
						desc: `Cita ${t.modalidad}`,
						place: "Edificio D",
						PSICOLOGO: `Psicólogo ${t.id_psicologo}`,
						icon: <BookOpen className="w-5 h-5" />,
					})
				);
				setEvents(mappedEvents);
			} catch (err) {
				console.error(err);
				setEvents([]);
			} finally {
				setLoading(false);
			}
		};
		fetchTutorias();
	}, [apiUrl, userId]);

	// Cancel cita handler
	const handleCancel = async () => {
		if (!selectedEvent) return;
		setConfirmLoading(true);
		try {
			// Get cita info before deleting
			const citaDate = selectedEvent.start
				? moment(selectedEvent.start).format("DD/MM/YYYY")
				: "";
			const citaTime = selectedEvent.start
				? moment(selectedEvent.start).format("HH:mm")
				: "";
			// Try to get id_psicologo from extendedProps, else from event object
			const psicologoId =
				selectedEvent.extendedProps?.id_psicologo ||
				selectedEvent.id_psicologo ||
				(selectedEvent.PSICOLOGO
					? Number(
							(selectedEvent.PSICOLOGO + "").replace(
								/\D/g,
								""
							)
					  )
					: undefined);

			await axios.delete(
				`${apiUrl}/citas/${selectedEvent.id}`
			);
			// Send notifications
			const notificationPayloads = [
				{
					id_psicologo: Number(psicologoId),
					titulo: `Su cita del día ${citaDate} a las ${citaTime} ha sido cancelada.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha cancelado una cita en el sistema que estaba programada para el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${apiUrl}/notifications/`, payload)
						.catch(() => {})
				)
			);
			setEvents((prev) =>
				prev.filter((ev) => ev.id !== selectedEvent.id)
			);
		} catch (err) {
			// Optionally show error
		} finally {
			setShowDelete(false);
			setSelectedEvent(null);
			setConfirmLoading(false);
		}
	};

	// Reprogramar cita handler
	const handleReschedule = async () => {
		if (
			!selectedEvent ||
			!rescheduleDate ||
			!form.fecha_hora_inicio ||
			!form.fecha_hora_fin
		)
			return;
		setConfirmLoading(true);
		try {
			const citaDate = form.fecha_hora_inicio
				? moment(form.fecha_hora_inicio).format(
						"DD/MM/YYYY"
				  )
				: "";
			const citaTime = form.fecha_hora_inicio
				? moment(form.fecha_hora_inicio).format("HH:mm")
				: "";
			const psicologoId =
				selectedEvent.extendedProps?.id_psicologo ||
				selectedEvent.id_psicologo ||
				(selectedEvent.PSICOLOGO
					? Number(
							(selectedEvent.PSICOLOGO + "").replace(
								/\D/g,
								""
							)
					  )
					: undefined);

			await axios.patch(
				`${apiUrl}/citas/reschedule/${selectedEvent.id}`,
				{
					fecha_hora_inicio: form.fecha_hora_inicio,
					fecha_hora_fin: form.fecha_hora_fin,
					modalidad: "presencial",
				}
			);
			// Send notifications
			const notificationPayloads = [
				{
					id_psicologo: Number(psicologoId),
					titulo: `Su cita ha sido reprogramada para el día ${citaDate} a las ${citaTime}.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha reprogramado una cita en el sistema para el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${apiUrl}/notifications/`, payload)
						.catch(() => {})
				)
			);
			setShowReschedule(false);
			setSelectedEvent(null);
			// Refetch events
			const res = await fetch(
				`${apiUrl}/citas/estudiante/${userId}`
			);
			const citas = await res.json();
			const mappedEvents = citas.map(
				(t: any, idx: number) => ({
					id: t.id_cita?.toString() || idx.toString(),
					title: `Cita ${t.id_cita}`,
					start: t.fecha_hora_inicio,
					end: t.fecha_hora_fin,
					color: "#fee2e2",
					borderColor: "#ef4444",
					textColor: "#b91c1c",
					desc: `Cita ${t.modalidad}`,
					place: "Edificio D",
					PSICOLOGO: `Psicólogo ${t.id_psicologo}`,
					icon: <BookOpen className="w-5 h-5" />,
				})
			);
			setEvents(mappedEvents);
		} catch (err: any) {
			if (err?.response?.status === 404) {
				alert(
					"Solo se pueden reprogramar citas que estén a más de 24 horas de la hora de inicio."
				);
			}
			// Optionally show error
		} finally {
			setConfirmLoading(false);
		}
	};

	// Can reschedule if more than 24h before start
	const canReschedule = (start: string) => {
		const startDate = moment(start);
		return startDate.diff(moment(), "hours") >= 24;
	};

	// --- Fetch psicologos for dropdown ---
	useEffect(() => {
		type PsicologoSelect = { id: number; nombre: string };
		const fetchPsicologos = async () => {
			try {
				const rolesRes = await axios.get(
					`${apiUrl}/roles/`
				);
				const usersRes = await axios.get(
					`${apiUrl}/users/`
				);
				const roles = rolesRes.data;
				const users = usersRes.data;
				const psicologoRole = roles.find(
					(r: any) =>
						r.nombre_rol &&
						r.nombre_rol.toLowerCase() === "psicologo"
				);
				const mapUserToSelectOption = (
					user: any
				): PsicologoSelect => ({
					id: user.id_usuario || user.id,
					nombre: user.nombre_completo || user.nombre,
				});
				const psicologosArr: PsicologoSelect[] =
					psicologoRole
						? users
								.filter(
									(u: any) =>
										u.id_rol === psicologoRole.id_rol
								)
								.map(mapUserToSelectOption)
						: [];

				// Filter psicologos by disponibilidad
				const filteredPsicologos: PsicologoSelect[] = [];
				await Promise.all(
					psicologosArr.map(async (p: PsicologoSelect) => {
						try {
							const today = new Date();
							const endDate = new Date();
							endDate.setDate(endDate.getDate() + 30);
							const res = await axios.get(
								`${apiUrl}/disponibilidad/${p.id}/dias_libres`,
								{
									params: {
										start: today
											.toISOString()
											.split("T")[0],
										end: endDate
											.toISOString()
											.split("T")[0],
									},
								}
							);
							if (
								Array.isArray(res.data) &&
								res.data.length > 0
							) {
								filteredPsicologos.push(p);
							}
						} catch {
							// Ignore psicologos with error or no disponibilidad
						}
					})
				);
				setPsicologos(filteredPsicologos);
			} catch {
				setPsicologos([]);
			}
		};
		if (showCreate) fetchPsicologos();
	}, [showCreate, apiUrl]);

	// --- Fetch available dates for selected psicologo ---
	const fetchAvailableDates = async (
		id_psicologo: number
	) => {
		setLoadingDates(true);
		try {
			const today = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 30);
			const res = await axios.get(
				`${apiUrl}/disponibilidad/${id_psicologo}/dias_libres`,
				{
					params: {
						start: today.toISOString().split("T")[0],
						end: endDate.toISOString().split("T")[0],
					},
				}
			);
			setAvailableDates(res.data);
		} catch {
			setAvailableDates([]);
		} finally {
			setLoadingDates(false);
		}
	};

	// --- Fetch available slots for selected date/psicologo ---
	const fetchCreateSlots = async (
		date: string,
		id_psicologo: number
	) => {
		setLoadingSlots(true);
		try {
			const res = await axios.get(
				`${apiUrl}/disponibilidad/${id_psicologo}/cita/0/libres`,
				{ params: { fecha: date } }
			);
			setCreateSlots(res.data);
		} catch {
			setCreateSlots([]);
		} finally {
			setLoadingSlots(false);
		}
	};

	// --- Fetch available dates for reschedule ---
	const fetchRescheduleDates = async (
		id_psicologo: number,
		id_cita: number
	) => {
		setRescheduleLoadingDates(true);
		try {
			const today = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 30);
			const res = await axios.get(
				`${apiUrl}/disponibilidad/${id_psicologo}/dias_libres`,
				{
					params: {
						start: today.toISOString().split("T")[0],
						end: endDate.toISOString().split("T")[0],
					},
				}
			);
			return res.data;
		} catch {
			return [];
		} finally {
			setRescheduleLoadingDates(false);
		}
	};

	// --- Fetch available slots for reschedule ---
	const fetchRescheduleSlots = async (
		date: string,
		id_psicologo: number,
		id_cita: number
	) => {
		setRescheduleLoadingSlots(true);
		try {
			const res = await axios.get(
				`${apiUrl}/disponibilidad/${id_psicologo}/cita/${id_cita}/libres`,
				{ params: { fecha: date } }
			);
			// If the cita being rescheduled is on the same date, add its current slot as available
			if (
				selectedEvent &&
				selectedEvent.start &&
				selectedEvent.end &&
				selectedEvent.start.slice(0, 10) === date
			) {
				const currentSlot = {
					inicio: selectedEvent.start.slice(11, 19),
					fin: selectedEvent.end.slice(11, 19),
				};
				const exists = res.data.some(
					(slot: { inicio: string; fin: string }) =>
						slot.inicio === currentSlot.inicio &&
						slot.fin === currentSlot.fin
				);
				if (!exists) {
					res.data.push(currentSlot);
				}
			}
			return res.data;
		} catch {
			return [];
		} finally {
			setRescheduleLoadingSlots(false);
		}
	};

	// --- Effect: when opening reschedule, fetch available dates ---
	useEffect(() => {
		if (
			showReschedule &&
			selectedEvent &&
			selectedEvent.id_psicologo
		) {
			setRescheduleDate("");
			setRescheduleSlots([]);
			(async () => {
				const dates = await fetchRescheduleDates(
					selectedEvent.id_psicologo,
					selectedEvent.id
				);
				setAvailableDates(dates);
			})();
		}
	}, [showReschedule, selectedEvent]);

	// --- Effect: when rescheduleDate changes, fetch slots ---
	useEffect(() => {
		if (
			showReschedule &&
			selectedEvent &&
			rescheduleDate &&
			selectedEvent.id_psicologo
		) {
			(async () => {
				const slots = await fetchRescheduleSlots(
					rescheduleDate,
					selectedEvent.id_psicologo,
					selectedEvent.id
				);
				setRescheduleSlots(slots);
			})();
		} else {
			setRescheduleSlots([]);
		}
	}, [rescheduleDate, showReschedule, selectedEvent]);

	// --- Effect: fetch available dates when psicologo changes ---
	useEffect(() => {
		if (showCreate && createForm.id_psicologo) {
			fetchAvailableDates(Number(createForm.id_psicologo));
		} else {
			setAvailableDates([]);
		}
	}, [createForm.id_psicologo, showCreate]);

	// --- Effect: fetch slots when date changes ---
	useEffect(() => {
		if (
			showCreate &&
			createForm.id_psicologo &&
			createDate
		) {
			fetchCreateSlots(
				createDate,
				Number(createForm.id_psicologo)
			);
		} else {
			setCreateSlots([]);
		}
	}, [createDate, createForm.id_psicologo, showCreate]);

	// --- Handle create cita ---
	const handleCreateCita = async () => {
		if (
			!userId ||
			!createForm.id_psicologo ||
			!createForm.fecha_hora_inicio ||
			!createForm.fecha_hora_fin
		)
			return;
		setCreateLoading(true);
		try {
			await axios.post(`${apiUrl}/citas/`, {
				id_estudiante: userId,
				id_psicologo: Number(createForm.id_psicologo),
				fecha_hora_inicio: createForm.fecha_hora_inicio,
				fecha_hora_fin: createForm.fecha_hora_fin,
				modalidad: "presencial",
			});
			setShowCreate(false);
			setCreateForm({});
			setCreateDate("");
			setCreateSlots([]);
			// Refetch events
			const res = await fetch(
				`${apiUrl}/citas/estudiante/${userId}`
			);
			const citas = await res.json();
			const mappedEvents = citas.map(
				(t: any, idx: number) => ({
					id: t.id_cita?.toString() || idx.toString(),
					title: `Cita ${t.id_cita}`,
					start: t.fecha_hora_inicio,
					end: t.fecha_hora_fin,
					color: "#fee2e2", // red-200
					borderColor: "#ef4444", // red-500
					textColor: "#b91c1c", // red-700
					desc: `Cita ${t.modalidad}`,
					place: "Edificio D",
					PSICOLOGO: `Psicólogo ${t.id_psicologo}`,
					icon: <BookOpen className="w-5 h-5" />,
				})
			);
			setEvents(mappedEvents);
		} catch (err) {
			// Optionally show error
		} finally {
			setCreateLoading(false);
		}
	};

	// --- RED THEME: Change event and calendar colors to red ---
	// Change event color mapping
	useEffect(() => {
		setEvents((prev) =>
			prev.map((ev) => ({
				...ev,
				color: "#fee2e2", // red-200
				borderColor: "#ef4444", // red-500
				textColor: "#b91c1c", // red-700
			}))
		);
	}, []);

	return (
		<div className="bg-[#f9fafb] px-2 py-8 min-h-screen">
			<div className="relative flex md:flex-row flex-col gap-10 bg-white shadow-lg mx-auto p-8 rounded-2xl w-full max-w-6xl">
				{/* Main */}
				<div className="flex-1 min-w-0">
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<div>
							<span className="block font-bold text-red-900 text-xl capitalize">
								{moment(currentDate).format("MMMM YYYY")}
							</span>
							<span className="block text-red-400 text-sm">
								{calendarView === "timeGridWeek"
									? "Vista semanal"
									: "Vista diaria"}
								<span className="inline-block bg-red-100 ml-1 px-2 py-0.5 rounded font-medium text-xs">
									Vista previa
								</span>
							</span>
						</div>
						<div className="flex items-center gap-3">
							<button
								className="bg-white hover:bg-red-50 px-3 py-2 border border-red-200 rounded-lg font-medium text-red-900"
								onClick={() => {
									if (!calendarRef.current) return;
									const api = calendarRef.current.getApi();
									api.prev();
									setCurrentDate(api.getDate());
								}}>
								{"<"}
							</button>
							<button
								className="bg-white hover:bg-red-50 px-3 py-2 border border-red-200 rounded-lg font-medium text-red-900"
								onClick={() => {
									if (!calendarRef.current) return;
									const api = calendarRef.current.getApi();
									api.today();
									setCurrentDate(api.getDate());
								}}>
								Hoy
							</button>
							<button
								className="bg-white hover:bg-red-50 px-3 py-2 border border-red-200 rounded-lg font-medium text-red-900"
								onClick={() => {
									if (!calendarRef.current) return;
									const api = calendarRef.current.getApi();
									api.next();
									setCurrentDate(api.getDate());
								}}>
								{">"}
							</button>
							<select
								value={calendarView}
								onChange={(e) => {
									setCalendarView(e.target.value);
									if (calendarRef.current) {
										calendarRef.current
											.getApi()
											.changeView(e.target.value);
									}
								}}
								className="bg-red-100 ml-2 px-3 py-2 border-none rounded-lg focus:ring-2 focus:ring-red-200 font-medium text-red-800 text-sm">
								<option value="timeGridWeek">
									Vista semanal
								</option>
								<option value="timeGridDay">
									Vista diaria
								</option>
							</select>
							<Button
								className="bg-red-700 hover:bg-red-800 ml-4 font-bold text-white"
								onClick={() => setShowCreate(true)}>
								Crear Cita
							</Button>
						</div>
					</div>
					<FullCalendar
						ref={calendarRef}
						plugins={[timeGridPlugin, interactionPlugin]}
						initialView={calendarView}
						headerToolbar={false}
						slotMinTime="07:00:00"
						slotMaxTime="19:00:00"
						events={events.map((ev) => ({
							...ev,
							backgroundColor: ev.color,
							borderColor: ev.borderColor,
							textColor: ev.textColor,
							extendedProps: {
								PSICOLOGO: ev.PSICOLOGO,
								icon: ev.icon,
								color: ev.color,
							},
						}))}
						locale={esLocale}
						eventContent={(arg) => (
							<EventContentFC
								event={arg.event}
								menuOpenId={menuOpenId}
								setMenuOpenId={setMenuOpenId}
								onCancel={(ev) => {
									setSelectedEvent(ev);
									setShowDelete(true);
								}}
								onReschedule={(ev) => {
									setSelectedEvent(ev);
									setForm({
										modalidad:
											ev.extendedProps?.modalidad ||
											"presencial",
									});
									setShowReschedule(true);
								}}
								canReschedule={canReschedule(
									arg.event.startStr
								)}
							/>
						)}
						nowIndicator
						allDaySlot={false}
						height={700}
						datesSet={(arg) => setCurrentDate(arg.start)}
					/>
				</div>
				{/* Panel derecho */}
				<div className="hidden md:block">
					<ProximasCitas events={events} />
				</div>
			</div>
			{/* Panel en móvil */}
			<div className="md:hidden block mt-6">
				<ProximasCitas events={events} />
			</div>
			<Sheet
				open={showReschedule}
				onOpenChange={setShowReschedule}>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Reprogramar cita</SheetTitle>
						<p className="text-red-500 text-sm">
							Seleccione nueva fecha y horario para la cita.
						</p>
					</SheetHeader>
					<div className="flex flex-col space-y-4">
						{/* Fecha */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium text-red-700">
								Fecha
							</label>
							{rescheduleLoadingDates ? (
								<div className="text-gray-500 text-sm">
									Cargando fechas...
								</div>
							) : availableDates.length > 0 ? (
								<select
									className="px-3 py-2 border border-red-200 rounded"
									value={rescheduleDate}
									onChange={(e) => {
										setRescheduleDate(e.target.value);
										setForm((f) => ({
											...f,
											fecha_hora_inicio: "",
											fecha_hora_fin: "",
										}));
									}}>
									<option value="">Selecciona fecha</option>
									{availableDates.map((d) => (
										<option
											key={d}
											value={d}>
											{d}
										</option>
									))}
								</select>
							) : (
								<div className="text-gray-500 text-sm">
									No hay fechas disponibles
								</div>
							)}
						</div>
						{/* Horario */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium text-red-700">
								Horario
							</label>
							{rescheduleDate && rescheduleLoadingSlots ? (
								<div className="text-gray-500 text-sm">
									Cargando horarios...
								</div>
							) : rescheduleDate &&
							  rescheduleSlots.length > 0 ? (
								<select
									className="mb-2 px-2 py-1 border border-red-200 rounded w-full"
									value={
										form.fecha_hora_inicio?.split("T")[1] ||
										""
									}
									onChange={(e) => {
										const inicio = e.target.value;
										const slot = rescheduleSlots.find(
											(s) => s.inicio === inicio
										);
										if (slot) {
											setForm((f) => ({
												...f,
												fecha_hora_inicio: `${rescheduleDate}T${slot.inicio}`,
												fecha_hora_fin: `${rescheduleDate}T${slot.fin}`,
											}));
										}
									}}>
									<option value="">
										Selecciona un horario
									</option>
									{rescheduleSlots.map((slot) => (
										<option
											key={`${slot.inicio}-${slot.fin}`}
											value={slot.inicio}>
											{slot.inicio} - {slot.fin}
										</option>
									))}
								</select>
							) : rescheduleDate ? (
								<div className="text-gray-500 text-sm">
									No hay horarios libres
								</div>
							) : null}
						</div>
					</div>
					<SheetFooter className="flex justify-end space-x-2 mt-4">
						<Button
							variant="outline"
							onClick={() => setShowReschedule(false)}>
							Cancelar
						</Button>
						<Button
							onClick={handleReschedule}
							disabled={
								confirmLoading || !form.fecha_hora_inicio
							}
							className="bg-red-700 hover:bg-red-800 font-bold text-white">
							Reprogramar
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
			<ConfirmDialog
				open={showDelete}
				title="¿Cancelar esta cita?"
				description="Esta acción no se puede deshacer."
				confirmText="Cancelar cita"
				cancelText="Volver"
				onConfirm={handleCancel}
				onCancel={() => {
					setShowDelete(false);
					setSelectedEvent(null);
				}}
			/>
			{/* --- Crear Cita Sheet --- */}
			<Sheet
				open={showCreate}
				onOpenChange={setShowCreate}>
				<SheetContent className="space-y-4">
					<SheetHeader>
						<SheetTitle>Crear cita</SheetTitle>
						<p className="text-red-500 text-sm">
							Complete el formulario para crear una nueva
							cita.
						</p>
					</SheetHeader>
					<div className="flex flex-col space-y-4">
						{/* Psicólogo */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium text-red-700">
								Psicólogo
							</label>
							<select
								className="px-3 py-2 border border-red-200 rounded"
								value={
									createForm.id_psicologo !== undefined
										? String(createForm.id_psicologo)
										: ""
								}
								onChange={(e) => {
									setCreateForm((f) => ({
										...f,
										id_psicologo: e.target.value
											? Number(e.target.value)
											: undefined,
									}));
									setCreateDate("");
									setCreateSlots([]);
								}}>
								<option value="">
									Selecciona psicólogo
								</option>
								{psicologos.map((p) => (
									<option
										key={p.id}
										value={String(p.id)}>
										{p.nombre}
									</option>
								))}
							</select>
						</div>
						{/* Fecha */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium text-red-700">
								Fecha
							</label>
							{createForm.id_psicologo &&
								(loadingDates ? (
									<div className="text-gray-500 text-sm">
										Cargando fechas...
									</div>
								) : availableDates.length > 0 ? (
									<select
										className="px-3 py-2 border border-red-200 rounded"
										value={createDate}
										onChange={(e) => {
											setCreateDate(e.target.value);
											setCreateForm((f) => ({
												...f,
												fecha_hora_inicio: "",
												fecha_hora_fin: "",
											}));
											setCreateSlots([]);
										}}>
										<option value="">
											Selecciona fecha
										</option>
										{availableDates.map((d) => (
											<option
												key={d}
												value={d}>
												{d}
											</option>
										))}
									</select>
								) : (
									<div className="text-gray-500 text-sm">
										No hay fechas disponibles
									</div>
								))}
						</div>
						{/* Horario */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium text-red-700">
								Horario
							</label>
							{createDate && createSlots.length > 0 ? (
								<select
									className="mb-2 px-2 py-1 border border-red-200 rounded w-full"
									value={
										createForm.fecha_hora_inicio?.split(
											"T"
										)[1] || ""
									}
									onChange={(e) => {
										const inicio = e.target.value;
										const slot = createSlots.find(
											(s) => s.inicio === inicio
										);
										if (slot) {
											setCreateForm((f) => ({
												...f,
												fecha_hora_inicio: `${createDate}T${slot.inicio}`,
												fecha_hora_fin: `${createDate}T${slot.fin}`,
											}));
										}
									}}>
									<option value="">
										Selecciona un horario
									</option>
									{createSlots.map((slot) => (
										<option
											key={`${slot.inicio}-${slot.fin}`}
											value={slot.inicio}>
											{slot.inicio} - {slot.fin}
										</option>
									))}
								</select>
							) : createDate ? (
								<div className="text-gray-500 text-sm">
									No hay horarios libres
								</div>
							) : null}
						</div>
					</div>
					<SheetFooter className="flex justify-end space-x-2 mt-4">
						<Button
							variant="outline"
							onClick={() => setShowCreate(false)}>
							Cancelar
						</Button>
						<Button
							onClick={handleCreateCita}
							disabled={
								createLoading ||
								!userId ||
								!createForm.id_psicologo ||
								!createForm.fecha_hora_inicio
							}
							className="bg-red-700 hover:bg-red-800 font-bold text-white">
							Crear
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
}

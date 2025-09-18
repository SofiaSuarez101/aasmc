"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
	SheetClose,
} from "@/components/ui/sheet";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Calendar } from "@/components/ui/calendar";
import {
	format,
	parseISO,
	differenceInHours,
} from "date-fns";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import {
	useQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

// Types
interface Cita {
	id_cita: number;
	id_estudiante: number;
	id_psicologo: number;
	estudiante?: string;
	psicologo?: string;
	fecha_hora_inicio: string;
	fecha_hora_fin: string;
	modalidad: string;
}

interface CitaForm {
	id_estudiante?: string | number;
	id_psicologo?: string | number;
	fecha_hora_inicio?: string;
	fecha_hora_fin?: string;
	modalidad?: string;
}

interface Student {
	id: number;
	nombre: string;
	// ...other fields if needed...
}
interface Psicologo {
	id: number;
	nombre: string;
	// ...other fields if needed...
}

const AdminCitasPage: React.FC = () => {
	const [citas, setCitas] = useState<Cita[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreate, setShowCreate] = useState(false);
	const [showReschedule, setShowReschedule] =
		useState(false);
	const [selectedCita, setSelectedCita] =
		useState<Cita | null>(null);
	const [form, setForm] = useState<CitaForm>({});
	const [confirmLoading, setConfirmLoading] =
		useState(false);
	const [showDelete, setShowDelete] = useState(false);
	const [deleteId, setDeleteId] = useState<number | null>(
		null
	);
	const [showCancel, setShowCancel] = useState(false);
	const [cancelId, setCancelId] = useState<number | null>(
		null
	);
	const [availableSlots, setAvailableSlots] = useState<
		{ inicio: string; fin: string }[]
	>([]);
	const [rescheduleDate, setRescheduleDate] =
		useState<string>("");
	const [createDate, setCreateDate] = useState<string>("");
	const [createSlots, setCreateSlots] = useState<
		{ inicio: string; fin: string }[]
	>([]);
	const [availableDates, setAvailableDates] = useState<
		string[]
	>([]);
	const [loadingDates, setLoadingDates] = useState(false);
	const queryClient = useQueryClient();

	// Get current user and role from localStorage
	const [userId, setUserId] = useState<string | null>(null);
	const [userRole, setUserRole] = useState<string | null>(
		null
	);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const userStr = localStorage.getItem("user");
			const roleStr = localStorage.getItem("role");
			if (userStr) {
				try {
					const userObj = JSON.parse(userStr);
					setUserId(
						userObj.id_usuario?.toString() ||
							userObj.id?.toString() ||
							null
					);
				} catch {
					setUserId(null);
				}
			} else {
				setUserId(null);
			}
			setUserRole(roleStr ? roleStr.toUpperCase() : null);
		}
	}, []);

	// Fetch citas for current psicologo
	const {
		data: citasData = [],
		isLoading: loadingCitas,
		refetch: refetchCitas,
	} = useQuery({
		enabled: !!userId,
		queryKey: ["citas", userId],
		queryFn: async () => {
			if (!userId) return [];
			// For psicologo, fetch their citas
			const res = await axios.get(
				`${API_URL}/citas/psicologo/${userId}`
			);
			return res.data;
		},
	});

	// Fetch students and psicologos for dropdowns
	const {
		data: dropdownData = { students: [], psicologos: [] },
		isLoading: loadingDropdowns,
	} = useQuery({
		queryKey: ["dropdowns"],
		queryFn: async () => {
			const [usersRes, rolesRes] = await Promise.all([
				axios.get(`${API_URL}/users/`),
				axios.get(`${API_URL}/roles/`),
			]);
			const users: any[] = usersRes.data; // Explicitly type or ensure it's an array
			const roles: any[] = rolesRes.data; // Explicitly type or ensure it's an array

			const psicologoRole = roles.find(
				(r: any) =>
					r.nombre_rol &&
					r.nombre_rol.toLowerCase() === "psicologo"
			);
			const estudianteRole = roles.find(
				(r: any) =>
					r.nombre_rol &&
					r.nombre_rol.toLowerCase() === "estudiante"
			);

			// IMPORTANT: Replace 'user.actual_id_field' and 'user.actual_nombre_field'
			// with the actual property names from your API response for users.
			// For example, if your API returns 'user_id' and 'full_name':
			const mapUserToSelectOption = (user: any) => ({
				id: user.id_usuario || user.id, // Adjust to your API's user ID field
				nombre: user.nombre_completo || user.nombre, // Adjust to your API's user name field
			});

			const students = estudianteRole
				? users
						.filter(
							(u: any) => u.id_rol === estudianteRole.id_rol
						)
						.map(mapUserToSelectOption)
				: [];

			const psicologos = psicologoRole
				? users
						.filter(
							(u: any) => u.id_rol === psicologoRole.id_rol
						)
						.map(mapUserToSelectOption)
				: [];

			return {
				students,
				psicologos,
			};
		},
	});

	// Fetch available slots for reschedule
	const {
		data: availableSlotsData = [],
		refetch: refetchAvailableSlots,
		isLoading: loadingSlots,
	} = useQuery({
		enabled: !!(
			showReschedule &&
			selectedCita &&
			rescheduleDate
		),
		queryKey: [
			"availableSlots",
			rescheduleDate,
			selectedCita?.id_psicologo,
			selectedCita?.id_cita,
		],
		queryFn: async () => {
			if (!selectedCita || !rescheduleDate) return [];
			const res = await axios.get(
				`${API_URL}/disponibilidad/${selectedCita.id_psicologo}/cita/${selectedCita.id_cita}/libres`,
				{ params: { fecha: rescheduleDate } }
			);
			// If the cita being rescheduled is on the same date, add its current slot as available
			if (
				selectedCita &&
				format(
					parseISO(selectedCita.fecha_hora_inicio),
					"yyyy-MM-dd"
				) === rescheduleDate
			) {
				const currentSlot = {
					inicio: selectedCita.fecha_hora_inicio.slice(
						11,
						19
					),
					fin: selectedCita.fecha_hora_fin.slice(11, 19),
				};
				const exists = res.data.some(
					(slot: any) =>
						slot.inicio === currentSlot.inicio &&
						slot.fin === currentSlot.fin
				);
				if (!exists) {
					res.data.push(currentSlot);
				}
			}
			return res.data;
		},
	});

	// Reschedule mutation
	const rescheduleMutation = useMutation({
		mutationFn: async (payload: any) => {
			await axios.patch(
				`${API_URL}/citas/reschedule/${
					selectedCita!.id_cita
				}`,
				payload
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["citas"],
			});
			setShowReschedule(false);
		},
	});

	// Delete cita
	const handleDelete = async (id_cita: number) => {
		setConfirmLoading(true);
		try {
			// Find the cita and student for notification BEFORE deleting
			const cita = citasData.find(
				(c: Cita) => c.id_cita === id_cita
			);
			const selectedStudent = dropdownData.students.find(
				(s: Student) =>
					String(s.id) === String(cita?.id_estudiante)
			);
			const selectedPsicologo =
				dropdownData.psicologos.find(
					(p: Psicologo) => String(p.id) === String(userId)
				);
			const citaDate = cita?.fecha_hora_inicio
				? format(
						parseISO(cita.fecha_hora_inicio),
						"dd/MM/yyyy"
				  )
				: "";
			const citaTime = cita?.fecha_hora_inicio
				? format(parseISO(cita.fecha_hora_inicio), "HH:mm")
				: "";
			const notificationPayloads = [
				{
					id_estudiante: Number(cita?.id_estudiante),
					titulo: `Tu cita con el psicólogo ${
						selectedPsicologo?.nombre ?? ""
					} para el día ${citaDate} a las ${citaTime} ha sido cancelada.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha cancelado una cita en el sistema que estaba programada para el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${API_URL}/notifications/`, payload)
						.catch(() => {})
				)
			);
			await axios.delete(`${API_URL}/citas/${id_cita}`);
			setShowDelete(false);
			setDeleteId(null);
			refetchCitas();
		} catch (err) {
			// Optionally show error
		} finally {
			setConfirmLoading(false);
		}
	};

	// Cancel cita
	const handleCancel = async (id_cita: number) => {
		setConfirmLoading(true);
		try {
			await axios.patch(
				`${API_URL}/citas/cancelar/${id_cita}`
			);
			// Find the cita and student for notification
			const cita = citasData.find(
				(c: Cita) => c.id_cita === id_cita
			);
			const selectedStudent = dropdownData.students.find(
				(s: Student) =>
					String(s.id) === String(cita?.id_estudiante)
			);
			const selectedPsicologo =
				dropdownData.psicologos.find(
					(p: Psicologo) => String(p.id) === String(userId)
				);
			const citaDate = cita?.fecha_hora_inicio
				? format(
						parseISO(cita.fecha_hora_inicio),
						"dd/MM/yyyy"
				  )
				: "";
			const citaTime = cita?.fecha_hora_inicio
				? format(parseISO(cita.fecha_hora_inicio), "HH:mm")
				: "";
			const notificationPayloads = [
				{
					id_estudiante: Number(cita?.id_estudiante),
					titulo: `Tu cita con el psicólogo ${
						selectedPsicologo?.nombre ?? ""
					} para el día ${citaDate} a las ${citaTime} ha sido cancelada.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha cancelado una cita en el sistema que estaba programada para el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${API_URL}/notifications/`, payload)
						.catch(() => {})
				)
			);
			setShowCancel(false);
			setCancelId(null);
			refetchCitas();
		} catch (err) {
			// Optionally show error
		} finally {
			setConfirmLoading(false);
		}
	};

	// Open reschedule modal
	const openReschedule = (cita: Cita) => {
		setSelectedCita(cita);
		const today = new Date();
		const citaDate = format(
			parseISO(cita.fecha_hora_inicio),
			"yyyy-MM-dd"
		);
		setRescheduleDate(
			citaDate > format(today, "yyyy-MM-dd") ? citaDate : ""
		);
		setForm({
			id_psicologo: cita.id_psicologo,
			id_estudiante: cita.id_estudiante,
			fecha_hora_inicio: cita.fecha_hora_inicio,
			fecha_hora_fin: cita.fecha_hora_fin,
			modalidad: cita.modalidad,
		});
		setAvailableSlots([]);
		setShowReschedule(true);
	};

	// When rescheduleDate changes, fetch available slots
	useEffect(() => {
		if (showReschedule && selectedCita && rescheduleDate) {
			refetchAvailableSlots();
		}
	}, [rescheduleDate, showReschedule, selectedCita]);

	// Reschedule cita
	const handleReschedule = async () => {
		setConfirmLoading(true);
		try {
			await rescheduleMutation.mutateAsync({
				fecha_hora_inicio: form.fecha_hora_inicio,
				fecha_hora_fin: form.fecha_hora_fin,
				modalidad: form.modalidad,
			});
			// Send notifications to admin and student
			const selectedStudent = dropdownData.students.find(
				(s: Student) =>
					String(s.id) === String(form.id_estudiante)
			);
			const selectedPsicologo =
				dropdownData.psicologos.find(
					(p: Psicologo) => String(p.id) === String(userId)
				);
			const citaDate = form.fecha_hora_inicio
				? format(
						parseISO(form.fecha_hora_inicio as string),
						"dd/MM/yyyy"
				  )
				: "";
			const citaTime = form.fecha_hora_inicio
				? format(
						parseISO(form.fecha_hora_inicio as string),
						"HH:mm"
				  )
				: "";
			const notificationPayloads = [
				{
					id_estudiante: Number(form.id_estudiante),
					titulo: `Tu cita con el psicólogo ${
						selectedPsicologo?.nombre ?? ""
					} ha sido reprogramada para el día ${citaDate} a las ${citaTime}.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha reprogramado una cita en el sistema para el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${API_URL}/notifications/`, payload)
						.catch(() => {})
				)
			);
			refetchCitas();
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

	// Fetch available slots for create cita
	const fetchCreateSlots = async (
		date: string,
		id_psicologo: number
	) => {
		try {
			// For new appointments, cita ID is unknown, so we use 0. The backend ignores cita ID 0.
			const res = await axios.get(
				`${API_URL}/disponibilidad/${id_psicologo}/cita/0/libres`,
				{ params: { fecha: date } }
			);
			setCreateSlots(res.data);
		} catch (err) {
			console.error("Error fetching slots:", err);
			setCreateSlots([]);
		}
	};
	// Fetch available dates for create cita
	const fetchAvailableDates = async (
		id_psicologo: number
	) => {
		try {
			setLoadingDates(true);
			const today = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 30);
			const res = await axios.get(
				`${API_URL}/disponibilidad/${id_psicologo}/dias_libres`,
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
	// When psicologo or showCreate changes, fetch available dates
	useEffect(() => {
		if (showCreate && form.id_psicologo) {
			fetchAvailableDates(Number(form.id_psicologo));
		} else {
			setAvailableDates([]);
		}
	}, [form.id_psicologo, showCreate]);

	// When createDate changes, fetch available slots for create cita
	useEffect(() => {
		if (showCreate && form.id_psicologo && createDate) {
			fetchCreateSlots(
				createDate,
				Number(form.id_psicologo)
			);
		} else {
			setCreateSlots([]);
		}
	}, [createDate, form.id_psicologo, showCreate]);

	// Open create cita modal
	const openCreate = () => {
		setForm({});
		setCreateDate("");
		setCreateSlots([]);
		setShowCreate(true);
	};
	// Create cita
	const handleCreate = async () => {
		setConfirmLoading(true);
		try {
			// Always use the logged-in psicologo (userId)
			await axios.post(`${API_URL}/citas/`, {
				id_estudiante: Number(form.id_estudiante),
				id_psicologo: Number(userId),
				fecha_hora_inicio: form.fecha_hora_inicio,
				fecha_hora_fin: form.fecha_hora_fin,
				modalidad: "presencial",
			});

			// Get selected student and psicologo objects
			const selectedStudent = dropdownData.students.find(
				(s: Student) =>
					String(s.id) === String(form.id_estudiante)
			);
			const selectedPsicologo =
				dropdownData.psicologos.find(
					(p: Psicologo) => String(p.id) === String(userId)
				);

			// Format date and time for notification
			const citaDate = form.fecha_hora_inicio
				? format(
						parseISO(form.fecha_hora_inicio as string),
						"dd/MM/yyyy"
				  )
				: "";
			const citaTime = form.fecha_hora_inicio
				? format(
						parseISO(form.fecha_hora_inicio as string),
						"HH:mm"
				  )
				: "";

			// Send notifications to student, psychologist, and admin (id 1), including names and cita date/time
			const notificationPayloads = [
				{
					id_estudiante: Number(form.id_estudiante),
					titulo: `Tienes una nueva cita programada con el psicólogo ${
						selectedPsicologo?.nombre ?? ""
					} el día ${citaDate} a las ${citaTime}.`,
				},
				{
					id_psicologo: Number(userId),
					titulo: `Tienes una nueva cita programada con el estudiante ${
						selectedStudent?.nombre ?? ""
					} el día ${citaDate} a las ${citaTime}.`,
				},
				{
					id_estudiante: 1, // Admin user id
					titulo: `Se ha creado una nueva cita en el sistema el día ${citaDate} a las ${citaTime}.`,
				},
			];
			await Promise.all(
				notificationPayloads.map((payload) =>
					axios
						.post(`${API_URL}/notifications/`, payload)
						.catch(() => {})
				)
			);

			setShowCreate(false);
			refetchCitas();
		} catch (err) {
			console.error("Error creating appointment:", err);
			// Optionally show error
		} finally {
			setConfirmLoading(false);
		}
	};

	// Helper: check if cita can be rescheduled
	const canReschedule = (fecha_hora_inicio: string) => {
		const diff = differenceInHours(
			parseISO(fecha_hora_inicio),
			new Date()
		);
		return diff >= 24; // Only allow if cita is more than 24h away
	};

	// Helper to get user name by ID from dropdownData
	const getUserName = (
		id: number | string | undefined,
		type: "students" | "psicologos"
	) => {
		if (!id) return "";
		const arr = dropdownData[type];
		const found = arr.find(
			(u: any) => String(u.id) === String(id)
		);
		return found ? found.nombre : id;
	};

	// Always fetch available dates for the current psicologo when rescheduling
	useEffect(() => {
		if (showReschedule && selectedCita) {
			fetchAvailableDates(
				Number(selectedCita.id_psicologo)
			);
		} else {
			setAvailableDates([]);
		}
	}, [showReschedule, selectedCita]);

	return (
		<div className="p-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="font-bold text-2xl">Citas</h1>
				<Button onClick={() => setShowCreate(true)}>
					Crear cita
				</Button>
			</div>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Estudiante</TableHead>
							<TableHead>Psicólogo</TableHead>
							<TableHead>Inicio</TableHead>
							<TableHead>Fin</TableHead>
							<TableHead>Modalidad</TableHead>
							<TableHead>Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{citasData.map((cita: Cita) => {
							const reschedulable = canReschedule(
								cita.fecha_hora_inicio
							);
							return (
								<TableRow key={cita.id_cita}>
									<TableCell>{cita.id_cita}</TableCell>
									<TableCell>
										{getUserName(
											cita.id_estudiante,
											"students"
										)}
									</TableCell>
									<TableCell>
										{getUserName(
											cita.id_psicologo,
											"psicologos"
										)}
									</TableCell>
									<TableCell>
										{formatInTimeZone(
											cita.fecha_hora_inicio,
											"UTC",
											"yyyy-MM-dd HH:mm"
										)}
									</TableCell>
									<TableCell>
										{formatInTimeZone(
											cita.fecha_hora_fin,
											"UTC",
											"yyyy-MM-dd HH:mm"
										)}
									</TableCell>
									<TableCell>{cita.modalidad}</TableCell>
									<TableCell className="flex gap-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Link
														href={`/psicologo/citas/observaciones/${cita.id_cita}`}>
														<Button
															size="sm"
															variant="outline">
															Observaciones
														</Button>
													</Link>
												</TooltipTrigger>
												<TooltipContent>
													Ver observaciones
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<span>
														<Button
															size="sm"
															disabled={!reschedulable}
															onClick={() =>
																openReschedule(cita)
															}
															variant="outline">
															Reprogramar
														</Button>
													</span>
												</TooltipTrigger>
												<TooltipContent>
													{reschedulable
														? "Reprogramar cita"
														: "No se puede reprogramar (más de 24h)"}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => {
												setShowDelete(true);
												setDeleteId(cita.id_cita);
											}}>
											Eliminar
										</Button>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			{/* Sheet for create cita */}
			<Sheet
				open={showCreate}
				onOpenChange={setShowCreate}>
				<SheetContent
					aria-describedby="create-appointment-description"
					className="space-y-4">
					<SheetHeader>
						<SheetTitle>Crear cita</SheetTitle>
						<p
							id="create-appointment-description"
							className="text-muted-foreground text-sm">
							Complete el formulario para crear una nueva
							cita.
						</p>
					</SheetHeader>
					{/* Form fields container */}
					<div className="flex flex-col space-y-4">
						{/* Student */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Estudiante
							</label>
							<select
								className="px-3 py-2 border rounded"
								value={
									form.id_estudiante !== undefined
										? String(form.id_estudiante)
										: ""
								}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										id_estudiante: e.target.value
											? Number(e.target.value)
											: undefined,
									}))
								}>
								<option value="">
									Selecciona estudiante
								</option>
								{dropdownData.students.map((s: Student) => (
									<option
										key={s.id}
										value={String(s.id)}>
										{s.nombre}
									</option>
								))}
							</select>
						</div>
						{/* Psicólogo */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Psicólogo
							</label>
							<select
								className="px-3 py-2 border rounded"
								value={
									form.id_psicologo !== undefined
										? String(form.id_psicologo)
										: ""
								}
								onChange={(e) => {
									setForm((f) => ({
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
								{dropdownData.psicologos.map(
									(p: Psicologo) => (
										<option
											key={p.id}
											value={String(p.id)}>
											{p.nombre}
										</option>
									)
								)}
							</select>
						</div>
						{/* Fecha */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Fecha
							</label>
							{form.id_psicologo &&
								(loadingDates ? (
									<div className="text-gray-500 text-sm">
										Cargando fechas...
									</div>
								) : availableDates.length > 0 ? (
									<select
										className="px-3 py-2 border rounded"
										value={createDate}
										onChange={(e) => {
											setCreateDate(e.target.value);
											setForm((f) => ({
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
							<label className="mb-1 font-medium">
								Horario
							</label>
							{createDate && createSlots.length > 0 ? (
								<select
									className="mb-2 px-2 py-1 border rounded w-full"
									value={
										form.fecha_hora_inicio?.split("T")[1] ||
										""
									}
									onChange={(e) => {
										const inicio = e.target.value;
										const slot = createSlots.find(
											(s: {
												inicio: string;
												fin: string;
											}) => s.inicio === inicio
										);
										if (slot) {
											setForm((f) => ({
												...f,
												fecha_hora_inicio: `${createDate}T${slot.inicio}`,
												fecha_hora_fin: `${createDate}T${slot.fin}`,
											}));
										}
									}}>
									<option value="">
										Selecciona un horario
									</option>
									{createSlots.map(
										(slot: {
											inicio: string;
											fin: string;
										}) => (
											<option
												key={`${slot.inicio}-${slot.fin}`}
												value={slot.inicio}>
												{slot.inicio} - {slot.fin}
											</option>
										)
									)}
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
							onClick={handleCreate}
							disabled={
								confirmLoading ||
								!form.id_estudiante ||
								!form.id_psicologo ||
								!form.fecha_hora_inicio
							}>
							Crear
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
			{/* Sheet for reschedule cita */}
			<Sheet
				open={showReschedule}
				onOpenChange={setShowReschedule}>
				<SheetContent
					aria-describedby="reschedule-appointment-description"
					className="space-y-4">
					<SheetHeader>
						<SheetTitle>Reprogramar cita</SheetTitle>
						<p
							id="reschedule-appointment-description"
							className="text-muted-foreground text-sm">
							Seleccione nueva fecha y horario para la cita.
						</p>
					</SheetHeader>
					<div className="flex flex-col space-y-4">
						{/* Show selected appointment info */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Psicólogo actual
							</label>
							<div className="px-3 py-2 border rounded">
								{getUserName(
									selectedCita?.id_psicologo,
									"psicologos"
								)}
							</div>
						</div>
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Estudiante
							</label>
							<div className="px-3 py-2 border rounded">
								{getUserName(
									selectedCita?.id_estudiante,
									"students"
								)}
							</div>
						</div>
						{/* Fecha */}
						<div className="flex flex-col">
							<label className="mb-1 font-medium">
								Fecha
							</label>
							{loadingDates ? (
								<div className="text-gray-500 text-sm">
									Cargando fechas...
								</div>
							) : availableDates.length > 0 ? (
								<select
									className="px-3 py-2 border rounded"
									value={rescheduleDate}
									onChange={(e) =>
										setRescheduleDate(e.target.value)
									}>
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
							<label className="mb-1 font-medium">
								Horario
							</label>
							{rescheduleDate && loadingSlots ? (
								<div className="text-gray-500 text-sm">
									Cargando horarios...
								</div>
							) : rescheduleDate &&
							  availableSlotsData.length > 0 ? (
								<select
									className="mb-2 px-2 py-1 border rounded w-full"
									value={
										form.fecha_hora_inicio?.split("T")[1] ||
										""
									}
									onChange={(e) => {
										const inicio = e.target.value;
										const slot = availableSlotsData.find(
											(s: {
												inicio: string;
												fin: string;
											}) => s.inicio === inicio
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
									{availableSlotsData.map(
										(slot: {
											inicio: string;
											fin: string;
										}) => (
											<option
												key={`${slot.inicio}-${slot.fin}`}
												value={slot.inicio}>
												{slot.inicio} - {slot.fin}
											</option>
										)
									)}
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
							}>
							Reprogramar
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
			{/* ConfirmDialog for delete */}
			<ConfirmDialog
				open={showDelete}
				title="¿Eliminar esta cita?"
				description="Esta acción marcará la cita como cancelada y la eliminará. ¿Desea continuar?"
				confirmText="Eliminar cita"
				cancelText="Cancelar"
				onConfirm={() => {
					if (deleteId) {
						handleDelete(deleteId);
					}
				}}
				onCancel={() => {
					setShowDelete(false);
					setDeleteId(null);
				}}
			/>
		</div>
	);
};

export default AdminCitasPage;

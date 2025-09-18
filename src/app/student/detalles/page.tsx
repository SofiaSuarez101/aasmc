"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectItem,
	SelectContent,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

type User = {
	id_rol?: number;
	nombre_completo?: string;
	nombre?: string;
	email?: string;
	[key: string]: any;
};

type Cita = {
	id_cita: number;
	psicologo?: string;
	id_psicologo?: string;
	estudiante?: string;
	id_estudiante?: string;
	fecha_hora_inicio: string;
	fecha_hora_fin: string;
	modalidad?: string;
};

type DisponibilidadSlot = {
	id_disponibilidad: number;
	fecha?: string;
	inicio?: string;
	hora_inicio?: string;
	hora_fin?: string;
	fin?: string;
	estado?: string;
	ocupado?: boolean;
	dia_semana?: string;
};

type Alerta = {
	id_alerta: number;
	id_estudiante: number;
	texto: string;
	severidad: string;
	fecha_creacion: string;
};

// Only allow LUNES to VIERNES for disponibilidad
const diasSemana = [
	"LUNES",
	"MARTES",
	"MIERCOLES",
	"JUEVES",
	"VIERNES",
];

const UserDetailsPage = () => {
	// Get userId from localStorage
	const [userid, setUserid] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [citas, setCitas] = useState<Cita[]>([]);
	const [disponibilidad, setDisponibilidad] = useState<
		DisponibilidadSlot[]
	>([]);
	const [loadingUser, setLoadingUser] = useState(true);
	const [loadingData, setLoadingData] = useState(false);
	const [showAddSheet, setShowAddSheet] = useState(false);
	const [newDia, setNewDia] = useState("");
	const [newInicio, setNewInicio] = useState("");
	const [newFin, setNewFin] = useState("");
	const [adding, setAdding] = useState(false);
	const [alertas, setAlertas] = useState<Alerta[]>([]);

	useEffect(() => {
		// Get userId from localStorage on mount
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			try {
				const parsed = JSON.parse(storedUser);
				setUserid(parsed.id_usuario || parsed.id);
			} catch {
				setUserid(null);
			}
		} else {
			setUserid(null);
		}
	}, []);

	const roleMap: Record<number, string> = {
		1: "ADMINISTRADOR",
		2: "PSICOLOGO",
		3: "ESTUDIANTE",
	};

	const userRole =
		user && user.id_rol ? roleMap[user.id_rol] || "" : "";

	useEffect(() => {
		if (!userid) return;
		const fetchUser = async () => {
			setLoadingUser(true);
			try {
				const userRes = await axios.get(
					`${API_URL}/users/${userid}`
				);
				setUser(userRes.data);
			} catch (err) {
				setUser(null);
			} finally {
				setLoadingUser(false);
			}
		};
		fetchUser();
	}, [userid]);

	useEffect(() => {
		const fetchData = async () => {
			if (!user || !userRole || !userid) return;
			setLoadingData(true);
			try {
				let citasRes = { data: [] as Cita[] };
				let dispRes = { data: [] as DisponibilidadSlot[] };
				if (userRole === "PSICOLOGO") {
					citasRes = await axios.get<Cita[]>(
						`${API_URL}/citas/psicologo/${userid}`
					);
					dispRes = await axios.get<DisponibilidadSlot[]>(
						`${API_URL}/disponibilidad/${userid}/cita/0`
					);
					setDisponibilidad(dispRes.data);
				} else if (userRole === "ESTUDIANTE") {
					citasRes = await axios.get<Cita[]>(
						`${API_URL}/citas/estudiante/${userid}`
					);
				}
				setCitas(citasRes.data);
				// Fetch alertas for this student
				const alertasRes = await axios.get<Alerta[]>(
					`${API_URL}/alertas/user/${userid}`
				);
				setAlertas(alertasRes.data);
			} catch (err) {
				setCitas([]);
				setDisponibilidad([]);
				setAlertas([]);
			} finally {
				setLoadingData(false);
			}
		};
		if (user && userid) {
			fetchData();
		}
	}, [user, userRole, userid]);

	// After setting citas in fetchData, fetch names for psicologo and estudiante if only IDs are present
	useEffect(() => {
		if (!citas.length) return;
		const fetchNames = async () => {
			const updatedCitas = await Promise.all(
				citas.map(async (cita) => {
					let psicologoName = cita.psicologo;
					let estudianteName = cita.estudiante;
					if (!psicologoName && cita.id_psicologo) {
						try {
							const res = await axios.get(
								`${API_URL}/users/${cita.id_psicologo}`
							);
							psicologoName =
								res.data.nombre_completo || res.data.nombre;
						} catch {}
					}
					if (!estudianteName && cita.id_estudiante) {
						try {
							const res = await axios.get(
								`${API_URL}/users/${cita.id_estudiante}`
							);
							estudianteName =
								res.data.nombre_completo || res.data.nombre;
						} catch {}
					}
					return {
						...cita,
						psicologo: psicologoName,
						estudiante: estudianteName,
					};
				})
			);
			setCitas(updatedCitas);
		};
		fetchNames();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [citas.length]);

	// Helper: get available time slots for the selected day and start time
	const getAvailableTimes = (
		dia: string,
		selectedStart?: string
	) => {
		const allTimes = [
			"08:00",
			"09:00",
			"10:00",
			"11:00",
			"12:00",
			"13:00",
			"14:00",
			"15:00",
			"16:00",
			"17:00",
			"18:00",
		];
		const taken = disponibilidad
			.filter(
				(d: DisponibilidadSlot) => d.dia_semana === dia
			)
			.map((d) => ({
				start: d.hora_inicio?.slice(0, 5) || "",
				end: d.hora_fin?.slice(0, 5) || "",
			}));

		const isInTakenRange = (time: string) => {
			return taken.some(
				({ start, end }) =>
					start && end && time >= start && time < end
			);
		};

		// Horas de inicio: no pueden estar dentro de un rango ocupado y deben permitir al menos una hora fin válida
		const start = allTimes.filter((t, idx) => {
			if (isInTakenRange(t)) return false;
			// Debe haber al menos una hora fin válida después de esta
			return allTimes.slice(idx + 1).some((endTime) => {
				if (isInTakenRange(endTime)) return false;
				// No debe cruzar con ningún rango ocupado
				return taken.every(({ start, end }) => {
					return !(
						start &&
						end &&
						t < end &&
						endTime > start
					);
				});
			});
		});

		// Horas de fin: deben ser mayores a la hora de inicio seleccionada, no pueden estar dentro de un rango ocupado
		let end: string[] = [];
		if (selectedStart) {
			const idx = allTimes.indexOf(selectedStart);
			end = allTimes.slice(idx + 1).filter(
				(t) =>
					!isInTakenRange(t) &&
					taken.every(({ start, end }) => {
						return !(
							start &&
							end &&
							selectedStart < end &&
							t > start
						);
					})
			);
		}
		return { start, end };
	};

	// Resetear los valores del formulario al cerrar el Sheet
	useEffect(() => {
		if (!showAddSheet) {
			setNewDia("");
			setNewInicio("");
			setNewFin("");
		}
	}, [showAddSheet]);

	if (loadingUser)
		return <div className="p-8">Cargando usuario...</div>;
	if (!user)
		return <div className="p-8">Usuario no encontrado</div>;

	return (
		<div className="space-y-8 p-8">
			<div>
				<h2 className="mb-2 font-bold text-xl">
					Alertas emocionales
				</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Severidad</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Texto</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loadingData ? (
							<TableRow>
								<TableCell colSpan={4}>
									Cargando alertas...
								</TableCell>
							</TableRow>
						) : alertas.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4}>
									Sin alertas
								</TableCell>
							</TableRow>
						) : (
							alertas.map((a) => (
								<TableRow key={a.id_alerta}>
									<TableCell>{a.id_alerta}</TableCell>
									<TableCell>{a.severidad}</TableCell>
									<TableCell>
										{format(
											parseISO(a.fecha_creacion),
											"yyyy-MM-dd HH:mm"
										)}
									</TableCell>
									<TableCell
										className="max-w-[600px] truncate"
										title={a.texto}>
										{a.texto}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			<div>
				<h1 className="mb-2 font-bold text-2xl">
					Detalles de Usuario
				</h1>
				<div className="mb-4">
					<div>
						<b>Nombre:</b>
						{user.nombre_completo || user.nombre}
					</div>
					<div>
						<b>Email:</b> {user.email}
					</div>
					<div>
						<b>Rol:</b> {userRole}
					</div>
				</div>
			</div>
			<div>
				<h2 className="mb-2 font-bold text-xl">
					Historial de Citas
				</h2>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Psicólogo</TableHead>
							<TableHead>Estudiante</TableHead>
							<TableHead>Inicio</TableHead>
							<TableHead>Fin</TableHead>
							<TableHead>Modalidad</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loadingData ? (
							<TableRow>
								<TableCell colSpan={6}>
									Cargando citas...
								</TableCell>
							</TableRow>
						) : citas.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6}>Sin citas</TableCell>
							</TableRow>
						) : (
							citas.map((cita) => (
								<TableRow key={cita.id_cita}>
									<TableCell>{cita.id_cita}</TableCell>
									<TableCell>
										{cita.psicologo || cita.id_psicologo}
									</TableCell>
									<TableCell>
										{cita.estudiante || cita.id_estudiante}
									</TableCell>
									<TableCell>
										{format(
											parseISO(cita.fecha_hora_inicio),
											"yyyy-MM-dd HH:mm"
										)}
									</TableCell>
									<TableCell>
										{format(
											parseISO(cita.fecha_hora_fin),
											"yyyy-MM-dd HH:mm"
										)}
									</TableCell>
									<TableCell>{cita.modalidad}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
			{userRole === "PSICOLOGO" && (
				<div>
					<div className="flex justify-between items-center mb-2">
						<h2 className="font-bold text-xl">
							Disponibilidad
						</h2>
						<Button
							variant="outline"
							onClick={() => setShowAddSheet(true)}>
							Agregar disponibilidad
						</Button>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Día</TableHead>
								<TableHead>Inicio</TableHead>
								<TableHead>Fin</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead>Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loadingData ? (
								<TableRow>
									<TableCell colSpan={5}>
										Cargando disponibilidad...
									</TableCell>
								</TableRow>
							) : disponibilidad.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5}>
										Sin disponibilidad
									</TableCell>
								</TableRow>
							) : (
								disponibilidad.map((slot) => (
									<TableRow key={slot.id_disponibilidad}>
										<TableCell>
											{slot.dia_semana || slot.fecha || ""}
										</TableCell>
										<TableCell>
											{slot.hora_inicio ||
												slot.inicio
													?.split("T")[1]
													?.substring(0, 5)}
										</TableCell>
										<TableCell>
											{slot.hora_fin ||
												slot.fin
													?.split("T")[1]
													?.substring(0, 5)}
										</TableCell>
										<TableCell>
											{slot.estado ||
												(slot.ocupado
													? "Ocupado"
													: "Libre")}
										</TableCell>
										<TableCell>
											<Button
												variant="destructive"
												size="sm"
												onClick={async () => {
													if (
														!window.confirm(
															"¿Eliminar esta disponibilidad?"
														)
													)
														return;
													try {
														await axios.delete(
															`${API_URL}/disponibilidad/${slot.id_disponibilidad}`
														);
														setDisponibilidad((prev) =>
															prev.filter(
																(d) =>
																	d.id_disponibilidad !==
																	slot.id_disponibilidad
															)
														);
													} catch (err) {
														alert(
															"Error eliminando disponibilidad"
														);
													}
												}}>
												Eliminar
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
					<Sheet
						open={showAddSheet}
						onOpenChange={setShowAddSheet}>
						<SheetContent>
							<SheetHeader>
								<SheetTitle>
									Agregar Disponibilidad
								</SheetTitle>
							</SheetHeader>
							<form
								onSubmit={async (e) => {
									e.preventDefault();
									setAdding(true);
									try {
										if (
											disponibilidad.some(
												(d) =>
													d.dia_semana === newDia &&
													d.hora_inicio?.slice(0, 5) ===
														newInicio
											)
										) {
											alert(
												"Ya existe disponibilidad para ese día y hora de inicio"
											);
											setAdding(false);
											return;
										}
										await axios.post(
											`${API_URL}/disponibilidad/`,
											{
												id_psicologo: userid,
												dia_semana: newDia,
												hora_inicio: newInicio,
												hora_fin: newFin,
											}
										);
										setShowAddSheet(false);
										setNewDia("");
										setNewInicio("");
										setNewFin("");
										// Refetch disponibilidad
										const dispRes = await axios.get(
											`${API_URL}/disponibilidad/${userid}/cita/0`
										);
										setDisponibilidad(dispRes.data);
									} catch (err) {
										alert("Error agregando disponibilidad");
									} finally {
										setAdding(false);
									}
								}}
								className="space-y-4 mt-4">
								<div>
									<label className="block mb-1">
										Día (LUNES a VIERNES)
									</label>
									<Select
										value={newDia}
										onValueChange={setNewDia}
										required>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecciona un día" />
										</SelectTrigger>
										<SelectContent>
											{diasSemana.map((dia) => (
												<SelectItem
													key={dia}
													value={dia}
													disabled={
														getAvailableTimes(dia).start
															.length === 0
													}>
													{dia}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="block mb-1">
										Hora inicio
									</label>
									<Select
										value={newInicio}
										onValueChange={(val) => {
											setNewInicio(val);
											setNewFin(""); // Reset fin cuando cambia inicio
										}}
										required
										disabled={!newDia}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecciona hora inicio" />
										</SelectTrigger>
										<SelectContent>
											{getAvailableTimes(newDia).start.map(
												(h: string) => (
													<SelectItem
														key={h}
														value={h}>
														{h}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
								</div>
								<div>
									<label className="block mb-1">
										Hora fin
									</label>
									<Select
										value={newFin}
										onValueChange={setNewFin}
										required
										disabled={!newDia || !newInicio}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Selecciona hora fin" />
										</SelectTrigger>
										<SelectContent>
											{getAvailableTimes(
												newDia,
												newInicio
											).end.map((h: string) => (
												<SelectItem
													key={h}
													value={h}>
													{h}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<SheetFooter>
									<Button
										type="submit"
										disabled={adding}>
										{adding ? "Agregando..." : "Agregar"}
									</Button>
								</SheetFooter>
							</form>
						</SheetContent>
					</Sheet>
				</div>
			)}
		</div>
	);
};

export default UserDetailsPage;

"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import {
	useRouter,
	useSearchParams,
} from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:8000";

// Function to format date as dd/mm/yyyy hh:mm AM/PM
const formatDate = (dateString: string) => {
	if (!dateString) return "";

	const date = new Date(dateString);
	const day = date.getDate().toString().padStart(2, "0");
	const month = (date.getMonth() + 1)
		.toString()
		.padStart(2, "0");
	const year = date.getFullYear();

	let hours = date.getHours();
	const minutes = date
		.getMinutes()
		.toString()
		.padStart(2, "0");
	const ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'

	return `${day}/${month}/${year} ${hours}:${minutes}${ampm}`;
};

export default function ObservacionesPage({
	params,
}: {
	params: Promise<{ id_cita: string }>;
}) {
	const router = useRouter();
	const resolvedParams = use(params);
	const id_cita = resolvedParams.id_cita;
	const [cita, setCita] = useState<any>(null);
	const [observaciones, setObservaciones] = useState<any[]>(
		[]
	);
	const [loading, setLoading] = useState(true);
	const [newObs, setNewObs] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const userStr = localStorage.getItem("user");
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
			}
		}
	}, []);
	const fetchData = async () => {
		setLoading(true);
		console.log("Fetching data for cita ID:", id_cita);
		try {
			const [citaRes, obsRes] = await Promise.all([
				axios.get(`${API_URL}/citas/${id_cita}`),
				axios.get(
					`${API_URL}/observaciones/cita/${id_cita}`
				),
			]);
			console.log("Cita response:", citaRes.data);
			console.log("Observaciones response:", obsRes.data);
			let citaData = citaRes.data;

			// Fetch names if missing
			if (!citaData.psicologo && citaData.id_psicologo) {
				try {
					const res = await axios.get(
						`${API_URL}/users/${citaData.id_psicologo}`
					);
					citaData.psicologo =
						res.data.nombre_completo || res.data.nombre;
				} catch {}
			}
			if (!citaData.estudiante && citaData.id_estudiante) {
				try {
					const res = await axios.get(
						`${API_URL}/users/${citaData.id_estudiante}`
					);
					citaData.estudiante =
						res.data.nombre_completo || res.data.nombre;
				} catch {}
			} // Fetch psychologist names for observations
			const observacionesWithNames = await Promise.all(
				obsRes.data.map(async (obs: any) => {
					try {
						const userRes = await axios.get(
							`${API_URL}/users/${obs.id_psicologo}`
						);
						return {
							...obs,
							psicologo_nombre:
								userRes.data.nombre_completo ||
								userRes.data.nombre,
						};
					} catch {
						return {
							...obs,
							psicologo_nombre: `ID: ${obs.id_psicologo}`,
						};
					}
				})
			);

			setCita(citaData);
			setObservaciones(observacionesWithNames);
		} catch (error) {
			console.error("Error fetching data:", error);
			console.log("API_URL:", API_URL);
			console.log("id_cita:", id_cita);
			setCita(null);
			setObservaciones([]);
		} finally {
			setLoading(false);
		}
	};
	useEffect(() => {
		console.log("Component mounted with id_cita:", id_cita);
		console.log("API_URL:", API_URL);
		if (id_cita) fetchData();
		// eslint-disable-next-line
	}, [id_cita]);

	const handleAdd = async () => {
		if (!newObs.trim() || !userId) return;
		setSubmitting(true);
		try {
			await axios.post(`${API_URL}/observaciones/`, {
				id_cita: Number(id_cita),
				id_psicologo: Number(userId),
				texto: newObs,
			});
			setNewObs("");
			fetchData();
		} catch {
			// Optionally show error
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (id_observacion: number) => {
		if (!confirm("¿Eliminar esta observación?")) return;
		try {
			await axios.delete(
				`${API_URL}/observaciones/${id_observacion}`
			);
			fetchData();
		} catch {
			// Optionally show error
		}
	};

	if (loading)
		return <div className="p-8">Cargando...</div>;
	if (!cita)
		return (
			<div className="p-8">No se encontró la cita.</div>
		);

	return (
		<div className="mx-auto p-8 max-w-2xl">
			<Button
				variant="outline"
				onClick={() => router.back()}
				className="mb-4">
				Volver
			</Button>
			<h1 className="mb-2 font-bold text-2xl">
				Detalles de la Cita
			</h1>
			<div className="bg-gray-50 mb-6 p-4 border rounded">
				<div>
					<b>ID:</b> {cita.id_cita}
				</div>
				<div>
					<b>Estudiante:</b>
					{cita.estudiante || cita.id_estudiante}
				</div>
				<div>
					<b>Psicólogo:</b>
					{cita.psicologo || cita.id_psicologo}
				</div>
				<div>
					<b>Inicio:</b>
					{formatDate(cita.fecha_hora_inicio)}
				</div>
				<div>
					<b>Fin:</b> {formatDate(cita.fecha_hora_fin)}
				</div>
				<div>
					<b>Modalidad:</b> {cita.modalidad}
				</div>
			</div>
			<h2 className="mb-2 font-bold text-xl">
				Observaciones
			</h2>
			<div className="flex gap-2 mb-4">
				<textarea
					className="flex-1 p-2 border rounded"
					rows={2}
					placeholder="Escribe una observación..."
					value={newObs}
					onChange={(e) => setNewObs(e.target.value)}
				/>
				<Button
					onClick={handleAdd}
					disabled={submitting || !newObs.trim()}>
					Agregar
				</Button>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Psicólogo</TableHead>
						<TableHead>Texto</TableHead>
						<TableHead>Fecha</TableHead>
						<TableHead>Acciones</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{observaciones.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={5}
								className="text-center">
								No hay observaciones.
							</TableCell>
						</TableRow>
					) : (
						observaciones.map((obs: any) => (
							<TableRow key={obs.id_observacion}>
								<TableCell>{obs.id_observacion}</TableCell>
								<TableCell>
									{obs.psicologo_nombre}
								</TableCell>
								<TableCell>{obs.texto}</TableCell>
								<TableCell>
									{formatDate(obs.fecha_creacion)}
								</TableCell>
								<TableCell>
									<Button
										size="sm"
										variant="destructive"
										onClick={() =>
											handleDelete(obs.id_observacion)
										}>
										Eliminar
									</Button>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

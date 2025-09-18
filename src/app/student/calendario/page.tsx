import TutoriaCalendarComponent from "@/components/tutorias/TutoriaCalendarComponent";

export default function CalendarioPage() {
	return (
		<main className="bg-gray-50 p-8 min-h-screen">
			<h1 className="mb-4 font-bold text-2xl">
				Mis citas.
			</h1>
			<TutoriaCalendarComponent />
		</main>
	);
}

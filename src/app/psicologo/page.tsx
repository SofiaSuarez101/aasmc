import Image from "next/image";

export default function DashboardPage() {
	return (
		<div className="flex flex-col justify-center items-center w-full h-full">
			<Image
				src="/psico.png"
				alt="psico"
				width={0}
				height={0}
				sizes="100vw"
				style={{ width: "100%", height: "auto" }}
			/>
		</div>
	);
}

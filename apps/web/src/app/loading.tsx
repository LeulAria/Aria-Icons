export default function Loading() {
	return (
		<div
			className="flex h-full min-h-[100vh] items-center justify-center bg-background"
			style={{ minHeight: "100vh" }}
		>
			<div className="text-[13px] text-foreground/40">Loading…</div>
		</div>
	);
}

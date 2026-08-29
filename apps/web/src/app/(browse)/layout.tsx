import { Suspense } from "react";
import { IconBrowser } from "@/components/icon-browser";
import { getAllIconSetConfigs } from "@/lib/icon-sources";
import Loading from "../loading";

async function BrowseApp() {
	const sets = await getAllIconSetConfigs();
	return <IconBrowser sets={sets} />;
}

export default function BrowseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
			<Suspense fallback={<Loading />}>
				<BrowseApp />
			</Suspense>
			{children}
		</div>
	);
}

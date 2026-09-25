import { Suspense } from "react";
import { IconBrowser } from "@/components/icon-browser";
import { getStyleGroupCounts } from "@/lib/icon-meta-index";
import { getAllIconSetConfigs } from "@/lib/icon-sources";
import Loading from "../loading";

async function BrowseApp() {
	const [sets, styleCounts] = await Promise.all([
		getAllIconSetConfigs(),
		getStyleGroupCounts(),
	]);
	return <IconBrowser sets={sets} styleCounts={styleCounts} />;
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

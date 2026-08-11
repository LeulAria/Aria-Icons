import { Suspense } from "react";
import { IconBrowser } from "@/components/icon-browser";
import { getAllIconSetConfigs } from "@/lib/icon-sources";
import Loading from "./loading";

async function HomeBrowser() {
	const sets = await getAllIconSetConfigs();
	return <IconBrowser sets={sets} />;
}

export default function Home() {
	return (
		<Suspense fallback={<Loading />}>
			<HomeBrowser />
		</Suspense>
	);
}

import { IconBrowser } from "@/components/icon-browser";
import { getAllIconSetConfigs } from "@/lib/icon-sources";

export default async function Home() {
	const sets = await getAllIconSetConfigs();
	return <IconBrowser sets={sets} />;
}

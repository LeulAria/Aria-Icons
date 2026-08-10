import Link from "next/link";
import { ArrowLeft, GitPullRequestArrow } from "lucide-react";

const REPO_URL = "https://github.com/LeulAria/Aria-Icons";

type Step = {
	title: string;
	description: string;
	code?: string;
};

const STEPS: Step[] = [
	{
		title: "Fork and clone the repo",
		description:
			"Fork LeulAria/Aria-Icons on GitHub, then clone your fork and install dependencies.",
		code: `git clone https://github.com/<your-username>/Aria-Icons.git
cd Aria-Icons
bun install`,
	},
	{
		title: "Add your icons",
		description:
			"Drop your SVG files into a new folder under apps/web/icons/<your-set-name>/, then run bun run pack:icons -- --delete to collapse them into icons/vendored/<your-set-name>.json. Use lowercase, hyphenated file names (e.g. shopping-cart.svg) — the file name becomes the icon name.",
		code: `apps/web/icons/
└── my-icon-set/
    ├── shopping-cart.svg
    ├── arrow-right.svg
    └── user-circle.svg`,
	},
	{
		title: "Register the icon set",
		description:
			"Add an entry to ICON_SETS in apps/web/src/lib/icon-sets.ts so the app knows where to find your SVGs and how to group them (line or solid).",
		code: `{
  id: "my-icon-set",
  label: "My Icon Set",
  homepage: "https://example.com",
  styles: [
    { id: "line", label: "Line", group: "line", roots: ["./"] },
  ],
}`,
	},
	{
		title: "Rebuild the icon catalog",
		description:
			"Regenerate the search metadata so your icons show up in the browser, search, and the MCP server.",
		code: "cd apps/web\nbun run generate-icons",
	},
	{
		title: "Preview locally",
		description:
			"Start the dev server and check that your set appears in the sidebar, renders correctly in the grid, and is searchable.",
		code: "bun run dev\n# open http://localhost:3001",
	},
	{
		title: "Open a pull request",
		description:
			"Commit your changes, push to your fork, and open a PR against LeulAria/Aria-Icons. Mention the icon count, license, and source of the icons in the description.",
		code: `git checkout -b add-my-icon-set
git add .
git commit -m "Add my-icon-set (24 icons, MIT)"
git push -u origin add-my-icon-set`,
	},
];

export default function ContributePage() {
	return (
		<div className="h-full overflow-y-auto bg-black">
			<div className="mx-auto max-w-2xl px-6 py-10">
				<Link
					href="/"
					className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-white/50 transition-colors hover:text-white"
				>
					<ArrowLeft className="size-3.5" />
					Back to Aria Icons
				</Link>

				<h1 className="text-2xl font-semibold tracking-tight text-white">
					Contribute Icons
				</h1>
				<p className="mt-2 text-[13px] leading-5 text-white/50">
					Aria Icons is open source — every icon set here was contributed or
					curated by the community. Adding your own set takes about ten
					minutes.
				</p>

				<a
					href={REPO_URL}
					target="_blank"
					rel="noreferrer"
					className="mt-5 inline-flex items-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.04] px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
				>
					<GitPullRequestArrow className="size-4" />
					github.com/LeulAria/Aria-Icons
				</a>

				<ol className="relative mt-10 space-y-0">
					{STEPS.map((step, i) => {
						const isLast = i === STEPS.length - 1;
						return (
							<li key={step.title} className="relative pl-10 pb-10">
								{!isLast && (
									<span
										aria-hidden
										className="absolute left-[11px] top-8 h-[calc(100%-32px)] w-px bg-white/15"
									/>
								)}
								<span
									aria-hidden
									className="absolute left-0 top-0.5 grid size-6 place-items-center rounded-full border border-white/20 bg-black font-mono text-[11px] text-white/70"
								>
									{i + 1}
								</span>

								<h2 className="text-[15px] font-medium text-white">
									{step.title}
								</h2>
								<p className="mt-1 text-[13px] leading-5 text-white/55">
									{step.description}
								</p>
								{step.code ? (
									<pre className="mt-3 overflow-x-auto rounded-[3px] border border-white/10 bg-white/[0.03] p-3 font-mono text-[12px] leading-5 text-white/70">
										{step.code}
									</pre>
								) : null}
							</li>
						);
					})}
				</ol>

				<div className="mt-2 rounded-[3px] border border-white/10 bg-white/[0.03] p-4">
					<h2 className="text-[13px] font-medium text-white">
						Other ways to contribute
					</h2>
					<ul className="mt-2 space-y-1.5 text-[13px] leading-5 text-white/55">
						<li>
							<span className="text-white/80">Brand icons</span> — brand logos
							come from{" "}
							<a
								href="https://thesvg.org"
								target="_blank"
								rel="noreferrer"
								className="text-white/80 underline underline-offset-2 hover:text-white"
							>
								theSVG
							</a>
							; contribute new brands upstream, then refresh with{" "}
							<code className="rounded bg-white/8 px-1 py-0.5 font-mono text-[12px] text-white/70">
								bun run fetch:thesvg
							</code>
							.
						</li>
						<li>
							<span className="text-white/80">Iconify sets</span> — pull any of
							the 200+ Iconify collections with{" "}
							<code className="rounded bg-white/8 px-1 py-0.5 font-mono text-[12px] text-white/70">
								bun run fetch:iconify -- --sets &lt;prefix&gt;
							</code>
							.
						</li>
						<li>
							<span className="text-white/80">Metadata</span> — better tags,
							aliases, and categories make search smarter. PRs improving
							metadata are just as valuable as new icons.
						</li>
					</ul>
				</div>

				<p className="mt-6 text-[12px] leading-5 text-white/35">
					Only submit icons you have the right to share. Include the license in
					your PR — MIT, CC0, or similarly permissive licenses are preferred.
				</p>
			</div>
		</div>
	);
}

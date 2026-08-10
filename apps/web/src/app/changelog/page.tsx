import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CHANGELOG } from "@/lib/changelog";

function formatDate(iso: string) {
	return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function ChangelogText({ text }: { text: string }) {
	const parts = text.split(/(`[^`]+`)/g);
	return (
		<>
			{parts.map((part, i) =>
				part.startsWith("`") && part.endsWith("`") ? (
					<code
						key={i}
						className="rounded bg-white/8 px-1 py-0.5 font-mono text-[12px] text-white/70"
					>
						{part.slice(1, -1)}
					</code>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</>
	);
}

export default function ChangelogPage() {
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
					Changelog
				</h1>
				<p className="mt-2 text-[13px] leading-5 text-white/50">
					All changes, fixes, and updates — every release shipped to the Aria
					Icons MCP server.
				</p>

				<ol className="relative mt-10 space-y-0">
					{CHANGELOG.map((entry, i) => {
						const isLast = i === CHANGELOG.length - 1;
						return (
							<li key={entry.date + entry.title} className="relative pl-8 pb-12">
								{!isLast && (
									<span
										aria-hidden
										className="absolute left-[7px] top-3 h-[calc(100%-12px)] w-px bg-white/15"
									/>
								)}
								<span
									aria-hidden
									className="absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-white/30 bg-black"
								/>

								<div className="flex flex-wrap items-center gap-2">
									<span className="font-mono text-[12px] font-medium text-white/70">
										{entry.version}
									</span>
									<time
										dateTime={entry.date}
										className="font-mono text-[12px] text-white/40"
									>
										{formatDate(entry.date)}
									</time>
									<span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/50">
										{entry.tag}
									</span>
								</div>

								<h2 className="mt-2 text-[16px] font-medium text-white">
									{entry.title}
								</h2>
								<p className="mt-1 text-[13px] leading-5 text-white/55">
									<ChangelogText text={entry.summary} />
								</p>

								{entry.removed && entry.removed.length > 0 && (
									<div className="mt-4">
										<h3 className="text-[11px] font-medium uppercase tracking-wide text-red-400/80">
											Removed
										</h3>
										<ul className="mt-1.5 space-y-1">
											{entry.removed.map((item) => (
												<li
													key={item}
													className="flex gap-2 text-[13px] leading-5 text-white/50"
												>
													<span className="shrink-0 text-red-400/60">−</span>
													<span>
														<ChangelogText text={item} />
													</span>
												</li>
											))}
										</ul>
									</div>
								)}

								{entry.added && entry.added.length > 0 && (
									<div className="mt-4">
										<h3 className="text-[11px] font-medium uppercase tracking-wide text-emerald-400/80">
											Added
										</h3>
										<ul className="mt-1.5 space-y-1">
											{entry.added.map((item) => (
												<li
													key={item}
													className="flex gap-2 text-[13px] leading-5 text-white/50"
												>
													<span className="shrink-0 text-emerald-400/60">
														+
													</span>
													<span>
														<ChangelogText text={item} />
													</span>
												</li>
											))}
										</ul>
									</div>
								)}
							</li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}

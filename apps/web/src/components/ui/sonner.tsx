"use client";

import type { CSSProperties } from "react";
import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			theme="dark"
			className="toaster"
			position="bottom-center"
			offset={24}
			mobileOffset={20}
			duration={2200}
			visibleToasts={2}
			gap={10}
			icons={{
				success: <Check className="size-3.5" strokeWidth={2.25} />,
				error: <CircleAlert className="size-3.5" strokeWidth={2.25} />,
				warning: <CircleAlert className="size-3.5" strokeWidth={2.25} />,
				info: <Check className="size-3.5" strokeWidth={2.25} />,
				loading: <LoaderCircle className="size-3.5 animate-spin" strokeWidth={2.25} />,
			}}
			style={
				{
					"--width": "250px",
				} as CSSProperties
			}
			toastOptions={{
				unstyled: true,
				classNames: {
					toast: "aria-toast",
					title: "aria-toast-title",
					description: "aria-toast-description",
					icon: "aria-toast-icon",
					closeButton: "aria-toast-close",
					actionButton: "aria-toast-action",
					cancelButton: "aria-toast-cancel",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };

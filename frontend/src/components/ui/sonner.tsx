import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {

    return (
        <Sonner
            className="toaster group"
            icons={{
                success: (
                    <CircleCheckIcon className="size-4 text-secondary" />
                ),
                info: (
                    <InfoIcon className="size-4 text-secondary" />
                ),
                warning: (
                    <TriangleAlertIcon className="size-4 text-secondary" />
                ),
                error: (
                    <OctagonXIcon className="size-4 text-secondary" />
                ),
                loading: (
                    <Loader2Icon className="size-4 animate-spin text-secondary" />
                ),
            }}
            toastOptions={{
                classNames: {
                    toast: "cn-toast !shadow-xl font-medium",
                    success: "!bg-success !text-secondary",
                    error: "!bg-destructive !text-secondary",
                    info: "!bg-info !text-secondary",
                    warning: "!bg-warning !text-secondary",
                    loading: "!bg-primary !text-secondary",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
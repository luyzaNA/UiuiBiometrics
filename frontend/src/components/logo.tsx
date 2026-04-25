import {cn} from "@/lib/utils.ts";

export function Logo({className}: {className?: string}) {
    return (
        <img className={cn("h-18", className)} src="/logo.svg" alt="pocket"/>
    )
}

import {ChevronRight, type LucideIcon} from "lucide-react";
import {useLocation, Link} from "react-router-dom";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {useTranslation} from "react-i18next";

export function NavMain({
                            items,
                        }: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
}) {
    const location = useLocation();
    const currentPath = location.pathname;
    const {t} = useTranslation();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>{t("Actions")}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isParentActive =
                        currentPath.startsWith(item.url) ||
                        item.items?.some((sub) => sub.url === currentPath);

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={isParentActive}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem data-active={isParentActive}>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link
                                            to={item.url}
                                            className={`flex items-center w-full ${
                                                isParentActive ?
                                                    "border-l-3 will-transform-change transition-500 transition-all " +
                                                    "rounded-l-none border-primary" : ""
                                            }`}
                                        >
                                            {item.icon && <item.icon/>}
                                            <span>{item.title}</span>
                                            {item.items?.length ? (
                                                <ChevronRight
                                                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"/>
                                            ) : null}
                                        </Link>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                {item.items?.length ? (
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => {
                                                const isActive = subItem.url === currentPath;

                                                return (
                                                    <SidebarMenuSubItem
                                                        key={subItem.title}
                                                        data-active={isActive}
                                                    >
                                                        <SidebarMenuSubButton asChild>
                                                            <Link
                                                                to={subItem.url}
                                                                className={`block w-full ${
                                                                    isActive ?
                                                                        "border-l-3 will-transform-change transition-500 " +
                                                                        "transition-all rounded-l-none border-primary" : ""
                                                                }`}
                                                            >
                                                                <span>{subItem.title}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                ) : null}
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
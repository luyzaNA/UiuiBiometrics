import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Users,
    Calendar,
    Shield,
    Loader2,
    AlertCircle,
    Search,
    X,
    Check,
    ArrowLeft
} from "lucide-react";
import { adminService, type AdminUserI } from "@/services/admin-service";
import { toast } from "sonner";
import {useUser} from "@/hooks/use-user.ts";

const formatDate = (dateValue: number | string) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const AVAILABLE_ROLES = ["ADMIN", "DOCTOR", "USER"];

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user: currentUser } = useUser();

    const [users, setUsers] = useState<AdminUserI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [selectedUser, setSelectedUser] = useState<AdminUserI | null>(null);
    const [editedRoles, setEditedRoles] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setIsLoading(true);
                const data = await adminService.getUsers();
                console.log("data", data);

                const formattedUsers = data.users.map((u: any) => ({
                    ...u,
                    id: u.username,
                    roles: u.roles || ["USER"]
                }));

                setUsers(formattedUsers);
            } catch (error) {
                console.error("Failed to load users:", error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEditModal = (user: AdminUserI) => {
        setSelectedUser(user);
        setEditedRoles(user.roles || []);
    };

    const closeEditModal = () => {
        setSelectedUser(null);
        setEditedRoles([]);
    };

    const toggleRole = (role: string) => {
        setEditedRoles([role]);
    };

    const handleSaveRoles = async () => {
        if (!selectedUser) return;

        if (editedRoles.length === 0) {
            alert(t("Cannot save! The user must retain at least one role."));
            return;
        }

        const isSelf = currentUser?.email?.toLowerCase() === selectedUser.email?.toLowerCase();
        if (isSelf && !editedRoles.includes("ADMIN")) {
            toast.error(t("You cannot remove your own ADMIN role to prevent self-lockout."));
            return;
        }

        try {
            setIsSaving(true);
            const originalRoles = selectedUser.roles || [];

            const rolesToAdd = editedRoles.filter(role => !originalRoles.includes(role) && role !== "USER");
            const rolesToRemove = originalRoles.filter(role => !editedRoles.includes(role) && role !== "USER");

            const updatePromises: Promise<void>[] = [];

            rolesToAdd.forEach(role => {
                updatePromises.push(adminService.updateUserRole(selectedUser.id, {
                    group_name: role.toLowerCase() as "admin" | "doctor",
                    action: "add"
                }));
            });

            rolesToRemove.forEach(role => {
                updatePromises.push(adminService.updateUserRole(selectedUser.id, {
                    group_name: role.toLowerCase() as "admin" | "doctor",
                    action: "remove"
                }));
            });

            await Promise.all(updatePromises);

            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, roles: editedRoles } : u));
            closeEditModal();
            toast.success(t("Role updated successfully"));
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error(t("Failed to update role"));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm font-medium text-muted-foreground">{t("Loading users...")}</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="text-center py-20 animate-fadeIn">
                <AlertCircle className="mx-auto text-error mb-4" size={40} />
                <p className="font-bold text-foreground">{t("Failed to load users data")}</p>
                <p className="text-sm text-muted-foreground mt-2">{t("Please try again later.")}</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-24 space-y-6 animate-fadeIn min-h-screen relative">

            <button
                onClick={() => navigate("/admin/dashboard")}
                className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit hover:cursor-pointer"
            >
                <div className="p-2 rounded-full bg-secondary-foreground/5 group-hover:bg-secondary-foreground/10 transition-colors">
                    <ArrowLeft size={16} />
                </div>
                {t("Go back")}
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary text-secondary-foreground border border-secondary-foreground/10 p-6 rounded-3xl shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Users className="text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl leading-tight text-secondary-foreground">{t("User Management")}</h1>
                        <p className="text-sm text-secondary-foreground/60 font-medium">{t("View and manage registered accounts")}</p>
                    </div>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder={t("Search by email...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-secondary-foreground/20 text-secondary-foreground placeholder:text-secondary-foreground/40 border border-secondary-foreground/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-secondary-foreground/20 transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="bg-secondary text-secondary-foreground border border-secondary-foreground/10 rounded-3xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-secondary-foreground/5 border-b border-secondary-foreground/10 text-xs font-black uppercase tracking-wider text-primary">
                            <th className="px-6 py-4">{t("User Details")}</th>
                            <th className="px-6 py-4">{t("Account Type")}</th>
                            <th className="px-6 py-4">{t("Roles")}</th>
                            <th className="px-6 py-4">{t("Joined Date")}</th>
                            <th className="px-6 py-4 text-right">{t("Actions")}</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-foreground/5">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-secondary-foreground/50 italic text-sm">
                                    {t("No users found matching your criteria.")}
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => {
                                const isSelf = currentUser?.email?.toLowerCase() === user.email?.toLowerCase();

                                return (
                                    <tr key={user.id} className="hover:bg-secondary-foreground/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-secondary-foreground text-sm truncate flex items-center gap-1.5">
                                                        {user.email}
                                                        {isSelf && (
                                                            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium">
                                                                {t("You")}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                                {user.provider === "Google" ? (
                                                    <span className="text-error bg-error/10 px-2 py-1 rounded-md">Google</span>
                                                ) : user.provider === "Facebook" ? (
                                                    <span className="text-info bg-info/10 px-2 py-1 rounded-md">Facebook</span>
                                                ) : (
                                                    <span className="text-secondary-foreground/60 bg-secondary-foreground/5 px-2 py-1 rounded-md">
                                                        {user.provider === "Email/Password" ? t("Email & Password") : (user.provider || t("Email & Password"))}
                                                    </span>
                                                )}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles?.map((role: string) => {
                                                    const isAdmin = role.toUpperCase() === "ADMIN";
                                                    const isDoctor = role.toUpperCase() === "DOCTOR";

                                                    return (
                                                        <span
                                                            key={role}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                                                ${isAdmin
                                                                ? "bg-error/10 text-error border border-error/20"
                                                                : isDoctor
                                                                    ? "bg-success/10 text-success border border-success/20"
                                                                    : "bg-primary/10 text-primary border border-primary/20"
                                                            }
                                                            `}
                                                        >
                                                            {isAdmin && <Shield size={10} />}
                                                            {t(role)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-secondary-foreground/70 font-medium">
                                                <Calendar size={14} className="opacity-70" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-xs font-bold text-primary hover:text-secondary hover:cursor-pointer hover:bg-primary px-4 py-2 rounded-xl transition-all duration-300 border border-primary/20 hover:border-transparent"
                                            >
                                                {t("Edit Role")}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-secondary-foreground/5 border-t border-secondary-foreground/10 px-6 py-4 flex items-center justify-between text-xs text-secondary-foreground/60 font-medium">
                    <span>
                        {t("Showing")} <strong className="text-secondary-foreground">{filteredUsers.length}</strong> {t("users")}
                    </span>
                </div>
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-secondary text-secondary-foreground w-full max-w-md rounded-[2rem] shadow-2xl border border-secondary-foreground/10 overflow-hidden animate-reveal">

                        <div className="flex items-center justify-between p-6 border-b border-secondary-foreground/5">
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{t("Manage Roles")}</h3>
                                <p className="text-xs text-secondary-foreground/60 font-medium mt-1 truncate max-w-[250px]">
                                    {selectedUser.email}
                                </p>
                            </div>
                            <button
                                onClick={closeEditModal}
                                className="p-2 rounded-full hover:bg-secondary-foreground/10 transition-colors text-secondary-foreground/60 hover:text-secondary-foreground hover:cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-3">
                            {AVAILABLE_ROLES.map((role) => {
                                const isSelected = editedRoles.includes(role);
                                const isAdmin = role === "ADMIN";
                                const isDoctor = role === "DOCTOR";

                                const activeColorClass = isAdmin
                                    ? "bg-error/10 text-error border-error/20"
                                    : isDoctor
                                        ? "bg-success/10 text-success border-success/20"
                                        : "bg-primary/10 text-primary border-primary/20"

                                return (
                                    <div
                                        key={role}
                                        onClick={() => toggleRole(role)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200
                                            ${isSelected
                                            ? activeColorClass
                                            : "border-secondary-foreground/10 hover:bg-secondary-foreground/5 text-secondary-foreground"
                                        }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors
                                                ${isSelected ? "border-transparent bg-white/20" : "border-secondary-foreground/30"}
                                            `}>
                                                {isSelected && <Check size={14} className="text-current" />}
                                            </div>
                                            <span className="font-bold text-sm tracking-wide">{t(role)}</span>
                                        </div>

                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md opacity-80 bg-secondary-foreground/10`}>
                                            {role === "ADMIN" ? t("Full Access") : role === "DOCTOR" ? t("Medical") : t("Standard")}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-secondary-foreground/5 flex items-center justify-end gap-3 border-t border-secondary-foreground/5">
                            <button
                                onClick={closeEditModal}
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/5 transition-all disabled:opacity-50 hover:cursor-pointer "
                            >
                                {t("Cancel")}
                            </button>
                            <button
                                onClick={handleSaveRoles}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-secondary hover:cursor-pointer hover:opacity-90 transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
                            >
                                {isSaving && <Loader2 size={16} className="animate-spin" />}
                                {t("Save Changes")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
import { apiClient } from "@/api/client";

export interface DeficiencyScore {
    name: string;
    score: number;
}

export interface CreateFoodMenuRequest {
    assessment_id: string;
    review_after_days?: number;
    deficiencies: DeficiencyScore[];
}

export const foodBasedMenuService = {
    /**
     * POST /api/menu/food
     */
    async createFoodMenu(data: CreateFoodMenuRequest): Promise<any> {
        const response = await apiClient.post<any>("/menu/food", data);
        return response.data;
    },

    /**
     * GET /api/menu/active?target_person=Nume
     */
    async getActiveByPerson(targetPerson: string): Promise<any> {
        const response = await apiClient.get<any>("/menu/food/active", {
            params: {
                target_person: targetPerson
            }
        });
        return response.data;
    },
    async getHistoryByPerson(targetPerson: string): Promise<any[]> {
        const response = await apiClient.get<any[]>("/menu/food/history", {
            params: { target_person: targetPerson }
        });
        return response.data;
    },
    /**
     * PATCH /api/menu/food/activate
     */
    async activateMenu(menuId: string): Promise<any> {
        const response = await apiClient.patch<any>("/menu/food/activate", {
            menu_id: menuId
        });
        return response.data;
    }
};
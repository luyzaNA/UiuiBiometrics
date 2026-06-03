import { apiClient } from "@/api/client";
import type { FoodBaseMenu, MealBaseMenu } from "@/models/menu-model";

export interface DeficiencyScore {
    name: string;
    score: number;
}

export interface CreateMenuRequest {
    assessment_id: string;
    deficiencies: DeficiencyScore[];
    language?: string;
    meal_category?: string;
    full_menu_data?: any;
}

export const menuService = {
    /**
     * POST /api/menus/food
     */
    async createFoodMenu(data: CreateMenuRequest): Promise<FoodBaseMenu> {
        const response = await apiClient.post<FoodBaseMenu>("/menu/food", data);
        return response.data;
    },

    /**
     * POST /api/menus/meals/generate
     * Apelează AI-ul strict pentru o anumită categorie (fără salvare în baza de date)
     */
    async generatePartialMealBank(data: CreateMenuRequest): Promise<any> {
        const response = await apiClient.post<any>("/menu/meals/generate", data);
        return response.data;
    },

    /**
     * POST /api/menus/meals
     * Trimite meniul complet asamblat către backend pentru salvarea finală ca DRAFT
     */
    async createMealBankMenu(data: CreateMenuRequest): Promise<MealBaseMenu> {
        const response = await apiClient.post<MealBaseMenu>("/menu/meals", data);
        return response.data;
    },

    /**
     * GET /api/menus/active/{targetPerson}
     */
    async getActiveMenu(targetPerson: string): Promise<FoodBaseMenu | MealBaseMenu | null> {
        const response = await apiClient.get<FoodBaseMenu | MealBaseMenu>(`/menu/active/${targetPerson}`);
        return response.data;
    },

    /**
     * GET /api/menus/history?target_person={targetPerson}
     */
    async getMenuHistory(targetPerson?: string): Promise<(FoodBaseMenu | MealBaseMenu)[]> {
        const params = targetPerson ? { target_person: targetPerson } : {};
        const response = await apiClient.get<(FoodBaseMenu | MealBaseMenu)[]>("/menu/history", { params });
        return response.data;
    },

    /**
     * PATCH /api/menus/activate
     */
    async activateMenu(menuId: string, targetPerson: string): Promise<any> {
        const response = await apiClient.patch<any>("/menu/activate", {
            menu_id: menuId,
            target_person: targetPerson
        });
        return response.data;
    }
};
export type MenuStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type MenuType = "FOOD_ITEMS" | "MEALS";

export interface LocalizedText {
    en: string;
    ro: string;
}

export interface DeficiencyTargetDef {
    deficiencyName: LocalizedText | string;
    recommendedFoods: {
        foodName: LocalizedText | string;
        servingSize: string;
        frequency: LocalizedText | string;
        absorptionBoosters?: (LocalizedText | string)[];
    }[];
}

export interface MealOptionDef {
    mealId?: string;
    name: LocalizedText | string;
    description: LocalizedText | string;
    prepTimeMinutes: number;
    keyIngredients: (LocalizedText | string)[];
    instructions: LocalizedText | string;
}

export interface BaseMenu {
    menuId: string;
    assessmentId: string;
    cognitoSub: string;
    targetPerson: string;
    menuType: MenuType;
    status: MenuStatus;
    reviewAfterDays: number;
    createdAt: number;
    updatedAt: number;
}

export interface FoodBaseMenu extends BaseMenu {
    menuType: "FOOD_ITEMS";
    deficiencyTargets: DeficiencyTargetDef[];
}

export interface MealBaseMenu extends BaseMenu {
    menuType: "MEALS";
    breakfasts: MealOptionDef[];
    lunches: MealOptionDef[];
    dinners: MealOptionDef[];
    snacks: MealOptionDef[];
}
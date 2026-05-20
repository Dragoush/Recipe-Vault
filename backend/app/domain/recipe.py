from dataclasses import dataclass
from enum import Enum


class RecipeCategory(str, Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    DINNER = "Dinner"
    DESSERT = "Dessert"
    SNACK = "Snack"
    DRINK = "Drink"


class RecipeDifficulty(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


@dataclass(slots=True)
class Recipe:
    id: str
    title: str
    category: RecipeCategory
    difficulty: RecipeDifficulty
    servings: int
    prep_time_minutes: int
    cook_time_minutes: int
    total_time_minutes: int
    description: str
    ingredients: list[str]
    instructions: list[str]
    created_at: str
    updated_at: str

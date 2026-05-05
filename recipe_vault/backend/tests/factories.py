from app.domain.recipe import Recipe, RecipeCategory, RecipeDifficulty


def build_recipe(index: int = 1, **overrides) -> Recipe:
    payload = {
        "id": f"recipe-{index}",
        "title": f"Recipe {index}",
        "category": RecipeCategory.DINNER,
        "difficulty": RecipeDifficulty.EASY,
        "servings": 2,
        "prep_time_minutes": 10 + index,
        "cook_time_minutes": 20 + index,
        "total_time_minutes": 30 + (index * 2),
        "description": f"Recipe {index} description that is comfortably long.",
        "ingredients": ["Ingredient A", "Ingredient B"],
        "instructions": ["Step one", "Step two"],
        "created_at": f"2026-04-{index:02d}T08:00:00.000Z",
        "updated_at": f"2026-04-{index:02d}T08:00:00.000Z",
    }
    payload.update(overrides)

    if isinstance(payload["category"], str):
        payload["category"] = RecipeCategory(payload["category"])

    if isinstance(payload["difficulty"], str):
        payload["difficulty"] = RecipeDifficulty(payload["difficulty"])

    return Recipe(**payload)


def build_recipe_payload(**overrides) -> dict:
    payload = {
        "title": "Roasted Potatoes",
        "category": "Dinner",
        "difficulty": "Easy",
        "servings": 4,
        "prepTimeMinutes": 15,
        "cookTimeMinutes": 35,
        "description": "Crispy roasted potatoes with herbs and a golden finish.",
        "ingredients": ["Potatoes", "Olive oil", "Rosemary"],
        "instructions": ["Cut the potatoes.", "Roast until golden."],
    }
    payload.update(overrides)
    return payload

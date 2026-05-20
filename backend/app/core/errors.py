class RecipeNotFoundError(Exception):
    def __init__(self, recipe_id: str):
        self.recipe_id = recipe_id
        super().__init__(f'Recipe "{recipe_id}" was not found.')


class PaginationValidationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)

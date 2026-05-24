class RecipeNotFoundError(Exception):
    def __init__(self, recipe_id: str):
        self.recipe_id = recipe_id
        super().__init__(f'Recipe "{recipe_id}" was not found.')


class PaginationValidationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)


class UsernameConflictError(Exception):
    def __init__(self, username: str):
        self.username = username
        super().__init__(f'Username "{username}" is already in use.')


class AuthenticationError(Exception):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message)


class AuthorizationError(Exception):
    def __init__(self, message: str = "You are not allowed to perform this action."):
        super().__init__(message)

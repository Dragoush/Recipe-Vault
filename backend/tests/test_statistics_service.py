from app.repositories.in_memory_recipe_repository import InMemoryRecipeRepository
from app.services.statistics_service import StatisticsService
from tests.factories import build_recipe, build_user


def test_statistics_service_returns_empty_shape_for_empty_repository():
    user = build_user()
    service = StatisticsService(repository=InMemoryRecipeRepository())

    stats = service.get_statistics(user)

    assert stats.total_recipes == 0
    assert stats.counts_by_category == {}
    assert stats.counts_by_difficulty == {}
    assert stats.average_prep_time_minutes == 0.0
    assert stats.average_cook_time_minutes == 0.0
    assert stats.average_total_time_minutes == 0.0


def test_statistics_service_aggregates_counts_and_averages():
    user = build_user()
    repository = InMemoryRecipeRepository(
        [
            build_recipe(1, category="Breakfast", difficulty="Easy", prep_time_minutes=10, cook_time_minutes=20, total_time_minutes=30),
            build_recipe(2, category="Dinner", difficulty="Medium", prep_time_minutes=20, cook_time_minutes=30, total_time_minutes=50),
            build_recipe(3, category="Dinner", difficulty="Easy", prep_time_minutes=30, cook_time_minutes=40, total_time_minutes=70),
        ]
    )
    service = StatisticsService(repository=repository)

    stats = service.get_statistics(user)

    assert stats.total_recipes == 3
    assert stats.counts_by_category == {"Breakfast": 1, "Dinner": 2}
    assert stats.counts_by_difficulty == {"Easy": 2, "Medium": 1}
    assert stats.average_prep_time_minutes == 20.0
    assert stats.average_cook_time_minutes == 30.0
    assert stats.average_total_time_minutes == 50.0

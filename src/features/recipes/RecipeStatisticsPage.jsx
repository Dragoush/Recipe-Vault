import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import StatusPanel from '../../components/StatusPanel';
import { recipeSource } from './activeRecipeSource';

const emptyStatistics = {
  totalRecipes: 0,
  countsByCategory: {},
  countsByDifficulty: {},
  averagePrepTimeMinutes: 0,
  averageCookTimeMinutes: 0,
  averageTotalTimeMinutes: 0
};

const statisticsPageCopy = {
  title: 'Recipe Statistics',
  description: 'A quick summary of the recipes',
  loadingTitle: 'Loading statistics...',
  loadingDescription: 'Gathering the latest numbers',
  errorTitle: "We couldn't load the statistics.",
  retryLabel: 'Try again',
  emptyTitle: 'No statistics yet.',
  emptyDescription:
    'Create your first recipe and this page will start highlighting category counts, difficulty levels, and average prep times.',
  addRecipeLabel: 'Add recipe',
  addFirstRecipeLabel: 'Add a recipe',
  backToRecipesLabel: 'Back to recipes',
  totalRecipesLabel: 'Total recipes',
  averagePrepTimeLabel: 'Average prep time',
  averageCookTimeLabel: 'Average cook time',
  averageTotalTimeLabel: 'Average total time',
  categorySpreadLabel: 'Category spread',
  difficultySpreadLabel: 'Difficulty spread',
  categoryTitle: 'By category',
  difficultyTitle: 'By difficulty',
  breakdownEmptyDescription: 'Add a few recipes and the breakdown will appear here.'
};

function formatMinutes(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

function BreakdownPanel({ title, description, entries }) {
  return (
    <article className="panel">
      <p className="summary-label">{description}</p>
      <h2>{title}</h2>
      {entries.length > 0 ? (
        <ul className="stats-list" aria-label={title}>
          {entries.map(([label, count]) => (
            <li className="stats-list-item" key={label}>
              <span>{label}</span>
              <strong>{count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="stats-empty-copy">{statisticsPageCopy.breakdownEmptyDescription}</p>
      )}
    </article>
  );
}

export default function RecipeStatisticsPage() {
  const [statistics, setStatistics] = useState(emptyStatistics);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadStatistics() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const nextStatistics = await recipeSource.getStatistics();

        if (!isCancelled) {
          setStatistics(nextStatistics);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error?.message ?? 'Unable to load the recipe statistics right now.'
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadStatistics();

    return () => {
      isCancelled = true;
    };
  }, [reloadKey]);

  function handleRetry() {
    setReloadKey((value) => value + 1);
  }

  if (isLoading) {
    return (
      <div className="stack-lg">
        <PageHeader
          title={statisticsPageCopy.title}
          description={statisticsPageCopy.description}
        />
        <StatusPanel
          title={statisticsPageCopy.loadingTitle}
          description={statisticsPageCopy.loadingDescription}
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="stack-lg">
        <PageHeader
          title={statisticsPageCopy.title}
          description={statisticsPageCopy.description}
        />
        <StatusPanel
          title={statisticsPageCopy.errorTitle}
          description={errorMessage}
          actionLabel={statisticsPageCopy.retryLabel}
          onAction={handleRetry}
          tone="error"
        />
      </div>
    );
  }

  if (statistics.totalRecipes === 0) {
    return (
      <div className="stack-lg">
        <PageHeader
          title={statisticsPageCopy.title}
          description={statisticsPageCopy.description}
          actions={
            <Link className="button" to="/recipes/new">
              {statisticsPageCopy.addRecipeLabel}
            </Link>
          }
        />
        <EmptyState
          title={statisticsPageCopy.emptyTitle}
          description={statisticsPageCopy.emptyDescription}
          actionLabel={statisticsPageCopy.addFirstRecipeLabel}
        />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <PageHeader
        title={statisticsPageCopy.title}
        description={statisticsPageCopy.description}
        actions={
          <Link className="button button-secondary" to="/recipes">
            {statisticsPageCopy.backToRecipesLabel}
          </Link>
        }
      />

      <section className="feature-grid stats-summary-grid">
        <article className="panel summary-card">
          <p className="summary-label">{statisticsPageCopy.totalRecipesLabel}</p>
          <p className="summary-value">{statistics.totalRecipes}</p>
        </article>
        <article className="panel summary-card">
          <p className="summary-label">{statisticsPageCopy.averagePrepTimeLabel}</p>
          <p className="summary-value">
            {formatMinutes(statistics.averagePrepTimeMinutes)} min
          </p>
        </article>
        <article className="panel summary-card">
          <p className="summary-label">{statisticsPageCopy.averageCookTimeLabel}</p>
          <p className="summary-value">
            {formatMinutes(statistics.averageCookTimeMinutes)} min
          </p>
        </article>
        <article className="panel summary-card">
          <p className="summary-label">{statisticsPageCopy.averageTotalTimeLabel}</p>
          <p className="summary-value">
            {formatMinutes(statistics.averageTotalTimeMinutes)} min
          </p>
        </article>
      </section>

      <section className="detail-grid">
        <BreakdownPanel
          title={statisticsPageCopy.categoryTitle}
          description={statisticsPageCopy.categorySpreadLabel}
          entries={Object.entries(statistics.countsByCategory)}
        />
        <BreakdownPanel
          title={statisticsPageCopy.difficultyTitle}
          description={statisticsPageCopy.difficultySpreadLabel}
          entries={Object.entries(statistics.countsByDifficulty)}
        />
      </section>
    </div>
  );
}

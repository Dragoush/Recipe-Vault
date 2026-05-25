import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import useAuth from '../features/auth/useAuth';

const HOME_COPY = {
  eyebrow: 'Cook smarter, not harder.',
  title: 'Recipe Vault',
  description:
    'Turn your kitchen ideas into a beautifully organized recipe collection. Keep everything in one place, explore dishes effortlessly, and enjoy a smooth, distraction-free cooking experience.',
  heroStatValue: 'Plan less, cook better.',
  heroStatCopy:
    'A small but complete recipe workspace for organizing meals, planning prep time, and keeping cooking steps easy to follow.',
  heroInfoLabel: 'Designed for everyday cooking',
  heroInfoItems: [
    'All your recipes available in one organized workspace',
    'Clear, helpful validation while adding or editing recipes',
    'Clean separation between interface, data, and logic',
    'Built for a smooth and intuitive user experience'
  ]
};

const cards = [
  {
    title: 'A welcoming home for your recipes',
    description: 'Get started with a clean, inviting interface that highlights your collection, showcases your style, and makes navigation effortless.'
  },
  {
    title: 'Browse with ease',
    description: 'Quickly scan your recipes in a structured list, see key details at a glance, and dive deeper when something catches your eye.'
  },
  {
    title: 'Full control, from start to finish',
    description: 'Create, view, edit, and remove recipes anytime, with everything saved instantly for a seamless experience.'
  }
];

export default function HomePage() {
  const auth = useAuth();

  return (
    <div className="stack-xl">
      <section className="hero panel">
        <PageHeader
          eyebrow={HOME_COPY.eyebrow}
          title={HOME_COPY.title}
          description={HOME_COPY.description}
          actions={
            auth.isAuthenticated ? (
              <>
                <Link className="button" to="/recipes">
                  Explore recipes
                </Link>
                <Link className="button button-secondary" to="/recipes/new">
                  Add your next recipe
                </Link>
              </>
            ) : (
              <>
                <Link className="button" to="/login">
                  Sign in to continue
                </Link>
                <Link className="button button-secondary" to="/register">
                  Create an account
                </Link>
              </>
            )
          }
        />

        <div className="hero-grid">
          <div className="hero-card hero-card-centered accent-card">
            <p className="hero-stat-value">{HOME_COPY.heroStatValue}</p>
            <p className="hero-copy">{HOME_COPY.heroStatCopy}</p>
          </div>

          <div className="hero-card">
            <p className="hero-stat-label">{HOME_COPY.heroInfoLabel}</p>
            <ul className="hero-list">
              {HOME_COPY.heroInfoItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {cards.map((highlight) => (
          <article className="panel feature-card" key={highlight.title}>
            <h2>{highlight.title}</h2>
            <p>{highlight.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-body-small text-on-surface-variant">
          © {new Date().getFullYear()} Luna's Project. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <Link
            to="/privacy"
            className="text-body-small text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/impact"
            className="text-body-small text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Impact Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  );
}

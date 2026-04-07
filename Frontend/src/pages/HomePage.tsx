import { Link } from 'react-router-dom';

const pages = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/logout', label: 'Logout' },
  { to: '/impact', label: 'Impact Dashboard' },
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/dashboard', label: 'Dashboard (Admin)' },
  { to: '/donors', label: 'Donors (Admin)' },
  { to: '/mfa', label: 'Manage MFA (Authenticated)' },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-headline-large text-on-surface mb-6">HomePage</h1>
      <ul className="flex flex-col gap-2">
        {pages.map((page) => (
          <li key={page.to}>
            <Link
              to={page.to}
              className="text-body-large text-primary hover:underline"
            >
              {page.label} <span className="text-on-surface-variant">({page.to})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppLayout() {
  const { pathname } = useLocation();
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  return (
    <div className="flex min-h-dvh flex-col bg-soil-50">
      <Header />
      <main className={isAuthRoute
        ? 'w-full flex-1 p-0'
        : 'mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-9 lg:px-8'}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const Portal = lazy(() => import('./portal/Portal'));
const PublicPage = lazy(() => import('./portal/Public'));
const path = window.location.pathname;
const isPortal = ['/dashboard', '/admin', '/judge', '/sign-in', '/sign-up'].some(
  (route) => path === route || path.startsWith(`${route}/`),
);
const isPublicPage = path === '/results' || path === '/schedule';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Suspense
        fallback={
          <div role="status" style={{ padding: 40 }}>
            Loading...
          </div>
        }
      >
        {isPortal ? <Portal /> : isPublicPage ? <PublicPage /> : <App />}
      </Suspense>
    </StrictMode>,
  );
}

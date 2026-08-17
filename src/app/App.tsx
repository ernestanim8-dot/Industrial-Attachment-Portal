import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <DataProvider>
            <RouterProvider router={router} />
            <Toaster />
          </DataProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
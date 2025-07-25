// App.jsx
import React from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import routes from './routes/routes';

const AppRoutes = () => useRoutes(routes);
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <Router>
      <Toaster position="top-right" />
      <AppRoutes />
    </Router>
    </QueryClientProvider>
  );
}

export default App;

import { SessionProvider } from '@features/session/SessionProvider';
import AppRouter from './routes/AppRouter';

const App = () => {
  return (
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  );
};

export default App;

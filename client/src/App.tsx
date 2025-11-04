import { FaucetCard } from './components/FaucetCard';
import { InfoCard } from './components/InfoCard';
import { HistoryCard } from './components/HistoryCard';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">💧</div>
          <h1>Nuwa Faucet</h1>
        </div>
      </header>

      <main className="main-container">
        <FaucetCard />

        <InfoCard />

        <HistoryCard />
      </main>
    </div>
  );
}

export default App;


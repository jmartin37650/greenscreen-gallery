import { useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import designs from './data/designs.json';
import DesignCard from './components/DesignCard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="login-screen">
        <img src="/assets/logo.png" alt="Green Screen Gallery Logo" className="login-logo" />
        <h1>{isRegistering ? 'Register' : 'Login'} to Green Screen Gallery</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={isRegistering ? handleRegister : handleLogin}>
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <p>
          {isRegistering ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            className="toggle-button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setEmail('');
              setPassword('');
            }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <div className="header-left">
          <img src="/assets/logo.png" alt="Logo" className="header-logo" />
          <h1 className="logo-text">Green Screen Gallery</h1>
        </div>
        <div className="user-controls">
          <span className="welcome">Welcome, {user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="gallery">
        <h2>Featured Designs</h2>
        <div className="design-grid">
          {designs.map((design, index) => (
            <DesignCard key={index} design={design} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
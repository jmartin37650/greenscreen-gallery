import { useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import designs from './data/designs.json';
import DesignCard from './components/DesignCard';
import './App.css';
import { signOut } from 'firebase/auth';

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
const handleLogout = async () => {
  try {
    await signOut(auth);
    setUser(null);
  } catch (error) {
    alert('Error signing out: ' + error.message);
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

  if (!user) {
    return (
      <div className="login-screen">
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
          <button onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="gallery">
  <div className="gallery-header">
    <h1>Welcome, {user.email}!</h1>
    <button onClick={handleLogout}>Logout</button>
  </div>
  <div className="grid">
    {designs.map((d) => (
      <DesignCard key={d.id} design={d} />
    ))}
  </div>
</div>
  );
}

export default App;
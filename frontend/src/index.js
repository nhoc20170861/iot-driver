import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import GlobalStyles from '@mui/material/GlobalStyles'
import Login from "./Login";


const Root = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <React.StrictMode>
      <GlobalStyles styles={{ body: { margin: 0 } }} />
      {isLoggedIn ? <App /> : <Login onLogin={() => setIsLoggedIn(true)} />}
    </React.StrictMode>
  );
};

ReactDOM.render(<Root />, document.getElementById("root"));
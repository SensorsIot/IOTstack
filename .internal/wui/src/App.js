import React, { Fragment } from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import blueGrey from "@material-ui/core/colors/blueGrey";
import lightGreen from "@material-ui/core/colors/lightGreen";
import CssBaseline from '@material-ui/core/CssBaseline';
import ReactRouterBootstrap from './router'
import './App.css';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
          primary: {
            light: lightGreen[300],
            main: lightGreen[500],
            dark: lightGreen[700]
          },
          secondary: {
            light: blueGrey[300],
            main: blueGrey[500],
            dark: blueGrey[700]
          }
        },
      }),
    [prefersDarkMode],
  );

  return (
    <Fragment>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ReactRouterBootstrap />
      </ThemeProvider>
    </Fragment>
  );
}

export default App;

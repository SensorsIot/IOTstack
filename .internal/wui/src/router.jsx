import React, { Fragment } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Redirect,
  Route
} from "react-router-dom";
import Build from './pages/mainBuild'
import NotFound from './pages/notFound'
import BuildHistory from './pages/buildHistory'
import Scripts from './pages/scripts'
import Box from '@material-ui/core/Box';
import Help from './pages/help'
import Sidebar from './features/Sidebar'

export default function RouteWrapper() {
  return (
    <Router>
      <Fragment>
        <Sidebar />
        <Box pl="3.5rem">
          <Switch>
            <Route path="/build-history">
              <BuildHistory />
            </Route>
            <Route path="/build">
              <Build />
            </Route>
            <Route path="/build">
              <Build />
            </Route>
            <Route path="/scripts">
              <Scripts />
            </Route>
            <Route path="/help">
              <Help />
            </Route>
            <Route path="/">
              <Build />
            </Route>
            <Route path='/not-found' component={NotFound} />
            <Redirect from='*' to='/not-found' />
          </Switch>
        </Box>
      </Fragment>
    </Router>
  );
}

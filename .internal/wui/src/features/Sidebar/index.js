import React, { Fragment } from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import BuildIcon from '@material-ui/icons/Build';
import QueryBuilderIcon from '@material-ui/icons/QueryBuilder';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import { Link } from "react-router-dom";
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: 10,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9) + 1,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1)
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
}));

export default function MiniDrawer() {
  const classes = useStyles();
  // const theme = useTheme();
  const [menuOpen, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: menuOpen,
          [classes.drawerClose]: !menuOpen,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: menuOpen,
            [classes.drawerClose]: !menuOpen,
          }),
        }}
      >
        <Fragment>
          {menuOpen
          && (
            <Box
              className={classes.toolbar}
            >
              <IconButton onClick={handleDrawerClose}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          )}
          {!menuOpen
          && (
            <Box
              className={classes.toolbar}
            >
              <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                className={classes.menuButton}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Fragment>

        <Divider />

        <List>
          <ListItem button component={Link} to="/build">
            <ListItemIcon><BuildIcon /></ListItemIcon>
            <ListItemText primary="Build" />
          </ListItem>
          <ListItem button component={Link} to="/build-history">
            <ListItemIcon><QueryBuilderIcon /></ListItemIcon>
            <ListItemText primary="Build History" />
          </ListItem>
          <Divider />
          <ListItem button component={Link} to="/scripts">
            <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
            <ListItemText primary="Scripts" />
          </ListItem>
          <ListItem button component={Link} to="/help">
            <ListItemIcon><HelpOutlineIcon /></ListItemIcon>
            <ListItemText primary="Help and Docs" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
}
import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };
  const navigate = useNavigate();

  const DrawerList = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)}>
      <List>
        {['Groups'].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton onClick={() => {
              navigate(text.toLowerCase())
            }}>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

    </Box>
  );



  return (
    <>
      <Drawer open={open} onClose={toggleDrawer(false)}>
        {DrawerList}
      </Drawer>

      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TAB BUDDY
          </Typography>
          <Button color="inherit"
            onClick={() => {
              localStorage.removeItem('access_token')
              navigate('/login')
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
    </>
  );
}


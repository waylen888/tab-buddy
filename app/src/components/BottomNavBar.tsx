
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation, useNavigate } from 'react-router-dom';
import { Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  return (
    <Paper
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={(/s$/).test(pathname.split("/")[1]) ? pathname.split("/")[1] : pathname.split("/")[1] + "s"}
        onChange={(e, value) => {
          console.log(`bottom navigation onChange`, value)
          navigate(value)
        }}
      >
        <BottomNavigationAction label={t("bottom_nav.friends")} icon={<PeopleIcon />} value="friends" />
        <BottomNavigationAction label={t("bottom_nav.groups")} icon={<ReceiptIcon />} value="groups" />
        <BottomNavigationAction label={t("bottom_nav.settings")} icon={<SettingsIcon />} value="settings" />
      </BottomNavigation>
    </Paper>
  )
}
import { NavLink, Stack } from '@mantine/core';
import {
  IconDashboard,
  IconListDetails,
  IconDeviceDesktop,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', icon: IconDashboard, path: '/' },
  { labelKey: 'nav.scenarios', icon: IconListDetails, path: '/scenarios' },
  { labelKey: 'nav.sessions', icon: IconDeviceDesktop, path: '/sessions' },
  { labelKey: 'nav.executions', icon: IconPlayerPlay, path: '/executions' },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Stack gap={0} pt="md">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          label={t(item.labelKey)}
          leftSection={<item.icon size={18} />}
          active={
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
          }
          onClick={() => navigate(item.path)}
        />
      ))}
    </Stack>
  );
}

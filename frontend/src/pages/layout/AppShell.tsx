import { AppShell as MantineAppShell, Burger, Group } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleSidebar } from '@/store/slices/uiSlice';
import { Header } from './Header';
import { Navbar } from './Navbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function AppShell() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !sidebarOpen, desktop: !sidebarOpen } }}
      padding="md"
    >
      <MantineAppShell.Header>
        <Group h="100%" px="md">
          <Burger
            opened={sidebarOpen}
            onClick={() => dispatch(toggleSidebar())}
            size="sm"
          />
          <Header />
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar>
        <Navbar />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}

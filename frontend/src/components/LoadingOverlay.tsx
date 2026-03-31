import { LoadingOverlay as MantineLoadingOverlay } from '@mantine/core';

interface Props {
  visible: boolean;
}

export function LoadingOverlay({ visible }: Props) {
  return (
    <MantineLoadingOverlay
      visible={visible}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ color: 'cyan', type: 'bars' }}
    />
  );
}

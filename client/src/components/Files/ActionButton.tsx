import React from 'react';
import { Button } from '@librechat/client';
import { useLocalize } from '~/hooks';

type ActionButtonProps = {
  onClick: () => void;
  loading?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
};

export default function ActionButton({
  onClick,
  loading,
  variant = 'outline',
}: ActionButtonProps) {
  const localize = useLocalize();
  return (
    <Button
      variant={variant}
      className="w-full justify-start gap-2"
      onClick={onClick}
      loading={loading}
    >
      {localize('com_ui_action_button')}
    </Button>
  );
}

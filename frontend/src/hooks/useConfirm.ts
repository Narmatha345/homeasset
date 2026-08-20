import { useState, useCallback } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}

const initialState: ConfirmState = {
  open: false,
  title: "",
  onConfirm: () => {},
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(initialState);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback(
    (options: Omit<ConfirmState, "open">) => {
      setState({ ...options, open: true });
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await state.onConfirm();
      setState(initialState);
    } finally {
      setLoading(false);
    }
  }, [state]);

  const handleCancel = useCallback(() => setState(initialState), []);

  return { confirm, dialogProps: { ...state, loading, onConfirm: handleConfirm, onCancel: handleCancel } };
}

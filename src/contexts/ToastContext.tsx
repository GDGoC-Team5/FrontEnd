'use client';

import { Alert, Snackbar, type AlertColor } from '@mui/material';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

type ShowToast = (message: string, severity?: AlertColor) => void;

const ToastContext = createContext<ShowToast>(() => {});

/** 화면 아래에 잠깐 뜨는 알림. const toast = useToast(); toast('저장했어요', 'success') */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const show = useCallback<ShowToast>((message, severity = 'success') => {
    setState({ open: true, message, severity });
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={3000}
        onClose={() => setState((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={state.severity} variant="filled" onClose={() => setState((s) => ({ ...s, open: false }))} sx={{ fontWeight: 600 }}>
          {state.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

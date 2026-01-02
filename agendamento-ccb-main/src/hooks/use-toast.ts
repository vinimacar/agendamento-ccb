import { useState } from 'react';

export interface Toast {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastCallback: ((toast: Toast) => void) | null = null;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (newToast: Toast) => {
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);

    // Show alert for now (simple implementation)
    const message = `${newToast.title}${newToast.description ? '\n' + newToast.description : ''}`;
    if (newToast.variant === 'destructive') {
      console.error(message);
    } else {
      console.log(message);
    }
  };

  toastCallback = toast;

  return { toast, toasts };
};

// Export a simple toast function for use without hook
export const toast = (toastData: Toast) => {
  if (toastCallback) {
    toastCallback(toastData);
  } else {
    const message = `${toastData.title}${toastData.description ? '\n' + toastData.description : ''}`;
    if (toastData.variant === 'destructive') {
      alert('Erro: ' + message);
    } else {
      alert(message);
    }
  }
};

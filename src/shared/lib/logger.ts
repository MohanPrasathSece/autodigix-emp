export const serverLog = async (action: string, details: any = {}, status: 'success' | 'error' | 'info' = 'info') => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, status }),
    });
    if (!res.ok) {
      console.warn('Log endpoint returned a non-OK status.');
    }
  } catch (error) {
    console.error('Failed to send log to server:', error);
  }
};

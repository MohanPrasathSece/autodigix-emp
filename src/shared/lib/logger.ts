export const serverLog = async (action: string, details: any = {}, status: 'success' | 'error' | 'info' = 'info') => {
  try {
    await fetch('http://localhost:3001/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, status }),
    });
  } catch (error) {
    console.error('Failed to send log to server:', error);
  }
};

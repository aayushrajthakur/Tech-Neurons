const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const getDashboardSummary = async () => {
  const res = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return await res.json();
};

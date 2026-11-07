// Keep requests on the shared axios instance configured in main.js.
export function apiError(error, fallback, { auth = false, mutation = false } = {}) {
  const status = error?.response?.status;
  if (status === 401) return auth
    ? "Check your username and password, then try again."
    : "Your session is no longer valid. Please log in again.";
  if (status === 403) return "You do not have permission to change this plant. Return to your plants and refresh the list.";
  if (status === 404) return "This plant is no longer available. Return to your plants and refresh the list.";
  if (status === 409 && auth) return "That username is already taken. Choose another username or log in.";
  if (status === 429) return "Too many attempts. Wait a moment, then try again.";
  if (!error?.response) {
    return `${fallback} Check your connection. ${mutation
      ? "The change may have been saved; refresh and check before trying again."
      : "Please try again."}`;
  }
  // Validation messages are safe to show as text; do not expose server errors.
  const message = error.response.data?.message || error.response.data?.msg;
  if ((status === 400 || status === 422) && typeof message === "string") {
    return `${message} Check the form and try again.`;
  }
  return `${fallback} ${mutation
    ? "Refresh and check whether the change was saved before trying again."
    : "Please try again in a moment."}`;
}

export function lastAction(plant) {
  return (plant.actions || []).reduce((latest, action) => {
    if (!Number.isFinite(Date.parse(action.time))) return latest;
    return !latest || Date.parse(action.time) > Date.parse(latest.time) ? action : latest;
  }, null);
}

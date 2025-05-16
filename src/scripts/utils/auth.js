// auth.js
export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
  window.dispatchEvent(new Event("authChange"));
};

export const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
  window.dispatchEvent(new Event("authChange"));
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const checkAuthenticatedRoute = (page) => {
  if (!isAuthenticated()) {
    window.location.hash = "#/login";
    return null;
  }
  return page;
};

export const checkUnauthenticatedRouteOnly = (page) => {
  if (isAuthenticated()) {
    window.location.hash = "#/";
    return null;
  }
  return page;
};

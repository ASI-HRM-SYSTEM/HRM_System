const getEnv = (key: string, fallback = ""): string => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value : fallback;
};

export const ENV = {
  firebase: {
    apiKey: getEnv("VITE_FB_API_KEY"),
    authDomain: getEnv("VITE_FB_AUTH_DOMAIN"),
    projectId: getEnv("VITE_FB_PROJECT_ID"),
    storageBucket: getEnv("VITE_FB_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FB_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FB_APP_ID"),
    companyId: getEnv("VITE_FB_COMPANY_ID", "newlanka"),
  },
};

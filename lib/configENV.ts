export const backendUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:9000"
    : "https://zec-bounties-backend.onrender.com/";

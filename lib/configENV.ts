export const backendUrl =
  process.env.NODE_ENV === "production"
    ? "https://zec-bounties-backend.onrender.com"
    : "http://localhost:9000";

export const backendWebSpocketUrl =
  process.env.NODE_ENV === "production"
    ? "wss://zec-bounties-backend.onrender.com/"
    : "ws://localhost:9000";

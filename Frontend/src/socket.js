import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_API_URL;

// remove /api for socket connection
const SOCKET_URL = BASE_URL
  ? BASE_URL.replace("/api", "")
  : undefined;

const socket = io(SOCKET_URL, {
  autoConnect: true,
});

export default socket;
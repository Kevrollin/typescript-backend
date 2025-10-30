import tls from "tls";
import dns from "dns/promises";

const host = "ep-tiny-snow-ahuefa0u.c-3.us-east-1.aws.neon.tech";

console.log("🌐 Resolving IPv4 address...");
const addresses = await dns.resolve4(host);
const ip = addresses[0];
console.log("✅ IPv4 address:", ip);

const options = {
  host: ip,
  port: 5432,
  servername: host, // required for SNI
  rejectUnauthorized: false,
};

console.log("🔍 Testing TLS handshake (IPv4 forced)...");
const socket = tls.connect(options, () => {
  console.log("✅ TLS handshake success!");
  console.log("Protocol:", socket.getProtocol());
  socket.end();
});

socket.on("error", (err) => {
  console.error("❌ TLS handshake failed:", err);
});

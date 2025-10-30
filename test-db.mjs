import { Client } from "pg";
import net from "net";

const dbConfig = {
  connectionString: "postgresql://neondb_owner:npg_3zlZOGrRNd0C@ep-tiny-snow-ahuefa0u.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 8000,
};

async function testPgConnection() {
  console.log("⏳ Step 1: Testing raw TCP connection to port 5432...");
  const socket = new net.Socket();
  socket.setTimeout(5000);

  socket.on("connect", () => {
    console.log("✅ TCP connection successful! Port 5432 reachable.");
    socket.destroy();
    testPgClient();
  });

  socket.on("timeout", () => {
    console.error("❌ TCP timeout: port 5432 not reachable. Probably blocked.");
    socket.destroy();
  });

  socket.on("error", (err) => {
    console.error("❌ TCP error:", err.message);
  });

  socket.connect(5432, "ep-tiny-snow-ahuefa0u.us-east-1.aws.neon.tech");
}

async function testPgClient() {
  console.log("\n⏳ Step 2: Testing PostgreSQL handshake...");
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log("✅ PostgreSQL connection successful!");
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
  } finally {
    await client.end().catch(() => {});
  }
}

testPgConnection();

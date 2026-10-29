import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const port = config.port;

async function main() {
  try {
    await prisma.$connect();
    app.listen(port, () => {
     
    });
  } catch (error) {
    await prisma.$disconnect();
   
    process.exit(1);
  }
}

main();
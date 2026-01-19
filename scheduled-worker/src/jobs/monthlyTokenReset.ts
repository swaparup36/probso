import prisma from "../db/prisma.js";

export async function monthlyTokenReset() {
  console.log("[CRON] Monthly token reset started");

  await prisma.user.updateMany({
    data: {
      tokenBalance: 1,
      lastTokenResetAt: new Date()
    }
  });

  console.log("[CRON] Monthly token reset completed");
}

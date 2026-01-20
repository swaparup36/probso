import prisma from "../db/prisma.js";

export async function monthlyTokenReset() {
  console.log("[CRON] Monthly token reset started");

  const allUserTokenBalances = await prisma.userTokenBalance.findMany({});

  for (const userTokenBalance of allUserTokenBalances) {
    const userId = userTokenBalance.userId;
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId,
        status: "active",
      },
    });

    if (!subscription) {
      await prisma.userTokenBalance.updateMany({
        where: {
          userId: userId,
        },
        data: {
          balance: 1,
        }
      });
    }
  }

  console.log("[CRON] Monthly token reset completed");
}

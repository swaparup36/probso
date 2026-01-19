import "dotenv/config";

const jobName = process.argv[2];

if (!jobName) {
  console.error("❌ Job name not provided");
  process.exit(1);
}

const jobs = {
  monthlyTokenReset: async () =>
    (await import("./jobs/monthlyTokenReset.js")).monthlyTokenReset(),
};

(async () => {
  try {
    console.log(`[CRON] Running job: ${jobName}`);
    await jobs[jobName]();
    process.exit(0);
  } catch (err) {
    console.error(`[CRON] Job failed: ${jobName}`, err);
    process.exit(1);
  }
})();

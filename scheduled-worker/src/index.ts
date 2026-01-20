import "dotenv/config";

const jobs = {
  monthlyTokenReset: async () =>
    (await import("./jobs/monthlyTokenReset.js")).monthlyTokenReset(),
};

type JobName = keyof typeof jobs;

const jobName = process.argv[2];

const isValidJobName = (name: string): name is JobName => name in jobs;

if (!jobName || !isValidJobName(jobName)) {
  console.error("Job name not provided or invalid");
  process.exit(1);
}

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

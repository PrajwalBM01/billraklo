import { hello } from "@billraklo/core";

console.log(hello("worker"));

// Stand-in for the job queue: keep the process running
setInterval(() => {
  console.log("Worker alive, waiting for jobs...");
}, 10_000);
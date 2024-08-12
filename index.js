const axios = require("axios");
const { performance } = require("perf_hooks");
const fs = require("fs");

// Configuration
const URL = "https://pricing-service-3-2.onrender.com/price"; // Replace with your pricing service URL
const CONCURRENT_REQUESTS = 1000; // Number of concurrent requests
const TOTAL_REQUESTS = 100000; // Total number of requests to be made
const REQUEST_DELAY = 100; // Delay between each batch of requests in ms

// To store results for later analysis
let results = [];
let successfulRequests = 0;
let failedRequests = 0;

// Function to make a single request
const makeRequest = async () => {
  const startTime = performance.now();
  const params = {
    distance: Math.random() * 50, // Random distance between 0 and 50 km
    demand: Math.random(), // Random demand factor between 0 and 1
    timeOfDay: Math.floor(Math.random() * 24), // Random hour of the day
  };

  try {
    const response = await axios.get(URL, { params });
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    console.log(
      `Response Time: ${responseTime}ms, Status Code: ${response.status}`
    );

    // Log the successful response
    results.push({
      status: "success",
      statusCode: response.status,
      responseTime: responseTime,
      data: response.data,
    });
    successfulRequests++;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    console.log(
      `Request failed: ${error.message}, Response Time: ${responseTime}ms`
    );

    // Log the failed response
    results.push({
      status: "error",
      message: error.message,
      responseTime: responseTime,
    });
    failedRequests++;
  }
};

// Function to run the stress test
const stressTest = async () => {
  let requestsSent = 0;

  const runBatch = async () => {
    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      if (requestsSent >= TOTAL_REQUESTS) break;
      promises.push(makeRequest());
      requestsSent++;
    }
    await Promise.all(promises);

    if (requestsSent < TOTAL_REQUESTS) {
      setTimeout(runBatch, REQUEST_DELAY);
    } else {
      console.log(`Finished sending ${TOTAL_REQUESTS} requests.`);
      analyzeResults();
      saveResultsToFile();
    }
  };

  runBatch();
};

// Function to analyze results
const analyzeResults = () => {
  const totalTime = results.reduce((acc, curr) => acc + curr.responseTime, 0);
  const averageResponseTime = totalTime / results.length;

  console.log("\n--- Stress Test Summary ---");
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`Successful Requests: ${successfulRequests}`);
  console.log(`Failed Requests: ${failedRequests}`);
  console.log(`Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
};

// Function to save results to a file
const saveResultsToFile = () => {
  const filePath = "stress_test_results.json";
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filePath}`);
};

// Start the stress test
stressTest();

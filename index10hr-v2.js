const axios = require("axios");
const { performance } = require("perf_hooks");
const fs = require("fs");

// Configuration
const URL = "https://pricing-service-3-2.onrender.com/price"; // Replace with your pricing service URL
const TOTAL_DURATION = 10 * 60 * 60 * 1000; // 10 hours in milliseconds
const TOTAL_REQUESTS = 10000; // Total number of requests to be made
const PEAK_HOUR_REQUEST_INTERVAL = TOTAL_DURATION / (TOTAL_REQUESTS * 0.7); // Interval between requests during peak hours in ms
const LOW_LOAD_REQUEST_INTERVAL = TOTAL_DURATION / (TOTAL_REQUESTS * 0.3); // Interval between requests during low load in ms
const CONCURRENT_REQUESTS = 10; // Number of concurrent requests

// To store results for later analysis
let results = [];
let successfulRequests = 0;
let failedRequests = 0;

// Function to make a single request
const makeRequest = async () => {
  const startTime = performance.now();
  const currentTime = new Date().getTime(); // Get the current time in milliseconds
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
      `Response Time: ${responseTime}ms, Status Code: ${response.status}, Time: ${currentTime}`
    );

    // Log the successful response
    results.push({
      status: "success",
      statusCode: response.status,
      responseTime: responseTime,
      data: response.data,
      time: currentTime, // Add the request time to the log
    });
    successfulRequests++;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    console.log(
      `Request failed: ${error.message}, Response Time: ${responseTime}ms, Time: ${currentTime}`
    );

    // Log the failed response
    results.push({
      status: "error",
      message: error.message,
      responseTime: responseTime,
      time: currentTime, // Add the request time to the log
    });
    failedRequests++;
  }
};

// Function to run the stress test
const stressTest = async () => {
  let requestsSent = 0;
  let peakHour = true; // Flag to indicate peak hour or low load

  const runBatch = async () => {
    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      if (requestsSent >= TOTAL_REQUESTS) break;
      promises.push(makeRequest());
      requestsSent++;
    }
    await Promise.all(promises);

    if (requestsSent < TOTAL_REQUESTS) {
      if (peakHour) {
        setTimeout(runBatch, PEAK_HOUR_REQUEST_INTERVAL);
      } else {
        setTimeout(runBatch, LOW_LOAD_REQUEST_INTERVAL);
      }
    } else {
      console.log(`Finished sending ${TOTAL_REQUESTS} requests.`);
      analyzeResults();
      saveResultsToFile();
    }

    // Switch between peak hour and low load every 2 hours
    if (requestsSent % (TOTAL_REQUESTS / 5) === 0) {
      peakHour = !peakHour;
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
  const currentDate = new Date();
  const dateString = `${currentDate.getFullYear()}-${
    currentDate.getMonth() + 1
  }-${currentDate.getDate()}${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
  const filePath = `stress_test_results_${dateString}.json`;
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${filePath}`);
};

// Start the stress test
stressTest();

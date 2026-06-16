const axios = require("axios");
const env = require("../config/env");
const ApiError = require("./ApiError");

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const ensureSecret = () => {
  if (!env.PAYSTACK_SECRET_KEY) {
    throw new ApiError(500, "PAYSTACK_SECRET_KEY is not configured");
  }
};

const requestPaystack = async (path, options = {}) => {
  ensureSecret();

  try {
    const response = await axios({
      url: `${PAYSTACK_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    if (response.data?.status === false) {
      throw new ApiError(502, response.data.message || "Paystack request failed", response.data);
    }

    return response.data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const status = error.response?.status || 502;
    const message = error.response?.data?.message || error.message || "Paystack request failed";
    throw new ApiError(status, message, error.response?.data);
  }
};

exports.initializeTransaction = (data) => {
  return requestPaystack("/transaction/initialize", {
    method: "POST",
    data
  });
};

exports.verifyTransaction = (reference) => {
  return requestPaystack(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET"
  });
};

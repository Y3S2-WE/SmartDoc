const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const paypalBaseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const defaultLkrToUsdRate = Number(process.env.LKR_TO_USD_RATE || 0.0033);

const parseAmount = (value) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 0;
  }

  return Number(numeric.toFixed(2));
};

const buildLkrBreakdown = (appointmentDraft = {}, incomingBreakdown = {}) => {
  const consultationFeeLkr = parseAmount(
    incomingBreakdown.consultationFeeLkr !== undefined
      ? incomingBreakdown.consultationFeeLkr
      : appointmentDraft.channellingFee
  );
  const platformFeeLkr = parseAmount(
    incomingBreakdown.platformFeeLkr !== undefined ? incomingBreakdown.platformFeeLkr : consultationFeeLkr * 0.03
  );
  const secureTransactionFeeLkr = parseAmount(
    incomingBreakdown.secureTransactionFeeLkr !== undefined ? incomingBreakdown.secureTransactionFeeLkr : 150
  );
  const taxLkr = parseAmount(
    incomingBreakdown.taxLkr !== undefined
      ? incomingBreakdown.taxLkr
      : (consultationFeeLkr + platformFeeLkr + secureTransactionFeeLkr) * 0.02
  );
  const totalLkr = parseAmount(consultationFeeLkr + platformFeeLkr + secureTransactionFeeLkr + taxLkr);

  return {
    consultationFeeLkr,
    platformFeeLkr,
    secureTransactionFeeLkr,
    taxLkr,
    totalLkr
  };
};

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_SECRET;

  if (!clientId || !clientSecret) {
    const err = new Error('PayPal credentials are missing. Configure PAYPAL_CLIENT_ID and PAYPAL_SECRET.');
    err.statusCode = 500;
    throw err;
  }

  const tokenResponse = await axios.post(`${paypalBaseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: clientId,
      password: clientSecret
    }
  });

  return tokenResponse.data.access_token;
};

app.post('/api/payments/paypal/create-order', async (req, res) => {
  try {
    const { appointmentDraft = {}, amountBreakdown = {}, successUrl, cancelUrl } = req.body;

    if (!appointmentDraft.doctorAuthUserId || !appointmentDraft.appointmentDate || !appointmentDraft.appointmentTimeSlot) {
      return res.status(400).json({ message: 'Incomplete appointment payload for payment.' });
    }

    const lkrBreakdown = buildLkrBreakdown(appointmentDraft, amountBreakdown);
    const lkrToUsdRate = Number(amountBreakdown.lkrToUsdRate || defaultLkrToUsdRate);
    const usdTotal = parseAmount(lkrBreakdown.totalLkr * lkrToUsdRate);

    if (usdTotal <= 0) {
      return res.status(400).json({ message: 'Calculated payment amount is invalid.' });
    }

    const accessToken = await getPayPalAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `SmartDoc Appointment - Dr. ${appointmentDraft.doctorName || 'Doctor'} (${appointmentDraft.appointmentDate} ${appointmentDraft.appointmentTimeSlot})`,
          amount: {
            currency_code: 'USD',
            value: usdTotal.toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'SmartDoc Healthcare',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: successUrl || `${frontendBaseUrl}/payment/success`,
        cancel_url: cancelUrl || `${frontendBaseUrl}/payment/cancel`
      }
    };

    const orderResponse = await axios.post(`${paypalBaseUrl}/v2/checkout/orders`, orderPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const approvalLink = (orderResponse.data.links || []).find((link) => link.rel === 'approve')?.href;

    return res.status(201).json({
      message: 'PayPal order created successfully',
      orderId: orderResponse.data.id,
      status: orderResponse.data.status,
      approvalUrl: approvalLink,
      amountBreakdown: {
        ...lkrBreakdown,
        lkrToUsdRate,
        totalUsd: usdTotal,
        currency: 'USD'
      }
    });
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status || 500;
    const paypalIssue = error.response?.data?.details?.[0]?.description;
    const message = paypalIssue || error.message || 'Failed to create PayPal order';
    return res.status(statusCode).json({ message });
  }
});

app.post('/api/payments/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required for capture.' });
    }

    const accessToken = await getPayPalAccessToken();

    const captureResponse = await axios.post(
      `${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const captureId = captureResponse.data.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;

    return res.status(200).json({
      message: 'PayPal payment captured successfully',
      orderId: captureResponse.data.id,
      status: captureResponse.data.status,
      captureId
    });
  } catch (error) {
    const statusCode = error.statusCode || error.response?.status || 500;
    const paypalIssue = error.response?.data?.details?.[0]?.description;
    const message = paypalIssue || error.message || 'Failed to capture PayPal order';
    return res.status(statusCode).json({ message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: process.env.SERVICE_NAME || 'Payment Service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Payment Service - SmartDoc Healthcare Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createOrder: '/api/payments/paypal/create-order',
      captureOrder: '/api/payments/paypal/capture-order'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ${process.env.SERVICE_NAME || 'Payment Service'} is running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

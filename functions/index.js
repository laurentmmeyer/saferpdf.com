import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import Stripe from "stripe";
import { randomUUID } from "crypto";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Define secrets for Firebase Functions v2
const stripeSecretTest = defineSecret("STRIPE_SECRET_TEST");
const stripeSecretProd = defineSecret("STRIPE_SECRET_PROD");
const stripeWebhookSecretTest = defineSecret("STRIPE_WEBHOOK_SECRET_TEST");
const stripeWebhookSecretProd = defineSecret("STRIPE_WEBHOOK_SECRET_PROD");

export const createCustomerOnCheckoutCompleteV2 = onRequest(
  { 
    secrets: [stripeSecretTest, stripeSecretProd, stripeWebhookSecretTest, stripeWebhookSecretProd],
    cors: true,
  },
  async (req, res) => {
    console.log("=== createCustomerOnCheckoutComplete function invoked ===");
    console.log(`Request method: ${req.method}`);
    console.log(`Request path: ${req.path}`);
    console.log(`Request query params:`, JSON.stringify(req.query, null, 2));
    console.log(`Request headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`Request body size: ${req.rawBody?.length || 0} bytes`);
    
    const environment = req.query.environment || "prod";
    console.log(`Processing webhook for environment: ${environment}`);

    if (req.method !== "POST") {
      console.warn(`Method not allowed: ${req.method}`);
      res.status(405).send("Method Not Allowed");
      return;
    }

    console.log("✓ POST method verified");

    // Select the correct secrets based on environment
    const stripeSecret = environment === "test" ? stripeSecretTest : stripeSecretProd;
    const stripeWebhookSecret = environment === "test" ? stripeWebhookSecretTest : stripeWebhookSecretProd;
    
    console.log(`Using Stripe secrets for environment: ${environment}`);

    // Initialize Stripe with secret
    console.log("Initializing Stripe with secret...");
    const stripe = new Stripe(stripeSecret.value(), {
      apiVersion: "2024-12-18.acacia",
    });
    console.log("✓ Stripe initialized");

    const signature = req.headers["stripe-signature"];
    console.log(`Stripe signature found: ${!!signature}`);
    console.log(`Signature value: ${signature}`);

    let event;

    try {
      console.log("Attempting to construct webhook event...");
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value(),
      );
      console.log("✓ Webhook event verified and constructed");
      console.log(`Event type: ${event.type}`);
      console.log(`Event ID: ${event.id}`);
      console.log(`Full event object:`, JSON.stringify(event, null, 2));
    } catch (err) {
      console.error(`❌ Webhook signature verification failed`);
      console.error(`Error message: ${err.message}`);
      console.error(`Error stack:`, err.stack);
      console.error(`Stripe secret key exists: ${!!stripeSecret.value()}`);
      console.error(`Webhook secret key exists: ${!!stripeWebhookSecret.value()}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      console.log("✓ Processing checkout.session.completed event");
      const sessionId = event.data.object.id;
      console.log(`Session ID: ${sessionId}`);

      try {
        console.log("Retrieving Stripe checkout session...");
        // Retrieve the session with expanded line items
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items"],
        });
        console.log("✓ Session retrieved successfully");
        console.log(`Session object:`, JSON.stringify(session, null, 2));

        const clientReferenceId =
          session.client_reference_id || `error-${randomUUID()}`;
        const description =
          session.line_items.data[0]?.description || "No description";
        const customerId = session?.customer;

        console.log(`Client reference ID: ${clientReferenceId}`);
        console.log(`Product description: ${description}`);
        console.log(`Customer ID: ${customerId}`);

        // Prepare data for Firestore
        const customerData = {
          raw: session, // Consider filtering sensitive information
          date: new Date(session.created * 1000),
          productDescription: description, // Using the description from the first line item
          mode: session.mode,
          customerId,
        };

        console.log("Preparing Firestore data:");
        console.log(`- Date: ${customerData.date}`);
        console.log(`- Mode: ${customerData.mode}`);
        console.log(`- Custom ID: ${customerId}`);

        // Write to Firestore
        console.log(`Writing to Firestore at path: customers/${clientReferenceId}`);
        await db
          .collection("customers")
          .doc(clientReferenceId)
          .set(customerData, { merge: true });
        console.log("✓ Successfully wrote to Firestore");

        console.log("Sending success response");
        res.json({ received: true });
      } catch (error) {
        console.error(`❌ Error processing checkout session`);
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack:`, error.stack);
        console.error(`Error code: ${error.code}`);
        console.error(`Full error object:`, JSON.stringify(error, null, 2));
        res.status(500).send("Internal Server Error");
      }
    } else {
      console.log(`⚠ Unhandled event type: ${event.type}`);
      console.log(`Event details:`, JSON.stringify(event, null, 2));
      res.status(200).send("Unhandled event type");
    }
  },
);

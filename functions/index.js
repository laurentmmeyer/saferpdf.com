const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret);
const crypto = require("crypto");

admin.initializeApp();

exports.createCustomerOnCheckoutComplete = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        functions.config().stripe.webhook_secret,
      );
    } catch (err) {
      console.error(`Webhook signature verification failed. ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const sessionId = event.data.object.id;

      try {
        // Retrieve the session with expanded line items
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items"],
        });

        const clientReferenceId =
          session.client_reference_id || `error-${crypto.randomUUID()}`;
        const description =
          session.line_items.data[0]?.description || "No description";
        const customerId = session?.customer;

        // Prepare data for Firestore
        const customerData = {
          raw: session, // Consider filtering sensitive information
          date: new Date(session.created * 1000),
          productDescription: description, // Using the description from the first line item
          mode: session.mode,
          customerId,
        };

        // Write to Firestore
        await admin
          .firestore()
          .collection("customers")
          .doc(clientReferenceId)
          .set(customerData, { merge: true });

        res.json({ received: true });
      } catch (error) {
        console.error(
          `Error retrieving session with expanded line items: ${error}`,
        );
        res.status(500).send("Internal Server Error");
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
      res.status(200).send("Unhandled event type");
    }
  },
);

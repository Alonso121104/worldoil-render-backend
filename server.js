const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post("/book", async (req, res) => {
  try {
    const { name, phone, year, make, model, rawDate, time } = req.body;

    if (!name || !phone || !year || !make || !model || !rawDate || !time) {
      return res.status(400).json({ error: "Missing booking information." });
    }

    const samePhone = await db.collection("oilChanges")
      .where("phone", "==", phone)
      .where("rawDate", "==", rawDate)
      .get();

    if (!samePhone.empty) {
      return res.status(400).json({ error: "You can only book one appointment per day." });
    }

    const sameSlot = await db.collection("oilChanges")
      .where("rawDate", "==", rawDate)
      .where("time", "==", time)
      .get();

    if (sameSlot.size >= 2) {
      return res.status(400).json({ error: "This time slot is full. Please choose another time." });
    }

    await db.collection("oilChanges").add({
      name,
      phone,
      year,
      make,
      model,
      rawDate,
      time,
      status: "pending",
      createdAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Booking failed. Try again." });
  }
});

app.listen(process.env.PORT || 3000);

import { bucket, firestore, admin } from "../config/firebase";

class FirebaseDatabaseController {
  getDevices = async (req, res) => {
    try {
      const devicesCollection = firestore.collection("deviceEsp32");
      const snapshot = await devicesCollection.get();

      if (snapshot.empty) {
        return res.status(404).send({ message: "No devices found" });
      }

      const devices = snapshot.docs.map((doc) => doc.data());
      res.status(200).send({
        success: true,
        message: "Get device list successfully",
        devices,
      });
    } catch (error) {
      console.error("Error fetching devices from Firestore:", error);
      res.status(500).send({ error: "Error fetching devices from Firestore" });
    }
  };
  async getBinaries(req, res) {
    try {
      const esp32Version = req.params["esp32Version"] || esp32;
      const esp32Collection = firestore.collection(esp32Version);
      const snapshot = await esp32Collection.get();

      if (snapshot.empty) {
        return res.status(404).send({ message: "No binary versions found" });
      }

      const binaries = snapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => {
          // Sorting logic based on createdAt
          if (a.createdAt.seconds < b.createdAt.seconds) return -1;
          if (a.createdAt.seconds > b.createdAt.seconds) return 1;
          // In case seconds are equal, compare nanoseconds
          return a.createdAt.nanoseconds - b.createdAt.nanoseconds;
        });
      console.log("🚀 ~ router.get ~ binaries:", binaries);
      return res.status(200).send({
        success: true,
        message: "Get image list successfully",
        binaryEsp32List: binaries,
      });
    } catch (error) {
      console.error("Error fetching binaries from Firestore:", error);
      res.status(500).send({ error: "Error fetching binaries from Firestore" });
    }
  }

  async downloadBinary(req, res) {
    const esp32Version = req.body.esp32Version || "esp32";
    const folderName = req.body.folderName || "default";
    const fileName = req.body.fileName || "target.bin";

    const filePath = `${esp32Version}/${folderName}/${fileName}`;

    try {
      const file = bucket.file(filePath);

      // Check if the file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).send({ error: "File not found" });
      }

      // Set appropriate headers for file download
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", "application/octet-stream");

      // Stream the file content to the response
      const readStream = file.createReadStream();
      readStream.pipe(res);

      readStream.on("end", () => {
        console.log(`File ${filePath} successfully sent to the client.`);
      });

      readStream.on("error", (err) => {
        console.error("Error streaming file:", err);
        res.status(500).send({ error: "Error streaming file" });
      });
    } catch (error) {
      console.error("Error fetching file from Firebase Storage:", error);
      res
        .status(500)
        .send({ error: "Error fetching file from Firebase Storage" });
    }
  }

  async addBinary(req, res) {
    const { collection, binaryName, binaryDescription, folderContain } =
      req.body;

    if (!collection || !binaryName || !binaryDescription || !folderContain) {
      return res.status(400).send({
        error:
          "All fields (binaryName, binaryDescription, folderContain) are required.",
      });
    }

    const newBinary = {
      binaryName,
      binaryDescription,
      folderContain,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      // Add document to Firestore
      const docRef = await firestore.collection(collection).add(newBinary);

      // Define file paths
      const targetFilePath = `${collection}/${folderContain}/target.bin`;
      const firmwareFilePath = `${collection}/${folderContain}/firmware.bin`;
      console.log(
        "🚀 ~ FirebaseDatabaseController ~ addBinary ~ targetFilePath:",
        targetFilePath
      );

      // Assume files are uploaded via the request (e.g., using multer or similar middleware)
      const targetFile = req.files.targetBin[0]; // Access file via middleware like multer
      const firmwareFile = req.files.firmwareBin[0];

      if (!targetFile || !firmwareFile) {
        return res.status(400).send({
          error: "Both target.bin and firmware.bin files are required.",
        });
      }

      // Upload target.bin to Firebase Storage
      await bucket.file(targetFilePath).save(targetFile.buffer, {
        contentType: targetFile.mimetype,
      });

      // Upload firmware.bin to Firebase Storage
      await bucket.file(firmwareFilePath).save(firmwareFile.buffer, {
        contentType: firmwareFile.mimetype,
      });

      res.status(201).send({
        message: "Binary version added and files uploaded successfully",
        id: docRef.id,
      });
    } catch (error) {
      console.error("Error adding binary version or uploading files:", error);
      res.status(500).send({
        error: "Error adding binary version or uploading files",
      });
    }
  }
}

module.exports = new FirebaseDatabaseController();

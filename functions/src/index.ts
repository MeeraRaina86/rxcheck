// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// This is the number of recent reports you want to keep.
const REPORTS_TO_KEEP = 50;

/**
 * This Cloud Function triggers every time a new analysis report is created
 * for any user. It then checks the total number of reports for that user
 * and deletes the oldest ones if the total exceeds REPORTS_TO_KEEP.
 */
export const limitUserReports = functions.firestore
  .document("profiles/{userId}/reports/{reportId}")
  .onCreate(async (snapshot, context) => {
    // Get the user ID from the path of the newly created document.
    const userId = context.params.userId;
    const reportsRef = db.collection("profiles").doc(userId).collection("reports");

    // Query for all reports for this user, ordered by creation time (newest first).
    const reportsQuery = reportsRef.orderBy("createdAt", "desc");

    const querySnapshot = await reportsQuery.get();

    // Check if the total number of reports is greater than the limit.
    if (querySnapshot.size > REPORTS_TO_KEEP) {
      functions.logger.log(
        `User ${userId} has ${querySnapshot.size} reports. Deleting the oldest ones.`
      );

      // Create a "batch" to delete multiple documents at once, which is more efficient.
      const batch = db.batch();

      // Get all the documents that are older than the 50th document.
      const reportsToDelete = querySnapshot.docs.slice(REPORTS_TO_KEEP);

      reportsToDelete.forEach((doc) => {
        functions.logger.log(`  - Deleting old report: ${doc.id}`);
        batch.delete(doc.ref);
      });

      // Commit the batch deletion to the database.
      await batch.commit();
      functions.logger.log("Successfully deleted old reports.");
    }

    return null;
  });
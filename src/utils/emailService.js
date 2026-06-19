import { generateAllProjectsPDF } from "./pdfGenerator";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const sendEmailWithAttachment = async (recipient, subject, bodyMessage, pdfDoc, attachmentName = "weaverbird_report.pdf", credentials = {}) => {
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || credentials.googleScriptUrl;

    // Get the Base64 representation of the PDF from jsPDF
    const dataUri = pdfDoc.output("datauristring");
    const base64pdf = dataUri.split(",")[1];

    if (scriptUrl) {
      // Send via Google Apps Script Web App
      try {
        const payload = {
          to: recipient,
          subject: subject,
          body: bodyMessage,
          attachmentName: attachmentName,
          attachmentBase64: base64pdf
        };

        // We use mode: "no-cors" and Content-Type: "text/plain" to bypass CORS preflight restrictions in browsers
        await fetch(scriptUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });

        // Since no-cors returns an opaque response, we assume success if no exception was thrown
        return true;
      } catch (error) {
        console.error("Google Apps Script sending failed:", error);
        return false;
      }
    }

    // Fallback to EmailJS
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || credentials.emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || credentials.emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || credentials.emailJsPublicKey;

    if (!serviceId || !templateId || !publicKey) {
      console.warn("Email configuration is missing.");
      return false;
    }

    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: recipient,
          subject: subject,
          message: bodyMessage,
          from_name: "Weaverbird App",
          attachment: base64pdf
        }
      };

      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return true;
      } else {
        const errorText = await response.text();
        console.error("EmailJS sending failed:", errorText);
        return false;
      }
    } catch (error) {
      console.error("Error sending email via EmailJS:", error);
      return false;
    }
  };

export const checkAndTriggerAutoEmail = async (currentProjects, cleanEmail, credentials = {}, setLastEmailBackupDate) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || credentials.emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || credentials.emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || credentials.emailJsPublicKey;

    if (!serviceId || !templateId || !publicKey || !cleanEmail) return;

    try {
      const userDocRef = doc(db, "users", cleanEmail);
      const userSnap = await getDoc(userDocRef);

      let lastSent = 0;
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.lastEmailBackupAt) {
          lastSent = new Date(data.lastEmailBackupAt).getTime();
          setLastEmailBackupDate(data.lastEmailBackupAt);
        }
      }

      const nowTime = Date.now();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

      if (nowTime - lastSent >= threeDaysMs) {
        console.log("Triggering 3-day automated email backup...");
        const backupPdf = generateAllProjectsPDF(currentProjects);
        const emailSubject = `Automated 3-Day Backup: Weaverbird Studio`;
        const emailMessage = `Hello,\n\nThis is your automated 3-day backup report containing a summary of all active projects in your Weaverbird Interior Studio dashboard.\n\nDate: ${new Date().toLocaleDateString()}`;

        const success = await sendEmailWithAttachment(cleanEmail, emailSubject, emailMessage, backupPdf, `weaverbird_studio_backup_${new Date().toISOString().split("T")[0]}.pdf`);

        if (success) {
          const timestamp = new Date().toISOString();
          await setDoc(userDocRef, { lastEmailBackupAt: timestamp }, { merge: true });
          setLastEmailBackupDate(timestamp);
          console.log("Automated 3-day backup email sent successfully!");
        } else {
          console.warn("Automated backup email failed to send.");
        }
      }
    } catch (err) {
      console.error("Error processing automated backup email:", err);
    }
  };
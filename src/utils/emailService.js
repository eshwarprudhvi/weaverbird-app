import { generateAllProjectsPDF } from "./pdfGenerator";

export const sendEmailWithAttachment = async (recipient, subject, bodyMessage, pdfDoc, attachmentName = "report.pdf", credentials = {}, companyName = "My Workspace", studioName = "Interior Studio") => {
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
        from_name: `${companyName} App`,
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

export const sendInvitationEmail = async (recipient, role, workspaceName, acceptUrl, customMessage = "", credentials = {}, companyName = "Project Manager") => {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || credentials.googleScriptUrl || localStorage.getItem("ipm_google_script_url");
  const subject = `You've been invited to join ${workspaceName || 'a team workspace'} on ${companyName}`;
  const bodyMessage = `Hello!\n\nYou have been invited to collaborate on the workspace "${workspaceName || 'Team Workspace'}" with the role of [${role || 'Member'}].\n\n${customMessage ? `Message from sender:\n"${customMessage}"\n\n` : ''}To accept this invitation and get started, click or visit the link below:\n${acceptUrl}\n\nNote: This link will expire in 7 days.\n\nBest regards,\n${companyName} Studio Team`;

  if (scriptUrl) {
    try {
      const payload = {
        to: recipient,
        subject: subject,
        body: bodyMessage,
        acceptUrl: acceptUrl,
        role: role,
        workspaceName: workspaceName
      };

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error("Google Apps Script invitation sending failed:", error);
    }
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || credentials.emailJsServiceId || localStorage.getItem("ipm_emailjs_service_id");
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || credentials.emailJsTemplateId || localStorage.getItem("ipm_emailjs_template_id");
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || credentials.emailJsPublicKey || localStorage.getItem("ipm_emailjs_public_key");

  if (!serviceId || !templateId || !publicKey) {
    console.warn("Frontend EmailJS configuration is missing. Assuming backend dispatched the email.");
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
        accept_url: acceptUrl,
        role: role,
        workspace_name: workspaceName,
        from_name: `${companyName} App`
      }
    };

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending invitation email via EmailJS:", error);
    return false;
  }
};

export const checkAndTriggerAutoEmail = async () => {
  // Deprecated: Automated emails are now handled by backend schedulers and the Report API.
};
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { LocalNotifications } from "@capacitor/local-notifications";
import { jsPDF } from "jspdf";
import { sendEmailWithAttachment as defaultSendEmail } from "../utils/emailService";

export const usePdfGenerator = (props = {}) => {
  const { activeProject, setReportPreview, getPriorityWeight, reportPreview, recipientEmail, customRecipientEmail, googleScriptUrl, emailJsServiceId, emailJsTemplateId, emailJsPublicKey, setIsSendingEmail = () => {}, sendEmailWithAttachment = defaultSendEmail, projects = [], companyName = "My Workspace", companySubtitle = "Interior Studio" } = props;
  // Auto-destructure will be injected here

  const generatePDFReport = (type) => {
    if (!activeProject) return;

    const materials = activeProject.materials || [];
    const tasks = activeProject.tasks || [];

    if (type === "materials" && materials.length === 0) {
      alert("No materials to generate a PDF report.");
      return;
    }
    if (type === "tasks" && tasks.length === 0) {
      alert("No tasks to generate a PDF report.");
      return;
    }
    if (type === "both" && materials.length === 0 && tasks.length === 0) {
      alert("No materials or tasks to generate a PDF report.");
      return;
    }

    let reportTitle;
    if (type === "materials") reportTitle = "Materials Report";
    else if (type === "tasks") reportTitle = "Works Report";
    else reportTitle = "Project Status Report";

    setReportPreview({
      type,
      title: reportTitle,
      projectName: activeProject.name,
      targetDate: activeProject.completionDate,
      materials: materials,
      tasks: [...tasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)),
      rooms: activeProject.rooms || []
    });
  };

  const handleGenerateRoomPDF = (e, room) => {
    e.stopPropagation();
    if (!activeProject) return;

    const materials = activeProject.materials?.filter(m => (room.id === 'general' ? (!m.roomId || m.roomId === 'general') : m.roomId === room.id)) || [];
    const tasks = activeProject.tasks?.filter(t => (room.id === 'general' ? (!t.roomId || t.roomId === 'general') : t.roomId === room.id)) || [];

    setReportPreview({
      type: "both",
      title: `${room.name} Report`,
      projectName: activeProject.name,
      targetDate: activeProject.completionDate,
      materials: materials,
      tasks: [...tasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)),
      rooms: activeProject.rooms || []
    });
  };

  const generateAllProjectsPDF = (allProjects) => {
    const doc = new jsPDF();

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(companyName, 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 150, 100); // gold
    doc.text("INTERIOR STUDIO - ALL PROJECTS BACKUP SUMMARY", 20, 31);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 150, 25);

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(20, 36, 190, 36);

    let y = 45;

    const activeProjects = allProjects.filter(p => !p.isTrashed);

    if (activeProjects.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.text("No active projects found in the studio database.", 20, y);
    } else {
      activeProjects.forEach((proj, idx) => {
        // Page boundary check
        if (y > 250) {
          doc.addPage();
          y = 25;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. Project: ${proj.name}`, 20, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 100, 100);
        doc.text(`Status: ${proj.status.toUpperCase()} | Deadline: ${proj.completionDate || "Not set"}`, 20, y);
        y += 5;

        doc.setFont("helvetica", "italic");
        doc.text(`Description: ${proj.description || "No description provided."}`, 20, y);
        y += 6;

        // Filter pending tasks and materials
        const pendingMats = (proj.materials || []).filter(m => !m.completed);
        const pendingTasks = (proj.tasks || []).filter(t => !t.completed);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(`Pending Materials: ${pendingMats.length} | Pending Tasks: ${pendingTasks.length}`, 20, y);
        y += 6;

        if (pendingMats.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text("  Pending Materials List:", 20, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          pendingMats.forEach((m) => {
            if (y > 270) { doc.addPage(); y = 25; }
            doc.text(`    • ${m.name}`, 20, y);
            y += 5;
          });
        }

        if (pendingTasks.length > 0) {
          if (y > 270) { doc.addPage(); y = 25; }
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(100, 116, 139);
          doc.text("  Pending Tasks List:", 20, y);
          y += 5;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          pendingTasks.forEach((t) => {
            if (y > 270) { doc.addPage(); y = 25; }
            const priorityStr = (t.priority || "medium").toUpperCase();
            doc.text(`    • ${t.name} [${priorityStr}]`, 20, y);
            y += 5;
          });
        }
        y += 8; // Gap
      });
    }

    return doc;
  };

  const generateSingleProjectPDF = (report) => {
    const doc = new jsPDF();

    // Workspace Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(companyName, 20, 25);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 150, 100); // gold
    doc.text("INTERIOR STUDIO", 20, 31);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 150, 25);

    // Gold Divider Line
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.line(20, 36, 190, 36);

    // Project Details box background
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 42, 170, 22, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(20, 42, 170, 22, "S");

    // Project Details Text
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`Project Name: ${report.projectName}`, 25, 49);

    doc.setFont("helvetica", "normal");
    const targetDateStr = report.targetDate ? new Date(report.targetDate).toLocaleDateString("en-GB") : "No Date Set";
    doc.text(`Target Date: ${targetDateStr}`, 25, 57);

    // Days Left section on the right side of the details box
    if (report.targetDate) {
      const target = new Date(report.targetDate);
      const today = new Date();
      target.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      doc.setFont("helvetica", "bold");
      if (diffDays < 0) {
        doc.setTextColor(239, 68, 68); // Red for overdue
        doc.text(`${Math.abs(diffDays)} Days Overdue`, 135, 53);
      } else if (diffDays === 0) {
        doc.setTextColor(212, 175, 55); // Gold for due today
        doc.text("Due Today", 135, 53);
      } else {
        doc.setTextColor(34, 197, 94); // Green for active days left
        doc.text(`${diffDays} Days Left`, 135, 53);
      }
    }

    // Report Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(report.title, 20, 76);

    let y = 86;

    const materialsByRoom = {};
    (report.materials || []).forEach(m => {
      const rid = m.roomId || 'general';
      if (!materialsByRoom[rid]) materialsByRoom[rid] = [];
      materialsByRoom[rid].push(m);
    });

    const tasksByRoom = {};
    (report.tasks || []).forEach(t => {
      const rid = t.roomId || 'general';
      if (!tasksByRoom[rid]) tasksByRoom[rid] = [];
      tasksByRoom[rid].push(t);
    });

    const allRoomIds = [...new Set([...Object.keys(materialsByRoom), ...Object.keys(tasksByRoom)])];

    if (allRoomIds.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("No pending items found.", 20, y);
      return doc;
    }

    allRoomIds.forEach((roomId) => {
      let roomName = 'General / Unassigned';
      if (roomId !== 'general') {
        const r = (report.rooms || []).find(x => x.id === roomId);
        if (r) roomName = r.name;
      }

      if (y > 260) { doc.addPage(); y = 20; }

      // Room Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246); // accent blue
      doc.text(roomName.toUpperCase(), 20, y);
      y += 2;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 8;

      const rMaterials = materialsByRoom[roomId] || [];
      const rTasks = tasksByRoom[roomId] || [];

      // Render Materials
      if ((report.type === "materials" || report.type === "both") && rMaterials.length > 0) {
        if (y > 270) { doc.addPage(); y = 20; }
        // Table Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("MATERIAL", 22, y);
        doc.text("STATUS", 160, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);

        rMaterials.forEach((m, idx) => {
          if (y > 275) { doc.addPage(); y = 20; }
          // Background band for alternate rows
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, y - 4, 170, 7, "F");
          }
          doc.text(`• ${m.name}`, 22, y + 1);
          if (m.completed) {
            doc.setTextColor(34, 197, 94); // Green for completed
            doc.text("Completed", 160, y + 1);
          } else {
            doc.setTextColor(100, 116, 139); // Gray/muted for pending
            doc.text("Pending", 160, y + 1);
          }
          doc.setTextColor(51, 65, 85); // reset
          y += 8;
        });
        y += 4; // gap
      }

      // Render Tasks
      if ((report.type === "tasks" || report.type === "both") && rTasks.length > 0) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("WORK / TASK", 22, y);
        doc.text("PRIORITY", 160, y);
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);

        rTasks.forEach((t, idx) => {
          if (y > 275) { doc.addPage(); y = 20; }
          if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, y - 4, 170, 7, "F");
          }
          doc.text(`• ${t.name}`, 22, y + 1);

          if (t.completed) {
            doc.setTextColor(34, 197, 94); // Green for completed
            doc.text("COMPLETED", 160, y + 1);
          } else {
            const pStr = (t.priority || "medium").toUpperCase();
            if (t.priority === "high") doc.setTextColor(239, 68, 68);
            else if (t.priority === "low") doc.setTextColor(59, 130, 246);
            else doc.setTextColor(249, 115, 22);
            doc.text(pStr, 160, y + 1);
          }
          doc.setTextColor(51, 65, 85); // reset
          y += 8;
        });
        y += 4; // gap
      }

      y += 6; // Extra gap before next room
    });

    return doc;
  };

  const handleEmailReportManually = async (overrideEmail = null) => {
    if (!reportPreview) return;

    const targetEmail = (typeof overrideEmail === "string" && overrideEmail.trim()) ? overrideEmail : (recipientEmail === "custom" ? customRecipientEmail : recipientEmail);
    if (!targetEmail || !targetEmail.trim() || !targetEmail.includes("@")) {
      alert("Please enter or select a valid recipient email.");
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || googleScriptUrl;
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || emailJsPublicKey;

    if (!scriptUrl && (!serviceId || !templateId || !publicKey)) {
      alert("Email configuration is missing. Please set VITE_GOOGLE_SCRIPT_URL in your .env file, or configure your EmailJS credentials.");
      return;
    }

    setIsSendingEmail(true);

    try {
      // Create the single project PDF using the shared generator function
      const doc = generateSingleProjectPDF(reportPreview);

      const emailSubject = `${companyName} Report: ${reportPreview.projectName} - ${reportPreview.title}`;
      const emailMessage = `Hello,\n\nPlease find attached the ${reportPreview.title} PDF for project "${reportPreview.projectName}" generated from the ${companyName} ${companySubtitle} app.`;

      const success = await sendEmailWithAttachment(targetEmail, emailSubject, emailMessage, doc, `${reportPreview.projectName.replace(/\s+/g, '_')}_report.pdf`, { googleScriptUrl, emailJsServiceId, emailJsTemplateId, emailJsPublicKey }, companyName, companySubtitle);

      if (success) {
        alert(`PDF report successfully emailed to ${targetEmail}!`);
      } else {
        alert("Failed to email report. Please check configurations.");
      }
    } catch (err) {
      console.error("Error generating/mailing report:", err);
      alert("An error occurred while preparing the email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendManualBackup = async (overrideEmail = null) => {
    const targetEmail = (typeof overrideEmail === "string" && overrideEmail.trim()) ? overrideEmail : (recipientEmail === "custom" ? customRecipientEmail : recipientEmail);
    if (!targetEmail || !targetEmail.trim() || !targetEmail.includes("@")) {
      alert("Please select or enter a valid recipient email.");
      return;
    }

    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || googleScriptUrl;
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || emailJsPublicKey;

    if (!scriptUrl && (!serviceId || !templateId || !publicKey)) {
      alert("Email configuration is missing. Please set VITE_GOOGLE_SCRIPT_URL in your .env file, or configure your EmailJS credentials.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const backupPdf = generateAllProjectsPDF(projects);
      const emailSubject = `Manual Backup: ${companyName} ${companySubtitle}`;
      const emailMessage = `Hello,\n\nHere is a manual backup report containing a summary of all active projects in the ${companyName} ${companySubtitle} dashboard.\n\nDate: ${new Date().toLocaleDateString()}`;

      const success = await sendEmailWithAttachment(targetEmail, emailSubject, emailMessage, backupPdf, `${(companyName).toLowerCase().replace(/[^a-z0-9]/g, "_")}_backup_${new Date().toISOString().split("T")[0]}.pdf`, { googleScriptUrl, emailJsServiceId, emailJsTemplateId, emailJsPublicKey }, companyName, companySubtitle);

      if (success) {
        alert(`Backup PDF successfully emailed to ${targetEmail}!`);
      } else {
        alert("Failed to send backup email. Please verify the mail configuration.");
      }
    } catch (err) {
      console.error("Manual backup send failed:", err);
      alert("An error occurred while sending the backup email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportPreview) return;

    try {
      // Create the single project PDF using the shared generator function
      const doc = generateSingleProjectPDF(reportPreview);

      const fileName = `${(companyName).replace(/[^a-zA-Z0-9]/g, "_")}_${reportPreview.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];

        await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });

        // Trigger Local Notification for Download Completion
        try {
          const perm = await LocalNotifications.requestPermissions();
          if (perm.display === "granted") {
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: Date.now(),
                  title: "PDF Report Downloaded",
                  body: `Saved ${fileName} to Documents folder.`,
                  schedule: { at: new Date(Date.now() + 100) }
                }
              ]
            });
          }
        } catch (notifErr) {
          console.error("Notification failed:", notifErr);
        }

        alert(`Success! PDF downloaded and saved to your Documents folder:\n${fileName}`);
      } else {
        // Desktop Browser
        doc.save(fileName);
      }
    } catch (err) {
      console.error(err);
      alert(`Could not download PDF: ${err.message || err}`);
    }
  };

  const handleSharePDF = async () => {
    if (!reportPreview) return;

    try {
      // Create the single project PDF using the shared generator function
      const doc = generateSingleProjectPDF(reportPreview);

      const fileName = `${(companyName).replace(/[^a-zA-Z0-9]/g, "_")}_${reportPreview.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfBase64 = doc.output('datauristring').split(',')[1];

        // Write the PDF to cache directory temporarily (hidden from downloads)
        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache
        });

        // Share the actual cached PDF file natively
        await Share.share({
          title: `${companyName} Report - ${reportPreview.projectName}`,
          text: `Here is the pending report for project: ${reportPreview.projectName}.`,
          url: fileResult.uri,
          dialogTitle: 'Share PDF Report'
        });

        // Clean up temp file from cache
        try {
          await Filesystem.deleteFile({
            path: fileName,
            directory: Directory.Cache
          });
        } catch (delErr) {
          console.warn("Could not delete temp cache file:", delErr);
        }
      } else {
        // Desktop Browser
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${companyName} Report - ${reportPreview.projectName}`,
            text: `Here is the pending report for project: ${reportPreview.projectName}.`
          });
        } else {
          // Fallback text share or clipboard
          let shareText = `*${companyName} ${companySubtitle}*\n*Project:* ${reportPreview.projectName}\n*Report:* ${reportPreview.title}\n\n`;
          if (reportPreview.type === "materials" || reportPreview.type === "both") {
            shareText += `*Pending Materials:*\n`;
            reportPreview.materials.forEach((m, idx) => { shareText += `${idx + 1}. ${m.name}\n`; });
            shareText += `\n`;
          }
          if (reportPreview.type === "tasks" || reportPreview.type === "both") {
            shareText += `*Pending Works:*\n`;
            reportPreview.tasks.forEach((t, idx) => { shareText += `${idx + 1}. ${t.name} (${(t.priority || "medium").toUpperCase()})\n`; });
          }
          if (navigator.share) {
            await navigator.share({
              title: `${companyName} Report - ${reportPreview.projectName}`,
              text: shareText
            });
          } else {
            navigator.clipboard.writeText(shareText);
            alert("Could not share file directly. Report details copied to clipboard!");
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Share failed: ${err.message || err}`);
    }
  };

  return {
    generatePDFReport,
    handleGenerateRoomPDF,
    generateAllProjectsPDF,
    generateSingleProjectPDF,
    handleEmailReportManually,
    handleSendManualBackup,
    handleDownloadPDF,
    handleSharePDF,
  };
};

export const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0].substring(2);
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  };

export const getDaysLeftTextAndColor = (project) => {
    if (project.status === "completed") {
      return { text: "Completed", color: "#22c55e", urgencyClass: "urgency-done" };
    }
    if (!project.completionDate) {
      return { text: "No target date set", color: "var(--text-muted)", urgencyClass: "" };
    }

    const targetDate = new Date(project.completionDate);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "#e74c3c", urgencyClass: "urgency-red" };
    } else if (diffDays === 0) {
      return { text: "Due today!", color: "#e74c3c", urgencyClass: "urgency-red" };
    } else if (diffDays <= 15) {
      return { text: `${diffDays} days left`, color: "#e74c3c", urgencyClass: "urgency-red" };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days left`, color: "#f5a623", urgencyClass: "urgency-gold" };
    } else {
      return {
        text: `${diffDays} days left`,
        color: "#22c55e",
        urgencyClass: "urgency-green",
      };
    }
  };

export const formatDisplayDateStr = (dateStr) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const y = parts[0].slice(-2);
        const m = parts[1];
        const d = parts[2];
        return `${d}/${m}/${y}`;
      }
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return dateStr;
    }
  };

export const getPriorityWeight = (priority) => {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  };
import React, { useState, useEffect, useRef } from "react";
import { usePdfGenerator } from "./hooks/usePdfGenerator";
import { useSharing } from "./hooks/useSharing";
import { useNotifications } from "./hooks/useNotifications";
import { useProjectItems } from "./hooks/useProjectItems";
import { useProjects } from "./hooks/useProjects";
import { useSchedule } from "./hooks/useSchedule";
import { useTodos } from "./hooks/useTodos";
import { useCatalog } from "./hooks/useCatalog";
import { useCloudSync } from "./hooks/useCloudSync";
import CloudSyncLogin from "./components/auth/CloudSyncLogin";
import UnauthorizedScreen from "./components/auth/UnauthorizedScreen";
import MaterialsCatalog from "./components/views/MaterialsCatalog";
import AdminPanel from "./components/views/AdminPanel";
import TodoView from "./components/views/TodoView";
import ProjectsList from "./components/views/ProjectsList";
import ProjectDetail from "./components/views/ProjectDetail";
import CommonModals from "./components/views/CommonModals";


import { LocalNotifications } from "@capacitor/local-notifications";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Share } from "@capacitor/share";
import { Network } from "@capacitor/network";
import { db, isConfigured } from "./firebase";
import AddProjectModal from "./components/modals/AddProjectModal";
import AddMeetingModal from "./components/modals/AddMeetingModal";
import ReportPreviewModal from "./components/modals/ReportPreviewModal";
import BottomNav from "./components/navigation/BottomNav";
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDocs, getDoc } from "firebase/firestore";
import {
  Folder,
  Calendar,
  CheckSquare,
  User,
  Plus,
  Search,
  ArrowLeft,
  Menu,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Check,
  Briefcase,
  BookOpen,
  Sliders,
  Clock,
  CheckCircle2,
  Share2,
  FileText,
  GripVertical,
  AlertTriangle,
  LogOut,
  Undo,
  RotateCcw,
  Mail,
  MoreVertical,
} from "lucide-react";

const WEB_APP_VERSION = "1.1.3";

// Default initial data to populate localStorage if empty
const INITIAL_PROJECTS = []

const INITIAL_SCHEDULE = [];

function App() {
  const [currentTab, setCurrentTab] = useState("projects"); // projects | work | schedule | profile
  const [activeProjectId, setActiveProjectId] = useState(null); // null means dashboard, otherwise project detail
  const [activeRoomId, setActiveRoomId] = useState(null); // null means rooms list, otherwise room detail
  const [projectSubTab, setProjectSubTab] = useState("materials");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | ongoing | not-started | completed
  const [materialsCollapsed, setMaterialsCollapsed] = useState(true);
  const [tasksCollapsed, setTasksCollapsed] = useState(true);
  const [isTodoScreenOpen, setIsTodoScreenOpen] = useState(false);
  const [isNewProjModalOpen, setIsNewProjModalOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState("");
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);
  const [isBackupsListOpen, setIsBackupsListOpen] = useState(false);
  const [editItemModal, setEditItemModal] = useState(null); // { type: 'project'|'material'|'task'|'meeting'|'todo', projectId?, itemId, name, description?, time?, day? }
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);
  const [customConfirm, setCustomConfirm] = useState(null); // { title, message, onConfirm }
  const [isCatalogScreenOpen, setIsCatalogScreenOpen] = useState(false);
  const [newMaterialInput, setNewMaterialInput] = useState("");
  const [newWorkInput, setNewWorkInput] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium"); // high | medium | low
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0].substring(2);
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= numDays; d++) {
      const dayStr = String(d).padStart(2, "0");
      const monthStr = String(month + 1).padStart(2, "0");
      days.push(`${year}-${monthStr}-${dayStr}`);
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // --- STATE ---

  const {
    projects,
    setProjects,
    deletedProjectIds,
    setDeletedProjectIds,
    handleAddProject,
    handleAddRoomToExistingProject,
    handleEditRoom,
    handleDeleteRoom,
    handleDeleteProject,
    handleProjectStatusChange
  } = useProjects(activeProjectId, setActiveProjectId, setCustomConfirm, setIsNewProjModalOpen, setEditItemModal);

  const {
    schedule,
    setSchedule,
    handleAddMeeting,
    handleToggleMeeting,
    handleDeleteMeeting
  } = useSchedule(setIsNewMeetingModalOpen);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ipm_theme");
    return (saved === "dark" || saved === "light") ? saved : "light";
  });

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEmailReportsOpen, setIsEmailReportsOpen] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [openRoomMenuId, setOpenRoomMenuId] = useState(null);

  const [updateDebugInfo, setUpdateDebugInfo] = useState({
    status: "Idle",
    latestVersion: "Unknown",
    latestUrl: "None",
    isNative: Capacitor.isNativePlatform(),
    dbConfigured: isConfigured,
    error: "None"
  });

  useEffect(() => {
    const handleResize = () => {
      // If window innerHeight is significantly smaller than the screen height, keyboard is open
      if (window.innerHeight < window.screen.height * 0.8) {
        setIsKeyboardVisible(true);
      } else {
        setIsKeyboardVisible(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside room menu to close it
  useEffect(() => {
    if (openRoomMenuId === null) return;
    const handleDocumentClick = () => {
      setOpenRoomMenuId(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [openRoomMenuId]);

  // 2. Check for updates from Firestore
  const checkUpdate = async (isManual = false) => {
    try {
      if (!isConfigured) {
        setUpdateDebugInfo(prev => ({ ...prev, status: "Firestore not configured" }));
        if (isManual) alert("Firestore is not configured.");
        return;
      }
      setUpdateDebugInfo(prev => ({ ...prev, status: "Checking Firestore..." }));
      const updateRef = doc(db, "system", "update");
      const snap = await getDoc(updateRef);
      if (snap.exists()) {
        const data = snap.data();
        const latestVersion = data.version ? data.version.trim() : "";
        const zipUrl = data.url ? data.url.trim() : "";
        setUpdateDebugInfo(prev => ({
          ...prev,
          latestVersion: latestVersion || "None",
          latestUrl: zipUrl || "None",
          status: "Fetched database info"
        }));

        if (latestVersion && latestVersion !== WEB_APP_VERSION && zipUrl) {
          setUpdateDebugInfo(prev => ({ ...prev, status: `Downloading v${latestVersion}...` }));
          console.log(`OTA Update available: local v${WEB_APP_VERSION} -> latest v${latestVersion}`);

          // Notify user
          alert(`Installing WeaverBird update v${latestVersion}. The app will restart automatically.`);

          const downloadResult = await CapacitorUpdater.download({
            url: zipUrl,
            version: latestVersion
          });
          setUpdateDebugInfo(prev => ({ ...prev, status: "Applying update..." }));
          await CapacitorUpdater.set(downloadResult);
        } else {
          setUpdateDebugInfo(prev => ({ ...prev, status: "Already up to date" }));
          if (isManual) alert("App is already up to date!");
        }
      } else {
        setUpdateDebugInfo(prev => ({ ...prev, status: "Firestore config document 'system/update' not found" }));
        if (isManual) alert("Update config document not found in database.");
      }
    } catch (err) {
      console.error("Auto-update check failed:", err);
      setUpdateDebugInfo(prev => ({ ...prev, status: "Error", error: err.message || String(err) }));
      if (isManual) alert(`Update check failed: ${err.message || err}`);
    }
  };

  // Automatic Over-The-Air (OTA) Updates via Capgo & Firestore config
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. Notify Capacitor that the app loaded successfully (prevents rollback)
      try {
        CapacitorUpdater.notifyAppReady();
      } catch (err) {
        console.warn("CapacitorUpdater notifyAppReady failed:", err);
      }

      // Add a 5s delay on startup to prevent blocking the UI layout load
      const timer = setTimeout(() => checkUpdate(false), 5000);
      return () => clearTimeout(timer);
    } else {
      setUpdateDebugInfo(prev => ({ ...prev, status: "Not native platform" }));
    }
  }, [isConfigured]);

  const [isNetworkOnline, setIsNetworkOnline] = useState(navigator.onLine);

  useEffect(() => {
    let networkListener = null;
    let fallbackCleanup = null;

    const initNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        setIsNetworkOnline(status.connected);

        networkListener = await Network.addListener("networkStatusChange", (status) => {
          setIsNetworkOnline(status.connected);
        });
      } catch (err) {
        // Fallback for web browser testing if native fails
        const handleOnline = () => setIsNetworkOnline(true);
        const handleOffline = () => setIsNetworkOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        fallbackCleanup = () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }
    };

    initNetworkStatus();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      if (fallbackCleanup) {
        fallbackCleanup();
      }
    };
  }, []);


  // Project detail sub-tabs: 'materials' or 'work'

  // Filtering and Searching

  // Collapsible lists

  // Schedule sub-tabs: 'incomplete' | 'completed'
  const [scheduleSubTab, setScheduleSubTab] = useState("incomplete");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    () => new Date()
  );
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);

  // Todo list state (synced with cloud)
  const [todos, setTodos] = useState([]);
  const [newTodoInput, setNewTodoInput] = useState("");
  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodoText, setEditTodoText] = useState("");

  // Priority task collapsible state
  const [highPriorityCollapsed, setHighPriorityCollapsed] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mediumPriorityCollapsed, setMediumPriorityCollapsed] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [lowPriorityCollapsed, setLowPriorityCollapsed] = useState(false);

  // Modals state

  // Material Price Catalog States
  const {
    materialCatalog,
    setMaterialCatalog,
    handleAddCatalogItem,
    handleDeleteCatalogItem
  } = useCatalog(setCustomConfirm);
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);
  // Inline forms state

  // Swipe-to-delete tracking
  // Cloud Sync and Admin Access states
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(() => {
    return localStorage.getItem("weaverbird_cloud_sync") === "true";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("weaverbird_user_email") || "";
  });
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("weaverbird_user_role") || "editor";
  });
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem("weaverbird_user_authorized") !== "false";
  });
  const [authorizedUsers] = useState([]);
  const isRemoteChange = useRef(false);
  const prevProjectsRef = useRef([]);
  const [isConnectingCloud, setIsConnectingCloud] = useState(false);
  const {
    hasLoadedProjectsFromCloud,
    setHasLoadedProjectsFromCloud,
    hasLoadedScheduleFromCloud,
    setHasLoadedScheduleFromCloud,
    hasLoadedTodosFromCloud,
    setHasLoadedTodosFromCloud,
    hasLoadedCatalogFromCloud,
    setHasLoadedCatalogFromCloud,
    syncProjectToCloud,
    deleteProjectFromCloud
  } = useCloudSync({
    db,
    isConfigured,
    cloudSyncEnabled,
    isAuthorized,
    userEmail,
    projects,
    setProjects,
    schedule,
    setSchedule,
    todos,
    setTodos,
    materialCatalog,
    setMaterialCatalog,
    prevProjectsRef
  });

  // EmailJS & Email Automation States
  const [emailJsServiceId, setEmailJsServiceId] = useState(() => localStorage.getItem("ipm_emailjs_service_id") || "");
  const [emailJsTemplateId, setEmailJsTemplateId] = useState(() => localStorage.getItem("ipm_emailjs_template_id") || "");
  const [emailJsPublicKey, setEmailJsPublicKey] = useState(() => localStorage.getItem("ipm_emailjs_public_key") || "");
  const [googleScriptUrl, setGoogleScriptUrl] = useState(() => localStorage.getItem("ipm_google_script_url") || "");
  const [recipientEmail, setRecipientEmail] = useState(userEmail || "");
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [lastEmailBackupDate, setLastEmailBackupDate] = useState("");
  const [backupRecipients, setBackupRecipients] = useState(() => {
    const saved = localStorage.getItem("ipm_backup_recipients");
    return saved ? JSON.parse(saved) : [];
  });
  const [newRecipientInput, setNewRecipientInput] = useState("");

  useEffect(() => {
    localStorage.setItem("ipm_backup_recipients", JSON.stringify(backupRecipients));
  }, [backupRecipients]);


  useEffect(() => {
    localStorage.setItem("ipm_emailjs_service_id", emailJsServiceId);
  }, [emailJsServiceId]);

  useEffect(() => {
    localStorage.setItem("ipm_emailjs_template_id", emailJsTemplateId);
  }, [emailJsTemplateId]);

  useEffect(() => {
    localStorage.setItem("ipm_emailjs_public_key", emailJsPublicKey);
  }, [emailJsPublicKey]);

  useEffect(() => {
    localStorage.setItem("ipm_google_script_url", googleScriptUrl);
  }, [googleScriptUrl]);

  // Keep recipientEmail in sync with logged-in userEmail if empty
  useEffect(() => {
    if (userEmail && !recipientEmail) {
      setRecipientEmail(userEmail);
    }
  }, [userEmail, recipientEmail]);

  // Handle native Android hardware back button (natural back behavior)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapApp.addListener("backButton", () => {
      if (reportPreview) {
        setReportPreview(null);
      } else if (isCatalogScreenOpen) {
        setIsCatalogScreenOpen(false);
      } else if (isTodoScreenOpen) {
        setIsTodoScreenOpen(false);
      } else if (isNewProjModalOpen) {
        setIsNewProjModalOpen(false);
      } else if (isNewMeetingModalOpen) {
        setIsNewMeetingModalOpen(false);
      } else if (editItemModal) {
        setEditItemModal(null);
      } else if (activeRoomId !== null) {
        // If inside room details, go back to rooms list
        setActiveRoomId(null);
      } else if (activeProjectId !== null) {
        // If inside a project's rooms list, go back to main dashboard
        setActiveProjectId(null);
      } else {
        // Exit app if on main dashboard
        CapApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [
    reportPreview,
    isCatalogScreenOpen,
    isTodoScreenOpen,
    isNewProjModalOpen,
    isNewMeetingModalOpen,
    editItemModal,
    activeProjectId,
    activeRoomId
  ]);

  // Schedule Local Notifications for all upcoming incomplete meetings
  

  // --- LOCAL NOTIFICATIONS SYSTEM ---
  useEffect(() => {
    const requestNotificationPermission = async () => {
      try {
        const permission = await LocalNotifications.checkPermissions();
        if (permission.display !== "granted") {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn("LocalNotifications not supported or available:", err);
      }
    };
    requestNotificationPermission();

    // Register click action listener
    let actionListener;
    try {
      actionListener = LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          const extra = action.notification.extra;
          if (extra) {
            if (extra.projectId) {
              setActiveProjectId(extra.projectId);
              if (extra.tab) {
                setProjectSubTab(extra.tab);
              }
              setCurrentTab("projects");
            } else if (extra.tab === "schedule") {
              setCurrentTab("schedule");
            }
          }
        }
      );
    } catch (err) {
      console.warn("Failed to register notification action listener:", err);
    }

    return () => {
      if (actionListener) {
        if (typeof actionListener.then === "function") {
          actionListener.then((handle) => {
            if (handle && typeof handle.remove === "function") {
              handle.remove();
            }
          });
        } else if (typeof actionListener.remove === "function") {
          actionListener.remove();
        }
      }
    };
  }, []);

  const rescheduleNotifications = async () => {
    try {
      const pendingList = await LocalNotifications.getPending();
      if (pendingList.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pendingList.notifications,
        });
      }

      const now = new Date();
      const todayDateStr = now.toISOString().split("T")[0];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDateStr = tomorrow.toISOString().split("T")[0];

      const notificationsToSchedule = [];
      let idCounter = 1;

      // 1. Today's meetings -> Today at 6:00 AM
      const todaysMeets = schedule.filter(
        (s) => s.date === todayDateStr && !s.completed
      );
      if (todaysMeets.length > 0) {
        // Notification scheduling handled by useNotifications hook
      }

      // 2. Tomorrow's meetings -> Today at 12:00 PM (noon)
      const tomorrowsMeets = schedule.filter(
        (s) => s.date === tomorrowDateStr && !s.completed
      );
      if (tomorrowsMeets.length > 0) {
        const scheduleTime = new Date();
        scheduleTime.setHours(12, 0, 0, 0);
        if (scheduleTime > now) {
          notificationsToSchedule.push({
            id: idCounter++,
            title: "Meetings Scheduled Tomorrow",
            body: `Reminder: You have ${tomorrowsMeets.length} meeting(s) scheduled for tomorrow.`,
            schedule: { at: scheduleTime },
            extra: { tab: "schedule" },
          });
        }
      }

      // 3. Pending materials for any project -> Daily at 2:00 PM (One notification per project for direct routing)
      const projectsWithPendingMaterials = projects.filter((p) =>
        !p.isTrashed && p.materials?.some((m) => !m.completed)
      );
      projectsWithPendingMaterials.forEach((p) => {
        let scheduleTime = new Date();
        scheduleTime.setHours(14, 0, 0, 0);
        if (scheduleTime <= now) {
          scheduleTime.setDate(scheduleTime.getDate() + 1);
        }

        const pendingCount =
          p.materials?.filter((m) => !m.completed).length || 0;
        notificationsToSchedule.push({
          id: idCounter++,
          title: `Pending Materials: ${p.name}`,
          body: `You have ${pendingCount} material(s) pending updates. Tap to view.`,
          schedule: { at: scheduleTime },
          extra: { projectId: p.id, tab: "materials" },
        });
      });

      if (notificationsToSchedule.length > 0) {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule,
        });
      }
    } catch (err) {
      console.warn("Failed to schedule local notifications:", err);
    }
  };

  useEffect(() => {
    rescheduleNotifications();
  }, [projects, schedule]);

  // Save local project backup (retaining recent edits and 30 days of daily snapshots)
  const saveProjectBackup = (currentProjects) => {
    if (!currentProjects || currentProjects.length === 0) return;
    try {
      const now = new Date();
      const todayDateStr = now.toISOString().split("T")[0];

      // --- 1. RECENT BACKUPS (Short-term, last 5 edits with 5-minute cooldown) ---
      const savedRecentRaw = localStorage.getItem("ipm_projects_backups_recent");
      const recentBackups = savedRecentRaw ? JSON.parse(savedRecentRaw) : [];
      const lastRecent = recentBackups[0];

      let updatedRecent = [...recentBackups];

      if (!lastRecent || JSON.stringify(lastRecent.projects) !== JSON.stringify(currentProjects)) {
        if (lastRecent && (now - new Date(lastRecent.timestamp)) < 5 * 60 * 1000) {
          lastRecent.projects = currentProjects;
          lastRecent.timestamp = now.toISOString();
          updatedRecent = [...recentBackups];
        } else {
          updatedRecent = [{ timestamp: now.toISOString(), projects: currentProjects }, ...recentBackups].slice(0, 5);
        }
        localStorage.setItem("ipm_projects_backups_recent", JSON.stringify(updatedRecent));
      }

      // --- 2. DAILY BACKUPS (Long-term, one per day, keeps last 30 days) ---
      const savedDailyRaw = localStorage.getItem("ipm_projects_backups_daily");
      const dailyBackups = savedDailyRaw ? JSON.parse(savedDailyRaw) : [];
      const existingDailyIndex = dailyBackups.findIndex(b => b.date === todayDateStr);

      let updatedDaily = [...dailyBackups];
      if (existingDailyIndex !== -1) {
        dailyBackups[existingDailyIndex].projects = currentProjects;
        dailyBackups[existingDailyIndex].timestamp = now.toISOString();
        updatedDaily = [...dailyBackups];
      } else {
        const newDaily = {
          date: todayDateStr,
          timestamp: now.toISOString(),
          projects: currentProjects
        };
        updatedDaily = [newDaily, ...dailyBackups].slice(0, 30);
      }
      localStorage.setItem("ipm_projects_backups_daily", JSON.stringify(updatedDaily));

      // --- 3. CLOUD BACKUPS SYNC & RETENTION (Saves to cloud, retains last 30 days) ---
      if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail) {
        const cleanEmail = userEmail.toLowerCase().trim();
        const backupDocRef = doc(db, "users", cleanEmail, "backups", todayDateStr);

        setDoc(backupDocRef, {
          date: todayDateStr,
          timestamp: now.toISOString(),
          projects: currentProjects
        }, { merge: true }).then(() => {
          // Fetch backups list to enforce 30-day retention
          const backupsColRef = collection(db, "users", cleanEmail, "backups");
          getDocs(backupsColRef).then((querySnapshot) => {
            const backupsList = [];
            querySnapshot.forEach((docSnap) => {
              backupsList.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort lexicographically by date descending (latest first)
            backupsList.sort((a, b) => b.date.localeCompare(a.date));

            // Delete backups beyond the 30th latest daily snapshot
            if (backupsList.length > 30) {
              const oldBackups = backupsList.slice(30);
              oldBackups.forEach((old) => {
                deleteDoc(doc(db, "users", cleanEmail, "backups", old.id))
                  .catch((e) => console.error("Error deleting old backup:", e));
              });
            }
          }).catch((err) => console.error("Error retrieving backups list for retention check:", err));
        }).catch((err) => console.error("Error uploading daily backup to Firestore:", err));
      }
    } catch (err) {
      console.error("Failed to save project backup:", err);
    }
  };

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem("ipm_projects", JSON.stringify(projects));
    saveProjectBackup(projects);
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(deletedProjectIds));
  }, [deletedProjectIds]);

  useEffect(() => {
    localStorage.setItem("ipm_schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("ipm_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark-theme");
    } else {
      root.classList.remove("dark-theme");
    }
  }, [theme]);

  // --- ACTIVE PROJECTS FILTERING ---
  const activeProjects = projects.filter(p => !p.isTrashed);

  // --- STATS CALCULATION ---
  const ongoingProjectsCount = activeProjects.filter(
    (p) => p.status === "ongoing"
  ).length;
  const notStartedProjectsCount = activeProjects.filter(
    (p) => p.status === "not-started"
  ).length;
  const completedProjectsCount = activeProjects.filter(
    (p) => p.status === "completed"
  ).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const todayMeetings = schedule.filter((s) => s.date === todayStr);
  const tomorrowMeetings = schedule.filter((s) => s.date === tomorrowStr);

  const todayMeetingsCount = todayMeetings.filter((s) => !s.completed).length;
  const tomorrowMeetingsCount = tomorrowMeetings.filter(
    (s) => !s.completed
  ).length;

  const totalTasksCompleted = activeProjects.reduce(
    (acc, p) => acc + (p.tasks?.filter((t) => t.completed).length || 0),
    0
  );
  // eslint-disable-next-line no-unused-vars
  const totalMaterialsOrdered = activeProjects.reduce(
    (acc, p) => acc + (p.materials?.length || 0),
    0
  );

  // --- SORTED AND FILTERED MEETINGS ---
  const sortedAndFilteredMeetings = [...schedule]
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
    .filter((s) => {
      const dateMatch =
        !selectedCalendarDate || s.date === selectedCalendarDate;
      return dateMatch;
    });

  // --- FILTERED LISTS ---
  const filteredProjects = activeProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  // Add Project
  const getDaysLeftTextAndColor = (project) => {
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

  const formatDisplayDateStr = (dateStr) => {
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

  // Priority weight logic for sorting
  const getPriorityWeight = (priority) => {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  };

  const activeProject = activeProjects.find((p) => p.id === activeProjectId);

  const {
    generatePDFReport,
    handleGenerateRoomPDF,
    generateAllProjectsPDF,
    generateSingleProjectPDF,
    handleEmailReportManually,
    handleSendManualBackup,
    handleDownloadPDF,
    handleSharePDF
  } = usePdfGenerator({ activeProject, reportPreview, setReportPreview, db, isAuthorized, userEmail, emailJsServiceId: import.meta.env.VITE_EMAILJS_SERVICE_ID, projects, formatDisplayDateStr, getDaysLeftTextAndColor, getPriorityWeight });

  const {
    handleShareMaterials,
    handleShareTasks,
    handleShareProjectOverview,
    handleShareRoom
  } = useSharing({ activeProject, formatDisplayDateStr, getDaysLeftTextAndColor });

  const {
    scheduleAllUpcomingMeetings,
    scheduleTime
  } = useNotifications({ schedule, projects });

  const {
    handleAddMaterial,
    handleToggleMaterial,
    handleDeleteMaterial,
    handleClearCompletedMaterials,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleClearCompletedTasks,
    handleTaskDragStart,
    handleTaskDragOver,
    handleTaskDrop,
    handleSaveEdit
  } = useProjectItems({ newMaterialInput, activeProjectId, setProjects, projects, activeRoomId, setNewMaterialInput, activeProject, setCustomConfirm, newWorkInput, newTaskPriority, setNewWorkInput, setNewTaskPriority, setDraggedTaskId, draggedTaskId, editItemModal, schedule, setSchedule, setMaterialCatalog, materialCatalog, setEditItemModal });


  // --- HANDLERS ---
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };



  // Add Material inline
  

  // Toggle Material Complete
  

  // Delete Material
  

  // Add Task inline
  

  // Toggle Task Complete
  

  // Delete Task
  

  // Clear Completed Materials
  

  // Clear Completed Tasks
  

  // Drag and drop handlers for tasks
  

  

  

  // Add Meeting
  


  // WhatsApp Sharing Logic
  

  

  

  // PDF Report Generator Function (opens inside an in-app sheet modal to prevent mobile freezes)
  

  

  

  // --- EMAIL UTILITIES AND AUTOMATED REPORT SYNC ---

  // Helper to generate a PDF of ALL active projects (used for automatic backup emails)
  

  // Shared helper to generate a PDF for a single project report
  

  // Main Email sender helper (Supports Google Apps Script or EmailJS fallback)
  const sendEmailWithAttachment = async (recipient, subject, bodyMessage, pdfDoc, attachmentName = "weaverbird_report.pdf") => {
    const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || googleScriptUrl;

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
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || emailJsPublicKey;

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

  // Helper to send a project report manually
  

  // Trigger manual full studio backup report
  

  // Auto-backup scheduler checks and triggers the 3-day backup email
  const checkAndTriggerAutoEmail = async (currentProjects, cleanEmail) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || emailJsTemplateId;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || emailJsPublicKey;

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

  // Local PDF File Download/Write handler for phones and web browsers
  

  // Natively share the generated PDF file directly without downloading/saving it first
  

  // Center Navbar Add Click Handler
  const handleNavbarAddClick = () => {
    if (currentTab === "schedule") {
      setIsNewMeetingModalOpen(true);
    } else if (currentTab === "projects" && activeProjectId !== null && activeRoomId === null) {
      handleAddRoomToExistingProject();
    } else {
      setIsNewProjModalOpen(true);
    }
  };

  return (
    <div className="desktop-wrapper">
      <div className="phone-frame">
        {/* Notch simulator */}
        <div className="phone-notch">
          <div className="phone-camera"></div>
          <div className="phone-speaker"></div>
        </div>

        {/* App Container */}
        <div
          id="app-root"
          className={`app-container ${theme === "dark" ? "dark-theme" : ""}`}
        >
          {cloudSyncEnabled && !userEmail ? (
            <CloudSyncLogin
              setUserEmail={setUserEmail}
              isConnectingCloud={isConnectingCloud}
              setIsConnectingCloud={setIsConnectingCloud}
              setCloudSyncEnabled={setCloudSyncEnabled}
              setIsAuthorized={setIsAuthorized}
            />
          ) : !isAuthorized ? (
            <UnauthorizedScreen
               userEmail={userEmail}
               setUserEmail={setUserEmail}
               setCloudSyncEnabled={setCloudSyncEnabled}
               setIsAuthorized={setIsAuthorized}
             />
          ) : (
            <>
              {/* Simulated Status Bar (standard iOS/Android mockup) */}
              <div className="simulated-status-bar">
                <span>12:30 PM</span>
                <div className="status-bar-icons">
                  <span style={{ fontSize: "10px" }}>5G</span>
                  <div
                    style={{
                      width: "18px",
                      height: "10px",
                      border: "1px solid currentColor",
                      borderRadius: "2px",
                      display: "flex",
                      padding: "1px",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: "currentColor",
                        borderRadius: "1px",
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* MAIN TAB SWITCHER */}

              {/* TAB 1: PROJECTS */}
              {currentTab === "projects" && (
                <>
                  {isCatalogScreenOpen && userRole === "admin" ? (
                    <MaterialsCatalog
                       setIsCatalogScreenOpen={setIsCatalogScreenOpen}
                       materialCatalog={materialCatalog}
                       handleAddCatalogItem={handleAddCatalogItem}
                       setEditItemModal={setEditItemModal}
                       handleDeleteCatalogItem={handleDeleteCatalogItem}
                     />
                  ) : activeProjectId === null ? (
                    <>
                      <ProjectsList 
                        isNetworkOnline={isNetworkOnline}
                        cloudSyncEnabled={cloudSyncEnabled}
                        userRole={userRole}
                        setIsCatalogScreenOpen={setIsCatalogScreenOpen}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filteredProjects={filteredProjects}
                        setActiveProjectId={setActiveProjectId}
                        setProjectSubTab={setProjectSubTab}
                        handleDeleteProject={handleDeleteProject}
                      />
                    </>
                  ) : (
                    <>
                      <ProjectDetail 
                        setActiveProjectId={setActiveProjectId}
                        activeProject={activeProject}
                        getDaysLeftTextAndColor={getDaysLeftTextAndColor}
                        formatDisplayDateStr={formatDisplayDateStr}
                        handleShareProjectOverview={handleShareProjectOverview}
                        generatePDFReport={generatePDFReport}
                        setEditItemModal={setEditItemModal}
                        activeRoomId={activeRoomId}
                        setActiveRoomId={setActiveRoomId}
                        openRoomMenuId={openRoomMenuId}
                        setOpenRoomMenuId={setOpenRoomMenuId}
                        handleEditRoom={handleEditRoom}
                        handleDeleteRoom={handleDeleteRoom}
                        handleShareRoom={handleShareRoom}
                        handleGenerateRoomPDF={handleGenerateRoomPDF}
                        projectSubTab={projectSubTab}
                        setProjectSubTab={setProjectSubTab}
                        handleShareMaterials={handleShareMaterials}
                        handleAddMaterial={handleAddMaterial}
                        newMaterialInput={newMaterialInput}
                        setNewMaterialInput={setNewMaterialInput}
                        handleToggleMaterial={handleToggleMaterial}
                        handleDeleteMaterial={handleDeleteMaterial}
                        setMaterialsCollapsed={setMaterialsCollapsed}
                        materialsCollapsed={materialsCollapsed}
                        handleClearCompletedMaterials={handleClearCompletedMaterials}
                        handleShareTasks={handleShareTasks}
                        handleAddTask={handleAddTask}
                        newWorkInput={newWorkInput}
                        setNewWorkInput={setNewWorkInput}
                        newTaskPriority={newTaskPriority}
                        setNewTaskPriority={setNewTaskPriority}
                        getPriorityWeight={getPriorityWeight}
                        draggedTaskId={draggedTaskId}
                        handleTaskDragStart={handleTaskDragStart}
                        handleTaskDragOver={handleTaskDragOver}
                        handleTaskDrop={handleTaskDrop}
                        handleToggleTask={handleToggleTask}
                        handleDeleteTask={handleDeleteTask}
                        setTasksCollapsed={setTasksCollapsed}
                        tasksCollapsed={tasksCollapsed}
                        handleClearCompletedTasks={handleClearCompletedTasks}
                      />
                    </>
                  )}
                </>
              )}

              {/* TAB 3: SCHEDULE (Screen 4 Details) */}
              {currentTab === "schedule" && (
                <>
                  <div className="app-header fade-in">
                    <div className="header-left">
                      <div className="header-title-container">
                        <span className="header-subtitle">WeaverBird</span>
                        <h1>Meetings</h1>
                      </div>
                    </div>
                    <div className="header-right">
                      <button
                        className="icon-btn todo-header-btn"
                        onClick={() => setIsTodoScreenOpen(true)}
                        aria-label="Open To-Do List"
                        title="To-Do List"
                      >
                        <CheckSquare size={20} />
                        {todos.filter((t) => !t.completed).length > 0 && (
                          <span className="todo-badge">
                            {todos.filter((t) => !t.completed).length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ===== TODO FULL SCREEN OVERLAY ===== */}
                  {isTodoScreenOpen && (
                <TodoView
                  setIsTodoScreenOpen={setIsTodoScreenOpen}
                  todos={todos}
                  setTodos={setTodos}
                  newTodoInput={newTodoInput}
                  setNewTodoInput={setNewTodoInput}
                  editTodoId={editTodoId}
                  setEditTodoId={setEditTodoId}
                  editTodoText={editTodoText}
                  setEditTodoText={setEditTodoText}
                />
              )}

                  {/* Unified meetings list */}

                  {!isTodoScreenOpen && (
                    <div
                      className="screen-content fade-in"
                      style={{ paddingTop: "12px" }}
                    >

                      {/* Schedule Stats Card (Hero) */}
                      <div className="schedule-hero" style={{ padding: "16px 20px" }}>
                        <div className="schedule-stats-row">
                          <div className="schedule-stat-card">
                            <div className="schedule-stat-title">Scheduled Today</div>
                            <div className="schedule-stat-number">
                              {todayMeetingsCount}
                            </div>
                          </div>
                          <div className="schedule-stat-card">
                            <div className="schedule-stat-title">
                              Scheduled Tomorrow
                            </div>
                            <div className="schedule-stat-number">
                              {tomorrowMeetingsCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Collapsible Calendar Header */}
                      <div
                        className="collapsible-header"
                        onClick={() => setCalendarCollapsed(!calendarCollapsed)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          className="collapsible-title"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Calendar
                            size={18}
                            style={{ color: "var(--accent-gold-dark)" }}
                          />
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "700",
                              color: "var(--text-title)",
                            }}
                          >
                            Meetings Calendar{" "}
                            {selectedCalendarDate &&
                              `(${formatDate(selectedCalendarDate)})`}
                          </span>
                        </div>
                        {calendarCollapsed ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronUp size={18} />
                        )}
                      </div>

                      {/* Monthly Calendar View */}
                      {!calendarCollapsed && (
                        <div
                          className="calendar-card"
                          style={{ marginTop: "-4px", marginBottom: "16px" }}
                        >
                          <div
                            className="calendar-header"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={handlePrevMonth}
                                style={{ padding: "4px" }}
                                aria-label="Previous Month"
                              >
                                <ChevronLeft size={18} />
                              </button>
                              <h3
                                style={{
                                  margin: 0,
                                  minWidth: "120px",
                                  textAlign: "center",
                                }}
                              >
                                {currentCalendarDate.toLocaleString("default", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </h3>
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={handleNextMonth}
                                style={{ padding: "4px" }}
                                aria-label="Next Month"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </div>
                            {selectedCalendarDate && (
                              <button
                                className="calendar-clear-btn"
                                onClick={() => setSelectedCalendarDate(null)}
                              >
                                Show All
                              </button>
                            )}
                          </div>
                          <div className="calendar-weekdays">
                            <span>S</span>
                            <span>M</span>
                            <span>T</span>
                            <span>W</span>
                            <span>T</span>
                            <span>F</span>
                            <span>S</span>
                          </div>
                          <div className="calendar-grid">
                            {getDaysInMonth().map((dayStr, idx) => {
                              if (!dayStr) {
                                return (
                                  <div
                                    key={`empty-${idx}`}
                                    className="calendar-day empty"
                                  ></div>
                                );
                              }

                              const dayNum = parseInt(dayStr.split("-")[2], 10);
                              const hasMeetings = schedule.some(
                                (s) => s.date === dayStr && !s.completed
                              );
                              const isSelected = selectedCalendarDate === dayStr;

                              return (
                                <div
                                  key={dayStr}
                                  className={`calendar-day ${hasMeetings ? "has-meetings" : ""
                                    } ${isSelected ? "selected" : ""}`}
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedCalendarDate(null);
                                    } else {
                                      setSelectedCalendarDate(dayStr);
                                    }
                                  }}
                                >
                                  <span className="day-number">{dayNum}</span>
                                  {hasMeetings && <span className="day-dot"></span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Schedule Lists */}
                      <div className="list-section-card">
                        <div
                          className="list-columns-subheader"
                          style={{ gridTemplateColumns: "46px 1fr 70px" }}
                        >
                          <span>Done</span>
                          <span>Sync Info</span>
                          <span className="text-right">Actions</span>
                        </div>

                        <div>
                          {sortedAndFilteredMeetings.length > 0 ? (
                            sortedAndFilteredMeetings.map((meet) => (
                              <div
                                key={meet.id}
                                className="list-item-row"
                                style={{ gridTemplateColumns: "46px 1fr 70px" }}
                              >
                                <label className="checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={meet.completed}
                                    onChange={() => handleToggleMeeting(meet.id)}
                                  />
                                  <span className="checkmark"></span>
                                </label>

                                <div className="schedule-item-info">
                                  <span
                                    className={`schedule-item-title ${meet.completed ? "completed" : ""
                                      }`}
                                  >
                                    {meet.title}
                                  </span>
                                  <span className="schedule-item-time">
                                    {formatDate(meet.date)}
                                  </span>
                                </div>

                                <div className="item-actions">
                                  <button
                                    className="action-icon-btn"
                                    onClick={() =>
                                      setEditItemModal({
                                        type: "meeting",
                                        itemId: meet.id,
                                        name: meet.title,
                                        date: meet.date,
                                      })
                                    }
                                    aria-label="Edit Meeting"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => handleDeleteMeeting(meet.id)}
                                    aria-label="Delete Meeting"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "30px 20px",
                                color: "var(--text-muted)",
                                fontSize: "13px",
                              }}
                            >
                              No meetings scheduled.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No FAB here, handled in bottom-nav */}
                </>
              )}

              {/* TAB 4: PROFILE & SETTINGS */}
              {currentTab === "profile" && (
                <AdminPanel 
                  userEmail={userEmail}
                  setUserEmail={setUserEmail}
                  userRole={userRole}
                  setUserRole={setUserRole}
                  authorizedUsers={authorizedUsers}
                  cloudSyncEnabled={cloudSyncEnabled}
                  setCloudSyncEnabled={setCloudSyncEnabled}
                  setIsAuthorized={setIsAuthorized}
                  theme={theme}
                  toggleTheme={toggleTheme}
                  WEB_APP_VERSION={WEB_APP_VERSION}
                  updateDebugInfo={updateDebugInfo}
                  checkUpdate={checkUpdate}
                  emailJsServiceId={emailJsServiceId}
                  setEmailJsServiceId={setEmailJsServiceId}
                  emailJsTemplateId={emailJsTemplateId}
                  setEmailJsTemplateId={setEmailJsTemplateId}
                  emailJsPublicKey={emailJsPublicKey}
                  setEmailJsPublicKey={setEmailJsPublicKey}
                  googleScriptUrl={googleScriptUrl}
                  setGoogleScriptUrl={setGoogleScriptUrl}
                  recipientEmail={recipientEmail}
                  setRecipientEmail={setRecipientEmail}
                  backupRecipients={backupRecipients}
                  setBackupRecipients={setBackupRecipients}
                  lastEmailBackupDate={lastEmailBackupDate}
                  isSendingEmail={isSendingEmail}
                  handleEmailReportManually={handleEmailReportManually}
                  handleSendManualBackup={handleSendManualBackup}
                  newRecipientInput={newRecipientInput}
                  setNewRecipientInput={setNewRecipientInput}
                  isAdminPanelOpen={isAdminPanelOpen}
                  setIsAdminPanelOpen={setIsAdminPanelOpen}
                  db={db}
                  isConfigured={isConfigured}
                  setHasLoadedProjectsFromCloud={setHasLoadedProjectsFromCloud}
                  setHasLoadedScheduleFromCloud={setHasLoadedScheduleFromCloud}
                  isAuthorized={isAuthorized}
                  setIsTrashBinOpen={setIsTrashBinOpen}
                  projects={projects}
                  setIsBackupsListOpen={setIsBackupsListOpen}
                  setIsEmailReportsOpen={setIsEmailReportsOpen}
                  isEmailReportsOpen={isEmailReportsOpen}
                  customRecipientEmail={customRecipientEmail}
                  setCustomRecipientEmail={setCustomRecipientEmail}
                />
              )}

              {/* PERSISTENT BOTTOM NAVIGATION BAR */}
              {!isKeyboardVisible && (
                <div className="bottom-nav">
                  <button
                    className={`nav-tab ${currentTab === "projects" ? "active" : ""}`}
                    onClick={() => {
                      setCurrentTab("projects");
                      setActiveProjectId(null); // Return to project dashboard list
                      setIsCatalogScreenOpen(false); // Close catalog screen on tab click
                    }}
                  >
                    <div className="nav-icon-wrapper">
                      <Folder size={20} />
                    </div>
                    <span className="nav-label">Projects</span>
                  </button>

                  <button
                    className={`nav-tab ${currentTab === "schedule" ? "active" : ""}`}
                    onClick={() => setCurrentTab("schedule")}
                  >
                    <div className="nav-icon-wrapper">
                      <Calendar size={20} />
                    </div>
                    <span className="nav-label">Schedule</span>
                  </button>

                  {/* Center Hump with + Button */}
                  <div
                    className="nav-hump-container"
                    style={{ 
                      visibility: (
                        currentTab === "profile" || 
                        (currentTab === "projects" && activeProjectId !== null && activeRoomId !== null)
                      ) ? "hidden" : "visible" 
                    }}
                  >
                    <div className="nav-hump"></div>
                    <button
                      type="button"
                      className="nav-add-btn"
                      onClick={handleNavbarAddClick}
                      aria-label="Add Item"
                    >
                      <Plus size={24} />
                    </button>
                  </div>

                  <button
                    className={`nav-tab ${currentTab === "profile" ? "active" : ""}`}
                    onClick={() => setCurrentTab("profile")}
                  >
                    <div className="nav-icon-wrapper">
                      <User size={20} />
                    </div>
                    <span className="nav-label">Profile</span>
                  </button>
                </div>
              )}

              {/* --- MODALS --- */}
              <CommonModals 
                reportPreview={reportPreview}
                setReportPreview={setReportPreview}
                formatDisplayDateStr={formatDisplayDateStr}
                handleDownloadPDF={handleDownloadPDF}
                handleSharePDF={handleSharePDF}
                recipientEmail={recipientEmail}
                setRecipientEmail={setRecipientEmail}
                userEmail={userEmail}
                backupRecipients={backupRecipients}
                authorizedUsers={authorizedUsers}
                handleEmailReportManually={handleEmailReportManually}
                isSendingEmail={isSendingEmail}
                customRecipientEmail={customRecipientEmail}
                setCustomRecipientEmail={setCustomRecipientEmail}
                emailJsServiceId={emailJsServiceId}
                isTrashBinOpen={isTrashBinOpen}
                setIsTrashBinOpen={setIsTrashBinOpen}
                projects={projects}
                userRole={userRole}
                setCustomConfirm={setCustomConfirm}
                setProjects={setProjects}
                setDeletedProjectIds={setDeletedProjectIds}
                isBackupsListOpen={isBackupsListOpen}
                setIsBackupsListOpen={setIsBackupsListOpen}
                isRemoteChange={isRemoteChange}
                deletedProjectIds={deletedProjectIds}
                syncProjectToCloud={syncProjectToCloud}
                isConfigured={isConfigured}
                db={db}
                cloudSyncEnabled={cloudSyncEnabled}
                isAuthorized={isAuthorized}
                deleteDoc={deleteDoc}
                doc={doc}
                deleteProjectFromCloud={deleteProjectFromCloud}
                isNewProjModalOpen={isNewProjModalOpen}
                setIsNewProjModalOpen={setIsNewProjModalOpen}
                handleAddProject={handleAddProject}
                isNewMeetingModalOpen={isNewMeetingModalOpen}
                setIsNewMeetingModalOpen={setIsNewMeetingModalOpen}
                handleAddMeeting={handleAddMeeting}
                newMeetTitle={newMeetTitle}
                setNewMeetTitle={setNewMeetTitle}
                newMeetDate={newMeetDate}
                setNewMeetDate={setNewMeetDate}
                editItemModal={editItemModal}
                setEditItemModal={setEditItemModal}
                handleSaveEdit={handleSaveEdit}
                customConfirm={customConfirm}
              />

            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

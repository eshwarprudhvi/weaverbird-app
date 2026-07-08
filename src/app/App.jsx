import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "../contexts/WorkspaceContext";
import WorkspaceInvitationsModal from "../components/account/modals/WorkspaceInvitationsModal";
import { usePdfGenerator } from "../hooks/usePdfGenerator";
import { useSharing } from "../hooks/useSharing";
import { useNotifications } from "../hooks/useNotifications";
import { useProjectItems } from "../hooks/useProjectItems";
import { useProjects } from "../hooks/useProjects";
import { useMeetings } from "../hooks/useMeetings";
import { useTodos } from "../hooks/useTodos";
import { useCatalog } from "../hooks/useCatalog";
import { useCloudSync } from "../hooks/useCloudSync";
import UnauthorizedScreen from "../components/auth/UnauthorizedScreen";
import { useAuth } from "../hooks/useAuth";
import { failedWorkspaceIds } from "../contexts/AuthContext";
import AuthRouter from "../components/auth/AuthRouter";
import { WorkspaceProvider } from "../contexts/WorkspaceContext";
import { APPLICATION } from "../config/application";
import MaterialsCatalog from "../components/views/MaterialsCatalog";
import AccountPage from "../pages/Account/AccountPage";
import TodoView from "../components/views/TodoView";
import MeetingsView from "../components/views/MeetingsView";
import ProjectsList from "../components/views/ProjectsList";
import ProjectDetail from "../components/views/ProjectDetail";
import CommonModals from "../components/views/CommonModals";
import AppHeader from "../components/common/AppHeader";
import LocalSyncDecisionModal from "../components/account/modals/LocalSyncDecisionModal";


import { LocalNotifications } from "@capacitor/local-notifications";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Share } from "@capacitor/share";
import { db, isConfigured } from "../firebase";
import AddProjectModal from "../components/modals/AddProjectModal";
import AddMeetingModal from "../components/modals/AddMeetingModal";
import ReportPreviewModal from "../components/modals/ReportPreviewModal";
import BottomNav from "../components/navigation/BottomNav";
import { collection, onSnapshot, getDocs, getDoc, setDoc, serverTimestamp, doc, query, where } from "firebase/firestore";
import { createProject } from "../api/project.api";
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

const WEB_APP_VERSION = "1.1.11";



// Default initial data to populate localStorage if empty
const INITIAL_PROJECTS = []

const INITIAL_SCHEDULE = [];

function AuthenticatedApp() {
  const { user, isLocalMode, workspaceConnectionState, isNetworkOnline } = useAuth();
  const { workspace } = useWorkspace();
  const companyName = workspace?.companyName || "My Workspace";
  const companySubtitle = workspace?.companySubtitle || "Interior Studio";

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
    handleProjectStatusChange,
    retrySync
  } = useProjects(activeProjectId, setActiveProjectId, setCustomConfirm, setIsNewProjModalOpen, setEditItemModal);

  const {
    meetings,
    setMeetings,
    handleAddMeeting,
    handleToggleMeeting,
    handleDeleteMeeting
  } = useMeetings(setIsNewMeetingModalOpen);
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

        if (latestVersion && latestVersion !== WEB_APP_VERSION) {
          setUpdateDebugInfo(prev => ({ ...prev, status: `Downloading v${latestVersion}...` }));
          console.log(`OTA Update available: local v${WEB_APP_VERSION} -> latest v${latestVersion}`);

          if (!Capacitor.isNativePlatform()) {
            if (isManual || window.confirm(`A new version (v${latestVersion}) is available! Refresh the web app to update now?`)) {
              window.location.reload();
            }
          } else if (zipUrl) {
            alert(`Installing ${companyName} update v${latestVersion}. The app will restart automatically.`);
            const downloadResult = await CapacitorUpdater.download({
              url: zipUrl,
              version: latestVersion
            });
            setUpdateDebugInfo(prev => ({ ...prev, status: "Applying update..." }));
            await CapacitorUpdater.set(downloadResult);
          } else if (isManual) {
            alert(`New version v${latestVersion} is available, but OTA bundle URL is missing.`);
          }
        } else {
          setUpdateDebugInfo(prev => ({ ...prev, status: "Already up to date" }));
          if (isManual) alert(`App is already up to date! (v${WEB_APP_VERSION})`);
        }
      } else {
        setUpdateDebugInfo(prev => ({ ...prev, status: "Already up to date" }));
        if (isManual) alert(`App is up to date! (v${WEB_APP_VERSION})`);
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
        // Only run reset once per APK install to avoid infinite webview reload loops on Android
        const otaKey = 'app_ota_bundle_cleared_v10';
        if (!localStorage.getItem(otaKey)) {
          localStorage.setItem(otaKey, 'true');
          CapacitorUpdater.reset().catch(() => {});
        }
      } catch (err) {
        console.warn("CapacitorUpdater notifyAppReady/reset failed:", err);
      }

      // Disabled automatic OTA check on startup as requested ("dont give any update to ota and all")
      // const timer = setTimeout(() => checkUpdate(false), 5000);
      // return () => clearTimeout(timer);
    } else {
      setUpdateDebugInfo(prev => ({ ...prev, status: "Not native platform" }));
    }
  }, []);




  // Project detail sub-tabs: 'materials' or 'work'

  // Filtering and Searching

  // Collapsible lists

  // Meetings sub-tabs: 'incomplete' | 'completed'
  const [meetingsSubTab, setMeetingsSubTab] = useState("incomplete");
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(
    () => new Date()
  );
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);

  // Todo list state (using hook)
  const {
    todos,
    setTodos,
    handleAddTodo,
    handleToggleTodo,
    handleEditTodo,
    handleDeleteTodo
  } = useTodos();

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
    return localStorage.getItem(APPLICATION.storageKeys.cloudSync) === "true";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return user?.email || localStorage.getItem(APPLICATION.storageKeys.userEmail) || "";
  });
  const [userRole, setUserRole] = useState(() => {
    return user?.role || localStorage.getItem(APPLICATION.storageKeys.userRole) || "editor";
  });
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return localStorage.getItem("weaverbird_user_authorized") !== "false";
  });

  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
      setCloudSyncEnabled(true);
    } else if (isLocalMode) {
      setCloudSyncEnabled(false);
    }
  }, [user, isLocalMode]);
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const isRemoteChange = useRef(false);
  const prevProjectsRef = useRef([]);
  const [isConnectingCloud, setIsConnectingCloud] = useState(false);
  const {
    hasLoadedProjectsFromCloud,
    setHasLoadedProjectsFromCloud,
    hasLoadedScheduleFromCloud: hasLoadedMeetingsFromCloud,
    setHasLoadedScheduleFromCloud: setHasLoadedMeetingsFromCloud,
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
    setUserRole,
    setAuthorizedUsers,
    projects,
    setProjects,
    deletedProjectIds,
    schedule: meetings,
    setSchedule: setMeetings,
    todos,
    setTodos,
    materialCatalog,
    setMaterialCatalog,
    prevProjectsRef
  });

  // --- Structured Authentication Success & Local Sync Flow ---
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [hasCheckedLocalSync, setHasCheckedLocalSync] = useState(false);
  const [pendingLocalProjects, setPendingLocalProjects] = useState([]);

  useEffect(() => {
    // Sequence: Authentication Successful -> Workspace Loading -> Workspace Ready -> Local Projects Found? -> YES -> LocalSyncDecisionModal
    if (!isLocalMode && user && !hasCheckedLocalSync && projects && projects.length > 0) {
      const localProjs = projects.filter(p => p.syncState === "LOCAL" || (p.syncState !== "SYNCED" && p.syncState !== "PENDING"));
      if (localProjs.length > 0) {
        setPendingLocalProjects(localProjs);
        setIsSyncModalOpen(true);
        setHasCheckedLocalSync(true);
      }
    }
  }, [isLocalMode, user, hasCheckedLocalSync, projects]);

  const handleLocalSyncDecision = async (strategy, selectedIds = []) => {
    setIsSyncModalOpen(false);
    const targetProjects = pendingLocalProjects.length > 0 ? pendingLocalProjects : projects.filter(p => p.syncState === "LOCAL" || (p.syncState !== "SYNCED" && p.syncState !== "PENDING"));
    setPendingLocalProjects([]);

    if (strategy === "UPLOAD_ALL") {
      const updated = projects.map(p => {
        if (targetProjects.some(tp => tp.id === p.id) || p.syncState === "LOCAL" || (p.syncState !== "SYNCED" && p.syncState !== "PENDING")) {
          const updatedProj = { ...p, syncState: "PENDING" };
          setTimeout(() => syncProjectToCloud(updatedProj), 100);
          return updatedProj;
        }
        return p;
      });
      setProjects(updated);
    } else if (strategy === "CHOOSE") {
      const updated = projects.map(p => {
        if (selectedIds.includes(p.id)) {
          const updatedProj = { ...p, syncState: "PENDING" };
          setTimeout(() => syncProjectToCloud(updatedProj), 100);
          return updatedProj;
        } else if (targetProjects.some(tp => tp.id === p.id) && p.syncState !== "SYNCED") {
          return { ...p, syncState: "LOCAL" };
        }
        return p;
      });
      setProjects(updated);
    } else if (strategy === "KEEP_LOCAL") {
      const updated = projects.map(p => {
        if (targetProjects.some(tp => tp.id === p.id) && p.syncState !== "SYNCED") {
          return { ...p, syncState: "LOCAL" };
        }
        return p;
      });
      setProjects(updated);
    }
  };

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
      const todaysMeets = meetings.filter(
        (s) => s.date === todayDateStr && !s.completed
      );
      if (todaysMeets.length > 0) {
        // Notification scheduling handled by useNotifications hook
      }

      // 2. Tomorrow's meetings -> Today at 12:00 PM (noon)
      const tomorrowsMeets = meetings.filter(
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
  }, [projects, meetings]);

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
      // This has been deprecated. The backend Report domain now handles Workspace backups automatically via the REST API.
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
    localStorage.setItem("ipm_schedule", JSON.stringify(meetings));
  }, [meetings]);

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

  const todayMeetings = meetings.filter((s) => s.date === todayStr);
  const tomorrowMeetings = meetings.filter((s) => s.date === tomorrowStr);

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
  const sortedAndFilteredMeetings = [...meetings]
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
  } = usePdfGenerator({ activeProject, reportPreview, setReportPreview, db, isAuthorized, userEmail, recipientEmail, customRecipientEmail, googleScriptUrl, emailJsServiceId, emailJsTemplateId, emailJsPublicKey, setIsSendingEmail, projects, companyName, companySubtitle, formatDisplayDateStr, getDaysLeftTextAndColor, getPriorityWeight });

  const {
    handleShareMaterials,
    handleShareTasks,
    handleShareProjectOverview,
    handleShareRoom
  } = useSharing({ activeProject, companyName, companySubtitle, formatDisplayDateStr, getDaysLeftTextAndColor, getPriorityWeight });

  const {
    scheduleAllUpcomingMeetings,
    scheduleTime
  } = useNotifications(companyName);

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
  } = useProjectItems({ newMaterialInput, activeProjectId, setProjects, projects, activeRoomId, setNewMaterialInput, activeProject, setCustomConfirm, newWorkInput, newTaskPriority, setNewWorkInput, setNewTaskPriority, setDraggedTaskId, draggedTaskId, editItemModal, meetings, setMeetings, setMaterialCatalog, materialCatalog, setEditItemModal });


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
          {!isAuthorized ? (
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
                  {isCatalogScreenOpen && (userRole === "admin" || userRole === "owner") ? (
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
                        companyName={companyName}
                        companySubtitle={companySubtitle}
                        isNetworkOnline={isNetworkOnline && workspaceConnectionState !== 'OFFLINE'}
                        cloudSyncEnabled={cloudSyncEnabled}
                        userRole={userRole}
                        setIsCatalogScreenOpen={setIsCatalogScreenOpen}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filteredProjects={filteredProjects}
                        setActiveProjectId={setActiveProjectId}
                        setProjectSubTab={setProjectSubTab}
                        handleDeleteProject={handleDeleteProject}
                        retrySync={retrySync}
                        createProject={createProject}
                      />
                    </>
                  ) : (
                    <>
                      <ProjectDetail
                        companyName={companyName}
                        companySubtitle={companySubtitle}
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
                <MeetingsView
                  setIsTodoScreenOpen={setIsTodoScreenOpen}
                  isTodoScreenOpen={isTodoScreenOpen}
                  todos={todos}
                  setTodos={setTodos}
                  handleAddTodo={handleAddTodo}
                  handleToggleTodo={handleToggleTodo}
                  handleEditTodo={handleEditTodo}
                  handleDeleteTodo={handleDeleteTodo}
                  todayMeetingsCount={todayMeetingsCount}
                  tomorrowMeetingsCount={tomorrowMeetingsCount}
                  setEditItemModal={setEditItemModal}
                  handleDeleteMeeting={handleDeleteMeeting}
                  handleToggleMeeting={handleToggleMeeting}
                  calendarCollapsed={calendarCollapsed}
                  setCalendarCollapsed={setCalendarCollapsed}
                  selectedCalendarDate={selectedCalendarDate}
                  setSelectedCalendarDate={setSelectedCalendarDate}
                  formatDate={formatDate}
                  currentCalendarDate={currentCalendarDate}
                  handlePrevMonth={handlePrevMonth}
                  handleNextMonth={handleNextMonth}
                  getDaysInMonth={getDaysInMonth}
                  meetings={meetings}
                  sortedAndFilteredMeetings={sortedAndFilteredMeetings}
                />
              )}

              {/* TAB 4: ACCOUNT */}
              {currentTab === "account" && (
                <AccountPage
                  companyName={companyName}
                  companySubtitle={companySubtitle}
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
                  setHasLoadedMeetingsFromCloud={setHasLoadedMeetingsFromCloud}
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
                        currentTab === "account" ||
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
                    className={`nav-tab ${currentTab === "account" ? "active" : ""}`}
                    onClick={() => setCurrentTab("account")}
                  >
                    <div className="nav-icon-wrapper">
                      <User size={24} />
                    </div>
                    <span className="nav-label">Account</span>
                  </button>
                </div>
              )}

              {/* --- MODALS --- */}
              <CommonModals
                companyName={companyName}
                companySubtitle={companySubtitle}
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

              <LocalSyncDecisionModal
                isOpen={isSyncModalOpen}
                localProjects={pendingLocalProjects.length > 0 ? pendingLocalProjects : projects.filter(p => p.syncState === "LOCAL" || (p.syncState !== "SYNCED" && p.syncState !== "PENDING"))}
                onDecision={handleLocalSyncDecision}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { WorkspaceScopeProvider, WorkspaceDiagnostics, workspaceEventBus, workspaceSessionManager } from "../application/session";
import "../application/modules";
function App() {
  const { isAuthenticated, isLocalMode, isLoading, activeWorkspaceId, user, checkPendingInvitations, switchWorkspace } = useAuth();
  const [initialAuthRoute, setInitialAuthRoute] = useState("welcome");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [inAppInvites, setInAppInvites] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  // Tracks whether the user has explicitly confirmed a workspace for this session.
  // Always false on launch so every session goes through the onboarding gate.
  const [isWorkspaceSelected, setIsWorkspaceSelected] = useState(false);

  useEffect(() => {
    if (!isLoading && isWorkspaceSelected) {
      workspaceSessionManager.transitionTo(activeWorkspaceId).catch(console.error);
    }
  }, [activeWorkspaceId, isLoading, isWorkspaceSelected]);

  useEffect(() => {
    const unsubInit = workspaceEventBus.on('workspace.initializing', () => setSessionLoading(true));
    const unsubReady = workspaceEventBus.on('workspace.ready', () => setSessionLoading(false));
    const unsubFailed = workspaceEventBus.on('workspace.failed', () => {
      setSessionLoading(false);
      // If the user has a stored workspace, this failure is likely transient (offline/network).
      // Don't reset workspace selection — let them stay in the app with cached data.
      // (Logout clears localStorage, so stored workspace only exists for returning users)
      const hasStoredWorkspace = !!localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
      if (!hasStoredWorkspace) {
        setIsWorkspaceSelected(false);
      }
    });
    
    return () => {
      unsubInit();
      unsubReady();
      unsubFailed();
    };
  }, []);

  /**
   * Checks if the authenticated user belongs to any workspaces:
   * 1. Via their workspaceIndex entry (owner / previously active workspace)
   * 2. Via accepted invitations in the invitations collection
   */
  const checkHasWorkspaces = async (uid, userEmail) => {
    if (!uid && !userEmail) return false;
    try {
      // 1. Check workspaceIndex for owner/previously active workspace
      if (uid) {
        const indexSnap = await getDoc(doc(db, 'workspaceIndex', uid));
        if (indexSnap.exists() && indexSnap.data().workspaceId && !failedWorkspaceIds.has(indexSnap.data().workspaceId)) {
          return true;
        }
      }
      // 2. Check for accepted invitations
      if (userEmail) {
        const q = query(
          collection(db, 'invitations'),
          where('email', '==', userEmail.trim().toLowerCase()),
          where('status', '==', 'accepted')
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          if (!failedWorkspaceIds.has(d.data().workspaceId)) return true;
        }
      }
      // 3. Fallback check: Direct member documents across workspaces
      if (uid) {
        try {
          const allWsSnap = await getDocs(collection(db, "workspaces"));
          for (const wsDoc of allWsSnap.docs) {
            const wsId = wsDoc.id;
            if (!failedWorkspaceIds.has(wsId)) {
              try {
                const memSnap = await getDoc(doc(db, "workspaces", wsId, "members", uid));
                if (memSnap.exists() && memSnap.data().status !== "inactive") {
                  // Self-heal workspaceIndex if it was missing!
                  setDoc(doc(db, 'workspaceIndex', uid), {
                    workspaceId: wsId,
                    role: memSnap.data().role || "member",
                    status: "active",
                    updatedAt: serverTimestamp()
                  }).catch(() => {});
                  return true;
                }
              } catch (memErr) {}
            }
          }
        } catch (wsListErr) {}
      }
      return false;
    } catch (e) {
      console.warn('[App] Error checking existing workspaces:', e);
      return false;
    }
  };

  useEffect(() => {
    // Launch gate: when user is authenticated, route them through the structured onboarding flow
    if (isAuthenticated && !isLocalMode && !isWorkspaceSelected) {
      // Fast-path: if they already have an active workspace, take them straight to it!
      if (activeWorkspaceId) {
        setIsWorkspaceSelected(true);
        return;
      }

      // Cached session fast-path: if localStorage has a stored workspace but activeWorkspaceId
      // is not set in state (e.g. offline cold start where AuthContext restored user from cache),
      // restore it directly instead of trying (and failing) network checks.
      const storedWorkspace = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
      if (storedWorkspace) {
        console.log("[App Gate] Stored workspace found — restoring session from cache.");
        setIsWorkspaceSelected(true);
        return;
      }

      const uid = user?.uid || null;
      const email = user?.email || null;
      console.log("[App Gate] Checking for user:", { uid, email, user });
      checkPendingInvitations()
        .then(async (invs) => {
          console.log("[App Gate] Pending invitations:", invs);
          if (invs && invs.length > 0) {
            setInitialAuthRoute('pending-invitations');
          } else {
            const hasWorkspaces = await checkHasWorkspaces(uid, email);
            console.log("[App Gate] Has workspaces:", hasWorkspaces);
            if (hasWorkspaces) {
              setInitialAuthRoute('switch');
            } else {
              setInitialAuthRoute('no-workspace');
            }
          }
        })
        .catch((err) => {
          console.error("[App Gate] Error in check:", err);
          // If there's a stored workspace, this failure is likely due to being offline.
          // Restore the session instead of routing to no-workspace.
          const storedWs = localStorage.getItem(APPLICATION.storageKeys.activeWorkspaceId);
          if (storedWs) {
            console.log("[App Gate] Stored workspace found in catch — restoring session.");
            setIsWorkspaceSelected(true);
          } else {
            setInitialAuthRoute('no-workspace');
          }
        });
    }
  }, [isAuthenticated, isLocalMode, isWorkspaceSelected, user, activeWorkspaceId, checkPendingInvitations]);

  // Load and show pending invitations in-app only AFTER the user is in the dashboard
  // (they may receive new invitations while working inside a workspace)
  useEffect(() => {
    if (isAuthenticated && !isLocalMode && isWorkspaceSelected) {
      checkPendingInvitations().then(invs => {
        setInAppInvites(invs || []);
        if (invs && invs.length > 0) {
          setIsInviteModalOpen(true);
        }
      }).catch(console.error);
    } else {
      setInAppInvites([]);
      setIsInviteModalOpen(false);
    }
  }, [isAuthenticated, isLocalMode, isWorkspaceSelected, checkPendingInvitations]);


  if (isLoading || sessionLoading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "var(--bg-app)",
        color: "var(--accent-gold)",
        fontFamily: "var(--font-title)",
        fontSize: "18px",
        fontWeight: "700"
      }}>
        Loading Workspace...
      </div>
    );
  }

  // Show the auth gate if:
  // - User is not authenticated and not in local/offline mode, OR
  // - User is authenticated but has not yet confirmed a workspace for this session
  if ((!isAuthenticated && !isLocalMode) || (isAuthenticated && !isWorkspaceSelected && !isLocalMode)) {
    return (
      <AuthRouter
        initialRoute={isAuthenticated ? initialAuthRoute : "welcome"}
        onWorkspaceSelected={() => setIsWorkspaceSelected(true)}
      />
    );
  }

  const appContent = (
    <WorkspaceProvider>
      <AuthenticatedApp />
      {import.meta.env.DEV && <WorkspaceDiagnostics />}
    </WorkspaceProvider>
  );

  return (
    <WorkspaceScopeProvider workspaceId={activeWorkspaceId}>
      {appContent}
      <WorkspaceInvitationsModal
        isOpen={isInviteModalOpen}
        invitations={inAppInvites}
        onClose={() => setIsInviteModalOpen(false)}
        onAccepted={(id) => {
          setInAppInvites(prev => prev.filter(inv => inv.id !== id));
        }}
        onDeclined={(id) => {
          setInAppInvites(prev => prev.filter(inv => inv.id !== id));
          if (inAppInvites.length <= 1) {
            setIsInviteModalOpen(false);
          }
        }}
        onSwitchWorkspace={(workspaceId) => {
          switchWorkspace(workspaceId);
        }}
      />
    </WorkspaceScopeProvider>
  );
}

export default App;

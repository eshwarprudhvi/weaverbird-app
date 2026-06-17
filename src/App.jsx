import React, { useState, useEffect, useRef } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { jsPDF } from "jspdf";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { Share } from "@capacitor/share";
import { Network } from "@capacitor/network";
import { db, isConfigured } from "./firebase";
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
} from "lucide-react";

const WEB_APP_VERSION = "1.0.7";

// Default initial data to populate localStorage if empty
const INITIAL_PROJECTS = []

const INITIAL_SCHEDULE = [
  {
    id: "s1",
    title: "Internal Sync: Q4 Logistics",
    date: new Date().toISOString().split("T")[0],
    completed: false,
  },
  {
    id: "s2",
    title: "Client Review: Project Zenith",
    date: new Date().toISOString().split("T")[0],
    completed: false,
  },
  {
    id: "s3",
    title: "Design Handoff",
    date: new Date().toISOString().split("T")[0],
    completed: false,
  },
  {
    id: "s4",
    title: "Site Inspection: Riverside",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    completed: false,
  },
  {
    id: "s5",
    title: "Supplier Contract Signing",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    completed: false,
  },
];

function App() {
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
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("ipm_projects");
    return saved ? JSON.parse(saved) : [];
  });

  const [deletedProjectIds, setDeletedProjectIds] = useState(() => {
    const saved = localStorage.getItem("ipm_deleted_project_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem("ipm_schedule");
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("ipm_theme");
    return saved || "light";
  });

  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEmailReportsOpen, setIsEmailReportsOpen] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const [currentTab, setCurrentTab] = useState("projects"); // projects | work | schedule | profile
  const [activeProjectId, setActiveProjectId] = useState(null); // null means dashboard, otherwise project detail
  const [activeRoomId, setActiveRoomId] = useState(null); // null means rooms list, otherwise room detail

  // Project detail sub-tabs: 'materials' or 'work'
  const [projectSubTab, setProjectSubTab] = useState("materials");

  // Filtering and Searching
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | ongoing | not-started | completed

  // Collapsible lists
  const [materialsCollapsed, setMaterialsCollapsed] = useState(true);
  const [tasksCollapsed, setTasksCollapsed] = useState(true);

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
  const [isTodoScreenOpen, setIsTodoScreenOpen] = useState(false);
  const [editTodoId, setEditTodoId] = useState(null);
  const [editTodoText, setEditTodoText] = useState("");

  // Priority task collapsible state
  const [highPriorityCollapsed, setHighPriorityCollapsed] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mediumPriorityCollapsed, setMediumPriorityCollapsed] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [lowPriorityCollapsed, setLowPriorityCollapsed] = useState(false);

  // Modals state
  const [isNewProjModalOpen, setIsNewProjModalOpen] = useState(false);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);
  const [isBackupsListOpen, setIsBackupsListOpen] = useState(false);
  const [editItemModal, setEditItemModal] = useState(null); // { type: 'project'|'material'|'task'|'meeting'|'todo', projectId?, itemId, name, description?, time?, day? }
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);

  // Inline forms state
  const [newMaterialInput, setNewMaterialInput] = useState("");
  const [newWorkInput, setNewWorkInput] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium"); // high | medium | low

  // Add Project Form state
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjStatus, setNewProjStatus] = useState("not-started");
  const [newProjCompletionDate, setNewProjCompletionDate] = useState("");
  
  // Room selection for new project
  const defaultRoomsList = ["MBR", "Kitchen", "KBR", "Living Area"];
  const [newProjAllAvailableRooms, setNewProjAllAvailableRooms] = useState([...defaultRoomsList]);
  const [newProjSelectedRooms, setNewProjSelectedRooms] = useState([...defaultRoomsList]);
  const [newProjCustomRoomInput, setNewProjCustomRoomInput] = useState("");

  const handleAddCustomRoomToNewProj = () => {
    const r = newProjCustomRoomInput.trim();
    if (r) {
      if (!newProjAllAvailableRooms.includes(r)) {
        setNewProjAllAvailableRooms([...newProjAllAvailableRooms, r]);
      }
      if (!newProjSelectedRooms.includes(r)) {
        setNewProjSelectedRooms([...newProjSelectedRooms, r]);
      }
    }
    setNewProjCustomRoomInput("");
  };

  // Add Meeting Form state
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

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
  const [authorizedUsers, setAuthorizedUsers] = useState([]);
  const isRemoteChange = useRef(false);
  const prevProjectsRef = useRef([]);
  const [isConnectingCloud, setIsConnectingCloud] = useState(false);
  const [hasLoadedProjectsFromCloud, setHasLoadedProjectsFromCloud] = useState(false);
  const [hasLoadedScheduleFromCloud, setHasLoadedScheduleFromCloud] = useState(false);
  const [hasLoadedTodosFromCloud, setHasLoadedTodosFromCloud] = useState(false);

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
    isTodoScreenOpen,
    isNewProjModalOpen,
    isNewMeetingModalOpen,
    editItemModal,
    activeProjectId,
    activeRoomId
  ]);

  // Schedule Local Notifications for all upcoming incomplete meetings
  const scheduleAllUpcomingMeetings = async (meetingsList) => {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }

      // Cancel existing ones first to avoid duplicate notifications
      for (const m of meetingsList) {
        const numericId = Math.floor(parseInt(m.id.replace("s_", "")) % 2147483647) || 0;
        if (numericId > 0) {
          try {
            await LocalNotifications.cancel({
              notifications: [{ id: numericId }]
            });
          // eslint-disable-next-line no-unused-vars, no-empty
          } catch (e) {}
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      const incompleteUpcoming = meetingsList.filter(m => !m.completed);
      
      for (const meeting of incompleteUpcoming) {
        const targetDate = new Date(meeting.date + "T09:00:00");
        let scheduleTime = targetDate;
        
        if (meeting.date === todayStr) {
          // If the meeting is today, trigger it 5 seconds in the future for immediate alert
          scheduleTime = new Date(Date.now() + 5000);
        } else if (targetDate.getTime() < Date.now()) {
          // Skip if the meeting date is in the past
          continue;
        }

        const numericId = Math.floor(parseInt(meeting.id.replace("s_", "")) % 2147483647) || Math.floor(Date.now() % 2147483647);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: numericId,
              title: "WeaverBird Meeting Today",
              body: `Reminder: "${meeting.title}" is scheduled for today!`,
              schedule: { at: scheduleTime },
              extra: { tab: "schedule" }
            }
          ]
        });
      }
    } catch (err) {
      console.warn("Could not schedule upcoming meetings:", err);
    }
  };

  // Sync individual project document to cloud
  const syncProjectToCloud = async (project) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const projDocRef = doc(db, "projects", project.id);
      await setDoc(projDocRef, {
        ...project,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(`Failed to sync project ${project.id} to cloud:`, err);
    }
  };

  // Delete individual project document from cloud and add to deleted_projects collection
  const deleteProjectFromCloud = async (projectId) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      await deleteDoc(doc(db, "projects", projectId));
      await setDoc(doc(db, "deleted_projects", projectId), {
        deletedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(`Failed to delete project ${projectId} from cloud:`, err);
    }
  };

  // Sync schedule/meetings to user-specific private document in cloud
  const syncScheduleToCloud = async (newSchedule) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const dataDocRef = doc(db, "users", cleanEmail, "private", "meetings");
      await setDoc(dataDocRef, {
        schedule: newSchedule,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync private schedule to cloud:", err);
    }
  };

  // Sync todos to user-specific private document in cloud
  const syncTodosToCloud = async (newTodos) => {
    if (!isConfigured || !db || !cloudSyncEnabled || !isAuthorized || !userEmail) return;
    try {
      const cleanEmail = userEmail.toLowerCase().trim();
      const dataDocRef = doc(db, "users", cleanEmail, "private", "todos");
      await setDoc(dataDocRef, {
        todos: newTodos,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to sync private todos to cloud:", err);
    }
  };

  // Sync projects state to localStorage and cloud incrementally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    localStorage.setItem("ipm_projects", JSON.stringify(projects));
    saveProjectBackup(projects);

    if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail && hasLoadedProjectsFromCloud) {
      checkAndTriggerAutoEmail(projects, userEmail.toLowerCase().trim());
    }

    if (!cloudSyncEnabled || !hasLoadedProjectsFromCloud) {
      prevProjectsRef.current = projects;
      return;
    }

    if (isRemoteChange.current) {
      prevProjectsRef.current = projects;
      return;
    }

    // Detect granular differences (Added, Modified, or Deleted projects)
    const prevMap = new Map((prevProjectsRef.current || []).map((p) => [p.id, p]));
    const currentMap = new Map(projects.map((p) => [p.id, p]));

    // 1. Check for additions and modifications
    projects.forEach((proj) => {
      const prevProj = prevMap.get(proj.id);
      if (!prevProj) {
        syncProjectToCloud(proj);
      } else if (JSON.stringify(prevProj) !== JSON.stringify(proj)) {
        syncProjectToCloud(proj);
      }
    });

    // 2. Check for deletions
    (prevProjectsRef.current || []).forEach((prevProj) => {
      if (!currentMap.has(prevProj.id)) {
        deleteProjectFromCloud(prevProj.id);
      }
    });

    prevProjectsRef.current = projects;
  }, [projects, hasLoadedProjectsFromCloud, cloudSyncEnabled, isAuthorized, userEmail]);

  // Sync schedule state to localStorage and cloud, and schedule local alerts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    localStorage.setItem("ipm_schedule", JSON.stringify(schedule));
    if (!cloudSyncEnabled || hasLoadedScheduleFromCloud) {
      if (!isRemoteChange.current) {
        syncScheduleToCloud(schedule);
      }
    }
    scheduleAllUpcomingMeetings(schedule);
  }, [schedule, hasLoadedScheduleFromCloud, cloudSyncEnabled]);

  // Sync todos state to cloud
  useEffect(() => {
    if (!cloudSyncEnabled || hasLoadedTodosFromCloud) {
      if (!isRemoteChange.current) {
        syncTodosToCloud(todos);
      }
    }
  }, [todos, hasLoadedTodosFromCloud, cloudSyncEnabled]);

  // Handle Firestore cloud database listeners (real-time data sync and access rules)
  useEffect(() => {
    if (!isConfigured || !db || !cloudSyncEnabled || !userEmail) {
      setIsAuthorized(true);
      return;
    }

    setTimeout(() => {
      setHasLoadedProjectsFromCloud(false);
      setHasLoadedScheduleFromCloud(false);
    }, 0);

    const cleanEmail = userEmail.toLowerCase().trim();
    let unsubscribeUsers = () => {};
    let unsubscribeData = () => {};
    let unsubscribeDeleted = () => {};
    let unsubscribeSchedule = () => {};
    let unsubscribeTodos = () => {};

    try {
      // 1. Listen to authorized users list & check access role
      const usersCol = collection(db, "users");
      unsubscribeUsers = onSnapshot(usersCol, async (snapshot) => {
        try {
          if (!navigator.onLine) {
            console.log("[Firebase Debug] Offline, skipping online auth check.");
            return;
          }

          const usersList = [];
          snapshot.forEach(docSnap => {
            usersList.push({ email: docSnap.id, ...docSnap.data() });
          });

          console.log("[Firebase Debug] Fetched usersList:", usersList);
          console.log("[Firebase Debug] Current cleanEmail:", cleanEmail);

          if (usersList.length === 0) {
            // First time? Register the user as admin
            await setDoc(doc(db, "users", cleanEmail), { role: "admin" });
            return;
          }

          setAuthorizedUsers(usersList);

          const currentUser = usersList.find(u => u.email === cleanEmail);
          console.log("[Firebase Debug] Match found:", currentUser);

          if (currentUser) {
            setIsAuthorized(true);
            localStorage.setItem("weaverbird_user_authorized", "true");
            setUserRole(currentUser.role);
            localStorage.setItem("weaverbird_user_role", currentUser.role);
          } else {
            setIsAuthorized(false);
            localStorage.setItem("weaverbird_user_authorized", "false");
          }
        } catch (err) {
          console.error("Error processing users snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to users list:", error);
      });

      const deletedColRef = collection(db, "deleted_projects");
      unsubscribeDeleted = onSnapshot(deletedColRef, (deletedSnap) => {
        try {
          const cloudDeletedIds = [];
          deletedSnap.forEach((docSnap) => {
            cloudDeletedIds.push(docSnap.id);
          });
          
          setDeletedProjectIds((prev) => {
            const combined = [...new Set([...prev, ...cloudDeletedIds])];
            const savedProjectsRaw = localStorage.getItem("ipm_projects");
            const activeIds = savedProjectsRaw ? JSON.parse(savedProjectsRaw).map(p => p.id) : [];
            const filtered = combined.filter(id => !activeIds.includes(id));
            localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(filtered));
            return filtered;
          });
        } catch (err) {
          console.error("Error processing deleted projects snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to deleted projects:", error);
      });

      // 3. Listen to real-time shared projects (projects collection)
      const projectsColRef = collection(db, "projects");
      unsubscribeData = onSnapshot(projectsColRef, (querySnapshot) => {
        try {
          isRemoteChange.current = true;
          
          const cloudProjects = [];
          querySnapshot.forEach((docSnap) => {
            cloudProjects.push({ ...docSnap.data(), id: docSnap.id });
          });

          setProjects((prevProjects) => {
            // Read latest deleted IDs directly to avoid closure stale state
            const savedDeletedRaw = localStorage.getItem("ipm_deleted_project_ids");
            const currentDeletedIds = savedDeletedRaw ? JSON.parse(savedDeletedRaw) : [];

            // Perform Safe Merge
            const allProjectsMap = new Map();
            
            // Add local projects first
            prevProjects.forEach((p) => {
              if (!currentDeletedIds.includes(p.id)) {
                allProjectsMap.set(p.id, p);
              }
            });
            
            // Add/overwrite with cloud projects (using smart conflict-free merge)
            cloudProjects.forEach((cloudProj) => {
              if (currentDeletedIds.includes(cloudProj.id)) return;

              const localProj = allProjectsMap.get(cloudProj.id);
              if (!localProj) {
                allProjectsMap.set(cloudProj.id, cloudProj);
              } else {
                // Perform smart merge based on updatedAt and offline updates
                const localTime = localProj.updatedAt ? new Date(localProj.updatedAt).getTime() : 0;
                const cloudTime = cloudProj.updatedAt ? new Date(cloudProj.updatedAt).getTime() : 0;

                const localIsNewer = localTime >= cloudTime;
                const baseProj = localIsNewer ? localProj : cloudProj;
                const otherProj = localIsNewer ? cloudProj : localProj;

                // Merge materials
                const baseMaterials = baseProj.materials || [];
                const otherMaterials = otherProj.materials || [];
                const mergedMaterials = [...baseMaterials];
                otherMaterials.forEach((item) => {
                  if (!baseMaterials.some((m) => m.id === item.id)) {
                    mergedMaterials.push(item);
                  }
                });

                // Merge tasks
                const baseTasks = baseProj.tasks || [];
                const otherTasks = otherProj.tasks || [];
                const mergedTasks = [...baseTasks];
                otherTasks.forEach((item) => {
                  if (!baseTasks.some((t) => t.id === item.id)) {
                    mergedTasks.push(item);
                  }
                });

                allProjectsMap.set(cloudProj.id, {
                  ...baseProj,
                  materials: mergedMaterials,
                  tasks: mergedTasks
                });
              }
            });
            
            const mergedList = Array.from(allProjectsMap.values());
            localStorage.setItem("ipm_projects", JSON.stringify(mergedList));
            
            // Upload any local projects that are not yet in the cloud (excluding deleted ones)
            mergedList.forEach((p) => {
              const inCloud = cloudProjects.some((cp) => cp.id === p.id);
              if (!inCloud) {
                setTimeout(() => {
                  syncProjectToCloud(p);
                }, 200);
              }
            });

            // Delete any project document in the cloud if it is in currentDeletedIds
            currentDeletedIds.forEach((deletedId) => {
              const inCloud = cloudProjects.some((cp) => cp.id === deletedId);
              if (inCloud) {
                setTimeout(() => {
                  deleteProjectFromCloud(deletedId);
                }, 200);
              }
            });

            prevProjectsRef.current = mergedList;
            return mergedList;
          });

          setTimeout(() => {
            isRemoteChange.current = false;
          }, 100);
          setHasLoadedProjectsFromCloud(true);

          // Fetch daily backups from cloud to synchronize local cache
          const backupsColRef = collection(db, "users", cleanEmail, "backups");
          getDocs(backupsColRef).then((querySnapshot) => {
            const cloudBackups = [];
            querySnapshot.forEach((docSnap) => {
              cloudBackups.push(docSnap.data());
            });
            // Sort by timestamp descending
            cloudBackups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            localStorage.setItem("ipm_projects_backups_daily", JSON.stringify(cloudBackups));
          }).catch((err) => console.error("Error syncing cloud backups list:", err));
        } catch (err) {
          console.error("Error processing projects collection snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to projects updates:", error);
      });

      // 4. Listen to real-time private schedule sync edits (private per user)
      const scheduleDocRef = doc(db, "users", cleanEmail, "private", "meetings");
      unsubscribeSchedule = onSnapshot(scheduleDocRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            
            isRemoteChange.current = true;
            
            if (cloudData.schedule) {
              setSchedule(cloudData.schedule);
              localStorage.setItem("ipm_schedule", JSON.stringify(cloudData.schedule));
            }

            setTimeout(() => {
              isRemoteChange.current = false;
            }, 100);
          }
          setHasLoadedScheduleFromCloud(true);
        } catch (err) {
          console.error("Error processing private schedule snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to private schedule updates:", error);
      });

      // 5. Listen to real-time private todos sync edits (private per user)
      const todosDocRef = doc(db, "users", cleanEmail, "private", "todos");
      unsubscribeTodos = onSnapshot(todosDocRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            const cloudData = docSnap.data();
            
            isRemoteChange.current = true;
            
            if (cloudData.todos) {
              setTodos(cloudData.todos);
            }

            setTimeout(() => {
              isRemoteChange.current = false;
            }, 100);
          }
          setHasLoadedTodosFromCloud(true);
        } catch (err) {
          console.error("Error processing private todos snapshot:", err);
        }
      }, (error) => {
        console.error("Error listening to private todos updates:", error);
      });

    } catch (err) {
      console.error("Failed to initialize Firestore snapshot listeners:", err);
    }

    return () => {
      unsubscribeUsers();
      unsubscribeData();
      unsubscribeDeleted();
      unsubscribeSchedule();
      unsubscribeTodos();
    };
  }, [cloudSyncEnabled, userEmail]);

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
        const scheduleTime = new Date();
        scheduleTime.setHours(6, 0, 0, 0);
        if (scheduleTime > now) {
          notificationsToSchedule.push({
            id: idCounter++,
            title: "Today's Meetings",
            body: `You have ${todaysMeets.length} meeting(s) scheduled for today.`,
            schedule: { at: scheduleTime },
            extra: { tab: "schedule" },
          });
        }
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

  const activeProject = activeProjects.find((p) => p.id === activeProjectId);

  // --- HANDLERS ---
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "theme"));
    // Simple classes switch
    const root = document.getElementById("app-root");
    if (root) {
      root.classList.toggle("dark-theme");
    }
  };

  // Add Project
  const getDaysLeftTextAndColor = (project) => {
    if (project.status === "completed") {
      return { text: "Completed", color: "#10b981" };
    }
    if (!project.completionDate) {
      return { text: "No target date set", color: "var(--text-muted)" };
    }

    const targetDate = new Date(project.completionDate);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "#ef4444" };
    } else if (diffDays === 0) {
      return { text: "Due today!", color: "#ef4444" };
    } else if (diffDays <= 3) {
      return { text: `${diffDays} days left`, color: "#ef4444" };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: "#f97316" };
    } else {
      return {
        text: `${diffDays} days left`,
        color: "var(--accent-gold-dark)",
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

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const projectRooms = newProjSelectedRooms.map((name, index) => ({
      id: "room_" + Date.now() + "_" + index,
      name: name
    }));

    const newProject = {
      id: Date.now().toString(),
      name: newProjName,
      description: newProjDesc || "No description provided.",
      status: newProjStatus,
      completionDate: newProjCompletionDate || "",
      rooms: projectRooms,
      materials: [],
      tasks: [],
    };

    setProjects([newProject, ...projects]);
    setNewProjName("");
    setNewProjDesc("");
    setNewProjStatus("not-started");
    setNewProjCompletionDate("");
    setNewProjSelectedRooms([...defaultRoomsList]);
    setNewProjAllAvailableRooms([...defaultRoomsList]);
    setNewProjCustomRoomInput("");
    setIsNewProjModalOpen(false);
  };

  const handleAddRoomToExistingProject = () => {
    const roomName = window.prompt("Enter new room name:");
    if (roomName && roomName.trim()) {
      setProjects(projects.map(p => {
        if (p.id === activeProjectId) {
          const newRoom = { id: "room_" + Date.now(), name: roomName.trim() };
          return { ...p, rooms: [...(p.rooms || []), newRoom] };
        }
        return p;
      }));
    }
  };

  const handleEditRoom = (e, roomId, currentName) => {
    e.stopPropagation();
    const newName = window.prompt("Edit room name:", currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      setProjects(projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            rooms: (p.rooms || []).map(r => r.id === roomId ? { ...r, name: newName.trim() } : r)
          };
        }
        return p;
      }));
    }
  };

  const handleDeleteRoom = (e, roomId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this room? Materials and Tasks assigned to this room will become unassigned.")) {
      setProjects(projects.map(p => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            rooms: (p.rooms || []).filter(r => r.id !== roomId),
            materials: (p.materials || []).map(m => m.roomId === roomId ? { ...m, roomId: null } : m),
            tasks: (p.tasks || []).map(t => t.roomId === roomId ? { ...t, roomId: null } : t),
          };
        }
        return p;
      }));
    }
  };

  // Delete Project (Move to Recycle Bin)
  const handleDeleteProject = (projId, e) => {
    e.stopPropagation(); // Stop navigation click
    if (window.confirm("Are you sure you want to move this project to the Recycle Bin (Trash)?")) {
      setProjects(
        projects.map((p) => {
          if (p.id === projId) {
            return { ...p, isTrashed: true, trashedAt: new Date().toISOString() };
          }
          return p;
        })
      );
      if (activeProjectId === projId) {
        setActiveProjectId(null);
      }
    }
  };

  // Update Project Status from details screen
  // eslint-disable-next-line no-unused-vars
  const handleProjectStatusChange = (projId, newStatus) => {
    setProjects(
      projects.map((p) => {
        if (p.id === projId) {
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  // Add Material inline
  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterialInput.trim() || !activeProjectId) return;

    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          const newMaterial = {
            id: "m_" + Date.now(),
            name: newMaterialInput.trim(),
            completed: false,
            roomId: activeRoomId,
          };
          return {
            ...p,
            materials: [newMaterial, ...(p.materials || [])],
          };
        }
        return p;
      })
    );

    setNewMaterialInput("");
  };

  // Toggle Material Complete
  const handleToggleMaterial = (matId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            materials: p.materials.map((m) => {
              if (m.id === matId) {
                return { ...m, completed: !m.completed };
              }
              return m;
            }),
          };
        }
        return p;
      })
    );
  };

  // Delete Material
  const handleDeleteMaterial = (matId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            materials: p.materials.filter((m) => m.id !== matId),
          };
        }
        return p;
      })
    );
  };

  // Add Task inline
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newWorkInput.trim() || !activeProjectId) return;

    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          const newTask = {
            id: "t_" + Date.now(),
            name: newWorkInput.trim(),
            completed: false,
            priority: newTaskPriority, // Use state priority
            roomId: activeRoomId,
          };
          return {
            ...p,
            tasks: [newTask, ...(p.tasks || [])],
          };
        }
        return p;
      })
    );

    setNewWorkInput("");
    setNewTaskPriority("medium"); // Reset to default
  };

  // Toggle Task Complete
  const handleToggleTask = (taskId, projId = activeProjectId) => {
    const targetProj = projects.find((p) => p.id === projId);
    if (targetProj) {
      const task = targetProj.tasks.find((t) => t.id === taskId);
      if (task && !task.completed) {
        const uncompletedDeps = (task.dependencies || [])
          .map((depId) => targetProj.tasks.find((t) => t.id === depId))
          .filter((t) => t && !t.completed);
        
        if (uncompletedDeps.length > 0) {
          const depNames = uncompletedDeps.map((t) => `"${t.name}"`).join(", ");
          alert(
            `Cannot complete this task. It depends on preceding tasks: ${depNames} which are not yet completed.`
          );
          return;
        }
      }
    }

    setProjects(
      projects.map((p) => {
        if (p.id === projId) {
          return {
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id === taskId) {
                return { ...t, completed: !t.completed };
              }
              return t;
            }),
          };
        }
        return p;
      })
    );
  };

  // Delete Task
  const handleDeleteTask = (taskId) => {
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            tasks: p.tasks.filter((t) => t.id !== taskId),
          };
        }
        return p;
      })
    );
  };

  // Clear Completed Materials
  const handleClearCompletedMaterials = () => {
    if (!activeProjectId) return;
    const confirmClear = window.confirm("Are you sure you want to clear all completed materials?");
    if (!confirmClear) return;
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            materials: (p.materials || []).filter((m) => !m.completed),
          };
        }
        return p;
      })
    );
  };

  // Clear Completed Tasks
  const handleClearCompletedTasks = () => {
    if (!activeProjectId) return;
    const confirmClear = window.confirm("Are you sure you want to clear all completed tasks?");
    if (!confirmClear) return;
    setProjects(
      projects.map((p) => {
        if (p.id === activeProjectId) {
          return {
            ...p,
            tasks: (p.tasks || []).filter((t) => !t.completed),
          };
        }
        return p;
      })
    );
  };

  // Drag and drop handlers for tasks
  const handleTaskDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTaskDragOver = (e) => {
    e.preventDefault();
  };

  const handleTaskDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetId) return;

    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id === activeProjectId) {
          const tasks = [...proj.tasks];
          const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
          const targetIndex = tasks.findIndex((t) => t.id === targetId);

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);
          }
          return { ...proj, tasks };
        }
        return proj;
      })
    );
    setDraggedTaskId(null);
  };

  // Add Meeting
  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!newMeetTitle.trim()) return;

    const exists = schedule.some((s) => s.date === newMeetDate && !s.completed);
    if (exists) {
      const proceed = window.confirm(
        "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
      );
      if (!proceed) return;
    }

    const newMeeting = {
      id: "s_" + Date.now(),
      title: newMeetTitle.trim(),
      date: newMeetDate,
      completed: false,
    };

    setSchedule([...schedule, newMeeting]);
    setNewMeetTitle("");
    setNewMeetDate(new Date().toISOString().split("T")[0]);
    setIsNewMeetingModalOpen(false);
  };

  // Toggle Meeting Complete
  const handleToggleMeeting = (meetId) => {
    setSchedule(
      schedule.map((s) => {
        if (s.id === meetId) {
          return { ...s, completed: !s.completed };
        }
        return s;
      })
    );
  };

  // Delete Meeting
  const handleDeleteMeeting = (meetId) => {
    setSchedule(schedule.filter((s) => s.id !== meetId));
  };

  // Save edits from modal
  const handleSaveEdit = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-unused-vars
    const { type, projectId, itemId, name, description, time, day, status } =
      editItemModal;

    if (type === "project") {
      const { completionDate } = editItemModal;
      setProjects(
        projects.map((p) => {
          if (p.id === itemId) {
            return {
              ...p,
              name,
              status,
              completionDate: completionDate || "",
            };
          }
          return p;
        })
      );
    } else if (type === "material") {
      setProjects(
        projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              materials: p.materials.map((m) =>
                m.id === itemId ? { ...m, name } : m
              ),
            };
          }
          return p;
        })
      );
    } else if (type === "task") {
      const { priority, dependencies } = editItemModal;
      setProjects(
        projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === itemId
                  ? {
                      ...t,
                      name,
                      priority: priority || "medium",
                      dependencies: dependencies || [],
                    }
                  : t
              ),
            };
          }
          return p;
        })
      );
    } else if (type === "meeting") {
      const { date } = editItemModal;
      const exists = schedule.some(
        (s) => s.date === date && s.id !== itemId && !s.completed
      );
      if (exists) {
        const proceed = window.confirm(
          "A meeting is already scheduled on this date. Do you still want to schedule another meeting?"
        );
        if (!proceed) return;
      }
      setSchedule(
        schedule.map((s) => {
          if (s.id === itemId) {
            return { ...s, title: name, date };
          }
          return s;
        })
      );
    }

    setEditItemModal(null);
  };

  // Priority weight logic for sorting
  const getPriorityWeight = (priority) => {
    if (priority === "high") return 3;
    if (priority === "medium") return 2;
    return 1;
  };

  // WhatsApp Sharing Logic
  const handleShareMaterials = () => {
    if (!activeProject) return;
    const pending = activeProject.materials?.filter((m) => !m.completed) || [];
    if (pending.length === 0) {
      alert("No pending materials to share!");
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*WeaverBird Interior Studio*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(
        activeProject.completionDate
      )}\n`;
    }
    text += `\n*Pending Materials:*\n`;
    pending.forEach((m) => {
      text += `- ${m.name}\n`;
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  const handleShareTasks = () => {
    if (!activeProject) return;
    const pending = activeProject.tasks?.filter((t) => !t.completed) || [];
    if (pending.length === 0) {
      alert("No pending tasks to share!");
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*WeaverBird Interior Studio*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(
        activeProject.completionDate
      )}\n`;
    }
    text += `\n*Pending Tasks (Sorted by Priority):*\n`;

    const sorted = [...pending].sort(
      (a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
    );
    sorted.forEach((t) => {
      const priorityStr = (t.priority || "medium").toUpperCase();
      const emoji =
        t.priority === "high" ? "🔴" : t.priority === "low" ? "🔵" : "🟠";
      text += `${emoji} [${priorityStr}] ${t.name}\n`;
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      text
    )}`;
    window.open(url, "_blank");
  };

  const handleShareProjectOverview = () => {
    if (!activeProject) return;
    const pendingMaterials = activeProject.materials?.filter((m) => !m.completed) || [];
    const pendingTasks = activeProject.tasks?.filter((t) => !t.completed) || [];

    if (pendingMaterials.length === 0 && pendingTasks.length === 0) {
      alert("No pending materials or tasks to share!");
      return;
    }

    const rooms = activeProject.rooms || [];
    const roomsMap = new Map();
    rooms.forEach(r => roomsMap.set(r.id, r.name));
    roomsMap.set('general', 'General / Unassigned');

    const materialsByRoom = {};
    pendingMaterials.forEach(m => {
      const roomId = m.roomId || 'general';
      if (!materialsByRoom[roomId]) materialsByRoom[roomId] = [];
      materialsByRoom[roomId].push(m);
    });

    const tasksByRoom = {};
    pendingTasks.forEach(t => {
      const roomId = t.roomId || 'general';
      if (!tasksByRoom[roomId]) tasksByRoom[roomId] = [];
      tasksByRoom[roomId].push(t);
    });

    const allRoomIds = [...new Set([...Object.keys(materialsByRoom), ...Object.keys(tasksByRoom)])];

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*WeaverBird Interior Studio*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    if (activeProject.completionDate) {
      text += `*Target Deadline:* ${formatDisplayDateStr(activeProject.completionDate)}\n`;
    }

    allRoomIds.forEach(roomId => {
      const roomName = roomsMap.get(roomId) || 'Unknown Room';
      text += `\n--- *${roomName.toUpperCase()}* ---\n`;
      
      const rMaterials = materialsByRoom[roomId] || [];
      if (rMaterials.length > 0) {
        text += `*Materials:*\n`;
        rMaterials.forEach(m => { text += `- ${m.name}\n`; });
      }

      const rTasks = tasksByRoom[roomId] || [];
      if (rTasks.length > 0) {
        text += `*Work:*\n`;
        const sorted = [...rTasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
        sorted.forEach(t => {
          const emoji = t.priority === "high" ? "🔴" : t.priority === "low" ? "🔵" : "🟠";
          const priorityStr = (t.priority || "medium").toUpperCase();
          text += `${emoji} [${priorityStr}] ${t.name}\n`;
        });
      }
    });

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`;
    window.open(url, "_blank");
  };

  // PDF Report Generator Function (opens inside an in-app sheet modal to prevent mobile freezes)
  const generatePDFReport = (type) => {
    if (!activeProject) return;

    const pendingMaterials =
      activeProject.materials?.filter((m) => !m.completed) || [];
    const pendingTasks = activeProject.tasks?.filter((t) => !t.completed) || [];

    if (type === "materials" && pendingMaterials.length === 0) {
      alert("No pending materials to generate a PDF report.");
      return;
    }
    if (type === "tasks" && pendingTasks.length === 0) {
      alert("No pending tasks to generate a PDF report.");
      return;
    }
    if (type === "both" && pendingMaterials.length === 0 && pendingTasks.length === 0) {
      alert("No pending materials or tasks to generate a PDF report.");
      return;
    }

    let reportTitle;
    if (type === "materials") reportTitle = "Pending Materials";
    else if (type === "tasks") reportTitle = "Pending Works";
    else reportTitle = "Project Status Report";

    setReportPreview({
      type,
      title: reportTitle,
      projectName: activeProject.name,
      targetDate: activeProject.completionDate,
      materials: pendingMaterials,
      tasks: [...pendingTasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)),
      rooms: activeProject.rooms || []
    });
  };

  const handleGenerateRoomPDF = (e, room) => {
    e.stopPropagation();
    if (!activeProject) return;

    const pendingMaterials = activeProject.materials?.filter(m => (room.id === 'general' ? (!m.roomId || m.roomId === 'general') : m.roomId === room.id) && !m.completed) || [];
    const pendingTasks = activeProject.tasks?.filter(t => (room.id === 'general' ? (!t.roomId || t.roomId === 'general') : t.roomId === room.id) && !t.completed) || [];

    if (pendingMaterials.length === 0 && pendingTasks.length === 0) {
      alert("No pending materials or tasks in this room to generate a PDF.");
      return;
    }

    setReportPreview({
      type: "both",
      title: `${room.name} Report`,
      projectName: activeProject.name,
      targetDate: activeProject.completionDate,
      materials: pendingMaterials,
      tasks: [...pendingTasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority)),
      rooms: activeProject.rooms || []
    });
  };

  const handleShareRoom = (e, room) => {
    e.stopPropagation();
    if (!activeProject) return;

    const pendingMaterials = activeProject.materials?.filter(m => (room.id === 'general' ? (!m.roomId || m.roomId === 'general') : m.roomId === room.id) && !m.completed) || [];
    const pendingTasks = activeProject.tasks?.filter(t => (room.id === 'general' ? (!t.roomId || t.roomId === 'general') : t.roomId === room.id) && !t.completed) || [];

    if (pendingMaterials.length === 0 && pendingTasks.length === 0) {
      alert("No pending materials or tasks in this room to share!");
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = `${dd}/${mm}/${yy}`;

    let text = `*WeaverBird Interior Studio*\n`;
    text += `*Date:* ${dateStr}\n`;
    text += `*Project:* ${activeProject.name}\n`;
    text += `*Room:* ${room.name}\n\n`;

    if (pendingMaterials.length > 0) {
      text += `*Pending Materials:*\n`;
      pendingMaterials.forEach((m) => {
        text += `- ${m.name}\n`;
      });
      text += `\n`;
    }

    if (pendingTasks.length > 0) {
      text += `*Pending Work:*\n`;
      pendingTasks.forEach((t) => {
        text += `- ${t.name}\n`;
      });
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text.trim())}`;
    window.open(url, "_blank");
  };

  // --- EMAIL UTILITIES AND AUTOMATED REPORT SYNC ---

  // Helper to generate a PDF of ALL active projects (used for automatic backup emails)
  const generateAllProjectsPDF = (allProjects) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("WeaverBird", 20, 25);
    
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

  // Shared helper to generate a PDF for a single project report
  const generateSingleProjectPDF = (report) => {
    const doc = new jsPDF();
    
    // WeaverBird Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("WeaverBird", 20, 25);
    
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
      target.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
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
          doc.text("Pending", 160, y + 1);
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
          
          const pStr = (t.priority || "medium").toUpperCase();
          if (t.priority === "high") doc.setTextColor(239, 68, 68);
          else if (t.priority === "low") doc.setTextColor(59, 130, 246);
          else doc.setTextColor(249, 115, 22);

          doc.text(pStr, 160, y + 1);
          doc.setTextColor(51, 65, 85); // reset
          y += 8;
        });
        y += 4; // gap
      }

      y += 6; // Extra gap before next room
    });

    return doc;
  };

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
  const handleEmailReportManually = async () => {
    if (!reportPreview) return;
    
    const targetEmail = recipientEmail === "custom" ? customRecipientEmail : recipientEmail;
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
      
      const emailSubject = `Weaverbird Report: ${reportPreview.projectName} - ${reportPreview.title}`;
      const emailMessage = `Hello,\n\nPlease find attached the ${reportPreview.title} PDF for project "${reportPreview.projectName}" generated from the Weaverbird Interior Studio app.`;
      
      const success = await sendEmailWithAttachment(targetEmail, emailSubject, emailMessage, doc, `${reportPreview.projectName.replace(/\s+/g, '_')}_report.pdf`);
      
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

  // Trigger manual full studio backup report
  const handleSendManualBackup = async () => {
    const targetEmail = recipientEmail === "custom" ? customRecipientEmail : recipientEmail;
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
      const emailSubject = `Manual Backup: Weaverbird Studio`;
      const emailMessage = `Hello,\n\nHere is a manual backup report containing a summary of all active projects in the Weaverbird Interior Studio dashboard.\n\nDate: ${new Date().toLocaleDateString()}`;
      
      const success = await sendEmailWithAttachment(targetEmail, emailSubject, emailMessage, backupPdf, `weaverbird_studio_backup_${new Date().toISOString().split("T")[0]}.pdf`);
      
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
  const handleDownloadPDF = async () => {
    if (!reportPreview) return;

    try {
      // Create the single project PDF using the shared generator function
      const doc = generateSingleProjectPDF(reportPreview);
      
      const fileName = `WeaverBird_${reportPreview.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;
      
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

  // Natively share the generated PDF file directly without downloading/saving it first
  const handleSharePDF = async () => {
    if (!reportPreview) return;

    try {
      // Create the single project PDF using the shared generator function
      const doc = generateSingleProjectPDF(reportPreview);
      
      const fileName = `WeaverBird_${reportPreview.projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Report.pdf`;
      
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
          title: `WeaverBird Report - ${reportPreview.projectName}`,
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
            title: `WeaverBird Report - ${reportPreview.projectName}`,
            text: `Here is the pending report for project: ${reportPreview.projectName}.`
          });
        } else {
          // Fallback text share or clipboard
          let shareText = `*WeaverBird Interior Studio*\n*Project:* ${reportPreview.projectName}\n*Report:* ${reportPreview.title}\n\n`;
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
              title: `WeaverBird Report - ${reportPreview.projectName}`,
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
            <div className="screen-content fade-in" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "30px 24px",
              textAlign: "center",
              backgroundColor: "var(--bg-body)",
              gap: "24px"
            }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "45px",
                backgroundColor: "var(--accent-gold-dark)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "700",
                fontFamily: "var(--font-title)",
                boxShadow: "0 8px 20px rgba(212, 175, 55, 0.2)"
              }}>
                WB
              </div>

              <div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-gold)", letterSpacing: "2px", textTransform: "uppercase" }}>
                  WeaverBird
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text-title)", margin: "4px 0 0 0" }}>
                  Cloud Sync Portal
                </h2>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                  Enter your email address to sync projects and milestones with your team.
                </p>
              </div>

              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  id="login-email-input"
                  type="email"
                  placeholder="your.name@weaverbird.com"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-main)",
                    fontSize: "14px",
                    outline: "none",
                    textAlign: "center"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      document.getElementById("login-connect-btn")?.click();
                    }
                  }}
                />
                
                <button
                  id="login-connect-btn"
                  onClick={async () => {
                    const emailVal = document.getElementById("login-email-input")?.value?.toLowerCase()?.trim();
                    if (!emailVal || !emailVal.includes("@")) {
                      alert("Please enter a valid email address!");
                      return;
                    }
                    setIsConnectingCloud(true);
                    try {
                      setUserEmail(emailVal);
                      localStorage.setItem("weaverbird_user_email", emailVal);
                    } catch (err) {
                      alert(`Connection failed: ${err.message}`);
                    } finally {
                      setIsConnectingCloud(false);
                    }
                  }}
                  disabled={isConnectingCloud}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: "var(--accent-gold-dark)",
                    color: "white",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(212, 175, 55, 0.15)",
                    transition: "all 0.2s"
                  }}
                >
                  {isConnectingCloud ? "Connecting..." : "Connect & Sync"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  First time? Connecting registers you as the Admin.
                </span>
                <button
                  onClick={() => {
                    setCloudSyncEnabled(false);
                    localStorage.setItem("weaverbird_cloud_sync", "false");
                    setIsAuthorized(true);
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    border: "none",
                    fontSize: "12px",
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: "8px"
                  }}
                >
                  Use Local-Only Mode
                </button>
              </div>
            </div>
          ) : !isAuthorized ? (
            <div className="screen-content fade-in" style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              padding: "24px",
              textAlign: "center",
              backgroundColor: "var(--bg-body)",
              gap: "20px"
            }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "40px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                marginBottom: "10px",
                marginTop: "40px"
              }}>
                <AlertTriangle size={40} />
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--text-title)", margin: 0 }}>Access Restricted</h2>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: "1.5" }}>
                Your email <strong>{userEmail}</strong> is not authorized to access WeaverBird Interior Studio's cloud database.
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
                Please ask your administrator to grant access to your email from their settings panel.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: "center", marginTop: "10px" }}>
                <button
                  onClick={() => {
                    setCloudSyncEnabled(false);
                    localStorage.setItem("weaverbird_cloud_sync", "false");
                    setIsAuthorized(true);
                  }}
                  style={{
                    width: "100%",
                    maxWidth: "240px",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent-gold-dark)",
                    color: "white",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Back to Local-Only Mode
                </button>
                <button
                  onClick={() => {
                    setUserEmail("");
                    localStorage.removeItem("weaverbird_user_email");
                    setIsAuthorized(true);
                  }}
                  style={{
                    width: "100%",
                    maxWidth: "240px",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "transparent",
                    color: "var(--text-main)",
                    border: "1px solid var(--border)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Try a Different Email
                </button>
              </div>
            </div>
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
              {activeProjectId === null ? (
                // Dashboard view
                <>
                  <div className="app-header fade-in">
                    <div className="header-left">
                      <div
                        className="header-title-container"
                        style={{ display: "flex", flexDirection: "column" }}
                      >
                        <span
                          className="header-brand"
                          style={{
                            fontSize: "22px",
                            fontWeight: "800",
                            color: "var(--text-title)",
                            fontFamily: "var(--font-title)",
                            lineHeight: "1.1",
                            letterSpacing: "-0.5px",
                          }}
                        >
                          WeaverBird
                        </span>
                        <span
                          className="header-subtitle"
                          style={{
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "var(--accent-gold-dark)",
                            textTransform: "uppercase",
                            letterSpacing: "3.5px",
                            marginTop: "2px",
                            display: "block",
                          }}
                        >
                          Interior Studio
                        </span>
                      </div>
                    </div>
                    <div className="header-right" style={{ display: "flex", alignItems: "center" }}>
                      {(() => {
                        const getStatus = () => {
                          if (!isNetworkOnline) {
                            return {
                              text: "Offline",
                              dotColor: "#ef4444", // Red
                              bg: "rgba(239, 68, 68, 0.1)",
                              border: "rgba(239, 68, 68, 0.2)"
                            };
                          }
                          if (!cloudSyncEnabled) {
                            return {
                              text: "Sync Off",
                              dotColor: "#f59e0b", // Amber
                              bg: "rgba(245, 158, 11, 0.1)",
                              border: "rgba(245, 158, 11, 0.2)"
                            };
                          }
                          return {
                            text: "Online",
                            dotColor: "#10b981", // Emerald Green
                            bg: "rgba(16, 185, 129, 0.1)",
                            border: "rgba(16, 185, 129, 0.2)"
                          };
                        };
                        const status = getStatus();
                        return (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "12px",
                              backgroundColor: status.bg,
                              border: `1px solid ${status.border}`,
                              fontSize: "11px",
                              fontWeight: "700",
                              color: status.dotColor,
                              transition: "all 0.3s ease"
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: status.dotColor,
                                boxShadow: `0 0 8px ${status.dotColor}`,
                                display: "inline-block"
                              }}
                            />
                            {status.text}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="screen-content fade-in">
                    {/* Search */}
                    <div className="search-container">
                      <Search className="search-icon" size={18} />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Project List */}
                    <div className="project-list">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => (
                          <div
                            key={project.id}
                            className="project-card"
                            onClick={() => {
                              setActiveProjectId(project.id);
                              setProjectSubTab("materials"); // default subtab
                            }}
                          >
                            <div className="project-info">
                              <span className="project-name">
                                {project.name}
                              </span>
                              <div
                                className="project-pending-stats"
                                style={{
                                  display: "flex",
                                  gap: "16px",
                                  marginTop: "6px",
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <Briefcase
                                    size={13}
                                    style={{ color: "var(--accent)" }}
                                  />
                                  <span>
                                    Pending Materials:{" "}
                                    <strong>
                                      {project.materials?.filter(
                                        (m) => !m.completed
                                      ).length || 0}
                                    </strong>
                                  </span>
                                </span>
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  <CheckSquare
                                    size={13}
                                    style={{ color: "var(--accent)" }}
                                  />
                                  <span>
                                    Pending Works:{" "}
                                    <strong>
                                      {project.tasks?.filter(
                                        (t) => !t.completed
                                      ).length || 0}
                                    </strong>
                                  </span>
                                </span>
                              </div>
                              {project.completionDate && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    marginTop: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color:
                                      getDaysLeftTextAndColor(project).color,
                                  }}
                                >
                                  <Clock size={12} />
                                  <span>
                                    Target:{" "}
                                    {formatDisplayDateStr(
                                      project.completionDate
                                    )}{" "}
                                    ({getDaysLeftTextAndColor(project).text})
                                  </span>
                                </div>
                              )}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                marginTop: "12px",
                              }}
                            >
                              <span
                                className={`status-pill ${
                                  project.status === "not-started"
                                    ? "not-started"
                                    : project.status
                                }`}
                              >
                                {project.status.replace("-", " ")}
                              </span>
                              <button
                                className="action-icon-btn delete"
                                onClick={(e) =>
                                  handleDeleteProject(project.id, e)
                                }
                                aria-label="Delete Project"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            color: "var(--text-muted)",
                          }}
                        >
                          No projects match your filters.
                        </div>
                      )}
                    </div>
                  </div>
                  {/* No FAB here, handled in bottom-nav */}
                </>
              ) : (
                // Project Detail view (matches Screen 2 & 3 layout)
                <>
                  <div className="app-header fade-in">
                    <div className="header-left">
                      <button
                        className="icon-btn"
                        onClick={() => setActiveProjectId(null)}
                        aria-label="Back"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div
                        className="header-title-container"
                        style={{ maxWidth: "230px" }}
                      >
                        <span className="header-subtitle">WeaverBird</span>
                        <h1 style={{ marginBottom: "2px" }}>
                          {activeProject?.name}
                        </h1>
                        {activeProject?.completionDate && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              color:
                                getDaysLeftTextAndColor(activeProject).color,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Clock size={10} />
                            Target:{" "}
                            {formatDisplayDateStr(
                              activeProject.completionDate
                            )}{" "}
                            ({getDaysLeftTextAndColor(activeProject).text})
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className="header-right"
                      style={{ display: "flex", gap: "8px" }}
                    >
                      <button
                        className="icon-btn"
                        onClick={handleShareProjectOverview}
                        style={{ color: "#25D366" }}
                        aria-label="Share project overview to WhatsApp"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => generatePDFReport("both")}
                        style={{ color: "#ef4444" }}
                        aria-label="Export project report to PDF"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() =>
                          setEditItemModal({
                            type: "project",
                            itemId: activeProject.id,
                            name: activeProject.name,
                            status: activeProject.status,
                            completionDate: activeProject.completionDate || "",
                          })
                        }
                        aria-label="Edit project metadata"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Target Completion Banner removed to reduce vertical spacing as target is already displayed in header */}

                  {activeRoomId === null ? (
                    // ROOMS LIST VIEW
                    <div className="screen-content fade-in" style={{ paddingTop: "12px" }}>
                      <div className="rooms-grid">
                        {(activeProject?.rooms || []).map((room) => (
                          <div 
                            key={room.id} 
                            className="room-card fade-in"
                            onClick={() => setActiveRoomId(room.id)}
                          >
                            <div className="room-card-header">
                              <h3 className="room-card-title">{room.name}</h3>
                              <div className="room-card-actions">
                                <button 
                                  className="room-action-btn edit" 
                                  onClick={(e) => handleEditRoom(e, room.id, room.name)}
                                  title="Edit Room Name"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  className="room-action-btn delete" 
                                  onClick={(e) => handleDeleteRoom(e, room.id)}
                                  title="Delete Room"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="room-card-stats">
                              <span>{activeProject?.materials?.filter(m => m.roomId === room.id && !m.completed).length || 0} materials</span>
                              <span className="dot-separator">•</span>
                              <span>{activeProject?.tasks?.filter(t => t.roomId === room.id && !t.completed).length || 0} tasks</span>
                            </div>
                            <div className="room-card-footer">
                                <button
                                  className="room-action-btn share"
                                  onClick={(e) => handleShareRoom(e, room)}
                                  title="Share Room to WhatsApp"
                                >
                                  <Share2 size={16} />
                                </button>
                                <button
                                  className="room-action-btn pdf"
                                  onClick={(e) => handleGenerateRoomPDF(e, room)}
                                  title="Download Room PDF"
                                >
                                  <FileText size={16} />
                                </button>
                            </div>
                          </div>
                        ))}
                        <div  
                          className="room-card general-room fade-in"
                          onClick={() => setActiveRoomId("general")}
                        >
                          <div className="room-card-header">
                            <h3 className="room-card-title">General / Unassigned</h3>
                          </div>
                          <div className="room-card-stats">
                            <span>{activeProject?.materials?.filter(m => (!m.roomId || m.roomId === "general") && !m.completed).length || 0} materials</span>
                            <span className="dot-separator">•</span>
                            <span>{activeProject?.tasks?.filter(t => (!t.roomId || t.roomId === "general") && !t.completed).length || 0} tasks</span>
                          </div>
                          <div className="room-card-footer">
                                <button
                                  className="room-action-btn share"
                                  onClick={(e) => handleShareRoom(e, { id: 'general', name: 'General / Unassigned' })}
                                  title="Share Room to WhatsApp"
                                >
                                  <Share2 size={16} />
                                </button>
                                <button
                                  className="room-action-btn pdf"
                                  onClick={(e) => handleGenerateRoomPDF(e, { id: 'general', name: 'General / Unassigned' })}
                                  title="Download Room PDF"
                                >
                                  <FileText size={16} />
                                </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // ROOM DETAILS VIEW (Materials & Work tabs)
                    <>
                      {/* Room Header with Back Button to go back to Rooms List */}
                      <div className="room-detail-header fade-in" style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", marginBottom: "5px" }}>
                        <button className="icon-btn" onClick={() => setActiveRoomId(null)} style={{ padding: "4px" }}>
                          <ArrowLeft size={16} />
                        </button>
                        <h2 style={{ fontSize: "16px", margin: 0, color: "var(--text-title)" }}>
                          {activeRoomId === "general" ? "General / Unassigned" : activeProject?.rooms?.find(r => r.id === activeRoomId)?.name || "Room"}
                        </h2>
                      </div>

                      {/* Sub-tabs for Materials and Work */}
                  <div className="tabs-bar-new fade-in">
                    <button
                      className={`tab-btn-new ${
                        projectSubTab === "materials" ? "active" : ""
                      }`}
                      onClick={() => setProjectSubTab("materials")}
                    >
                      Materials
                    </button>
                    <button
                      className={`tab-btn-new ${
                        projectSubTab === "work" ? "active" : ""
                      }`}
                      onClick={() => setProjectSubTab("work")}
                    >
                      Work
                    </button>
                  </div>

                  <div
                    className="screen-content fade-in"
                    style={{ paddingTop: "0px" }}
                  >
                    {projectSubTab === "materials" ? (
                      // MATERIALS SUB-TAB (Screen 2 details)
                      <>
                        <div className="section-header-new">
                          <h2 className="section-title-new">Materials</h2>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="section-count-new">
                              {(activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed).length || 0)} ITEMS
                            </span>
                            <button
                              className="icon-btn"
                              onClick={handleShareMaterials}
                              style={{ color: "#25D366", padding: "6px", background: "none", border: "none" }}
                              title="Share pending materials to WhatsApp"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => generatePDFReport("materials")}
                              style={{ color: "#ef4444", padding: "6px", background: "none", border: "none" }}
                              title="Download materials PDF report"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Add New Material Card */}
                        <div className="quick-add-card-new">
                          <h3 className="quick-add-new-title">Add New Material</h3>
                          {/* <p className="quick-add-new-desc">Enter a material name to add it to this project.</p> */}
                          <form onSubmit={handleAddMaterial} className="quick-add-new-form">
                            <div className="quick-add-input-group-new">
                              <input
                                type="text"
                                className="quick-add-new-input"
                                placeholder="Enter material name"
                                value={newMaterialInput}
                                onChange={(e) => setNewMaterialInput(e.target.value)}
                              />
                              <button type="submit" className="quick-add-new-btn">
                                Add
                              </button>
                            </div>
                          </form>
                        </div>

                        {/* Materials List Table */}
                        <div className="checklist-table-new">
                          <div className="list-columns-subheader-new">
                            <span>DONE</span>
                            <span>ITEM NAME</span>
                            <span className="text-right">ACTIONS</span>
                          </div>

                          {/* Pending Materials List */}
                          <div className="list-rows-container-new">
                            {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed).length > 0 ? (
                              activeProject.materials
                                .filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && !m.completed)
                                .map((mat) => (
                                  <div key={mat.id} className="list-item-row-new">
                                    <label className="checkbox-container-new">
                                      <input
                                        type="checkbox"
                                        checked={mat.completed}
                                        onChange={() => handleToggleMaterial(mat.id)}
                                      />
                                      <span className="checkmark-new"></span>
                                    </label>
                                    <span className="list-item-text-new">
                                      {mat.name}
                                    </span>
                                    <div className="item-actions-new">
                                      <button
                                        className="action-text-btn-new"
                                        onClick={() =>
                                          setEditItemModal({
                                            type: "material",
                                            projectId: activeProject.id,
                                            itemId: mat.id,
                                            name: mat.name,
                                          })
                                        }
                                      >
                                        Edit
                                      </button>
                                      <span className="action-separator-new">|</span>
                                      <button
                                        className="action-text-btn-new delete"
                                        onClick={() => handleDeleteMaterial(mat.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="empty-list-message-new">
                                No pending materials. All clean!
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Completed Materials Section */}
                        <div
                          className="collapsible-header-new"
                          onClick={() => setMaterialsCollapsed(!materialsCollapsed)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="collapsible-title-new" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Clock size={15} />
                              Completed Materials
                            </span>
                            <span className="collapsible-badge-new">
                              {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length || 0}
                            </span>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearCompletedMaterials();
                                }}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                              >
                                Clear Completed
                              </button>
                            )}
                            <span className="collapsible-arrow-new" style={{ display: "flex" }}>
                              {materialsCollapsed ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronUp size={16} />
                              )}
                            </span>
                          </div>
                        </div>

                        {!materialsCollapsed && (
                          <div className="collapsible-content-new">
                            {activeProject?.materials?.filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed).length > 0 ? (
                              activeProject.materials
                                .filter((m) => (activeRoomId === "general" ? (!m.roomId || m.roomId === "general") : m.roomId === activeRoomId) && m.completed)
                                .map((mat) => (
                                  <div key={mat.id} className="list-item-row-new completed-row-new">
                                    <label className="checkbox-container-new">
                                      <input
                                        type="checkbox"
                                        checked={mat.completed}
                                        onChange={() => handleToggleMaterial(mat.id)}
                                      />
                                      <span className="checkmark-new"></span>
                                    </label>
                                    <span className="list-item-text-new completed">
                                      {mat.name}
                                    </span>
                                    <div className="item-actions-new">
                                      <button
                                        className="action-text-btn-new delete"
                                        onClick={() => handleDeleteMaterial(mat.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="empty-list-message-new">
                                No completed materials yet.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      // WORK/TASKS SUB-TAB (Screen 3 details)
                      <>
                        <div className="section-header-new">
                          <h2 className="section-title-new">Work</h2>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="section-count-new">
                              {(activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed).length || 0)} ITEMS
                            </span>
                            <button
                              className="icon-btn"
                              onClick={handleShareTasks}
                              style={{ color: "#25D366", padding: "6px", background: "none", border: "none" }}
                              title="Share pending tasks to WhatsApp"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              className="icon-btn"
                              onClick={() => generatePDFReport("tasks")}
                              style={{ color: "#ef4444", padding: "6px", background: "none", border: "none" }}
                              title="Download works PDF report"
                            >
                              <FileText size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Add New Work Card */}
                        <div className="quick-add-card-new">
                          <h3 className="quick-add-new-title">Add New Work</h3>
                          {/* <p className="quick-add-new-desc">Enter a work description to add it to this project.</p> */}
                          <form onSubmit={handleAddTask} className="quick-add-new-form">
                            <div className="quick-add-input-group-new">
                              <input
                                type="text"
                                className="quick-add-new-input"
                                placeholder="Enter work description"
                                value={newWorkInput}
                                onChange={(e) => setNewWorkInput(e.target.value)}
                              />
                              <button type="submit" className="quick-add-new-btn">
                                Add
                              </button>
                            </div>
                          </form>
                          
                          {/* Priority Selector */}
                          <div className="priority-selector-new">
                            <span className="priority-label-new">Priority:</span>
                            <div className="priority-pills-new">
                              <button
                                type="button"
                                className={`priority-pill-new high ${newTaskPriority === "high" ? "active" : ""}`}
                                onClick={() => setNewTaskPriority("high")}
                              >
                                High
                              </button>
                              <button
                                type="button"
                                className={`priority-pill-new medium ${newTaskPriority === "medium" ? "active" : ""}`}
                                onClick={() => setNewTaskPriority("medium")}
                              >
                                Medium
                              </button>
                              <button
                                type="button"
                                className={`priority-pill-new low ${newTaskPriority === "low" ? "active" : ""}`}
                                onClick={() => setNewTaskPriority("low")}
                              >
                                Low
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tasks List Table */}
                        <div className="checklist-table-new">
                          <div className="list-columns-subheader-new">
                            <span>DONE</span>
                            <span>TASK DESCRIPTION</span>
                            <span className="text-right">ACTIONS</span>
                          </div>

                          {/* Pending Tasks List */}
                          <div className="list-rows-container-new">
                            {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed).length > 0 ? (
                              [...activeProject.tasks]
                                .filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && !t.completed)
                                .sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority))
                                .map((task) => (
                                  <div
                                    key={task.id}
                                    className={`list-item-row-new task-row-new ${
                                      draggedTaskId === task.id ? "dragging-new" : ""
                                    }`}
                                    draggable={true}
                                    onDragStart={(e) => handleTaskDragStart(e, task.id)}
                                    onDragOver={handleTaskDragOver}
                                    onDrop={(e) => handleTaskDrop(e, task.id)}
                                  >
                                    <div className="drag-handle-new">
                                      <GripVertical size={14} />
                                    </div>
                                    <label className="checkbox-container-new">
                                      <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => handleToggleTask(task.id)}
                                      />
                                      <span className="checkmark-new"></span>
                                    </label>
                                    <div className="list-item-text-with-badge-new">
                                      <span className="list-item-text-new">
                                        {task.name}
                                      </span>
                                      <span className={`task-priority-badge-new ${task.priority || "medium"}`}>
                                        {task.priority || "medium"}
                                      </span>
                                    </div>
                                    <div className="item-actions-new">
                                      <button
                                        className="action-text-btn-new"
                                        onClick={() =>
                                          setEditItemModal({
                                            type: "task",
                                            projectId: activeProject.id,
                                            itemId: task.id,
                                            name: task.name,
                                            priority: task.priority || "medium",
                                            dependencies: task.dependencies || [],
                                          })
                                        }
                                      >
                                        Edit
                                      </button>
                                      <span className="action-separator-new">|</span>
                                      <button
                                        className="action-text-btn-new delete"
                                        onClick={() => handleDeleteTask(task.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="empty-list-message-new">
                                No pending tasks. All clean!
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Completed Tasks Section */}
                        <div
                          className="collapsible-header-new"
                          onClick={() => setTasksCollapsed(!tasksCollapsed)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="collapsible-title-new" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Clock size={15} />
                              Completed Tasks
                            </span>
                            <span className="collapsible-badge-new">
                              {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length || 0}
                            </span>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearCompletedTasks();
                                }}
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                              >
                                Clear Completed
                              </button>
                            )}
                            <span className="collapsible-arrow-new" style={{ display: "flex" }}>
                              {tasksCollapsed ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronUp size={16} />
                              )}
                            </span>
                          </div>
                        </div>

                        {!tasksCollapsed && (
                          <div className="collapsible-content-new">
                            {activeProject?.tasks?.filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed).length > 0 ? (
                              activeProject.tasks
                                .filter((t) => (activeRoomId === "general" ? (!t.roomId || t.roomId === "general") : t.roomId === activeRoomId) && t.completed)
                                .map((task) => (
                                  <div key={task.id} className="list-item-row-new completed-row-new">
                                    <label className="checkbox-container-new">
                                      <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => handleToggleTask(task.id)}
                                      />
                                      <span className="checkmark-new"></span>
                                    </label>
                                    <span className="list-item-text-new completed">
                                      {task.name}
                                    </span>
                                    <div className="item-actions-new">
                                      <button
                                        className="action-text-btn-new delete"
                                        onClick={() => handleDeleteTask(task.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="empty-list-message-new">
                                No completed tasks yet.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  </>
                )}
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
                <div className="todo-screen-overlay">
                  <div className="app-header fade-in">
                    <div className="header-left">
                      <button
                        className="icon-btn"
                        onClick={() => setIsTodoScreenOpen(false)}
                        aria-label="Back to Meetings"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <h1>To-Do List</h1>
                    </div>
                    <div className="header-right">
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                        {todos.filter((t) => !t.completed).length} pending
                      </span>
                    </div>
                  </div>

                  <div className="screen-content fade-in" style={{ paddingTop: "12px" }}>
                    {/* Add Todo Form */}
                    <div className="todo-add-form" style={{ marginBottom: "20px" }}>
                      <input
                        type="text"
                        className="todo-add-input"
                        placeholder="What needs to be done?"
                        value={newTodoInput}
                        onChange={(e) => setNewTodoInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newTodoInput.trim()) {
                            const newTodo = {
                              id: "todo_" + Date.now(),
                              text: newTodoInput.trim(),
                              completed: false,
                              createdAt: new Date().toISOString(),
                            };
                            setTodos((prev) => [newTodo, ...prev]);
                            setNewTodoInput("");
                          }
                        }}
                      />
                      <button
                        className="todo-add-btn"
                        onClick={() => {
                          if (newTodoInput.trim()) {
                            const newTodo = {
                              id: "todo_" + Date.now(),
                              text: newTodoInput.trim(),
                              completed: false,
                              createdAt: new Date().toISOString(),
                            };
                            setTodos((prev) => [newTodo, ...prev]);
                            setNewTodoInput("");
                          }
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    {/* Pending Todos */}
                    {todos.filter((t) => !t.completed).length > 0 && (
                      <div className="todo-group">
                        <div className="todo-group-label">Pending</div>
                        <div className="todo-section-card">
                          <div className="todo-items-list">
                            {todos.filter((t) => !t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((todo) => (
                              <div
                                key={todo.id}
                                className="todo-item-row"
                              >
                                <label className="checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => {
                                      setTodos((prev) =>
                                        prev.map((t) =>
                                          t.id === todo.id
                                            ? { ...t, completed: !t.completed }
                                            : t
                                        )
                                      );
                                    }}
                                  />
                                  <span className="checkmark"></span>
                                </label>

                                <div className="todo-item-content">
                                  {editTodoId === todo.id ? (
                                    <input
                                      type="text"
                                      className="todo-edit-input"
                                      value={editTodoText}
                                      autoFocus
                                      onChange={(e) => setEditTodoText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && editTodoText.trim()) {
                                          setTodos((prev) =>
                                            prev.map((t) =>
                                              t.id === todo.id
                                                ? { ...t, text: editTodoText.trim() }
                                                : t
                                            )
                                          );
                                          setEditTodoId(null);
                                          setEditTodoText("");
                                        } else if (e.key === "Escape") {
                                          setEditTodoId(null);
                                          setEditTodoText("");
                                        }
                                      }}
                                      onBlur={() => {
                                        if (editTodoText.trim()) {
                                          setTodos((prev) =>
                                            prev.map((t) =>
                                              t.id === todo.id
                                                ? { ...t, text: editTodoText.trim() }
                                                : t
                                            )
                                          );
                                        }
                                        setEditTodoId(null);
                                        setEditTodoText("");
                                      }}
                                    />
                                  ) : (
                                    <span className="todo-item-text">
                                      {todo.text}
                                    </span>
                                  )}
                                </div>

                                <div className="item-actions">
                                  <button
                                    className="action-icon-btn"
                                    onClick={() => {
                                      setEditTodoId(todo.id);
                                      setEditTodoText(todo.text);
                                    }}
                                    aria-label="Edit Todo"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => {
                                      setTodos((prev) =>
                                        prev.filter((t) => t.id !== todo.id)
                                      );
                                    }}
                                    aria-label="Delete Todo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completed Todos */}
                    {todos.filter((t) => t.completed).length > 0 && (
                      <div className="todo-group">
                        <div className="todo-group-label">Completed</div>
                        <div className="todo-section-card">
                          <div className="todo-items-list">
                            {todos.filter((t) => t.completed).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((todo) => (
                              <div
                                key={todo.id}
                                className="todo-item-row completed"
                              >
                                <label className="checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => {
                                      setTodos((prev) =>
                                        prev.map((t) =>
                                          t.id === todo.id
                                            ? { ...t, completed: !t.completed }
                                            : t
                                        )
                                      );
                                    }}
                                  />
                                  <span className="checkmark"></span>
                                </label>

                                <div className="todo-item-content">
                                  <span className="todo-item-text completed">
                                    {todo.text}
                                  </span>
                                </div>

                                <div className="item-actions">
                                  <button
                                    className="action-icon-btn delete"
                                    onClick={() => {
                                      setTodos((prev) =>
                                        prev.filter((t) => t.id !== todo.id)
                                      );
                                    }}
                                    aria-label="Delete Todo"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {todos.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          color: "var(--text-muted)",
                          fontSize: "14px",
                        }}
                      >
                        <CheckSquare size={40} style={{ marginBottom: "12px", opacity: 0.3 }} />
                        <div>No to-dos yet.</div>
                        <div style={{ fontSize: "12px", marginTop: "4px" }}>Add one using the field above!</div>
                      </div>
                    )}
                  </div>
                </div>
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
                            className={`calendar-day ${
                              hasMeetings ? "has-meetings" : ""
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
                              className={`schedule-item-title ${
                                meet.completed ? "completed" : ""
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
            <>
              <div className="app-header fade-in">
                  <div
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    <span
                      className="header-brand"
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "var(--text-title)",
                        fontFamily: "var(--font-title)",
                        lineHeight: "1.1",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      WeaverBird
                    </span>
                    <span
                      className="header-subtitle"
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        color: "var(--accent-gold-dark)",
                        textTransform: "uppercase",
                        letterSpacing: "3.5px",
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      Interior Studio
                    </span>
                  </div>
                <div className="header-right">
                  <button
                    className="icon-btn"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                  >
                    {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                </div>
              </div>

              <div className="screen-content fade-in">
                {/* Profile card */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "24px 0",
                    gap: "10px",
                  }}
                >
                  <div
                    className="profile-avatar-large"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "40px",
                      fontSize: "32px",
                      backgroundColor: "var(--accent-gold-dark)",
                      color: "white",
                    }}
                  >
                    WB
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-title)",
                      fontSize: "22px",
                      color: "var(--text-title)",
                      fontWeight: 700,
                    }}
                  >
                    WeaverBird
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginTop: "-4px",
                    }}
                  >
                    Interior Studio
                  </p>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      backgroundColor: "var(--bg-main)",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      marginTop: "4px",
                      fontWeight: 600,
                    }}
                  >
                    Version: v{WEB_APP_VERSION}
                  </span>

                  {/* Update System Monitor Card */}
                  <div style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--bg-main)",
                    fontSize: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    width: "80%",
                    maxWidth: "280px",
                    textAlign: "left"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "2px", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 700, color: "var(--accent-gold-dark)", textTransform: "uppercase", fontSize: "9px", letterSpacing: "1px" }}>
                        OTA Update Status
                      </span>
                      <button 
                        onClick={() => checkUpdate(true)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "2px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "var(--accent-gold-dark)",
                          opacity: 0.8,
                          transition: "opacity 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                        title="Check for update"
                      >
                        <RotateCcw size={10} />
                      </button>
                    </div>
                    <div><strong>Status:</strong> {updateDebugInfo.status}</div>
                    <div><strong>DB Version:</strong> {updateDebugInfo.latestVersion}</div>
                    {updateDebugInfo.isNative && (
                      <div style={{ wordBreak: "break-all", fontSize: "9px", color: "var(--text-muted)" }}><strong>DB URL:</strong> {updateDebugInfo.latestUrl}</div>
                    )}
                    {updateDebugInfo.error !== "None" && (
                      <div style={{ color: "#ef4444" }}><strong>Error:</strong> {updateDebugInfo.error}</div>
                    )}
                  </div>
                </div>

                {/* Settings list */}
                <div className="settings-section">
                  <div className="settings-section-title">App Settings</div>

                  {/* Dark Theme toggle removed from settings list as it is already present in the profile header */}

                  <div className="settings-row">
                    <div className="settings-row-left">
                      <Sliders size={16} className="settings-row-icon" />
                      <span>Notifications</span>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-section">
                  <div className="settings-section-title">Cloud Synchronization</div>

                  <div className="settings-row" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "10px", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="settings-row-left">
                        <Sliders size={16} className="settings-row-icon" />
                        <span style={{ fontWeight: 600 }}>Enable Cloud Sync</span>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={cloudSyncEnabled}
                          onChange={(e) => {
                            if (!isConfigured) {
                              alert("Firebase keys are not configured yet! Open 'src/firebase.js' and add your API keys first.");
                              return;
                            }
                            const val = e.target.checked;
                            setCloudSyncEnabled(val);
                            localStorage.setItem("weaverbird_cloud_sync", String(val));
                            if (val) {
                              setHasLoadedProjectsFromCloud(false);
                              setHasLoadedScheduleFromCloud(false);
                            } else {
                              setIsAuthorized(true);
                            }
                          }}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    {!isConfigured && (
                      <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px" }}>
                        ⚠️ Firebase keys not set in <code>src/firebase.js</code>. Local-only mode is active.
                      </div>
                    )}

                    {cloudSyncEnabled && isConfigured && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        {!userEmail ? (
                          <div>
                            <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Your Email Address:</label>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <input
                                id="settings-email-input"
                                type="email"
                                placeholder="name@weaverbird.com"
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border)",
                                  backgroundColor: "var(--bg-card)",
                                  color: "var(--text-main)",
                                  fontSize: "13px"
                                }}
                              />
                              <button
                                onClick={() => {
                                  const emailVal = document.getElementById("settings-email-input")?.value?.toLowerCase()?.trim();
                                  if (!emailVal || !emailVal.includes("@")) {
                                    alert("Please enter a valid email address!");
                                    return;
                                  }
                                  setUserEmail(emailVal);
                                  localStorage.setItem("weaverbird_user_email", emailVal);
                                }}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "8px",
                                  backgroundColor: "var(--accent-gold-dark)",
                                  color: "white",
                                  border: "none",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer"
                                }}
                              >
                                Connect
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Connected Account:</span>
                                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>{userEmail}</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (confirm("Are you sure you want to logout and disconnect from cloud sync?")) {
                                    setUserEmail("");
                                    localStorage.removeItem("weaverbird_user_email");
                                    localStorage.removeItem("weaverbird_user_role");
                                    setIsAuthorized(true);
                                  }
                                }}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "8px",
                                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px"
                                }}
                              >
                                <LogOut size={13} />
                                Logout
                              </button>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "8px", fontSize: "12px" }}>
                              <span>Role: <strong style={{ color: "var(--accent-gold)" }}>{(userRole || "editor").toUpperCase()}</strong></span>
                              <span>Status: {isAuthorized ? <strong style={{ color: "#22c55e" }}>AUTHORIZED</strong> : <strong style={{ color: "#ef4444" }}>PENDING APPROVAL</strong>}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ADMIN PANEL - Only displays if current user is admin */}
                  {cloudSyncEnabled && isConfigured && userRole === "admin" && isAuthorized && (
                    <div className="settings-row" style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "12px", padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
                      <div 
                        onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", width: "100%" }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--accent-gold-dark)", fontSize: "13px", letterSpacing: "1px", textTransform: "uppercase" }}>Admin Access Panel</span>
                        {isAdminPanelOpen ? <ChevronUp size={16} style={{ color: "var(--accent-gold-dark)" }} /> : <ChevronDown size={16} style={{ color: "var(--accent-gold-dark)" }} />}
                      </div>
                      
                      {isAdminPanelOpen && (
                        <>
                          {/* Invite new user */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            <label style={{ fontSize: "11px", color: "var(--text-muted)" }}>Invite Partner / Subcontractor Email:</label>
                            <input
                              id="invite-email-input"
                              type="email"
                              placeholder="partner@weaverbird.com"
                              style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-card)",
                                color: "var(--text-main)",
                                fontSize: "13.5px",
                                outline: "none"
                              }}
                            />
                            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                              <select
                                id="invite-role-select"
                                defaultValue="editor"
                                style={{
                                  flex: 1,
                                  padding: "10px",
                                  borderRadius: "8px",
                                  border: "1px solid var(--border)",
                                  backgroundColor: "var(--bg-card)",
                                  color: "var(--text-main)",
                                  fontSize: "13px",
                                  outline: "none"
                                }}
                              >
                                <option value="editor">Editor Access</option>
                                <option value="admin">Admin Access</option>
                              </select>
                              <button
                                onClick={async () => {
                                  const emailEl = document.getElementById("invite-email-input");
                                  const roleEl = document.getElementById("invite-role-select");
                                  const emailVal = emailEl?.value?.toLowerCase()?.trim();
                                  const roleVal = roleEl?.value;
                                  
                                  if (!emailVal || !emailVal.includes("@")) {
                                    alert("Please enter a valid email to invite.");
                                    return;
                                  }
                                  try {
                                    await setDoc(doc(db, "users", emailVal), { role: roleVal });
                                    alert(`Successfully granted ${roleVal} access to ${emailVal}!`);
                                    if (emailEl) emailEl.value = "";
                                  } catch (err) {
                                    alert(`Failed to add user: ${err.message}`);
                                  }
                                }}
                                style={{
                                  padding: "10px 20px",
                                  borderRadius: "8px",
                                  backgroundColor: "var(--accent-gold-dark)",
                                  color: "white",
                                  border: "none",
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  boxShadow: "0 4px 10px rgba(212, 175, 55, 0.15)"
                                }}
                              >
                                Add Partner
                              </button>
                            </div>
                          </div>

                          {/* Authorized users list */}
                          <div style={{ marginTop: "8px" }}>
                            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Users With Access ({authorizedUsers.length})</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
                              {authorizedUsers.map(u => (
                                <div
                                  key={u.email}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    backgroundColor: "var(--bg-body)",
                                    border: "1px solid var(--border)"
                                  }}
                                >
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-main)" }}>{u.email}</span>
                                    <span style={{ fontSize: "10px", color: "var(--accent-gold)" }}>Role: {u.role.toUpperCase()}</span>
                                  </div>
                                  
                                  {u.email !== userEmail.toLowerCase().trim() ? (
                                    <div style={{ display: "flex", gap: "6px" }}>
                                      <select
                                        value={u.role}
                                        onChange={async (e) => {
                                          try {
                                            await setDoc(doc(db, "users", u.email), { role: e.target.value });
                                          } catch (err) {
                                            alert(`Failed to update role: ${err.message}`);
                                          }
                                        }}
                                        style={{
                                          padding: "4px",
                                          borderRadius: "6px",
                                          border: "1px solid var(--border)",
                                          backgroundColor: "var(--bg-card)",
                                          color: "var(--text-main)",
                                          fontSize: "11px"
                                        }}
                                      >
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to revoke access for ${u.email}?`)) {
                                            try {
                                              await deleteDoc(doc(db, "users", u.email));
                                            } catch (err) {
                                              alert(`Failed to revoke access: ${err.message}`);
                                            }
                                          }
                                        }}
                                        style={{
                                          padding: "4px 8px",
                                          borderRadius: "6px",
                                          backgroundColor: "#ef4444",
                                          color: "white",
                                          border: "none",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          cursor: "pointer"
                                        }}
                                      >
                                        Revoke
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>You</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="settings-section">
                  <div className="settings-section-title">Data Security & Recovery</div>

                  {/* Recycle Bin row */}
                  <div 
                    className="settings-row"
                    onClick={() => setIsTrashBinOpen(true)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div className="settings-row-left">
                      <Trash2 size={16} className="settings-row-icon" />
                      <span>Recycle Bin (Trash)</span>
                    </div>
                    <span style={{ 
                      fontSize: "12px", 
                      backgroundColor: "rgba(212, 175, 55, 0.15)", 
                      color: "var(--accent-gold)", 
                      padding: "2px 8px", 
                      borderRadius: "12px",
                      fontWeight: 600
                    }}>
                      {projects.filter(p => p.isTrashed).length} item(s)
                    </span>
                  </div>

                  {/* Local Backups row */}
                  <div 
                    className="settings-row"
                    onClick={() => setIsBackupsListOpen(true)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div className="settings-row-left">
                      <Clock size={16} className="settings-row-icon" />
                      <span>Restore Backup Snapshots</span>
                    </div>
                    <span style={{ 
                      fontSize: "12px", 
                      color: "var(--text-muted)",
                      fontWeight: 600
                    }}>
                      View history
                    </span>
                  </div>
                </div>

                {userRole === "admin" && (
                  <div className="settings-section">
                    <div 
                      className="settings-section-title" 
                      onClick={() => setIsEmailReportsOpen(!isEmailReportsOpen)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    >
                      <span>Email Reports & Automation</span>
                      {isEmailReportsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                    
                    {isEmailReportsOpen && (
                      <>
                        {/* Part 1: Quick Send Manual Backup */}
                        <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                            Send Manual Studio Backup
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Send a complete PDF report of all active projects immediately:
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                            <select
                              value={recipientEmail}
                              onChange={(e) => setRecipientEmail(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "12.5px"
                              }}
                            >
                              {userEmail && <option value={userEmail.toLowerCase().trim()}>Myself ({userEmail})</option>}
                              
                              {/* Custom backupRecipients list */}
                              {backupRecipients.map(email => (
                                <option key={email} value={email}>{email} (Recipient)</option>
                              ))}
                              
                              {/* Other partners */}
                              {authorizedUsers.map(u => u.email.toLowerCase().trim())
                                .filter(email => email !== userEmail.toLowerCase().trim() && !backupRecipients.includes(email))
                                .map(email => (
                                  <option key={email} value={email}>{email} (Partner)</option>
                                ))
                              }
                              
                              <option value="custom">Other Email...</option>
                            </select>
                            
                            <button
                              onClick={handleSendManualBackup}
                              disabled={isSendingEmail}
                              style={{
                                width: "100%",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                padding: "10px 16px",
                                backgroundColor: isSendingEmail ? "var(--border)" : "var(--accent-gold)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "12.5px",
                                cursor: isSendingEmail ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "0 4px 10px rgba(212, 175, 55, 0.15)"
                              }}
                              onMouseEnter={(e) => {
                                if (!isSendingEmail) {
                                  e.currentTarget.style.backgroundColor = "var(--accent-gold-dark)";
                                  e.currentTarget.style.boxShadow = "0 6px 14px rgba(212, 175, 55, 0.25)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSendingEmail) {
                                  e.currentTarget.style.backgroundColor = "var(--accent-gold)";
                                  e.currentTarget.style.boxShadow = "0 4px 10px rgba(212, 175, 55, 0.15)";
                                }
                              }}
                            >
                              {isSendingEmail ? (
                                <>
                                  <div className="spinner-mini" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Mail size={13} />
                                  <span>Send Now</span>
                                </>
                              )}
                            </button>
                          </div>

                          {recipientEmail === "custom" && (
                            <input
                              type="email"
                              placeholder="partner@example.com"
                              value={customRecipientEmail}
                              onChange={(e) => setCustomRecipientEmail(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "12.5px"
                              }}
                            />
                          )}
                        </div>

                        {/* Google Apps Script Integration Config */}
                        <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                            Google Apps Script Web App URL
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Paste your Google Script URL to send email reports for free using your Gmail account:
                          </div>

                          {import.meta.env.VITE_GOOGLE_SCRIPT_URL ? (
                            <div style={{ 
                              width: "100%", 
                              padding: "8px 12px", 
                              backgroundColor: "rgba(34, 197, 94, 0.1)", 
                              border: "1px solid rgba(34, 197, 94, 0.2)", 
                              color: "#22c55e",
                              borderRadius: "8px", 
                              fontSize: "12px",
                              fontWeight: 600
                            }}>
                              ✓ Configured via environment variable (.env)
                            </div>
                          ) : (
                            <input
                              type="url"
                              placeholder="https://script.google.com/macros/s/.../exec"
                              value={googleScriptUrl}
                              onChange={(e) => setGoogleScriptUrl(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "12.5px"
                              }}
                            />
                          )}
                        </div>

                        {/* Part 2: Mailing List Directory Manager */}
                        <div className="settings-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", cursor: "default", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                            Mailing List Directory
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            Manage which email addresses appear in your quick-select mailing directory:
                          </div>

                          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                            <input
                              type="email"
                              placeholder="client-or-partner@example.com"
                              value={newRecipientInput}
                              onChange={(e) => setNewRecipientInput(e.target.value)}
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-main)",
                                color: "var(--text-main)",
                                fontSize: "12.5px"
                              }}
                            />
                            <button
                              onClick={() => {
                                const cleanInput = newRecipientInput.toLowerCase().trim();
                                if (!cleanInput || !cleanInput.includes("@")) {
                                  alert("Please enter a valid email address.");
                                  return;
                                }
                                if (backupRecipients.includes(cleanInput)) {
                                  alert("This email is already in the list.");
                                  return;
                                }
                                setBackupRecipients([...backupRecipients, cleanInput]);
                                setNewRecipientInput("");
                              }}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "var(--accent-gold)",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "12.5px",
                                cursor: "pointer"
                              }}
                            >
                              Add
                            </button>
                          </div>

                          {backupRecipients.length > 0 ? (
                            <div style={{
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                              maxHeight: "120px",
                              overflowY: "auto",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "8px",
                              backgroundColor: "var(--bg-main)",
                              marginTop: "4px"
                            }}>
                              {backupRecipients.map(email => (
                                <div key={email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "4px 8px", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                                  <span style={{ color: "var(--text-main)" }}>{email}</span>
                                  <button
                                    onClick={() => {
                                      setBackupRecipients(backupRecipients.filter(e => e !== email));
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      color: "#ef4444",
                                      cursor: "pointer",
                                      padding: "2px"
                                    }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>
                              No custom recipient emails added. Add above to build your quick mailing list directory.
                            </div>
                          )}
                        </div>

                        {/* Part 3: Automated backup status row */}
                        <div className="settings-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "default" }}>
                          <div className="settings-row-left">
                            <Mail size={16} className="settings-row-icon" style={{ color: "var(--text-muted)", marginRight: "8px" }} />
                            <span>3-Day Auto Backup Email</span>
                          </div>
                          <span style={{ 
                            fontSize: "12px", 
                            color: "var(--text-muted)",
                            fontWeight: 600
                          }}>
                            {lastEmailBackupDate ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <span>Last: {new Date(lastEmailBackupDate).toLocaleDateString()}</span>
                                <span style={{ fontSize: "10px", color: "var(--accent-gold)", marginTop: "2px", fontWeight: "normal" }}>
                                  {(() => {
                                    const lastSent = new Date(lastEmailBackupDate).getTime();
                                    const nextBackupTime = lastSent + (3 * 24 * 60 * 60 * 1000);
                                    const diffMs = nextBackupTime - Date.now();
                                    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
                                    if (diffDays <= 0) return "Next: Due today";
                                    return `Next: In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
                                  })()}
                                </span>
                              </div>
                            ) : "Pending"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="settings-section">
                  <div className="settings-section-title">Database & Sync</div>

                  <div
                    className="settings-row"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Do you want to clear all local app data? This will reset this device to a clean state and disconnect it from cloud sync, without deleting any shared data from the cloud."
                        )
                      ) {
                        localStorage.setItem("weaverbird_cloud_sync", "false");
                        localStorage.setItem("weaverbird_user_email", "");
                        localStorage.setItem("weaverbird_user_role", "");
                        localStorage.setItem("weaverbird_user_authorized", "true");
                        localStorage.setItem(
                          "ipm_projects",
                          JSON.stringify([])
                        );
                        localStorage.setItem(
                          "ipm_schedule",
                          JSON.stringify([])
                        );
                        window.location.reload();
                      }
                    }}
                  >
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>
                      Reset App Data
                    </span>
                  </div>

                  <div className="settings-row" style={{ cursor: "default" }}>
                    <div className="settings-row-left">
                      <span>App Version</span>
                    </div>
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {WEB_APP_VERSION} (Production)
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 16px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    letterSpacing: "0.5px",
                  }}
                >
                  <p>
                    © {new Date().getFullYear()} WeaverBird Interior Studio.
                  </p>
                  <p style={{ marginTop: "4px", opacity: 0.7 }}>
                    All rights reserved.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* PERSISTENT BOTTOM NAVIGATION BAR */}
          {!isKeyboardVisible && (
            <div className="bottom-nav">
              <button
                className={`nav-tab ${currentTab === "projects" ? "active" : ""}`}
                onClick={() => {
                  setCurrentTab("projects");
                  setActiveProjectId(null); // Return to project dashboard list
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
                style={{ visibility: currentTab === "profile" ? "hidden" : "visible" }}
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

          {/* Report Preview Modal (In-App sheet to avoid freezing/loading bugs on phones) */}
          {reportPreview && (
            <div
              className="modal-overlay"
              onClick={() => setReportPreview(null)}
              style={{ zIndex: 2000 }}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ padding: "24px 20px" }}
              >
                <div className="modal-header" style={{ marginBottom: "16px" }}>
                  <h3 style={{ textTransform: "uppercase", fontSize: "16px", letterSpacing: "1px" }}>
                    Report Preview
                  </h3>
                  <button
                    className="icon-btn"
                    onClick={() => setReportPreview(null)}
                    aria-label="Close Preview"
                    style={{ padding: "4px" }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <div 
                  className="report-preview-box" 
                  style={{
                    backgroundColor: "var(--bg-app)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "20px",
                    color: "var(--text-main)",
                    maxHeight: "350px",
                    overflowY: "auto",
                    marginBottom: "20px"
                  }}
                >
                  <div style={{ borderBottom: "2px solid var(--accent-gold)", paddingBottom: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-title)", fontSize: "20px", fontWeight: "800", color: "var(--text-title)" }}>WeaverBird</div>
                      <div style={{ fontFamily: "var(--font-title)", fontSize: "10px", fontWeight: "600", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "2px" }}>Interior Studio</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "right" }}>
                      <strong>Date:</strong> {new Date().toLocaleDateString("en-GB")}
                    </div>
                  </div>

                  <div style={{ backgroundColor: "rgba(0, 0, 0, 0.02)", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                    <div style={{ marginBottom: "4px" }}><strong>Project:</strong> {reportPreview.projectName}</div>
                    <div><strong>Target Deadline:</strong> {reportPreview.targetDate ? formatDisplayDateStr(reportPreview.targetDate) : "No Date Set"}</div>
                  </div>

                  <h4 style={{ fontFamily: "var(--font-title)", fontSize: "14px", fontWeight: "700", marginBottom: "10px", color: "var(--text-title)", borderLeft: "3px solid var(--accent-gold)", paddingLeft: "8px" }}>
                    {reportPreview.title}
                  </h4>

                  {/* Content grouped by room */}
                  {(() => {
                    const materialsByRoom = {};
                    (reportPreview.materials || []).forEach(m => {
                      const rid = m.roomId || 'general';
                      if (!materialsByRoom[rid]) materialsByRoom[rid] = [];
                      materialsByRoom[rid].push(m);
                    });

                    const tasksByRoom = {};
                    (reportPreview.tasks || []).forEach(t => {
                      const rid = t.roomId || 'general';
                      if (!tasksByRoom[rid]) tasksByRoom[rid] = [];
                      tasksByRoom[rid].push(t);
                    });

                    const allRoomIds = [...new Set([...Object.keys(materialsByRoom), ...Object.keys(tasksByRoom)])];

                    if (allRoomIds.length === 0) {
                      return <div style={{ fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>No pending items found.</div>;
                    }

                    return allRoomIds.map(roomId => {
                      let roomName = 'General / Unassigned';
                      if (roomId !== 'general') {
                        const r = (reportPreview.rooms || []).find(x => x.id === roomId);
                        if (r) roomName = r.name;
                      }

                      const rMaterials = materialsByRoom[roomId] || [];
                      const rTasks = tasksByRoom[roomId] || [];

                      return (
                        <div key={roomId} style={{ marginBottom: "20px", padding: "12px", backgroundColor: "rgba(0,0,0,0.02)", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                          <h5 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800", color: "var(--accent-blue)", borderBottom: "2px solid var(--border-hover)", paddingBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {roomName}
                          </h5>

                          {(reportPreview.type === "materials" || reportPreview.type === "both") && rMaterials.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Materials</div>
                              {rMaterials.map((m, idx) => (
                                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
                                  <span>• {m.name}</span>
                                  <span style={{ color: "var(--text-muted)" }}>Pending</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {(reportPreview.type === "tasks" || reportPreview.type === "both") && rTasks.length > 0 && (
                            <div>
                              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Works</div>
                              {rTasks.map((t, idx) => (
                                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed var(--border)", fontSize: "12px" }}>
                                  <span>• {t.name}</span>
                                  <span style={{ 
                                    textTransform: "uppercase", 
                                    fontSize: "10px", 
                                    fontWeight: "700",
                                    color: t.priority === "high" ? "#ef4444" : t.priority === "medium" ? "#f97316" : "#3b82f6"
                                  }}>{t.priority || "medium"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    className="btn-primary"
                    onClick={handleDownloadPDF}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "14px",
                      backgroundColor: "var(--accent-gold)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    Download PDF Report
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleSharePDF}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "transparent",
                      color: "var(--text-main)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    Share PDF Report
                  </button>

                  {/* Email PDF Section */}
                  <div style={{
                    marginTop: "12px",
                    borderTop: "1px dashed var(--border)",
                    paddingTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>
                      Email PDF Report to Partner
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <select
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-main)",
                            color: "var(--text-main)",
                            fontSize: "13px"
                          }}
                        >
                          {userEmail && <option value={userEmail.toLowerCase().trim()}>Myself ({userEmail})</option>}
                          
                          {/* Custom backupRecipients list */}
                          {backupRecipients.map(email => (
                            <option key={email} value={email}>{email} (Recipient)</option>
                          ))}
                          
                          {/* Other partners */}
                          {authorizedUsers.map(u => u.email.toLowerCase().trim())
                            .filter(email => email !== userEmail.toLowerCase().trim() && !backupRecipients.includes(email))
                            .map(email => (
                              <option key={email} value={email}>{email} (Partner)</option>
                            ))
                          }
                          
                          <option value="custom">Other Email...</option>
                        </select>
                        
                        <button
                          onClick={handleEmailReportManually}
                          disabled={isSendingEmail}
                          style={{
                            width: "100%",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 16px",
                            backgroundColor: isSendingEmail ? "var(--border)" : "var(--accent-gold)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: isSendingEmail ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            boxShadow: "0 4px 10px rgba(212, 175, 55, 0.15)"
                          }}
                          onMouseEnter={(e) => {
                            if (!isSendingEmail) {
                              e.currentTarget.style.backgroundColor = "var(--accent-gold-dark)";
                              e.currentTarget.style.boxShadow = "0 6px 14px rgba(212, 175, 55, 0.25)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSendingEmail) {
                              e.currentTarget.style.backgroundColor = "var(--accent-gold)";
                              e.currentTarget.style.boxShadow = "0 4px 10px rgba(212, 175, 55, 0.15)";
                            }
                          }}
                        >
                          {isSendingEmail ? (
                            <>
                              <div className="spinner-mini" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail size={13} />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>

                      {recipientEmail === "custom" && (
                        <input
                          type="email"
                          placeholder="partner@example.com"
                          value={customRecipientEmail}
                          onChange={(e) => setCustomRecipientEmail(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "var(--bg-main)",
                            color: "var(--text-main)",
                            fontSize: "13px"
                          }}
                        />
                      )}
                    </div>
                    {!(import.meta.env.VITE_EMAILJS_SERVICE_ID || emailJsServiceId) && (
                      <span style={{ fontSize: "11px", color: "#ef4444" }}>
                        ⚠️ Email service is not configured in the application environment (.env).
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recycle Bin (Trash) Modal */}
          {isTrashBinOpen && (
            <div className="modal-overlay" onClick={() => setIsTrashBinOpen(false)} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "100%", borderRadius: "16px", padding: "24px", maxHeight: "85vh" }}>
                <div className="modal-header" style={{ marginBottom: "20px" }}>
                  <h3>Recycle Bin (Trash)</h3>
                  <button className="icon-btn" onClick={() => setIsTrashBinOpen(false)}>
                    <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", padding: "8px 0" }}>
                  {projects.filter(p => p.isTrashed).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                      <Trash2 size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                      <p style={{ fontSize: "14px" }}>Your Recycle Bin is empty.</p>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {userRole !== "admin" && (
                          <span style={{ fontSize: "11.5px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            * Only Administrators can permanently empty trash.
                          </span>
                        )}
                        {userRole === "admin" && (
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to permanently delete all projects in the trash? This cannot be undone!")) {
                                const trashedIds = projects.filter(p => p.isTrashed).map(p => p.id);
                                setProjects(projects.filter(p => !p.isTrashed));
                                setDeletedProjectIds(prev => [...new Set([...prev, ...trashedIds])]);
                              }
                            }}
                            style={{
                              padding: "8px 12px",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginLeft: "auto"
                            }}
                          >
                            <Trash2 size={13} />
                            Empty Trash
                          </button>
                        )}
                      </div>

                      {projects.filter(p => p.isTrashed).map((p) => (
                        <div key={p.id} style={{
                          padding: "16px",
                          borderRadius: "12px",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--bg-card)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "12px"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-main)" }}>{p.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              Trashed on: {p.trashedAt ? new Date(p.trashedAt).toLocaleString() : "Unknown"}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            {/* Restore Button */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to restore the project "${p.name}"?`)) {
                                  setProjects(projects.map(proj => proj.id === p.id ? { ...proj, isTrashed: false, trashedAt: null } : proj));
                                  alert(`Successfully restored "${p.name}"!`);
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "rgba(34, 197, 94, 0.1)",
                                color: "#22c55e",
                                border: "1px solid rgba(34, 197, 94, 0.2)",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <Undo size={12} />
                              Restore
                            </button>

                            {/* Delete Permanently Button - Admin Only */}
                            {userRole === "admin" && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to permanently delete "${p.name}"? This cannot be undone!`)) {
                                    setProjects(projects.filter(proj => proj.id !== p.id));
                                    setDeletedProjectIds(prev => [...new Set([...prev, p.id])]);
                                  }
                                }}
                                style={{
                                  padding: "6px 10px",
                                  backgroundColor: "transparent",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.2)",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                  cursor: "pointer"
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Local Backups Modal */}
          {isBackupsListOpen && (
            <div className="modal-overlay" onClick={() => setIsBackupsListOpen(false)} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "100%", borderRadius: "16px", padding: "24px", maxHeight: "85vh" }}>
                <div className="modal-header" style={{ marginBottom: "20px" }}>
                  <h3>Local Backup Snapshots</h3>
                  <button className="icon-btn" onClick={() => setIsBackupsListOpen(false)}>
                    <ArrowLeft size={18} style={{ transform: "rotate(-90deg)" }} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "400px", overflowY: "auto", padding: "8px 0" }}>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                    The app saves backup snapshots of your projects locally before sync modifications are made. If you ever lose data, select a timestamped backup below to restore your projects state.
                  </p>

                  {userRole !== "admin" && (
                    <div style={{
                      padding: "10px 14px",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#ef4444",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 500,
                      lineHeight: "1.4"
                    }}>
                      ⚠️ Admin-Only Action: You can view the backup history list, but only administrators can execute a restore.
                    </div>
                  )}

                  {(() => {
                    const savedRecentRaw = localStorage.getItem("ipm_projects_backups_recent");
                    const recentBackups = savedRecentRaw ? JSON.parse(savedRecentRaw) : [];

                    const savedDailyRaw = localStorage.getItem("ipm_projects_backups_daily");
                    const dailyBackups = savedDailyRaw ? JSON.parse(savedDailyRaw) : [];

                    if (recentBackups.length === 0 && dailyBackups.length === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                          <Clock size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
                          <p style={{ fontSize: "14px" }}>No backup snapshots found yet.</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Recent Section */}
                        {recentBackups.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Recent Changes (Session Backup)
                            </h4>
                            {recentBackups.map((b, index) => (
                              <div key={`recent-${index}`} style={{
                                padding: "12px 16px",
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-card)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px"
                              }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                                  <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                                    {new Date(b.timestamp).toLocaleString()}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                    {b.projects.length} project(s)
                                  </span>
                                </div>
                                {userRole === "admin" ? (
                                  <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to restore the backup from ${new Date(b.timestamp).toLocaleString()}?`)) {
                                      isRemoteChange.current = false;
                                      const restoredIds = b.projects.map(bp => bp.id);
                                      const updatedDeletedIds = deletedProjectIds.filter(id => !restoredIds.includes(id));
                                      setDeletedProjectIds(updatedDeletedIds);
                                      localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(updatedDeletedIds));
                                      localStorage.setItem("ipm_projects", JSON.stringify(b.projects));
                                      
                                      b.projects.forEach((proj) => {
                                         syncProjectToCloud(proj);
                                         if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail) {
                                           deleteDoc(doc(db, "deleted_projects", proj.id))
                                             .catch(err => console.error("Failed to remove from deleted_projects:", err));
                                         }
                                       });
                                       projects.forEach((proj) => {
                                         if (!b.projects.some(bp => bp.id === proj.id)) {
                                           deleteProjectFromCloud(proj.id);
                                         }
                                       });
                                       setProjects(b.projects);
                                      setIsBackupsListOpen(false);
                                      alert("Backup successfully restored!");
                                    }
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "rgba(212, 175, 55, 0.1)",
                                    color: "var(--accent-gold)",
                                    border: "1px solid rgba(212, 175, 55, 0.2)",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <RotateCcw size={11} />
                                  Restore
                                </button>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", border: "1px dashed var(--border)", padding: "4px 8px", borderRadius: "6px" }}>
                                    Admin Only
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Daily Section */}
                        {dailyBackups.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Daily Checkpoints (Last 30 Days)
                            </h4>
                            {dailyBackups.map((b, index) => (
                              <div key={`daily-${index}`} style={{
                                padding: "12px 16px",
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                backgroundColor: "var(--bg-card)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "12px"
                              }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                                  <span style={{ fontWeight: 600, fontSize: "13.5px", color: "var(--text-main)" }}>
                                    {new Date(b.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </span>
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                    Saved at {new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {b.projects.length} project(s)
                                  </span>
                                </div>
                                {userRole === "admin" ? (
                                  <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to restore the daily backup from ${new Date(b.timestamp).toLocaleDateString()}?`)) {
                                      isRemoteChange.current = false;
                                      const restoredIds = b.projects.map(bp => bp.id);
                                      const updatedDeletedIds = deletedProjectIds.filter(id => !restoredIds.includes(id));
                                      setDeletedProjectIds(updatedDeletedIds);
                                      localStorage.setItem("ipm_deleted_project_ids", JSON.stringify(updatedDeletedIds));
                                      localStorage.setItem("ipm_projects", JSON.stringify(b.projects));
                                      
                                      b.projects.forEach((proj) => {
                                         syncProjectToCloud(proj);
                                         if (isConfigured && db && cloudSyncEnabled && isAuthorized && userEmail) {
                                           deleteDoc(doc(db, "deleted_projects", proj.id))
                                             .catch(err => console.error("Failed to remove from deleted_projects:", err));
                                         }
                                       });
                                       projects.forEach((proj) => {
                                         if (!b.projects.some(bp => bp.id === proj.id)) {
                                           deleteProjectFromCloud(proj.id);
                                         }
                                       });
                                       setProjects(b.projects);
                                      setIsBackupsListOpen(false);
                                      alert("Daily backup successfully restored!");
                                    }
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    backgroundColor: "var(--accent-gold-dark)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "11.5px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  <RotateCcw size={11} />
                                  Restore
                                </button>
                                ) : (
                                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", border: "1px dashed var(--border)", padding: "4px 8px", borderRadius: "6px" }}>
                                    Admin Only
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Add Project Modal */}
          {isNewProjModalOpen && (
            <div
              className="modal-overlay"
              onClick={() => setIsNewProjModalOpen(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Create New Project</h3>
                  <button
                    className="icon-btn"
                    onClick={() => setIsNewProjModalOpen(false)}
                  >
                    <ArrowLeft
                      size={18}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </button>
                </div>

                <form onSubmit={handleAddProject}>
                  <div className="form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Riverside Plaza Phase 2"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Status</label>
                    <select
                      className="form-control"
                      value={newProjStatus}
                      onChange={(e) => setNewProjStatus(e.target.value)}
                    >
                      <option value="not-started">Not Started</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Completion Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newProjCompletionDate}
                      onChange={(e) => setNewProjCompletionDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Rooms</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {newProjAllAvailableRooms.map((roomName) => {
                        const isSelected = newProjSelectedRooms.includes(roomName);
                        return (
                          <div 
                            key={roomName} 
                            onClick={() => {
                              if (isSelected) {
                                setNewProjSelectedRooms(newProjSelectedRooms.filter(r => r !== roomName));
                              } else {
                                setNewProjSelectedRooms([...newProjSelectedRooms, roomName]);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              borderRadius: '16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                              backgroundColor: isSelected ? 'var(--accent-blue-light)' : 'transparent',
                              color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                              transition: 'all 0.2s ease',
                              userSelect: 'none'
                            }}
                          >
                            {roomName}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Add custom room (e.g. Master Bath)"
                        value={newProjCustomRoomInput}
                        onChange={(e) => setNewProjCustomRoomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomRoomToNewProj();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={handleAddCustomRoomToNewProj}
                        style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsNewProjModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Project
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Meeting/Schedule Modal */}
          {isNewMeetingModalOpen && (
            <div
              className="modal-overlay"
              onClick={() => setIsNewMeetingModalOpen(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Schedule Sync Meeting</h3>
                  <button
                    className="icon-btn"
                    onClick={() => setIsNewMeetingModalOpen(false)}
                  >
                    <ArrowLeft
                      size={18}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </button>
                </div>

                <form onSubmit={handleAddMeeting}>
                  <div className="form-group">
                    <label>Meeting Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Supplier Review / Design Alignment"
                      value={newMeetTitle}
                      onChange={(e) => setNewMeetTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Meeting Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newMeetDate}
                      onChange={(e) => setNewMeetDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsNewMeetingModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Add Meeting
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* General Edit Modal */}
          {editItemModal && (
            <div
              className="modal-overlay"
              onClick={() => setEditItemModal(null)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>Edit {editItemModal.type}</h3>
                  <button
                    className="icon-btn"
                    onClick={() => setEditItemModal(null)}
                  >
                    <ArrowLeft
                      size={18}
                      style={{ transform: "rotate(-90deg)" }}
                    />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit}>
                  <div className="form-group">
                    <label>
                      {editItemModal.type === "meeting"
                        ? "Meeting Title"
                        : "Name"}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editItemModal.name}
                      onChange={(e) =>
                        setEditItemModal({
                          ...editItemModal,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  {editItemModal.type === "project" && (
                    <>
                      <div className="form-group">
                        <label>Project Status</label>
                        <select
                          className="form-control"
                          value={editItemModal.status}
                          onChange={(e) =>
                            setEditItemModal({
                              ...editItemModal,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="not-started">Not Started</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Target Completion Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editItemModal.completionDate || ""}
                          onChange={(e) =>
                            setEditItemModal({
                              ...editItemModal,
                              completionDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {editItemModal.type === "task" && (
                    <>
                      <div className="form-group">
                        <label>Task Priority</label>
                        <select
                          className="form-control"
                          value={editItemModal.priority || "medium"}
                          onChange={(e) =>
                            setEditItemModal({
                              ...editItemModal,
                              priority: e.target.value,
                            })
                          }
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      {/* Dependencies Multi-select Grid */}
                      {(() => {
                        const activeProj = projects.find(p => p.id === editItemModal.projectId);
                        const otherTasks = activeProj ? (activeProj.tasks || []).filter(t => t.id !== editItemModal.itemId) : [];
                        if (otherTasks.length === 0) return null;
                        
                        return (
                          <div className="form-group" style={{ marginTop: "14px" }}>
                            <label style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>Dependencies (Preceding Tasks)</label>
                            <div style={{
                              maxHeight: "120px",
                              overflowY: "auto",
                              border: "1px solid var(--border)",
                              borderRadius: "8px",
                              padding: "8px 12px",
                              backgroundColor: "var(--bg-app)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              marginTop: "4px"
                            }}>
                              {otherTasks.map(ot => {
                                const isChecked = (editItemModal.dependencies || []).includes(ot.id);
                                return (
                                  <label key={ot.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "var(--text-title)", margin: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (!isChecked) {
                                           const hasCycle = (tasksList, startId, targetId) => {
                                             const visited = new Set();
                                             const check = (currId) => {
                                               if (currId === targetId) return true;
                                               if (visited.has(currId)) return false;
                                               visited.add(currId);
                                               const t = tasksList.find(x => x.id === currId);
                                               if (!t || !t.dependencies) return false;
                                               for (const dId of t.dependencies) {
                                                 if (check(dId)) return true;
                                               }
                                               return false;
                                             };
                                             return check(startId);
                                           };

                                           if (hasCycle(activeProj.tasks || [], ot.id, editItemModal.itemId)) {
                                             alert(`Cannot add "${ot.name}" as a dependency because it already depends on this task, creating a circular loop.`);
                                             return;
                                           }
                                         }
                                         const newDeps = isChecked
                                           ? (editItemModal.dependencies || []).filter(id => id !== ot.id)
                                           : [...(editItemModal.dependencies || []), ot.id];
                                         setEditItemModal({
                                           ...editItemModal,
                                           dependencies: newDeps
                                         });
                                       }}
                                    />
                                    {ot.name}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {editItemModal.type === "meeting" && (
                    <div className="form-group">
                      <label>Meeting Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editItemModal.date}
                        onChange={(e) =>
                          setEditItemModal({
                            ...editItemModal,
                            date: e.target.value,
                          })
                        }
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  )}

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setEditItemModal(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

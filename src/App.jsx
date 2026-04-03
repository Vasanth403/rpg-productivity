import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell, BookOpen, Shield, Zap, Palette,
  Plus, X, Check, ChevronRight, Pencil, Camera, LogOut, GripVertical, Lock,
} from "lucide-react";
import { supabase, isSupabaseEnabled } from "./lib/supabase";
import AuthPage from "./AuthPage";
import Leaderboard from "./social/Leaderboard";
import Friends from "./social/Friends";
import Guild from "./social/Guild";

const STORAGE_KEY = "rpg-productivity-v5";

// ─── Categories ───────────────────────────────────────────────────────────────
export const CATEGORIES = {
  COMBAT:     { label: "Combat",     stat: "STR", color: "red",    desc: "Physical training & exercise" },
  KNOWLEDGE:  { label: "Knowledge",  stat: "MND", color: "blue",   desc: "Study, reading & learning"    },
  DISCIPLINE: { label: "Discipline", stat: "DIS", color: "purple", desc: "Habits & self-control"        },
  VITALITY:   { label: "Vitality",   stat: "VIT", color: "green",  desc: "Sleep, health & nutrition"    },
  CREATION:   { label: "Creation",   stat: "CRE", color: "amber",  desc: "Creative work & projects"     },
};
const CAT_ICONS = { COMBAT: Dumbbell, KNOWLEDGE: BookOpen, DISCIPLINE: Shield, VITALITY: Zap, CREATION: Palette };
const CAT_ORDER = ["COMBAT", "KNOWLEDGE", "DISCIPLINE", "VITALITY", "CREATION"];

// ─── Weekly Boss ──────────────────────────────────────────────────────────────
const WEEKLY_BOSSES = [
  { name: "The Iron Colossus",  desc: "A towering construct of pure discipline. Push beyond your limits this week." },
  { name: "Shadow Drake",       desc: "A beast born from accumulated laziness. Face it before the week ends."       },
  { name: "The Forgotten King", desc: "An ancient ruler who thrived on inconsistency. Dethrone him."                },
  { name: "Void Sentinel",      desc: "Guardian of stagnation. Prove your growth has no ceiling."                   },
  { name: "Abyssal Tyrant",     desc: "Born from your weakest moments. Conquer yourself this week."                 },
  { name: "The Hollow Knight",  desc: "An empty shell of potential. Fill it with decisive action."                  },
  { name: "Storm Warden",       desc: "Commands the chaos of the week. Stand firm and claim your XP."               },
];
function getWeeklyBoss(weekKey) {
  if (!weekKey) return WEEKLY_BOSSES[0];
  const d = new Date(weekKey + "T00:00:00");
  const weekNum = Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
  return WEEKLY_BOSSES[Math.abs(weekNum) % WEEKLY_BOSSES.length];
}

// ─── Difficulty Tiers ─────────────────────────────────────────────────────────
export const TIERS = {
  E: { xp: 20,  color: "slate",  hex: "#64748b", unlockLevel: 1  },
  D: { xp: 40,  color: "green",  hex: "#22c55e", unlockLevel: 5  },
  C: { xp: 70,  color: "blue",   hex: "#3b82f6", unlockLevel: 12 },
  B: { xp: 110, color: "purple", hex: "#a855f7", unlockLevel: 20 },
  A: { xp: 160, color: "amber",  hex: "#f59e0b", unlockLevel: 30 },
  S: { xp: 250, color: "red",    hex: "#ef4444", unlockLevel: 45 },
};
const TIER_ORDER = ["E", "D", "C", "B", "A", "S"];

// ─── Timezones ────────────────────────────────────────────────────────────────
export const TIMEZONES = [
  { value: "Pacific/Honolulu",    label: "Hawaii — UTC−10"          },
  { value: "America/Anchorage",   label: "Alaska — UTC−9"           },
  { value: "America/Los_Angeles", label: "Pacific US — UTC−8/7"     },
  { value: "America/Denver",      label: "Mountain US — UTC−7/6"    },
  { value: "America/Chicago",     label: "Central US — UTC−6/5"     },
  { value: "America/New_York",    label: "Eastern US — UTC−5/4"     },
  { value: "America/Sao_Paulo",   label: "Brazil — UTC−3"           },
  { value: "Europe/London",       label: "London — UTC+0/1"         },
  { value: "Europe/Paris",        label: "Paris / Berlin — UTC+1/2" },
  { value: "Europe/Helsinki",     label: "Helsinki — UTC+2/3"       },
  { value: "Europe/Moscow",       label: "Moscow — UTC+3"           },
  { value: "Asia/Dubai",          label: "Dubai — UTC+4"            },
  { value: "Asia/Karachi",        label: "Karachi — UTC+5"          },
  { value: "Asia/Kolkata",        label: "India — UTC+5:30"         },
  { value: "Asia/Dhaka",          label: "Dhaka — UTC+6"            },
  { value: "Asia/Bangkok",        label: "Bangkok — UTC+7"          },
  { value: "Asia/Singapore",      label: "Singapore — UTC+8"        },
  { value: "Asia/Tokyo",          label: "Tokyo — UTC+9"            },
  { value: "Asia/Seoul",          label: "Seoul — UTC+9"            },
  { value: "Australia/Sydney",    label: "Sydney — UTC+10/11"       },
  { value: "Pacific/Auckland",    label: "Auckland — UTC+12/13"     },
];

// ─── Achievements ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: "first_quest",  icon: "⚔️", label: "First Blood",       desc: "Complete your first quest"          },
  { id: "streak_3",     icon: "🔥", label: "On a Roll",          desc: "Maintain a 3-day streak"            },
  { id: "streak_7",     icon: "💥", label: "Unstoppable",        desc: "Maintain a 7-day streak"            },
  { id: "streak_30",    icon: "👁️", label: "Shadow Discipline",  desc: "30-day streak"                      },
  { id: "level_5",      icon: "🏅", label: "Awakened",           desc: "Reach level 5"                      },
  { id: "level_20",     icon: "🥇", label: "Ranked Hunter",      desc: "Reach level 20"                     },
  { id: "level_50",     icon: "👑", label: "S-Rank Ascension",   desc: "Reach level 50"                     },
  { id: "xp_1000",      icon: "⚡", label: "Power Surge",        desc: "Earn 1,000 total XP"                },
  { id: "xp_10000",     icon: "🌟", label: "Monarch's Path",     desc: "Earn 10,000 total XP"               },
  { id: "quests_50",    icon: "🗡️", label: "Seasoned Hunter",    desc: "Complete 50 quests total"           },
  { id: "all_cats",     icon: "🎯", label: "Well-Rounded",       desc: "Complete a quest in every category" },
  { id: "s_tier",       icon: "💎", label: "S-Rank Quest",       desc: "Complete an S-tier quest"           },
  { id: "shield_used",  icon: "🛡️", label: "Protected",          desc: "Use a streak shield"                },
];

function checkNewAchievements(data, streak) {
  const already     = new Set(data.achievements || []);
  const totalXp     = Object.values(data.dailyLog).reduce((a, b) => a + b.xp, 0);
  const totalQuests = Object.values(data.dailyLog).reduce((a, b) => a + b.quests, 0);
  const cats        = new Set((data.history || []).map((h) => h.category));
  const hasSQuest   = (data.history || []).some((h) => h.tier === "S");
  const usedShield  = (data.shieldedDays || []).length > 0;

  const passes = {
    first_quest:  totalQuests >= 1,
    streak_3:     streak >= 3,
    streak_7:     streak >= 7,
    streak_30:    streak >= 30,
    level_5:      data.level >= 5,
    level_20:     data.level >= 20,
    level_50:     data.level >= 50,
    xp_1000:      totalXp >= 1000,
    xp_10000:     totalXp >= 10000,
    quests_50:    totalQuests >= 50,
    all_cats:     CAT_ORDER.every((c) => cats.has(c)),
    s_tier:       hasSQuest,
    shield_used:  usedShield,
  };
  return ACHIEVEMENTS.filter((a) => !already.has(a.id) && passes[a.id]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function xpNeed(level) { return Math.round(100 + level * 25 + level * level * 5); }

function getRankTitle(level) {
  if (level >= 100) return "Shadow Monarch";
  if (level >= 80)  return "National-Level Hunter";
  if (level >= 60)  return "S-Rank Hunter";
  if (level >= 45)  return "A-Rank Hunter";
  if (level >= 30)  return "B-Rank Hunter";
  if (level >= 20)  return "C-Rank Hunter";
  if (level >= 12)  return "D-Rank Hunter";
  if (level >= 5)   return "E-Rank Hunter";
  return "Unranked";
}

function getRankBadge(level) {
  if (level >= 60) return "S-RANK";
  if (level >= 45) return "A-RANK";
  if (level >= 30) return "B-RANK";
  if (level >= 20) return "C-RANK";
  if (level >= 12) return "D-RANK";
  if (level >= 5)  return "E-RANK";
  return "UNRANKED";
}

function getTodayKey(tz) {
  try { return new Date().toLocaleDateString("en-CA", { timeZone: tz }); }
  catch { return new Date().toLocaleDateString("en-CA"); }
}

function getWeekKey(tz) {
  try {
    const s = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const d = new Date(s + "T00:00:00");
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return d.toLocaleDateString("en-CA");
  } catch { return new Date().toLocaleDateString("en-CA"); }
}

function playSound(type) {
  try {
    const ctx   = new (window.AudioContext || window.webkitAudioContext)();
    const notes =
      type === "complete"      ? [[523, 0], [659, 0.12], [784, 0.24]]
      : type === "levelup"    ? [[261, 0], [329, 0.1], [392, 0.2], [523, 0.32], [784, 0.46]]
      : type === "achievement" ? [[440, 0], [554, 0.13], [659, 0.26], [880, 0.42]]
      : type === "bonus"       ? [[784, 0], [880, 0.1], [988, 0.22], [1047, 0.36]]
      : type === "penalty"     ? [[220, 0], [196, 0.15], [165, 0.3]]
      : [];
    notes.forEach(([freq, delay]) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.55);
    });
  } catch {}
}

function resizeImageToBase64(file, maxPx = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function getDefaultState() {
  return {
    name: "Hunter", avatarUrl: "",
    level: 1, xp: 0,
    stats: { STR: 0, MND: 0, DIS: 0, VIT: 0, CRE: 0 },
    done: {}, history: [],
    dayKey: "", weekKey: "",
    quests: [], dailyLog: {},
    timezone: null, setupDone: false,
    achievements: [],
    streakShields: 0,
    shieldedDays: [],
    lastShieldMilestone: 0,
    bonusGiven: false,
    notifEnabled: false,
    notifTime: "08:00",
    weeklyBossDefeated: "",
  };
}

function parseData(d) {
  return {
    name:                d.name ?? "Hunter",
    avatarUrl:           d.avatarUrl ?? "",
    level:               Number(d.level) || 1,
    xp:                  Number(d.xp) || 0,
    stats: {
      STR: Number(d?.stats?.STR) || 0, MND: Number(d?.stats?.MND) || 0,
      DIS: Number(d?.stats?.DIS) || 0, VIT: Number(d?.stats?.VIT) || 0,
      CRE: Number(d?.stats?.CRE) || 0,
    },
    done:                d.done || {},
    history:             Array.isArray(d.history) ? d.history : [],
    dayKey:              d.dayKey ?? "",
    weekKey:             d.weekKey ?? "",
    quests:              Array.isArray(d.quests) ? d.quests : [],
    dailyLog:            d.dailyLog && typeof d.dailyLog === "object" ? d.dailyLog : {},
    timezone:            d.timezone ?? null,
    setupDone:           d.setupDone ?? false,
    achievements:        Array.isArray(d.achievements) ? d.achievements : [],
    streakShields:       Number(d.streakShields) || 0,
    shieldedDays:        Array.isArray(d.shieldedDays) ? d.shieldedDays : [],
    lastShieldMilestone: Number(d.lastShieldMilestone) || 0,
    bonusGiven:          d.bonusGiven ?? false,
    notifEnabled:        d.notifEnabled ?? false,
    notifTime:           d.notifTime ?? "08:00",
    weeklyBossDefeated:  d.weeklyBossDefeated ?? "",
  };
}

function safeLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return parseData(JSON.parse(raw));
  } catch { return getDefaultState(); }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]                 = useState(() => safeLoad());
  const [questModal, setQuestModal]     = useState(null);
  const [levelUpData, setLevelUpData]   = useState(null);
  const [notification, setNotification] = useState(null);
  const [achToast, setAchToast]         = useState(null);
  const [activeTab, setActiveTab]       = useState("quests");
  const prevLevelRef = useRef(data.level);
  const fileInputRef = useRef(null);
  const syncTimer    = useRef(null);
  const skipNextSync = useRef(false);
  const hasMounted   = useRef(false);
  const dragIndex    = useRef(null);
  const notifTimer   = useRef(null);

  const [session, setSession]       = useState(null);
  const [authReady, setAuthReady]   = useState(!isSupabaseEnabled);
  const [cloudReady, setCloudReady] = useState(!isSupabaseEnabled);

  // ── Auth ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setAuthReady(true);
      if (session) loadCloudData(session.user.id);
      else setCloudReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_IN")  loadCloudData(session.user.id);
      if (event === "SIGNED_OUT") { setData(getDefaultState()); localStorage.removeItem(STORAGE_KEY); setCloudReady(true); }
    });
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCloudData(userId) {
    try {
      const { data: profile, error } = await supabase
        .from("user_profiles").select("data").eq("id", userId).single();
      if (error?.code === "PGRST116") {
        const fresh = getDefaultState(); setData(fresh); localStorage.removeItem(STORAGE_KEY); return;
      }
      if (error) { console.error("Cloud load error:", error); return; }
      if (!profile?.data) return;
      skipNextSync.current = true;
      const loaded = parseData(profile.data);
      setData((prev) => {
        // Merge cloud data with local state, preserving whichever is more up-to-date.
        // This prevents cloud data from overwriting local completions that haven't synced yet
        // (e.g. user closed app within the 1500ms sync debounce window).
        if (prev.dayKey && loaded.dayKey) {
          if (prev.dayKey > loaded.dayKey) {
            // Local has already advanced past the cloud state (reset ran, or more recent activity).
            // Keep local's done/dayKey/bonusGiven so we don't re-apply stale completions or trigger false penalty.
            return { ...loaded, done: prev.done, dayKey: prev.dayKey, bonusGiven: prev.bonusGiven };
          }
          if (prev.dayKey === loaded.dayKey) {
            // Same day — keep whichever has more quest completions (more up-to-date).
            const prevCount  = Object.keys(prev.done).length;
            const loadedCount = Object.keys(loaded.done).length;
            if (prevCount > loadedCount) {
              return { ...loaded, done: prev.done, bonusGiven: prev.bonusGiven };
            }
          }
        }
        return loaded;
      });
    } finally {
      setCloudReady(true);
    }
  }

  // ── Cloud sync ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !session) return;
    if (skipNextSync.current) { skipNextSync.current = false; return; }
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      await supabase.from("user_profiles").upsert(
        { id: session.user.id, data, updated_at: new Date().toISOString() }, { onConflict: "id" }
      );
      // Sync public leaderboard data
      const totalXp     = Object.values(data.dailyLog).reduce((a, b) => a + b.xp, 0);
      const totalQuests = Object.values(data.dailyLog).reduce((a, b) => a + b.quests, 0);
      await supabase.from("user_public").upsert({
        id: session.user.id, display_name: data.name, level: data.level,
        xp_total: totalXp, rank_title: getRankTitle(data.level),
        rank_badge: getRankBadge(data.level), quests_total: totalQuests,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    }, 1500);
    return () => clearTimeout(syncTimer.current);
  }, [data, session]);

  async function signOut() { if (isSupabaseEnabled) await supabase.auth.signOut(); }

  async function wipeAllData() {
    const fresh = {
      ...getDefaultState(),
      setupDone: data.setupDone, timezone: data.timezone,
      weekKey: data.weekKey, name: data.name, avatarUrl: data.avatarUrl,
    };
    setData(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    if (isSupabaseEnabled && session)
      await supabase.from("user_profiles").upsert({ id: session.user.id, data: fresh });
  }

  const showSetup = cloudReady && (!data.setupDone || !data.timezone);

  // ── Daily reset + penalty + shield ──────────────────────────────────────────
  useEffect(() => {
    if (!data.timezone) return;
    const tick = () => {
      const today = getTodayKey(data.timezone);
      const week  = getWeekKey(data.timezone);
      setData((p) => {
        if (p.dayKey === today) return p;

        // Notification on new day
        if (p.dayKey && "Notification" in window && Notification.permission === "granted") {
          new Notification("Hunter's Journal", { body: "A new day has begun. Your quests await, Hunter.", icon: "/pwa-192x192.png" });
        }

        const weekChanged = p.weekKey !== week;
        // If dailyLog records all quests were completed yesterday, trust that over done state
        // (done can be stale if cloud data won a race against local completions)
        const allDoneYesterday = !!(p.dailyLog?.[p.dayKey]?.allDone);
        const missedQuests = allDoneYesterday
          ? []
          : (p.quests || []).filter((q) => q.repeat === "daily" && !p.done[q.id]);

        // Penalty: -5 per missed quest per stat
        const penaltyStats = { ...p.stats };
        let penaltyApplied = false;
        if (p.dayKey && missedQuests.length > 0) {
          missedQuests.forEach((q) => {
            const stat = CATEGORIES[q.category]?.stat;
            if (stat) { penaltyStats[stat] = Math.max(0, (penaltyStats[stat] || 0) - 5); penaltyApplied = true; }
          });
        }

        // Shield: auto-consume if no activity yesterday
        const hadActivity = Object.keys(p.done).length > 0 || (p.dailyLog?.[p.dayKey]?.quests || 0) > 0;
        let shields = p.streakShields || 0;
        let shieldedDays = [...(p.shieldedDays || [])];
        if (p.dayKey && !hadActivity && shields > 0) {
          shields--;
          shieldedDays.push(p.dayKey);
        }

        const resetIds = new Set(
          (p.quests || []).filter((q) => q.repeat === "daily" || (q.repeat === "weekly" && weekChanged)).map((q) => q.id)
        );
        const newDone = Object.fromEntries(Object.entries(p.done).filter(([id]) => !resetIds.has(id)));

        return {
          ...p, dayKey: today, weekKey: week, done: newDone,
          stats: penaltyApplied ? penaltyStats : p.stats,
          streakShields: shields, shieldedDays,
          bonusGiven: false,
          _penaltyCount: penaltyApplied ? missedQuests.length : 0,
        };
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [data.timezone]);

  // Show penalty toast
  useEffect(() => {
    if (!hasMounted.current) return;
    if ((data._penaltyCount || 0) > 0) {
      notify(`⚠️ Penalty: -5 to stats for ${data._penaltyCount} missed quest${data._penaltyCount > 1 ? "s" : ""}`);
      playSound("penalty");
    }
  }, [data._penaltyCount]); // eslint-disable-line

  // Bonus XP notification
  useEffect(() => {
    if (!hasMounted.current) return;
    if (data.bonusGiven) {
      notify("🏆 All quests complete! +50 Bonus EXP!");
      playSound("bonus");
    }
  }, [data.bonusGiven]); // eslint-disable-line

  // Persist
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

  // Level-up detection
  useEffect(() => {
    if (data.level > prevLevelRef.current) {
      prevLevelRef.current = data.level;
      setLevelUpData({ level: data.level });
      playSound("levelup");
      const t = setTimeout(() => setLevelUpData(null), 3500);
      return () => clearTimeout(t);
    }
  }, [data.level]);

  // Achievement check
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    const streak  = calcStreak(data.dailyLog, data.shieldedDays);
    const newOnes = checkNewAchievements(data, streak);
    if (newOnes.length === 0) return;
    setData((p) => ({ ...p, achievements: [...(p.achievements || []), ...newOnes.map((a) => a.id)] }));
    setAchToast(newOnes[0]);
    playSound("achievement");
  }, [data.level, data.history.length]); // eslint-disable-line

  useEffect(() => {
    if (!achToast) return;
    const t = setTimeout(() => setAchToast(null), 4500);
    return () => clearTimeout(t);
  }, [achToast]);

  // Shield earning: every 7-day streak milestone
  useEffect(() => {
    if (!hasMounted.current) return;
    const streak    = calcStreak(data.dailyLog, data.shieldedDays);
    const milestone = Math.floor(streak / 7) * 7;
    if (milestone >= 7 && milestone > data.lastShieldMilestone && data.streakShields < 3) {
      setData((p) => ({ ...p, streakShields: p.streakShields + 1, lastShieldMilestone: milestone }));
      notify(`🛡️ Streak shield earned! (${Math.min(3, data.streakShields + 1)}/3)`);
    }
  }, [data.dailyLog]); // eslint-disable-line

  // Notification reminder scheduling
  useEffect(() => {
    clearTimeout(notifTimer.current);
    if (!data.notifEnabled || !("Notification" in window) || Notification.permission !== "granted") return;
    function scheduleNext() {
      const [h, m] = (data.notifTime || "08:00").split(":").map(Number);
      const now  = new Date();
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      notifTimer.current = setTimeout(() => {
        const daily = (data.quests || []).filter((q) => q.repeat !== "once");
        const incomplete = daily.filter((q) => !data.done[q.id]).length;
        if (incomplete > 0) {
          new Notification("Hunter's Journal", {
            body: `⚔️ ${incomplete} quest${incomplete > 1 ? "s" : ""} awaiting completion, Hunter!`,
            icon: "/pwa-192x192.png",
          });
        }
        scheduleNext();
      }, next - now);
    }
    scheduleNext();
    return () => clearTimeout(notifTimer.current);
  }, [data.notifEnabled, data.notifTime]); // eslint-disable-line

  const need           = useMemo(() => xpNeed(data.level), [data.level]);
  const progress       = useMemo(() => Math.min(100, Math.round((data.xp / need) * 100)), [data.xp, need]);
  const completedCount = useMemo(() => Object.keys(data.done).length, [data.done]);

  function notify(msg) { setNotification(msg); setTimeout(() => setNotification(null), 3500); }

  function completeSetup({ name, timezone }) {
    setData((prev) => ({ ...prev, name, timezone, setupDone: true, dayKey: getTodayKey(timezone), weekKey: getWeekKey(timezone) }));
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  }

  async function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { const b = await resizeImageToBase64(file); setData((p) => ({ ...p, avatarUrl: b })); notify("Avatar updated."); }
    catch { notify("Could not load image."); }
    e.target.value = "";
  }

  function completeQuest(q) {
    const streak = calcStreak(data.dailyLog, data.shieldedDays);
    const multi  = streak >= 30 ? 2.0 : streak >= 14 ? 1.5 : streak >= 7 ? 1.25 : 1.0;
    setData((prev) => {
      if (prev.done[q.id]) return prev;
      const cat    = CATEGORIES[q.category];
      const xpGain = Math.round(TIERS[q.tier || "E"].xp * multi);
      const newDone = { ...prev.done, [q.id]: true };

      // Bonus XP if all daily quests now done
      const dailyQs = prev.quests.filter((qq) => qq.repeat !== "once");
      const allDone = dailyQs.length > 0 && dailyQs.every((qq) => newDone[qq.id]);
      const bonus   = (allDone && !prev.bonusGiven) ? 50 : 0;

      let level = prev.level, xp = prev.xp + xpGain + bonus, needNow = xpNeed(level);
      while (xp >= needNow) { xp -= needNow; level++; needNow = xpNeed(level); }

      const stats   = { ...prev.stats, [cat.stat]: (prev.stats[cat.stat] || 0) + xpGain };
      const history = [
        { t: new Date().toISOString(), name: q.name, xp: xpGain, stat: cat.stat, category: q.category, tier: q.tier || "E" },
        ...prev.history,
      ].slice(0, 50);

      const todayKey = getTodayKey(prev.timezone || "UTC");
      const pd = prev.dailyLog?.[todayKey] || { xp: 0, quests: 0, byCategory: {} };
      const dailyLog = {
        ...prev.dailyLog,
        [todayKey]: {
          xp:         pd.xp + xpGain + bonus,
          quests:     pd.quests + 1,
          byCategory: { ...pd.byCategory, [q.category]: (pd.byCategory?.[q.category] || 0) + xpGain },
          ...(allDone ? { allDone: true } : {}),
        },
      };
      return { ...prev, level, xp, stats, done: newDone, history, dailyLog, bonusGiven: allDone ? true : prev.bonusGiven };
    });
    playSound("complete");
    const bonusLabel = multi >= 2.0 ? " ×2 streak bonus!" : multi >= 1.5 ? " ×1.5 streak bonus!" : multi >= 1.25 ? " ×1.25 streak bonus!" : "";
    notify(`Quest cleared: ${q.name}${bonusLabel}`);
    if (q.repeat === "once") {
      setTimeout(() => {
        setData((prev) => ({
          ...prev,
          quests: prev.quests.filter((cq) => cq.id !== q.id),
          done:   Object.fromEntries(Object.entries(prev.done).filter(([k]) => k !== q.id)),
        }));
      }, 1800);
    }
  }

  function saveQuest(values, editId) {
    if (editId) {
      setData((prev) => ({ ...prev, quests: prev.quests.map((q) => q.id === editId ? { ...q, ...values } : q) }));
      notify("Quest updated.");
    } else {
      setData((prev) => ({ ...prev, quests: [...prev.quests, { ...values, id: `q-${Date.now()}` }] }));
      notify("New quest registered in the System.");
    }
  }

  function deleteQuest(id) {
    setData((prev) => ({
      ...prev,
      quests: prev.quests.filter((q) => q.id !== id),
      done:   Object.fromEntries(Object.entries(prev.done).filter(([k]) => k !== id)),
    }));
  }

  function completeBoss() {
    const boss = getWeeklyBoss(data.weekKey);
    setData((prev) => {
      if (prev.weeklyBossDefeated === prev.weekKey) return prev;
      let level = prev.level, xp = prev.xp + 500, needNow = xpNeed(level);
      while (xp >= needNow) { xp -= needNow; level++; needNow = xpNeed(level); }
      const todayKey = getTodayKey(prev.timezone || "UTC");
      const pd = prev.dailyLog?.[todayKey] || { xp: 0, quests: 0, byCategory: {} };
      const history = [
        { t: new Date().toISOString(), name: boss.name, xp: 500, stat: "ALL", category: "COMBAT", tier: "S" },
        ...prev.history,
      ].slice(0, 50);
      const dailyLog = { ...prev.dailyLog, [todayKey]: { ...pd, xp: pd.xp + 500, quests: pd.quests + 1 } };
      return { ...prev, level, xp, weeklyBossDefeated: prev.weekKey, history, dailyLog };
    });
    playSound("bonus");
    notify(`⚔️ Weekly Boss defeated! +500 EXP!`);
  }

  function renameHunter() {
    const n = prompt("Enter your hunter name:", data.name);
    if (n?.trim()) setData((p) => ({ ...p, name: n.trim() }));
  }

  function handleDragStart(index) { dragIndex.current = index; }
  function handleDrop(index) {
    if (dragIndex.current === null || dragIndex.current === index) return;
    setData((p) => {
      const quests = [...p.quests];
      const [moved] = quests.splice(dragIndex.current, 1);
      quests.splice(index, 0, moved);
      dragIndex.current = null;
      return { ...p, quests };
    });
  }

  if (!authReady || !cloudReady) return <LoadingScreen />;
  if (isSupabaseEnabled && !session) return <AuthPage />;

  const NAV_TABS = [
    { id: "quests",      label: "⚔ Quests"      },
    { id: "hunters",     label: "🏆 Hunters"     },
    { id: "friends",     label: "👥 Friends"     },
    { id: "guild",       label: "⚜ Guild"        },
  ];

  return (
    <div className="app-root">
      <div className="bg-layer" />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile} />

      <AnimatePresence>{showSetup && <SetupModal onComplete={completeSetup} />}</AnimatePresence>
      <AnimatePresence>{levelUpData && <LevelUpOverlay level={levelUpData.level} />}</AnimatePresence>
      <AnimatePresence>{achToast && <AchievementToast achievement={achToast} />}</AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div key={notification} initial={{ opacity: 0, y: -24, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -16, x: "-50%" }} className="sys-toast">
            <span className="sys-toast-tag">SYSTEM</span>{notification}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {questModal && (
          <QuestModal mode={questModal.mode} initialQuest={questModal.quest} userLevel={data.level} onSave={saveQuest} onClose={() => setQuestModal(null)} />
        )}
      </AnimatePresence>

      <div className="page-wrap">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="header-panel">
          <div>
            <p className="eyebrow">SYSTEM INTERFACE</p>
            <h1 className="hero-title">HUNTER'S JOURNAL</h1>
            <p className="header-meta">
              <span>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              <span className="sep">·</span>
              <span className="blue-glow">{completedCount} / {data.quests.length} Quests</span>
              {data.timezone && <><span className="sep">·</span><span className="tz-chip">{data.timezone.replace(/_/g, " ")}</span></>}
            </p>
          </div>
          {isSupabaseEnabled && session && (
            <div className="header-actions">
              <div className="sync-badge" title={`Signed in as ${session.user.email}`}>
                <span className="sync-dot" />{session.user.email}
              </div>
              <button onClick={signOut} className="btn-ghost btn-signout"><LogOut size={15} /> Sign Out</button>
            </div>
          )}
        </motion.header>

        {/* Nav */}
        <nav className="app-nav">
          {NAV_TABS.map((t) => (
            <button key={t.id} className={`nav-tab ${activeTab === t.id ? "nav-tab-active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Social views */}
        {activeTab === "hunters" && <Leaderboard session={session} />}
        {activeTab === "friends" && <Friends session={session} />}
        {activeTab === "guild"   && <Guild session={session} hunterName={data.name} />}

        {/* Main quests view */}
        {activeTab === "quests" && (
          <>
            <div className="main-grid">
              {/* Character panel */}
              <motion.aside initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="char-panel">
                <p className="eyebrow">STATUS WINDOW</p>
                <div className="char-identity">
                  <div className="avatar-wrap" onClick={() => fileInputRef.current?.click()} title="Upload avatar">
                    {data.avatarUrl ? <img src={data.avatarUrl} alt="avatar" className="avatar-img" /> : <span className="avatar-placeholder">☠</span>}
                    <div className="avatar-cam"><Camera size={12} /></div>
                    <span className="lv-badge">LV.{data.level}</span>
                  </div>
                  <div className="char-info">
                    <div className="char-name-row">
                      <p className="char-name">{data.name}</p>
                      <button className="rename-btn" onClick={renameHunter} title="Rename"><Pencil size={13} /></button>
                    </div>
                    <p className="char-rank">{getRankTitle(data.level)}</p>
                    <span className="rank-chip">{getRankBadge(data.level)}</span>
                  </div>
                </div>

                <div className="xp-block">
                  <div className="xp-meta">
                    <span className="xp-meta-label">EXP</span>
                    <span className="blue-glow">{data.xp} / {need}</span>
                    <span className="xp-pct">{progress}%</span>
                  </div>
                  <div className="xp-track">
                    <motion.div className="xp-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
                    <div className="xp-shine" />
                  </div>
                </div>

                {/* Streak shields */}
                {data.streakShields > 0 && (
                  <div className="shield-row">
                    <span className="shield-label">STREAK SHIELDS</span>
                    <div className="shield-icons">
                      {[0,1,2].map((i) => (
                        <span key={i} className={`shield-icon ${i < data.streakShields ? "shield-active" : "shield-empty"}`}>🛡️</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="stats-section">
                  <p className="eyebrow text-center">ATTRIBUTES</p>
                  <div className="stats-grid">
                    {Object.entries(data.stats).map(([key, val]) => <StatCard key={key} statKey={key} value={val} />)}
                  </div>
                </div>

                {data.achievements?.length > 0 && (
                  <div className="ach-section">
                    <p className="eyebrow">ACHIEVEMENTS</p>
                    <div className="ach-grid">
                      {ACHIEVEMENTS.filter((a) => data.achievements.includes(a.id)).map((a) => (
                        <div key={a.id} className="ach-badge" title={`${a.label}: ${a.desc}`}><span className="ach-icon">{a.icon}</span></div>
                      ))}
                    </div>
                    <p className="ach-count">{data.achievements.length} / {ACHIEVEMENTS.length} unlocked</p>
                  </div>
                )}

                <div className="notif-settings">
                  <p className="eyebrow">NOTIFICATIONS</p>
                  <div className="notif-row">
                    <label className="notif-toggle-label">
                      <input
                        type="checkbox"
                        checked={!!data.notifEnabled}
                        onChange={(e) => {
                          if (e.target.checked && "Notification" in window && Notification.permission !== "granted") {
                            Notification.requestPermission().then((perm) => {
                              if (perm === "granted") setData((p) => ({ ...p, notifEnabled: true }));
                            });
                          } else {
                            setData((p) => ({ ...p, notifEnabled: e.target.checked }));
                          }
                        }}
                      />
                      Daily reminder
                    </label>
                    <input
                      type="time"
                      className="notif-time-input"
                      value={data.notifTime || "08:00"}
                      disabled={!data.notifEnabled}
                      onChange={(e) => setData((p) => ({ ...p, notifTime: e.target.value }))}
                    />
                  </div>
                  <p className="notif-note">Fires when quests are incomplete · requires app open</p>
                </div>

                <p className="char-quote">"I alone level up."</p>
              </motion.aside>

              {/* Quest board */}
              <motion.main initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="quest-main">
                <div className="board-header">
                  <div>
                    <p className="eyebrow">QUEST BOARD</p>
                    <h2 className="board-title">Daily Quests</h2>
                    <p className="board-sub">Complete quests to gain EXP and level up your stats.</p>
                  </div>
                  <button className="btn-add" onClick={() => setQuestModal({ mode: "add" })}>
                    <Plus size={16} /> Add Quest
                  </button>
                </div>

                <WeeklyBossCard boss={getWeeklyBoss(data.weekKey)} defeated={data.weeklyBossDefeated === data.weekKey} weeklyQuests={getWeeklyQuestCount(data.dailyLog, data.weekKey)} onDefeat={completeBoss} />

                {data.quests.length === 0 ? (
                  <div className="empty-board">
                    <p className="empty-title">No quests registered</p>
                    <p className="empty-sub">Add your first quest to begin your journey.</p>
                    <button className="btn-add" onClick={() => setQuestModal({ mode: "add" })}><Plus size={16} /> Add Quest</button>
                  </div>
                ) : (
                  <div className="quest-grid">
                    {data.quests.map((q, i) => (
                      <QuestCard
                        key={q.id} quest={q} done={!!data.done[q.id]}
                        onComplete={completeQuest}
                        onEdit={() => setQuestModal({ mode: "edit", quest: q })}
                        onDelete={() => deleteQuest(q.id)}
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(i)}
                      />
                    ))}
                  </div>
                )}

                <div className="log-panel">
                  <p className="eyebrow">COMBAT LOG <span style={{ opacity: 0.4, fontSize: "0.7em", fontWeight: "normal", textTransform: "none" }}>· last 10 quests</span></p>
                  <div className="log-list">
                    {data.history.length === 0 ? (
                      <p className="log-empty">No activity recorded yet.</p>
                    ) : (
                      data.history.slice(0, 10).map((h, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} className="log-row">
                          <span className={`log-dot ld-${CATEGORIES[h.category]?.color || "blue"}`} />
                          <span className="log-name">{h.name}</span>
                          <span className={`log-stat lt-${CATEGORIES[h.category]?.color || "blue"}`}>
                            +{h.xp} EXP · {h.stat}
                            {h.tier && <span className="log-tier"> [{h.tier}]</span>}
                          </span>
                          <span className="log-time">{(() => {
                            const d = new Date(h.t);
                            const today = new Date();
                            const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                            const sameDay = (a, b) => a.toLocaleDateString() === b.toLocaleDateString();
                            if (sameDay(d, today)) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                            if (sameDay(d, yesterday)) return `Yesterday ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                            return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                          })()}</span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.main>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Analytics
                dailyLog={data.dailyLog} shieldedDays={data.shieldedDays} onWipe={wipeAllData}
                stats={data.stats} completedToday={completedCount} totalToday={data.quests.length}
              />
            </motion.div>

            <p className="footer-line">The System has chosen you. Do not waste this opportunity.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SetupModal ───────────────────────────────────────────────────────────────
function SetupModal({ onComplete }) {
  const detectedTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; } })();
  const defaultTz  = TIMEZONES.find((t) => t.value === detectedTz)?.value ?? TIMEZONES[7].value;
  const [name, setName] = useState(""); const [tz, setTz] = useState(defaultTz);
  function handleStart(e) { e.preventDefault(); if (!name.trim()) return; onComplete({ name: name.trim(), timezone: tz }); }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="setup-overlay">
      <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.15 }} className="setup-box">
        <p className="setup-eyebrow">SYSTEM INITIALIZATION</p>
        <h1 className="setup-title">HUNTER'S JOURNAL</h1>
        <p className="setup-sub">The System has detected a new player.<br />Register your profile to begin.</p>
        <div className="setup-divider" />
        <form onSubmit={handleStart} className="setup-form">
          <div className="field">
            <label className="field-label">Hunter Name</label>
            <input className="field-input setup-input" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div className="field">
            <label className="field-label">Timezone <span className="optional">— quests reset at 00:00 in this timezone</span></label>
            <select className="field-input setup-select" value={tz} onChange={(e) => setTz(e.target.value)}>
              {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <p className="setup-tz-hint">Auto-detected: {detectedTz}</p>
          </div>
          <button type="submit" className="btn-setup-start">BEGIN JOURNEY</button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Analytics helpers ────────────────────────────────────────────────────────
function getWeeklyQuestCount(dailyLog, weekKey) {
  if (!weekKey) return 0;
  let count = 0;
  const start = new Date(weekKey + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    count += dailyLog[d.toLocaleDateString("en-CA")]?.quests || 0;
  }
  return count;
}

function calcStreak(dailyLog, shieldedDays = []) {
  const today = new Date(); today.setHours(0,0,0,0);
  const shields = new Set(shieldedDays || []);
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const key = d.toLocaleDateString("en-CA");
    if ((dailyLog[key]?.quests || 0) > 0 || shields.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function buildHeatmap(dailyLog, shieldedDays = [], weeks = 14) {
  const today = new Date(); today.setHours(0,0,0,0);
  const shields = new Set(shieldedDays || []);
  const days = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString("en-CA");
    days.push({
      key, quests: dailyLog[key]?.quests || 0, xp: dailyLog[key]?.xp || 0,
      shielded: shields.has(key),
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  const result = [];
  for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7));
  return result;
}

function buildWeek(dailyLog) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i));
    const key = d.toLocaleDateString("en-CA"); const entry = dailyLog[key];
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), quests: entry?.quests || 0, xp: entry?.xp || 0, byCategory: entry?.byCategory || {}, isToday: i === 6 };
  });
}

function cellColor(q, shielded) {
  if (shielded) return "rgba(99,102,241,0.45)";
  if (q === 0) return "rgba(255,255,255,0.04)";
  if (q === 1) return "rgba(59,130,246,0.25)";
  if (q === 2) return "rgba(59,130,246,0.48)";
  if (q === 3) return "rgba(59,130,246,0.68)";
  return "rgba(59,130,246,0.88)";
}
function cellGlow(q, shielded) {
  if (shielded) return "0 0 7px rgba(99,102,241,0.4)";
  if (q >= 4) return "0 0 8px rgba(59,130,246,0.55)";
  if (q >= 2) return "0 0 5px rgba(59,130,246,0.25)";
  return "none";
}

const CAT_COLORS_HEX = { COMBAT: "#ef4444", KNOWLEDGE: "#3b82f6", DISCIPLINE: "#a855f7", VITALITY: "#22c55e", CREATION: "#f59e0b" };

// ─── StatRadarChart ───────────────────────────────────────────────────────────
const RADAR_AXES = [
  { key: "STR", color: "#ef4444" },
  { key: "MND", color: "#3b82f6" },
  { key: "DIS", color: "#a855f7" },
  { key: "VIT", color: "#22c55e" },
  { key: "CRE", color: "#f59e0b" },
];
function StatRadarChart({ stats }) {
  const cx = 110, cy = 110, r = 72, n = RADAR_AXES.length;
  const maxVal = Math.max(1, ...RADAR_AXES.map((a) => stats[a.key] || 0));

  function pt(i, ratio) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  }
  function poly(ratio) { return RADAR_AXES.map((_, i) => { const p = pt(i, ratio); return `${p.x},${p.y}`; }).join(" "); }

  const dataPoints = RADAR_AXES.map((a, i) => {
    const ratio = Math.max(0.04, (stats[a.key] || 0) / maxVal);
    return pt(i, ratio);
  });
  const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 220 220" className="radar-svg">
      {[0.25, 0.5, 0.75, 1].map((ratio, gi) => (
        <polygon key={gi} points={poly(ratio)} fill="none"
          stroke={gi === 3 ? "rgba(59,130,246,0.22)" : "rgba(59,130,246,0.09)"} strokeWidth="1" />
      ))}
      {RADAR_AXES.map((_, i) => {
        const p = pt(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(59,130,246,0.15)" strokeWidth="1" />;
      })}
      <polygon points={dataPoly} fill="rgba(59,130,246,0.13)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
      {RADAR_AXES.map((a, i) => {
        const p = dataPoints[i];
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={a.color} style={{ filter: `drop-shadow(0 0 4px ${a.color})` }} />;
      })}
      {RADAR_AXES.map((a, i) => {
        const lp = pt(i, 1.28);
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fill={a.color} fontSize="9.5" fontFamily="Orbitron, monospace" fontWeight="700">
            {a.key}
          </text>
        );
      })}
      {RADAR_AXES.map((a, i) => {
        const vp = pt(i, 1.55);
        return (
          <text key={`v-${i}`} x={vp.x} y={vp.y} textAnchor="middle" dominantBaseline="middle"
            fill="rgba(148,163,184,0.7)" fontSize="7.5" fontFamily="Inter, sans-serif">
            {stats[a.key] || 0}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function Analytics({ dailyLog, shieldedDays, onWipe, stats, completedToday, totalToday }) {
  const [tooltip, setTooltip]         = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const streak   = useMemo(() => calcStreak(dailyLog, shieldedDays),         [dailyLog, shieldedDays]);
  const heatmap  = useMemo(() => buildHeatmap(dailyLog, shieldedDays),        [dailyLog, shieldedDays]);
  const weekDays = useMemo(() => buildWeek(dailyLog),                          [dailyLog]);

  const totals = useMemo(() => {
    let totalXp = 0, totalDays = 0, bestDay = 0, totalQuests = 0;
    Object.values(dailyLog).forEach((d) => { totalXp += d.xp; totalDays++; totalQuests += d.quests; if (d.quests > bestDay) bestDay = d.quests; });
    return { totalXp, totalDays, bestDay, totalQuests };
  }, [dailyLog]);

  const catTotals = useMemo(() => {
    const acc = {};
    Object.values(dailyLog).forEach((d) => Object.entries(d.byCategory || {}).forEach(([cat, xp]) => { acc[cat] = (acc[cat] || 0) + xp; }));
    return acc;
  }, [dailyLog]);

  const maxCatXp      = Math.max(1, ...Object.values(catTotals));
  const maxWeekQuests = Math.max(1, ...weekDays.map((d) => d.quests));

  return (
    <div className="analytics-panel">
      <p className="eyebrow">ANALYTICS</p>
      <div className="analytics-pills">
        {[
          { val: streak,             label: "Day Streak"   },
          { val: totals.totalQuests, label: "Total Quests" },
          { val: totals.totalXp,     label: "Total XP"     },
          { val: totals.bestDay,     label: "Best Day"     },
          { val: totals.totalDays,   label: "Active Days"  },
          { val: totalToday > 0 ? `${Math.round((completedToday / totalToday) * 100)}%` : "—", label: "Today %" },
        ].map((p) => (
          <div key={p.label} className="a-pill">
            <span className="a-pill-val">{p.val}</span>
            <span className="a-pill-label">{p.label}</span>
          </div>
        ))}
      </div>

      <div className="heatmap-section">
        <p className="analytics-sub-label">ACTIVITY — LAST 14 WEEKS <span className="heatmap-legend-note">🛡️ = shield used</span></p>
        <div className="heatmap-grid">
          {heatmap.map((week, wi) => (
            <div key={wi} className="heatmap-week">
              {week.map((day) => (
                <div key={day.key} className="heatmap-cell"
                  style={{ background: cellColor(day.quests, day.shielded), boxShadow: cellGlow(day.quests, day.shielded) }}
                  onMouseMove={(e) => setTooltip({ day, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
        {tooltip && (
          <div className="heatmap-tooltip" style={{
            left: tooltip.x + 14,
            top: tooltip.y > window.innerHeight - 80 ? tooltip.y - 60 : tooltip.y + 16,
          }}>
            <span className="ht-date">{tooltip.day.label}</span>
            <span className="ht-val">
              {tooltip.day.shielded ? "🛡️ Shield used" : tooltip.day.quests === 0 ? "No activity" : `${tooltip.day.quests} quest${tooltip.day.quests !== 1 ? "s" : ""} · ${tooltip.day.xp} XP`}
            </span>
          </div>
        )}
        <div className="hl-row">
          <span className="hl-label">Less</span>
          {[0,1,2,3,4].map((q) => <div key={q} className="heatmap-cell" style={{ background: cellColor(q, false), display:"inline-block", margin:"0 2px" }} />)}
          <span className="hl-label">More</span>
        </div>
      </div>

      <div className="analytics-bottom">
        <div className="radar-section">
          <p className="analytics-sub-label">STAT PROFILE</p>
          <StatRadarChart stats={stats} />
        </div>
        <div className="week-chart">
          <p className="analytics-sub-label">THIS WEEK</p>
          <div className="week-bars">
            {weekDays.map((day, i) => (
              <div key={i} className="week-bar-col">
                <div className="week-bar-wrap">
                  <div className={`week-bar ${day.isToday ? "week-bar-today" : ""}`} style={{ height: `${Math.max(4, Math.round((day.quests / maxWeekQuests) * 100))}%` }}>
                    <div className="week-bar-inner">
                      {CAT_ORDER.map((cat) => {
                        const catXp = day.byCategory?.[cat] || 0;
                        return catXp > 0 ? <div key={cat} style={{ flex: catXp / (day.xp || 1), background: CAT_COLORS_HEX[cat], opacity: 0.85 }} /> : null;
                      })}
                    </div>
                  </div>
                </div>
                <span className={`week-day-label ${day.isToday ? "wdl-today" : ""}`}>{day.label}</span>
                <span className="week-quest-count">{day.quests}</span>
              </div>
            ))}
          </div>
          <div className="cat-legend">
            {CAT_ORDER.map((cat) => (
              <div key={cat} className="cat-legend-item">
                <span className="cat-legend-dot" style={{ background: CAT_COLORS_HEX[cat] }} />
                <span className="cat-legend-label">{CATEGORIES[cat].label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cat-breakdown">
          <p className="analytics-sub-label">CATEGORY BREAKDOWN</p>
          {totals.totalXp === 0 ? <p className="log-empty">No data yet.</p> : (
            <div className="cat-bars">
              {CAT_ORDER.map((cat) => {
                const xp = catTotals[cat] || 0; const pct = Math.round((xp / maxCatXp) * 100); const c = CATEGORIES[cat];
                return (
                  <div key={cat} className="cat-bar-row">
                    <div className="cat-bar-label-cell"><span className={`stat-tag st-${c.color}`}>{c.stat}</span><span className="cat-bar-name">{c.label}</span></div>
                    <div className="cat-bar-track"><motion.div className={`cat-bar-fill cbf-${c.color}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }} /></div>
                    <span className="cat-bar-xp">{xp}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="wipe-row">
        {confirmWipe ? (
          <>
            <span className="wipe-confirm-text">This will erase all XP, quests, and history. Are you sure?</span>
            <button className="btn-wipe-confirm" onClick={() => { onWipe(); setConfirmWipe(false); }}>Yes, wipe it</button>
            <button className="btn-wipe-cancel" onClick={() => setConfirmWipe(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn-wipe" onClick={() => setConfirmWipe(true)}>Wipe all data</button>
        )}
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
const STAT_META = {
  STR: { color: "red", hint: "Strength" }, MND: { color: "blue", hint: "Mind" },
  DIS: { color: "purple", hint: "Discipline" }, VIT: { color: "green", hint: "Vitality" },
  CRE: { color: "amber", hint: "Creativity" },
};
function StatCard({ statKey, value }) {
  const m = STAT_META[statKey] || { color: "blue", hint: statKey };
  const fillPct = Math.min(100, value === 0 ? 0 : (value / (value + 100)) * 100 + 5);
  return (
    <motion.div whileHover={{ y: -3, scale: 1.04 }} transition={{ type: "spring", stiffness: 280, damping: 18 }} className={`stat-card sc-${m.color}`}>
      <span className={`stat-key sk-${m.color}`}>{statKey}</span>
      <span className="stat-val">{value}</span>
      <span className="stat-hint">{m.hint}</span>
      <div className="stat-track"><motion.div className={`stat-fill sf-${m.color}`} initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 0.7 }} /></div>
    </motion.div>
  );
}

// ─── QuestCard ────────────────────────────────────────────────────────────────
function QuestCard({ quest, done, onComplete, onEdit, onDelete, onDragStart, onDragOver, onDrop }) {
  const cat      = CATEGORIES[quest.category] || CATEGORIES.DISCIPLINE;
  const Icon     = CAT_ICONS[quest.category] || Shield;
  const tierKey  = quest.tier || "E";
  const tier     = TIERS[tierKey];
  const isWeekly = quest.repeat === "weekly";

  return (
    <motion.div layout layoutId={quest.id} draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      whileHover={!done ? { y: -5 } : {}} transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`quest-card qc-${cat.color} ${done ? "qc-done" : ""} ${isWeekly ? "qc-weekly" : ""}`}
    >
      {done && <span className="cleared-stamp"><Check size={11} /> CLEARED</span>}
      <div className="qcard-top">
        <div className="qcard-left">
          <div className="drag-handle"><GripVertical size={13} /></div>
          <div className={`qicon qi-${cat.color}`}><Icon size={17} /></div>
        </div>
        <div className="qcard-badges">
          <span className={`cat-badge cb-${cat.color}`}>{cat.label}</span>
          <span className="tier-badge" style={{ color: tier.hex, borderColor: `${tier.hex}55`, background: `${tier.hex}14` }}>{tierKey}</span>
          {quest.repeat === "once"  && <span className="once-badge">ONCE</span>}
          {isWeekly                 && <span className="weekly-badge">WEEKLY</span>}
          <button className="icon-btn" onClick={onEdit}><Pencil size={11} /></button>
          <button className="icon-btn del-btn" onClick={onDelete}><X size={11} /></button>
        </div>
      </div>
      <div className="qcard-body">
        <p className="quest-name">{quest.name}</p>
        <p className="quest-desc">{quest.desc}</p>
        <div className="quest-reward">
          <span className="xp-tag">+{tier.xp} EXP</span>
          <span className={`stat-tag st-${cat.color}`}>{cat.stat}</span>
        </div>
        <button className={done ? "btn-done" : `btn-complete bc-${cat.color}`} disabled={done} onClick={() => onComplete(quest)}>
          {done ? "Completed" : <><span>Complete Quest</span><ChevronRight size={14} /></>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── QuestModal ───────────────────────────────────────────────────────────────
function QuestModal({ mode, initialQuest, userLevel, onSave, onClose }) {
  const [name, setName]         = useState(initialQuest?.name     || "");
  const [desc, setDesc]         = useState(initialQuest?.desc     || "");
  const [category, setCategory] = useState(initialQuest?.category || "KNOWLEDGE");
  const [repeat, setRepeat]     = useState(initialQuest?.repeat   || "daily");
  const [tier, setTier]         = useState(initialQuest?.tier     || "E");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), desc: desc.trim() || "Custom quest.", category, repeat, tier }, initialQuest?.id || null);
    onClose();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 16 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="modal-box">
        <div className="modal-head">
          <div><p className="eyebrow">SYSTEM</p><h3 className="modal-title">{mode === "edit" ? "Edit Quest" : "Register New Quest"}</h3></div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="field">
            <label className="field-label">Quest Name</label>
            <input className="field-input" placeholder="e.g. Morning Run" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
          <div className="field">
            <label className="field-label">Description <span className="optional">(optional)</span></label>
            <input className="field-input" placeholder="e.g. Run at least 2km outdoors" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Category</label>
            <div className="cat-grid">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <button type="button" key={key} className={`cat-opt co-${cat.color} ${category === key ? "co-selected" : ""}`} onClick={() => setCategory(key)}>
                  <span className="co-name">{cat.label}</span>
                  <span className="co-meta">{cat.stat}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label className="field-label">Difficulty Tier</label>
            <div className="tier-grid">
              {TIER_ORDER.map((t) => {
                const td      = TIERS[t];
                const locked  = userLevel < td.unlockLevel;
                const selected = tier === t;
                return (
                  <button type="button" key={t} disabled={locked}
                    className={`tier-opt ${selected ? "tier-opt-selected" : ""} ${locked ? "tier-opt-locked" : ""}`}
                    style={selected ? { borderColor: td.hex, background: `${td.hex}18`, color: td.hex } : {}}
                    onClick={() => !locked && setTier(t)}
                  >
                    {locked ? <Lock size={10} className="tier-lock-icon" /> : null}
                    <span className="tier-opt-label" style={{ color: locked ? undefined : td.hex }}>{t}</span>
                    <span className="tier-opt-xp">{locked ? `Lv.${td.unlockLevel}` : `+${td.xp} XP`}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label className="field-label">Repeat</label>
            <div className="repeat-toggle repeat-toggle-3">
              {[
                { v: "daily",  name: "Daily",    desc: "Resets every midnight"  },
                { v: "weekly", name: "⚔ Weekly", desc: "Resets every Monday"   },
                { v: "once",   name: "Once",     desc: "Removed on completion" },
              ].map((r) => (
                <button type="button" key={r.v} className={`repeat-opt ${repeat === r.v ? "repeat-selected" : ""}`} onClick={() => setRepeat(r.v)}>
                  <span className="repeat-opt-name">{r.name}</span>
                  <span className="repeat-opt-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-submit">{mode === "edit" ? "Save Changes" : "Register Quest"}</button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── WeeklyBossCard ───────────────────────────────────────────────────────────
const BOSS_THRESHOLD = 25;
function WeeklyBossCard({ boss, defeated, weeklyQuests, onDefeat }) {
  const unlocked = weeklyQuests >= BOSS_THRESHOLD;
  const progress = Math.min(100, Math.round((weeklyQuests / BOSS_THRESHOLD) * 100));
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`weekly-boss-card ${defeated ? "boss-defeated" : ""}`}>
      <div className="boss-header">
        <div className="boss-header-left">
          <span className="boss-eyebrow">WEEKLY BOSS</span>
          <p className="boss-name">{boss.name}</p>
        </div>
        {defeated
          ? <span className="boss-cleared-stamp"><Check size={11} /> DEFEATED</span>
          : <span className="boss-xp-badge">+500 EXP</span>
        }
      </div>
      <p className="boss-desc">{boss.desc}</p>
      {!defeated && !unlocked && (
        <div className="boss-lock-row">
          <div className="boss-lock-track"><div className="boss-lock-fill" style={{ width: `${progress}%` }} /></div>
          <span className="boss-lock-label">{weeklyQuests} / {BOSS_THRESHOLD} quests to unlock</span>
        </div>
      )}
      <button className={defeated ? "btn-done boss-btn" : "btn-complete bc-red boss-btn"} disabled={defeated || !unlocked} onClick={onDefeat}>
        {defeated ? "Defeated" : !unlocked ? <><Lock size={13} /><span>Locked</span></> : <><span>Challenge Boss</span><ChevronRight size={14} /></>}
      </button>
    </motion.div>
  );
}

// ─── AchievementToast ─────────────────────────────────────────────────────────
function AchievementToast({ achievement }) {
  return (
    <motion.div initial={{ opacity: 0, y: 80, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 60, x: "-50%" }} transition={{ type: "spring", stiffness: 240, damping: 22 }} className="ach-toast">
      <span className="ach-toast-icon">{achievement.icon}</span>
      <div className="ach-toast-body">
        <p className="ach-toast-eyebrow">ACHIEVEMENT UNLOCKED</p>
        <p className="ach-toast-label">{achievement.label}</p>
        <p className="ach-toast-desc">{achievement.desc}</p>
      </div>
    </motion.div>
  );
}

// ─── LoadingScreen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="app-root">
      <div className="bg-layer" />
      <div className="loading-screen">
        <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }} className="loading-label">SYSTEM INTERFACE</motion.p>
        <div className="loading-dots">
          {[0,1,2].map((i) => (
            <motion.div key={i} className="loading-dot" animate={{ opacity: [0.15,1,0.15], scale: [0.8,1.2,0.8] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LevelUpOverlay ───────────────────────────────────────────────────────────
function LevelUpOverlay({ level }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="levelup-overlay">
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.15, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="levelup-box">
        <motion.div animate={{ scale: [1,1.12,1], opacity: [0.4,0.9,0.4] }} transition={{ duration: 1.8, repeat: Infinity }} className="levelup-ring" />
        <motion.div animate={{ scale: [1,1.06,1], opacity: [0.15,0.35,0.15] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} className="levelup-ring-2" />
        <p className="lu-sys">SYSTEM ALERT</p>
        <p className="lu-heading">LEVEL UP</p>
        <p className="lu-num">LV.{level}</p>
        <p className="lu-rank">{getRankTitle(level)}</p>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="lu-line" />
      </motion.div>
    </motion.div>
  );
}

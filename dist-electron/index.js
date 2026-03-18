import { ipcMain as a, BrowserWindow as m, dialog as S, safeStorage as v, app as f, nativeTheme as b } from "electron";
import { extname as W, basename as _, join as g, dirname as O } from "path";
import { fileURLToPath as j } from "url";
import { writeFileSync as d, existsSync as h, readFileSync as C, mkdirSync as T } from "fs";
import { readFile as I } from "fs/promises";
import { createRequire as J } from "module";
import L from "groq-sdk";
const F = J(import.meta.url), Y = F("pdf-parse"), U = F("mammoth");
async function B(e) {
  const t = await I(e);
  return (await Y(t)).text;
}
async function H(e) {
  return (await U.extractRawText({ path: e })).value;
}
async function z(e) {
  return await I(e, "utf-8");
}
async function P(e) {
  const t = W(e).toLowerCase();
  switch (t) {
    case ".pdf":
      const s = await B(e), n = Math.ceil(s.length / 3e3);
      return { text: s, pages: n };
    case ".docx":
    case ".doc":
      return { text: await H(e) };
    case ".txt":
    case ".md":
      return { text: await z(e) };
    default:
      throw new Error(`Unsupported file type: ${t}`);
  }
}
function R(e, t = 12e3, s = 500) {
  if (e.length <= t)
    return [e];
  const n = [];
  let r = 0;
  for (; r < e.length; ) {
    let o = r + t;
    if (o < e.length) {
      const l = e.lastIndexOf(`

`, o);
      if (l > r + t / 2)
        o = l + 2;
      else {
        const u = e.lastIndexOf(". ", o);
        u > r + t / 2 && (o = u + 2);
      }
    }
    n.push(e.slice(r, o)), r = o - s;
  }
  return n;
}
function G(e) {
  return e.join(`

---

`);
}
function K() {
  a.handle("file:select", async (e) => {
    const t = m.fromWebContents(e.sender), s = await S.showOpenDialog(t, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Documents", extensions: ["pdf", "docx", "doc", "txt", "md"] }
      ]
    });
    return s.canceled || s.filePaths.length === 0 ? null : s.filePaths;
  }), a.handle("file:parse", async (e, t) => {
    console.log("Parsing file:", t);
    try {
      const { text: s, pages: n } = await P(t);
      return console.log("Parse success:", s.length, "chars"), {
        success: !0,
        fileName: _(t),
        text: s,
        pages: n,
        charCount: s.length
      };
    } catch (s) {
      return console.error("Parse error:", s), {
        success: !1,
        error: s instanceof Error ? s.message : "Unknown error"
      };
    }
  }), a.handle("file:parseMultiple", async (e, t) => {
    console.log("Parsing multiple files:", t);
    try {
      const s = await Promise.all(
        t.map(async (r) => {
          const { text: o } = await P(r);
          return { fileName: _(r), text: o };
        })
      ), n = G(s.map((r) => r.text));
      return {
        success: !0,
        files: s.map((r) => r.fileName),
        text: n,
        charCount: n.length
      };
    } catch (s) {
      return console.error("Parse multiple error:", s), {
        success: !1,
        error: s instanceof Error ? s.message : "Unknown error"
      };
    }
  }), a.handle("file:chunk", async (e, t, s) => {
    const n = R(t, s);
    return {
      chunks: n,
      count: n.length
    };
  });
}
const V = `You are an expert academic assistant that analyzes course syllabi and extracts structured information. Your task is to carefully read the provided syllabus and extract all relevant details into a structured JSON format.

## Guidelines:
1. Extract information accurately - do not infer or hallucinate details not present in the syllabus
2. For dates that are relative (e.g., "Week 3", "midterm week") or unclear, include the original text in dueDateRaw field
3. Only include dueDate (ISO format YYYY-MM-DD) when you can determine an exact date
4. If a semester start date is provided, use it to calculate relative dates like "Week 3" = start date + 14 days
5. Estimate assignment weights if a grading breakdown is provided
6. Generate practical, actionable preparation tips based on the course requirements
7. Categorize assignments correctly based on their nature
8. Flag assignments that might be duplicates (similar name and date)

## Required Output Structure:
Return ONLY valid JSON matching this structure (no markdown, no explanation, just JSON):

{
  "courseName": "string (full course name with code if available)",
  "courseCode": "string (e.g., 'CS 101') or null",
  "term": "string (e.g., 'Fall 2026') or null",
  "instructor": {
    "name": "string",
    "email": "string or null",
    "phone": "string or null",
    "officeLocation": "string or null",
    "officeHours": [{ "day": "string", "startTime": "HH:MM", "endTime": "HH:MM", "location": "string or null" }]
  },
  "assignments": [{
    "title": "string",
    "type": "exam | midterm | final | quiz | homework | project | paper | presentation | lab | participation | other",
    "description": "string or null",
    "dueDate": "YYYY-MM-DD or null",
    "dueDateRaw": "original text from syllabus if date is relative/unclear",
    "weight": "number (percentage 0-100) or null",
    "estimatedTime": "string (e.g., '2-3 hours') or null",
    "relatedTopics": ["array of strings"],
    "isPotentialDuplicate": "boolean - true if this seems like a duplicate of another assignment"
  }],
  "gradeWeights": [{
    "category": "string (e.g., 'Homework', 'Exams')",
    "weight": "number (percentage 0-100)",
    "description": "string or null"
  }],
  "materials": [{
    "type": "textbook | online_resource | software | equipment | reading | other",
    "title": "string",
    "author": "string or null",
    "isbn": "string or null",
    "url": "string or null",
    "isRequired": "boolean",
    "notes": "string or null"
  }],
  "prepTips": [{
    "category": "study_strategy | time_management | exam_prep | resource_recommendation | general",
    "content": "string (actionable advice specific to this course)",
    "priority": "high | medium | low"
  }],
  "policies": {
    "attendance": "string summarizing policy or null",
    "lateWork": "string summarizing policy or null",
    "academicIntegrity": "string summarizing policy or null",
    "grading": "string summarizing grading scale or null",
    "other": ["array of other notable policies"]
  }
}

Generate 3-5 helpful preparation tips based on the course structure, workload, and requirements. These should be practical and specific to this course.`, X = `You are merging syllabus analysis results from multiple document chunks. Combine the following partial results into a single coherent analysis.

Rules:
1. Merge assignments, removing exact duplicates (same title AND same date)
2. Keep all unique materials and prep tips
3. Use the most complete instructor information found
4. Combine grade weights (they should appear in one chunk, but verify totals)
5. Flag any assignments that appear similar but might be duplicates

Return the merged result as a single JSON object with the same structure.`;
class Q {
  client;
  constructor(t) {
    this.client = new L({ apiKey: t });
  }
  async analyzeSyllabus(t, s) {
    let n = "";
    s && (n = `

Note: The semester starts on ${s}. Use this to calculate dates for relative references like "Week 3".`);
    const o = (await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: V
        },
        {
          role: "user",
          content: `Please analyze this syllabus and extract structured information:${n}

${t}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })).choices[0]?.message?.content;
    if (!o)
      throw new Error("No response from Groq API");
    try {
      return JSON.parse(o);
    } catch (l) {
      throw new Error(`Failed to parse LLM response as JSON: ${l}`);
    }
  }
  async mergeChunkResults(t) {
    if (t.length === 1)
      return t[0];
    const n = (await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: X
        },
        {
          role: "user",
          content: `Merge these partial syllabus analysis results:

${JSON.stringify(t, null, 2)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })).choices[0]?.message?.content;
    if (!n)
      throw new Error("No response from Groq API during merge");
    return JSON.parse(n);
  }
  async testConnection() {
    try {
      return !!(await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: 'Say "ok" and nothing else.' }
        ],
        max_tokens: 10
      })).choices[0]?.message?.content;
    } catch {
      return !1;
    }
  }
}
function x() {
  const e = f.getPath("userData");
  return g(e, "secure-keys.enc");
}
function Z(e) {
  try {
    if (!v.isEncryptionAvailable()) {
      console.warn("Encryption not available, storing key in plain text");
      const n = x();
      return d(n, e), !0;
    }
    const t = v.encryptString(e), s = x();
    return d(s, t), !0;
  } catch (t) {
    return console.error("Failed to save API key:", t), !1;
  }
}
function $() {
  try {
    const e = x();
    if (!h(e))
      return null;
    const t = C(e);
    return v.isEncryptionAvailable() ? v.decryptString(t) : t.toString("utf-8");
  } catch (e) {
    return console.error("Failed to load API key:", e), null;
  }
}
function ee() {
  try {
    const e = x();
    if (h(e)) {
      const { unlinkSync: t } = require("fs");
      t(e);
    }
    return !0;
  } catch (e) {
    return console.error("Failed to delete API key:", e), !1;
  }
}
let w = null;
function D() {
  if (!w) {
    const e = $();
    if (!e)
      throw new Error("Groq API key not configured. Please add your API key in Settings.");
    w = new Q(e);
  }
  return w;
}
function te() {
  a.handle("llm:saveApiKey", async (e, t) => {
    const s = Z(t);
    return s && (w = null), { success: s };
  }), a.handle("llm:hasApiKey", async () => ({ hasKey: !!$() })), a.handle("llm:deleteApiKey", async () => {
    const e = ee();
    return w = null, { success: e };
  }), a.handle("llm:testConnection", async () => {
    try {
      const t = await D().testConnection();
      return { success: t, error: t ? null : "Connection test failed" };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Unknown error"
      };
    }
  }), a.handle(
    "llm:analyze",
    async (e, t, s) => {
      console.log("Starting syllabus analysis...");
      try {
        const n = D(), r = R(t, 1e4, 500);
        console.log(`Text split into ${r.length} chunk(s)`);
        let o;
        if (r.length === 1)
          o = await n.analyzeSyllabus(r[0], s.semesterStartDate);
        else {
          const l = [];
          for (let u = 0; u < r.length; u++) {
            console.log(`Analyzing chunk ${u + 1}/${r.length}...`);
            const q = await n.analyzeSyllabus(
              r[u],
              s.semesterStartDate
            );
            l.push(q);
          }
          console.log("Merging chunk results..."), o = await n.mergeChunkResults(l);
        }
        return s.courseName && (o.courseName = s.courseName), console.log("Analysis complete:", {
          courseName: o.courseName,
          assignments: o.assignments?.length || 0,
          materials: o.materials?.length || 0
        }), {
          success: !0,
          data: o
        };
      } catch (n) {
        return console.error("Analysis failed:", n), {
          success: !1,
          error: n instanceof Error ? n.message : "Analysis failed"
        };
      }
    }
  );
}
const y = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
function k() {
  const e = f.getPath("userData");
  return g(e, "courses.json");
}
function ne() {
  const e = k(), t = g(e, "..");
  h(t) || T(t, { recursive: !0 });
}
function c() {
  try {
    const e = k();
    if (h(e)) {
      const t = C(e, "utf-8");
      return JSON.parse(t);
    }
  } catch (e) {
    console.error("Failed to load courses:", e);
  }
  return [];
}
function p(e) {
  try {
    ne();
    const t = k();
    d(t, JSON.stringify(e, null, 2));
  } catch (t) {
    console.error("Failed to save courses:", t);
  }
}
function se(e) {
  const t = c(), s = {
    ...e,
    id: `course_${y()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    // Ensure assignments have IDs
    assignments: (e.assignments || []).map((n) => ({
      ...n,
      id: n.id || `assign_${y()}`,
      isCompleted: n.isCompleted || !1
    })),
    // Ensure materials have IDs
    materials: (e.materials || []).map((n) => ({
      ...n,
      id: n.id || `mat_${y()}`
    })),
    // Ensure prep tips have IDs
    prepTips: (e.prepTips || []).map((n) => ({
      ...n,
      id: n.id || `tip_${y()}`
    }))
  };
  return t.push(s), p(t), s;
}
function re(e, t) {
  const s = c(), n = s.findIndex((r) => r.id === e);
  return n === -1 ? null : (s[n] = {
    ...s[n],
    ...t,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, p(s), s[n]);
}
function oe(e) {
  const t = c(), s = t.filter((n) => n.id !== e);
  return s.length === t.length ? !1 : (p(s), !0);
}
function ae(e) {
  return c().find((s) => s.id === e) || null;
}
function ie(e) {
  return c().filter((s) => s.semesterId === e);
}
function ce(e, t, s) {
  const n = c(), r = n.find((l) => l.id === e);
  if (!r) return null;
  const o = r.assignments.findIndex((l) => l.id === t);
  return o === -1 ? null : (r.assignments[o] = {
    ...r.assignments[o],
    ...s
  }, r.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), p(n), r.assignments[o]);
}
function le(e, t) {
  const s = c(), n = s.find((o) => o.id === e);
  if (!n) return null;
  const r = {
    ...t,
    id: `assign_${y()}`,
    isCompleted: t.isCompleted || !1
  };
  return n.assignments.push(r), n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), p(s), r;
}
function ue(e, t) {
  const s = c(), n = s.find((o) => o.id === e);
  if (!n) return !1;
  const r = n.assignments.length;
  return n.assignments = n.assignments.filter((o) => o.id !== t), n.assignments.length === r ? !1 : (n.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), p(s), !0);
}
function de() {
  const e = c();
  return JSON.stringify(e, null, 2);
}
function fe() {
  const e = c(), t = [];
  t.push("Course,Assignment,Type,Due Date,Weight,Completed,Grade");
  for (const s of e)
    for (const n of s.assignments)
      t.push([
        `"${s.name.replace(/"/g, '""')}"`,
        `"${n.title.replace(/"/g, '""')}"`,
        n.type,
        n.dueDate || n.dueDateRaw || "",
        n.weight?.toString() || "",
        n.isCompleted ? "Yes" : "No",
        n.gradeReceived?.toString() || ""
      ].join(","));
  return t.join(`
`);
}
function me() {
  return {
    courses: c(),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function ge() {
  a.handle("store:getCourses", async () => c()), a.handle("store:getCoursesBySemester", async (e, t) => ie(t)), a.handle("store:getCourse", async (e, t) => ae(t)), a.handle("store:createCourse", async (e, t) => {
    try {
      return { success: !0, course: se(t) };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Failed to create course"
      };
    }
  }), a.handle("store:updateCourse", async (e, t, s) => {
    try {
      const n = re(t, s);
      return n ? { success: !0, course: n } : { success: !1, error: "Course not found" };
    } catch (n) {
      return {
        success: !1,
        error: n instanceof Error ? n.message : "Failed to update course"
      };
    }
  }), a.handle("store:deleteCourse", async (e, t) => ({ success: oe(t) })), a.handle(
    "store:updateAssignment",
    async (e, t, s, n) => {
      try {
        const r = ce(t, s, n);
        return r ? { success: !0, assignment: r } : { success: !1, error: "Assignment not found" };
      } catch (r) {
        return {
          success: !1,
          error: r instanceof Error ? r.message : "Failed to update assignment"
        };
      }
    }
  ), a.handle(
    "store:addAssignment",
    async (e, t, s) => {
      try {
        const n = le(t, s);
        return n ? { success: !0, assignment: n } : { success: !1, error: "Course not found" };
      } catch (n) {
        return {
          success: !1,
          error: n instanceof Error ? n.message : "Failed to add assignment"
        };
      }
    }
  ), a.handle("store:deleteAssignment", async (e, t, s) => ({ success: ue(t, s) })), a.handle("store:exportJSON", async (e) => {
    const t = m.fromWebContents(e.sender), s = await S.showSaveDialog(t, {
      defaultPath: "syllabus-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (s.canceled || !s.filePath)
      return { success: !1, canceled: !0 };
    try {
      const n = de();
      return d(s.filePath, n), { success: !0, path: s.filePath };
    } catch (n) {
      return {
        success: !1,
        error: n instanceof Error ? n.message : "Export failed"
      };
    }
  }), a.handle("store:exportCSV", async (e) => {
    const t = m.fromWebContents(e.sender), s = await S.showSaveDialog(t, {
      defaultPath: "syllabus-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }]
    });
    if (s.canceled || !s.filePath)
      return { success: !1, canceled: !0 };
    try {
      const n = fe();
      return d(s.filePath, n), { success: !0, path: s.filePath };
    } catch (n) {
      return {
        success: !1,
        error: n instanceof Error ? n.message : "Export failed"
      };
    }
  }), a.handle("store:getExportData", async () => me()), a.handle("store:savePDF", async (e, t) => {
    const s = m.fromWebContents(e.sender), n = await S.showSaveDialog(s, {
      defaultPath: "syllabus-report.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (n.canceled || !n.filePath)
      return { success: !1, canceled: !0 };
    try {
      return d(n.filePath, Buffer.from(t)), { success: !0, path: n.filePath };
    } catch (r) {
      return {
        success: !1,
        error: r instanceof Error ? r.message : "Export failed"
      };
    }
  });
}
function he() {
  K(), te(), ge();
}
const pe = j(import.meta.url), A = O(pe);
function M() {
  const e = f.getPath("userData");
  return g(e, "window-state.json");
}
function ye() {
  try {
    const e = M();
    if (h(e)) {
      const t = C(e, "utf-8");
      return JSON.parse(t);
    }
  } catch (e) {
    console.error("Failed to load window bounds:", e);
  }
  return { width: 1200, height: 800 };
}
function we(e) {
  try {
    const t = M(), s = O(t);
    h(s) || T(s, { recursive: !0 }), d(t, JSON.stringify(e, null, 2));
  } catch (t) {
    console.error("Failed to save window bounds:", t);
  }
}
let i = null;
function E() {
  const { width: e, height: t, x: s, y: n } = ye();
  i = new m({
    width: e,
    height: t,
    x: s,
    y: n,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: g(A, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: b.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    show: !1
    // Don't show until ready
  }), i.on("resize", N), i.on("move", N), i.once("ready-to-show", () => {
    i?.show();
  }), i.on("closed", () => {
    i = null;
  }), process.env.VITE_DEV_SERVER_URL ? (i.loadURL(process.env.VITE_DEV_SERVER_URL), i.webContents.openDevTools()) : i.loadFile(g(A, "../dist/index.html"));
}
function N() {
  if (!i) return;
  const e = i.getBounds();
  we(e);
}
f.whenReady().then(() => {
  he(), E(), f.on("activate", () => {
    m.getAllWindows().length === 0 && E();
  });
});
f.on("window-all-closed", () => {
  process.platform !== "darwin" && f.quit();
});
b.on("updated", () => {
  i?.webContents.send("theme-changed", b.shouldUseDarkColors);
});

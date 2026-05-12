import { ipcMain as i, BrowserWindow as b, dialog as I, safeStorage as D, app as h, shell as he, Notification as M, nativeTheme as L, nativeImage as ge, Tray as me, Menu as pe } from "electron";
import { extname as ye, basename as q, join as y, dirname as ee } from "path";
import { fileURLToPath as we } from "url";
import { writeFileSync as m, existsSync as g, readFileSync as C, unlinkSync as $, mkdirSync as te } from "fs";
import { readFile as ne } from "fs/promises";
import { createRequire as Se } from "module";
import De from "groq-sdk";
import { google as se } from "googleapis";
import { createServer as Ce } from "http";
import { deflateSync as be } from "zlib";
const re = Se(import.meta.url), Ee = re("pdf-parse"), Te = re("mammoth");
async function ve(e) {
  const t = await ne(e);
  return (await Ee(t)).text;
}
async function Ae(e) {
  return (await Te.extractRawText({ path: e })).value;
}
async function Ie(e) {
  return await ne(e, "utf-8");
}
async function H(e) {
  const t = ye(e).toLowerCase();
  switch (t) {
    case ".pdf":
      const n = await ve(e), s = Math.ceil(n.length / 3e3);
      return { text: n, pages: s };
    case ".docx":
    case ".doc":
      return { text: await Ae(e) };
    case ".txt":
    case ".md":
      return { text: await Ie(e) };
    default:
      throw new Error(`Unsupported file type: ${t}`);
  }
}
function oe(e, t = 12e3, n = 500) {
  if (e.length <= t)
    return [e];
  const s = [];
  let o = 0;
  for (; o < e.length; ) {
    let r = o + t;
    if (r < e.length) {
      const a = e.lastIndexOf(`

`, r);
      if (a > o + t / 2)
        r = a + 2;
      else {
        const c = e.lastIndexOf(". ", r);
        c > o + t / 2 && (r = c + 2);
      }
    }
    s.push(e.slice(o, r)), o = r - n;
  }
  return s;
}
function Ne(e) {
  return e.join(`

---

`);
}
function xe() {
  i.handle("file:select", async (e) => {
    const t = b.fromWebContents(e.sender), n = await I.showOpenDialog(t, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Documents", extensions: ["pdf", "docx", "doc", "txt", "md"] }
      ]
    });
    return n.canceled || n.filePaths.length === 0 ? null : n.filePaths;
  }), i.handle("file:parse", async (e, t) => {
    console.log("Parsing file:", t);
    try {
      const { text: n, pages: s } = await H(t);
      return console.log("Parse success:", n.length, "chars"), {
        success: !0,
        fileName: q(t),
        text: n,
        pages: s,
        charCount: n.length
      };
    } catch (n) {
      return console.error("Parse error:", n), {
        success: !1,
        error: n instanceof Error ? n.message : "Unknown error"
      };
    }
  }), i.handle("file:parseMultiple", async (e, t) => {
    console.log("Parsing multiple files:", t);
    try {
      const n = await Promise.all(
        t.map(async (o) => {
          const { text: r } = await H(o);
          return { fileName: q(o), text: r };
        })
      ), s = Ne(n.map((o) => o.text));
      return {
        success: !0,
        files: n.map((o) => o.fileName),
        text: s,
        charCount: s.length
      };
    } catch (n) {
      return console.error("Parse multiple error:", n), {
        success: !1,
        error: n instanceof Error ? n.message : "Unknown error"
      };
    }
  }), i.handle("file:chunk", async (e, t, n) => {
    const s = oe(t, n);
    return {
      chunks: s,
      count: s.length
    };
  });
}
const Oe = `You are an expert academic assistant that analyzes course syllabi and extracts structured information. Your task is to carefully read the provided syllabus and extract all relevant details into a structured JSON format.

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

Generate 3-5 helpful preparation tips based on the course structure, workload, and requirements. These should be practical and specific to this course.`, Pe = `You are merging syllabus analysis results from multiple document chunks. Combine the following partial results into a single coherent analysis.

Rules:
1. Merge assignments, removing exact duplicates (same title AND same date)
2. Keep all unique materials and prep tips
3. Use the most complete instructor information found
4. Combine grade weights (they should appear in one chunk, but verify totals)
5. Flag any assignments that appear similar but might be duplicates

Return the merged result as a single JSON object with the same structure.`;
class ke {
  client;
  constructor(t) {
    this.client = new De({ apiKey: t });
  }
  async analyzeSyllabus(t, n) {
    let s = "";
    n && (s = `

Note: The semester starts on ${n}. Use this to calculate dates for relative references like "Week 3".`);
    const r = (await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: Oe
        },
        {
          role: "user",
          content: `Please analyze this syllabus and extract structured information:${s}

${t}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })).choices[0]?.message?.content;
    if (!r)
      throw new Error("No response from Groq API");
    try {
      return JSON.parse(r);
    } catch (a) {
      throw new Error(`Failed to parse LLM response as JSON: ${a}`);
    }
  }
  async mergeChunkResults(t) {
    if (t.length === 1)
      return t[0];
    const s = (await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: Pe
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
    if (!s)
      throw new Error("No response from Groq API during merge");
    return JSON.parse(s);
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
function _() {
  const e = h.getPath("userData");
  return y(e, "secure-keys.enc");
}
function $e(e) {
  try {
    if (!D.isEncryptionAvailable()) {
      console.warn("Encryption not available, storing key in plain text");
      const s = _();
      return m(s, e), !0;
    }
    const t = D.encryptString(e), n = _();
    return m(n, t), !0;
  } catch (t) {
    return console.error("Failed to save API key:", t), !1;
  }
}
function ae() {
  try {
    const e = _();
    if (!g(e))
      return null;
    const t = C(e);
    return D.isEncryptionAvailable() ? D.decryptString(t) : t.toString("utf-8");
  } catch (e) {
    return console.error("Failed to load API key:", e), null;
  }
}
function _e() {
  try {
    const e = _();
    return g(e) && $(e), !0;
  } catch (e) {
    return console.error("Failed to delete API key:", e), !1;
  }
}
let N = null;
function j() {
  if (!N) {
    const e = ae();
    if (!e)
      throw new Error("Groq API key not configured. Please add your API key in Settings.");
    N = new ke(e);
  }
  return N;
}
function Re() {
  i.handle("llm:saveApiKey", async (e, t) => {
    const n = $e(t);
    return n && (N = null), { success: n };
  }), i.handle("llm:hasApiKey", async () => ({ hasKey: !!ae() })), i.handle("llm:deleteApiKey", async () => {
    const e = _e();
    return N = null, { success: e };
  }), i.handle("llm:testConnection", async () => {
    try {
      const t = await j().testConnection();
      return { success: t, error: t ? null : "Connection test failed" };
    } catch (e) {
      return {
        success: !1,
        error: e instanceof Error ? e.message : "Unknown error"
      };
    }
  }), i.handle(
    "llm:analyze",
    async (e, t, n) => {
      console.log("Starting syllabus analysis...");
      try {
        const s = j(), o = oe(t, 1e4, 500);
        console.log(`Text split into ${o.length} chunk(s)`);
        let r;
        if (o.length === 1)
          r = await s.analyzeSyllabus(o[0], n.semesterStartDate);
        else {
          const a = [];
          for (let c = 0; c < o.length; c++) {
            console.log(`Analyzing chunk ${c + 1}/${o.length}...`);
            const d = await s.analyzeSyllabus(
              o[c],
              n.semesterStartDate
            );
            a.push(d);
          }
          console.log("Merging chunk results..."), r = await s.mergeChunkResults(a);
        }
        return n.courseName && (r.courseName = n.courseName), console.log("Analysis complete:", {
          courseName: r.courseName,
          assignments: r.assignments?.length || 0,
          materials: r.materials?.length || 0
        }), {
          success: !0,
          data: r
        };
      } catch (s) {
        return console.error("Analysis failed:", s), {
          success: !1,
          error: s instanceof Error ? s.message : "Analysis failed"
        };
      }
    }
  );
}
const A = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
function W() {
  const e = h.getPath("userData");
  return y(e, "courses.json");
}
function Be() {
  const e = W(), t = y(e, "..");
  g(t) || te(t, { recursive: !0 });
}
function f() {
  try {
    const e = W();
    if (g(e)) {
      const t = C(e, "utf-8");
      return JSON.parse(t);
    }
  } catch (e) {
    console.error("Failed to load courses:", e);
  }
  return [];
}
function T(e) {
  try {
    Be();
    const t = W();
    m(t, JSON.stringify(e, null, 2));
  } catch (t) {
    console.error("Failed to save courses:", t);
  }
}
function Ue(e) {
  const t = f(), n = {
    ...e,
    id: `course_${A()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    // Ensure assignments have IDs
    assignments: (e.assignments || []).map((s) => ({
      ...s,
      id: s.id || `assign_${A()}`,
      isCompleted: s.isCompleted || !1
    })),
    // Ensure materials have IDs
    materials: (e.materials || []).map((s) => ({
      ...s,
      id: s.id || `mat_${A()}`
    })),
    // Ensure prep tips have IDs
    prepTips: (e.prepTips || []).map((s) => ({
      ...s,
      id: s.id || `tip_${A()}`
    }))
  };
  return t.push(n), T(t), n;
}
function Me(e, t) {
  const n = f(), s = n.findIndex((o) => o.id === e);
  return s === -1 ? null : (n[s] = {
    ...n[s],
    ...t,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }, T(n), n[s]);
}
function Le(e) {
  const t = f(), n = t.filter((s) => s.id !== e);
  return n.length === t.length ? !1 : (T(n), !0);
}
function Fe(e) {
  return f().find((n) => n.id === e) || null;
}
function ze(e) {
  return f().filter((n) => n.semesterId === e);
}
function Je(e, t, n) {
  const s = f(), o = s.find((a) => a.id === e);
  if (!o) return null;
  const r = o.assignments.findIndex((a) => a.id === t);
  return r === -1 ? null : (o.assignments[r] = {
    ...o.assignments[r],
    ...n
  }, o.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(s), o.assignments[r]);
}
function Ge(e, t) {
  const n = f(), s = n.find((r) => r.id === e);
  if (!s) return null;
  const o = {
    ...t,
    id: `assign_${A()}`,
    isCompleted: t.isCompleted || !1
  };
  return s.assignments.push(o), s.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n), o;
}
function We(e, t) {
  const n = f(), s = n.find((r) => r.id === e);
  if (!s) return !1;
  const o = s.assignments.length;
  return s.assignments = s.assignments.filter((r) => r.id !== t), s.assignments.length === o ? !1 : (s.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), T(n), !0);
}
function qe() {
  const e = f();
  return JSON.stringify(e, null, 2);
}
function He() {
  const e = f(), t = [];
  t.push("Course,Assignment,Type,Due Date,Weight,Completed,Grade");
  for (const n of e)
    for (const s of n.assignments)
      t.push([
        `"${n.name.replace(/"/g, '""')}"`,
        `"${s.title.replace(/"/g, '""')}"`,
        s.type,
        s.dueDate || s.dueDateRaw || "",
        s.weight?.toString() || "",
        s.isCompleted ? "Yes" : "No",
        s.gradeReceived?.toString() || ""
      ].join(","));
  return t.join(`
`);
}
function je() {
  return {
    courses: f(),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Ye() {
  i.handle("store:getCourses", async () => f()), i.handle("store:getCoursesBySemester", async (e, t) => ze(t)), i.handle("store:getCourse", async (e, t) => Fe(t)), i.handle("store:createCourse", async (e, t) => {
    try {
      return { success: !0, course: Ue(t) };
    } catch (n) {
      return {
        success: !1,
        error: n instanceof Error ? n.message : "Failed to create course"
      };
    }
  }), i.handle("store:updateCourse", async (e, t, n) => {
    try {
      const s = Me(t, n);
      return s ? { success: !0, course: s } : { success: !1, error: "Course not found" };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Failed to update course"
      };
    }
  }), i.handle("store:deleteCourse", async (e, t) => ({ success: Le(t) })), i.handle(
    "store:updateAssignment",
    async (e, t, n, s) => {
      try {
        const o = Je(t, n, s);
        return o ? { success: !0, assignment: o } : { success: !1, error: "Assignment not found" };
      } catch (o) {
        return {
          success: !1,
          error: o instanceof Error ? o.message : "Failed to update assignment"
        };
      }
    }
  ), i.handle(
    "store:addAssignment",
    async (e, t, n) => {
      try {
        const s = Ge(t, n);
        return s ? { success: !0, assignment: s } : { success: !1, error: "Course not found" };
      } catch (s) {
        return {
          success: !1,
          error: s instanceof Error ? s.message : "Failed to add assignment"
        };
      }
    }
  ), i.handle("store:deleteAssignment", async (e, t, n) => ({ success: We(t, n) })), i.handle("store:exportJSON", async (e) => {
    const t = b.fromWebContents(e.sender), n = await I.showSaveDialog(t, {
      defaultPath: "syllabus-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (n.canceled || !n.filePath)
      return { success: !1, canceled: !0 };
    try {
      const s = qe();
      return m(n.filePath, s), { success: !0, path: n.filePath };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Export failed"
      };
    }
  }), i.handle("store:exportCSV", async (e) => {
    const t = b.fromWebContents(e.sender), n = await I.showSaveDialog(t, {
      defaultPath: "syllabus-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }]
    });
    if (n.canceled || !n.filePath)
      return { success: !1, canceled: !0 };
    try {
      const s = He();
      return m(n.filePath, s), { success: !0, path: n.filePath };
    } catch (s) {
      return {
        success: !1,
        error: s instanceof Error ? s.message : "Export failed"
      };
    }
  }), i.handle("store:getExportData", async () => je()), i.handle("store:savePDF", async (e, t) => {
    const n = b.fromWebContents(e.sender), s = await I.showSaveDialog(n, {
      defaultPath: "syllabus-report.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (s.canceled || !s.filePath)
      return { success: !1, canceled: !0 };
    try {
      return m(s.filePath, Buffer.from(t)), { success: !0, path: s.filePath };
    } catch (o) {
      return {
        success: !1,
        error: o instanceof Error ? o.message : "Export failed"
      };
    }
  });
}
function O(e) {
  return e.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n").replace(/\r/g, "");
}
function Y(e) {
  const t = new Date(e), n = t.getUTCFullYear(), s = String(t.getUTCMonth() + 1).padStart(2, "0"), o = String(t.getUTCDate()).padStart(2, "0");
  return `${n}${s}${o}`;
}
function Ve(e) {
  return new Date(e).toISOString().replace(/[-:]/g, "").replace(".000", "");
}
function Ke(e, t) {
  const n = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Syllabus Dashboard//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${O("Syllabus Dashboard")}`,
    "X-WR-TIMEZONE:UTC"
  ], s = Ve((/* @__PURE__ */ new Date()).toISOString());
  for (const o of e)
    for (const r of o.assignments) {
      if (!r.dueDate) continue;
      const a = `${r.id}@syllabus-dashboard`, c = Y(r.dueDate), d = Y(new Date(new Date(r.dueDate).getTime() + 864e5).toISOString()), l = [];
      o.name && l.push(`Course: ${o.name}`), r.type && l.push(`Type: ${r.type.charAt(0).toUpperCase() + r.type.slice(1)}`), r.weight !== void 0 && l.push(`Weight: ${r.weight}%`), r.description && l.push(`
${r.description}`), n.push("BEGIN:VEVENT"), n.push(`UID:${a}`), n.push(`DTSTAMP:${s}`), n.push(`DTSTART;VALUE=DATE:${c}`), n.push(`DTEND;VALUE=DATE:${d}`), n.push(`SUMMARY:${O(`${o.name}: ${r.title}`)}`), l.length && n.push(`DESCRIPTION:${O(l.join("\\n"))}`), n.push(`CATEGORIES:${O(o.name)}`), r.isCompleted ? n.push("STATUS:COMPLETED") : n.push("STATUS:CONFIRMED"), n.push("END:VEVENT");
    }
  return n.push("END:VCALENDAR"), n.join(`\r
`);
}
const Xe = ["https://www.googleapis.com/auth/calendar"], P = 42813, Qe = `http://localhost:${P}/oauth2callback`, R = () => y(h.getPath("userData"), "google-tokens.enc"), B = () => y(h.getPath("userData"), "google-creds.json");
function ie(e) {
  const t = JSON.stringify(e);
  D.isEncryptionAvailable() ? m(R(), D.encryptString(t)) : m(B(), t);
}
function F() {
  try {
    if (D.isEncryptionAvailable() && g(R())) {
      const e = C(R());
      return JSON.parse(D.decryptString(e));
    }
    if (g(B()))
      return JSON.parse(C(B(), "utf-8"));
  } catch {
  }
  return null;
}
function Ze() {
  const e = R(), t = B();
  try {
    g(e) && $(e);
  } catch {
  }
  try {
    g(t) && $(t);
  } catch {
  }
}
const x = () => y(h.getPath("userData"), "google-oauth-tokens.json");
function ce(e) {
  m(x(), JSON.stringify(e, null, 2));
}
function le() {
  try {
    if (g(x()))
      return JSON.parse(C(x(), "utf-8"));
  } catch {
  }
  return null;
}
function et() {
  try {
    g(x()) && $(x());
  } catch {
  }
}
function tt() {
  return le() !== null;
}
function ue(e) {
  return new se.auth.OAuth2(e.clientId, e.clientSecret, Qe);
}
async function nt(e) {
  const t = ue(e), n = t.generateAuthUrl({
    access_type: "offline",
    scope: Xe,
    prompt: "consent"
  });
  return new Promise((s, o) => {
    const r = Ce(async (a, c) => {
      try {
        const d = new URL(a.url, `http://localhost:${P}`), l = d.searchParams.get("code"), p = d.searchParams.get("error");
        if (p) {
          c.writeHead(200, { "Content-Type": "text/html" }), c.end("<h2>Authorization denied. You can close this tab.</h2>"), r.close(), o(new Error(`OAuth error: ${p}`));
          return;
        }
        if (!l) {
          c.writeHead(400, { "Content-Type": "text/html" }), c.end("<h2>Missing authorization code.</h2>"), r.close(), o(new Error("Missing authorization code"));
          return;
        }
        const { tokens: v } = await t.getToken(l);
        ce(v), ie(e), c.writeHead(200, { "Content-Type": "text/html" }), c.end("<h2>Connected! You can close this tab and return to Syllabus Dashboard.</h2>"), r.close(), s();
      } catch (d) {
        c.writeHead(500, { "Content-Type": "text/html" }), c.end("<h2>An error occurred. Please try again.</h2>"), r.close(), o(d);
      }
    });
    r.listen(P, () => {
      he.openExternal(n);
    }), r.on("error", (a) => {
      o(new Error(`Could not start local server on port ${P}: ${a.message}`));
    }), setTimeout(() => {
      r.close(), o(new Error("OAuth timed out"));
    }, 300 * 1e3);
  });
}
function V(e) {
  return e.split("T")[0];
}
function st(e) {
  return `sd${e}`.replace(/[^a-z0-9]/g, "").toLowerCase().slice(0, 64);
}
async function rt(e) {
  const t = le(), n = F();
  if (!t || !n) throw new Error("Not connected to Google Calendar");
  const s = ue(n);
  s.setCredentials(t), s.on("tokens", (d) => {
    ce({ ...t, ...d });
  });
  const o = se.calendar({ version: "v3", auth: s });
  let r = "primary";
  try {
    const l = (await o.calendarList.list()).data.items?.find((p) => p.summary === "Syllabus Dashboard");
    l ? r = l.id : r = (await o.calendars.insert({
      requestBody: { summary: "Syllabus Dashboard", description: "Managed by Syllabus Dashboard app" }
    })).data.id;
  } catch {
    r = "primary";
  }
  let a = 0, c = 0;
  for (const d of e)
    for (const l of d.assignments) {
      if (!l.dueDate) continue;
      const p = st(l.id), v = new Date(new Date(l.dueDate).getTime() + 864e5).toISOString(), E = {
        summary: `${d.name}: ${l.title}`,
        description: [
          `Type: ${l.type}`,
          l.weight !== void 0 ? `Weight: ${l.weight}%` : "",
          l.description || ""
        ].filter(Boolean).join(`
`),
        start: { date: V(l.dueDate) },
        end: { date: V(v) }
      };
      try {
        try {
          await o.events.update({ calendarId: r, eventId: p, requestBody: E });
        } catch {
          await o.events.insert({ calendarId: r, requestBody: { ...E, id: p } });
        }
        a++;
      } catch {
        c++;
      }
    }
  return { synced: a, errors: c };
}
function ot() {
  i.handle("calendar:exportICS", async (e) => {
    const t = b.fromWebContents(e.sender), n = await I.showSaveDialog(t, {
      defaultPath: "syllabus-calendar.ics",
      filters: [{ name: "iCalendar", extensions: ["ics"] }]
    });
    if (n.canceled || !n.filePath)
      return { success: !1, canceled: !0 };
    try {
      const s = f(), o = Ke(s);
      return m(n.filePath, o, "utf-8"), { success: !0, path: n.filePath };
    } catch (s) {
      return { success: !1, error: s instanceof Error ? s.message : "Export failed" };
    }
  }), i.handle("calendar:isConnected", () => ({ connected: tt() })), i.handle("calendar:hasCredentials", () => {
    const e = F();
    return { hasCredentials: e !== null, clientId: e?.clientId || "" };
  }), i.handle("calendar:saveCredentials", async (e, t, n) => {
    try {
      return ie({ clientId: t, clientSecret: n }), { success: !0 };
    } catch (s) {
      return { success: !1, error: s instanceof Error ? s.message : "Failed to save credentials" };
    }
  }), i.handle("calendar:googleConnect", async () => {
    const e = F();
    if (!e)
      return { success: !1, error: "No Google credentials configured. Please add your Client ID and Client Secret first." };
    try {
      return await nt(e), { success: !0 };
    } catch (t) {
      return { success: !1, error: t instanceof Error ? t.message : "OAuth failed" };
    }
  }), i.handle("calendar:googleSync", async () => {
    try {
      const e = f();
      return { success: !0, ...await rt(e) };
    } catch (e) {
      return { success: !1, error: e instanceof Error ? e.message : "Sync failed" };
    }
  }), i.handle("calendar:googleDisconnect", async () => (et(), Ze(), { success: !0 }));
}
function z() {
  return y(h.getPath("userData"), "notification-log.json");
}
function at() {
  try {
    if (g(z())) {
      const e = JSON.parse(C(z(), "utf-8")), t = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (e.date === t) return e;
    }
  } catch {
  }
  return { date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0], shown: [] };
}
function it(e) {
  try {
    m(z(), JSON.stringify(e, null, 2));
  } catch {
  }
}
const J = () => y(h.getPath("userData"), "notification-settings.json");
function de() {
  try {
    if (g(J()))
      return JSON.parse(C(J(), "utf-8"));
  } catch {
  }
  return { enabled: !0, daysAhead: 7 };
}
function ct(e) {
  m(J(), JSON.stringify(e, null, 2));
}
function lt(e) {
  const t = /* @__PURE__ */ new Date();
  t.setHours(0, 0, 0, 0);
  const n = new Date(e);
  return n.setHours(0, 0, 0, 0), Math.round((n.getTime() - t.getTime()) / 864e5);
}
function ut(e) {
  return e === 0 ? "today" : e === 1 ? "tomorrow" : `in ${e} days`;
}
function G() {
  const e = de();
  if (!e.enabled || !M.isSupported()) return;
  const t = f(), n = at(), s = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  n.date !== s && (n.date = s, n.shown = []);
  for (const o of t)
    for (const r of o.assignments) {
      if (r.isCompleted || !r.dueDate || n.shown.includes(r.id)) continue;
      const a = lt(r.dueDate);
      if (a < 0 || a > e.daysAhead) continue;
      const c = r.weight !== void 0 ? ` (${r.weight}% of grade)` : "", d = `${o.name}: ${r.title}`, l = `Due ${ut(a)}${c}`;
      new M({ title: d, body: l, silent: !1 }).show(), n.shown.push(r.id);
    }
  it(n);
}
let k = null;
function dt() {
  G(), k = setInterval(G, 3600 * 1e3);
}
function ft() {
  k && (clearInterval(k), k = null);
}
function ht() {
  i.handle("notifications:getSettings", () => de()), i.handle("notifications:saveSettings", (e, t) => (ct(t), { success: !0 })), i.handle("notifications:isSupported", () => ({ supported: M.isSupported() })), i.handle("notifications:checkNow", () => (G(), { success: !0 }));
}
function gt() {
  xe(), Re(), Ye(), ot(), ht();
}
const mt = (() => {
  const e = new Uint32Array(256);
  for (let t = 0; t < 256; t++) {
    let n = t;
    for (let s = 0; s < 8; s++)
      n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    e[t] = n;
  }
  return e;
})();
function pt(e) {
  let t = 4294967295;
  for (const n of e)
    t = mt[(t ^ n) & 255] ^ t >>> 8;
  return (t ^ 4294967295) >>> 0;
}
function U(e, t) {
  const n = Buffer.from(e, "ascii"), s = pt(Buffer.concat([n, t])), o = Buffer.allocUnsafe(4), r = Buffer.allocUnsafe(4);
  return o.writeUInt32BE(t.length, 0), r.writeUInt32BE(s, 0), Buffer.concat([o, n, t, r]);
}
function yt() {
  const t = [];
  for (let r = 0; r < 16; r++) {
    const a = Buffer.allocUnsafe(65);
    a[0] = 0;
    for (let c = 0; c < 16; c++) {
      const d = c - 8 + 0.5, l = r - 16 / 2 + 0.5, p = Math.sqrt(d * d + l * l), v = p <= 16 / 2 - 1, E = p > 16 / 2 - 2 && p <= 16 / 2 - 1, S = 1 + c * 4;
      v ? (a[S] = E ? 30 : 64, a[S + 1] = E ? 60 : 115, a[S + 2] = E ? 200 : 255, a[S + 3] = 255) : a[S] = a[S + 1] = a[S + 2] = a[S + 3] = 0;
    }
    t.push(a);
  }
  const n = Buffer.concat(t), s = be(n), o = Buffer.allocUnsafe(13);
  return o.writeUInt32BE(16, 0), o.writeUInt32BE(16, 4), o[8] = 8, o[9] = 6, o[10] = o[11] = o[12] = 0, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    // PNG magic
    U("IHDR", o),
    U("IDAT", s),
    U("IEND", Buffer.alloc(0))
  ]);
}
const wt = we(import.meta.url), K = ee(wt);
function fe() {
  const e = h.getPath("userData");
  return y(e, "window-state.json");
}
function St() {
  try {
    const e = fe();
    if (g(e)) {
      const t = C(e, "utf-8");
      return JSON.parse(t);
    }
  } catch (e) {
    console.error("Failed to load window bounds:", e);
  }
  return { width: 1200, height: 800 };
}
function Dt(e) {
  try {
    const t = fe(), n = ee(t);
    g(n) || te(n, { recursive: !0 }), m(t, JSON.stringify(e, null, 2));
  } catch (t) {
    console.error("Failed to save window bounds:", t);
  }
}
let u = null, w = null;
function X() {
  const e = f(), t = /* @__PURE__ */ new Date(), n = new Date(t.getTime() + 10080 * 60 * 1e3), s = e.flatMap(
    (r) => r.assignments.filter((a) => !a.isCompleted && a.dueDate).map((a) => ({ ...a, courseName: r.name }))
  ).filter((r) => {
    const a = new Date(r.dueDate);
    return a >= t && a <= n;
  }).sort((r, a) => new Date(r.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 5), o = s.length ? s.map((r) => ({
    label: `${r.courseName}: ${r.title} – ${new Date(r.dueDate).toLocaleDateString(void 0, { month: "short", day: "numeric" })}`,
    enabled: !1
  })) : [{ label: "No upcoming deadlines", enabled: !1 }];
  return pe.buildFromTemplate([
    { label: "Syllabus Dashboard", enabled: !1 },
    { type: "separator" },
    ...o,
    { type: "separator" },
    { label: "Open", click: () => {
      u?.show(), u?.focus();
    } },
    { label: "Quit", click: () => h.quit() }
  ]);
}
function Ct() {
  const e = yt(), t = ge.createFromBuffer(e);
  process.platform === "darwin" && t.setTemplateImage(!0), w = new me(t), w.setToolTip("Syllabus Dashboard"), w.setContextMenu(X()), w.on("click", () => {
    w?.setContextMenu(X()), process.platform !== "darwin" && (u?.show(), u?.focus());
  });
}
function Q() {
  const { width: e, height: t, x: n, y: s } = St();
  u = new b({
    width: e,
    height: t,
    x: n,
    y: s,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: y(K, "preload.js"),
      contextIsolation: !0,
      nodeIntegration: !1
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: L.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    show: !1
    // Don't show until ready
  }), u.on("resize", Z), u.on("move", Z), u.once("ready-to-show", () => {
    u?.show();
  }), u.on("close", (o) => {
    w && (o.preventDefault(), u?.hide());
  }), u.on("closed", () => {
    u = null;
  }), process.env.VITE_DEV_SERVER_URL ? (u.loadURL(process.env.VITE_DEV_SERVER_URL), u.webContents.openDevTools()) : u.loadFile(y(K, "../dist/index.html"));
}
function Z() {
  if (!u) return;
  const e = u.getBounds();
  Dt(e);
}
h.whenReady().then(() => {
  gt(), Q(), Ct(), dt(), h.on("activate", () => {
    b.getAllWindows().length === 0 ? Q() : u?.show();
  });
});
h.on("window-all-closed", () => {
  !w && process.platform !== "darwin" && h.quit();
});
h.on("before-quit", () => {
  ft(), w?.destroy(), w = null;
});
L.on("updated", () => {
  u?.webContents.send("theme-changed", L.shouldUseDarkColors);
});

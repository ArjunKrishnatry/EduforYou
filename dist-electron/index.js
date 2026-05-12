import { ipcMain, BrowserWindow, dialog, safeStorage, app, nativeTheme } from "electron";
import { extname, basename, join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { readFile } from "fs/promises";
import { createRequire } from "module";
import Groq from "groq-sdk";
const require$1 = createRequire(import.meta.url);
const pdfParse = require$1("pdf-parse");
const mammoth = require$1("mammoth");
async function parsePDF(filePath) {
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  return data.text;
}
async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}
async function parseTXT(filePath) {
  const content = await readFile(filePath, "utf-8");
  return content;
}
async function parseFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      const pdfText = await parsePDF(filePath);
      const estimatedPages = Math.ceil(pdfText.length / 3e3);
      return { text: pdfText, pages: estimatedPages };
    case ".docx":
    case ".doc":
      const docText = await parseDOCX(filePath);
      return { text: docText };
    case ".txt":
    case ".md":
      const txtText = await parseTXT(filePath);
      return { text: txtText };
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}
function chunkText(text, maxChunkSize = 12e3, overlap = 500) {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      if (paragraphBreak > start + maxChunkSize / 2) {
        end = paragraphBreak + 2;
      } else {
        const sentenceBreak = text.lastIndexOf(". ", end);
        if (sentenceBreak > start + maxChunkSize / 2) {
          end = sentenceBreak + 2;
        }
      }
    }
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}
function mergeTexts(texts) {
  return texts.join("\n\n---\n\n");
}
function registerFileHandlers() {
  ipcMain.handle("file:select", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Documents", extensions: ["pdf", "docx", "doc", "txt", "md"] }
      ]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths;
  });
  ipcMain.handle("file:parse", async (_event, filePath) => {
    console.log("Parsing file:", filePath);
    try {
      const { text, pages } = await parseFile(filePath);
      console.log("Parse success:", text.length, "chars");
      return {
        success: true,
        fileName: basename(filePath),
        text,
        pages,
        charCount: text.length
      };
    } catch (error) {
      console.error("Parse error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  ipcMain.handle("file:parseMultiple", async (_event, filePaths) => {
    console.log("Parsing multiple files:", filePaths);
    try {
      const results = await Promise.all(
        filePaths.map(async (path) => {
          const { text } = await parseFile(path);
          return { fileName: basename(path), text };
        })
      );
      const mergedText = mergeTexts(results.map((r) => r.text));
      return {
        success: true,
        files: results.map((r) => r.fileName),
        text: mergedText,
        charCount: mergedText.length
      };
    } catch (error) {
      console.error("Parse multiple error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  ipcMain.handle("file:chunk", async (_event, text, maxChunkSize) => {
    const chunks = chunkText(text, maxChunkSize);
    return {
      chunks,
      count: chunks.length
    };
  });
}
const SYLLABUS_ANALYSIS_PROMPT = `You are an expert academic assistant that analyzes course syllabi and extracts structured information. Your task is to carefully read the provided syllabus and extract all relevant details into a structured JSON format.

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

Generate 3-5 helpful preparation tips based on the course structure, workload, and requirements. These should be practical and specific to this course.`;
const CHUNK_MERGE_PROMPT = `You are merging syllabus analysis results from multiple document chunks. Combine the following partial results into a single coherent analysis.

Rules:
1. Merge assignments, removing exact duplicates (same title AND same date)
2. Keep all unique materials and prep tips
3. Use the most complete instructor information found
4. Combine grade weights (they should appear in one chunk, but verify totals)
5. Flag any assignments that appear similar but might be duplicates

Return the merged result as a single JSON object with the same structure.`;
class GroqService {
  client;
  constructor(apiKey) {
    this.client = new Groq({ apiKey });
  }
  async analyzeSyllabus(syllabusText, semesterStartDate) {
    let contextNote = "";
    if (semesterStartDate) {
      contextNote = `

Note: The semester starts on ${semesterStartDate}. Use this to calculate dates for relative references like "Week 3".`;
    }
    const response = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYLLABUS_ANALYSIS_PROMPT
        },
        {
          role: "user",
          content: `Please analyze this syllabus and extract structured information:${contextNote}

${syllabusText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq API");
    }
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse LLM response as JSON: ${e}`);
    }
  }
  async mergeChunkResults(results) {
    if (results.length === 1) {
      return results[0];
    }
    const response = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: CHUNK_MERGE_PROMPT
        },
        {
          role: "user",
          content: `Merge these partial syllabus analysis results:

${JSON.stringify(results, null, 2)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from Groq API during merge");
    }
    return JSON.parse(content);
  }
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "user", content: 'Say "ok" and nothing else.' }
        ],
        max_tokens: 10
      });
      return !!response.choices[0]?.message?.content;
    } catch (e) {
      return false;
    }
  }
}
function getSecureKeyPath() {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "secure-keys.enc");
}
function saveApiKey(key) {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      console.warn("Encryption not available, storing key in plain text");
      const path2 = getSecureKeyPath();
      writeFileSync(path2, key);
      return true;
    }
    const encrypted = safeStorage.encryptString(key);
    const path = getSecureKeyPath();
    writeFileSync(path, encrypted);
    return true;
  } catch (e) {
    console.error("Failed to save API key:", e);
    return false;
  }
}
function loadApiKey() {
  try {
    const path = getSecureKeyPath();
    if (!existsSync(path)) {
      return null;
    }
    const data = readFileSync(path);
    if (!safeStorage.isEncryptionAvailable()) {
      return data.toString("utf-8");
    }
    return safeStorage.decryptString(data);
  } catch (e) {
    console.error("Failed to load API key:", e);
    return null;
  }
}
function deleteApiKey() {
  try {
    const path = getSecureKeyPath();
    if (existsSync(path)) {
      const { unlinkSync } = require("fs");
      unlinkSync(path);
    }
    return true;
  } catch (e) {
    console.error("Failed to delete API key:", e);
    return false;
  }
}
let groqService = null;
function getGroqService() {
  if (!groqService) {
    const apiKey = loadApiKey();
    if (!apiKey) {
      throw new Error("Groq API key not configured. Please add your API key in Settings.");
    }
    groqService = new GroqService(apiKey);
  }
  return groqService;
}
function registerLLMHandlers() {
  ipcMain.handle("llm:saveApiKey", async (_event, apiKey) => {
    const success = saveApiKey(apiKey);
    if (success) {
      groqService = null;
    }
    return { success };
  });
  ipcMain.handle("llm:hasApiKey", async () => {
    const key = loadApiKey();
    return { hasKey: !!key };
  });
  ipcMain.handle("llm:deleteApiKey", async () => {
    const success = deleteApiKey();
    groqService = null;
    return { success };
  });
  ipcMain.handle("llm:testConnection", async () => {
    try {
      const service = getGroqService();
      const success = await service.testConnection();
      return { success, error: success ? null : "Connection test failed" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  });
  ipcMain.handle(
    "llm:analyze",
    async (_event, syllabusText, options) => {
      console.log("Starting syllabus analysis...");
      try {
        const service = getGroqService();
        const chunks = chunkText(syllabusText, 1e4, 500);
        console.log(`Text split into ${chunks.length} chunk(s)`);
        let result;
        if (chunks.length === 1) {
          result = await service.analyzeSyllabus(chunks[0], options.semesterStartDate);
        } else {
          const chunkResults = [];
          for (let i = 0; i < chunks.length; i++) {
            console.log(`Analyzing chunk ${i + 1}/${chunks.length}...`);
            const chunkResult = await service.analyzeSyllabus(
              chunks[i],
              options.semesterStartDate
            );
            chunkResults.push(chunkResult);
          }
          console.log("Merging chunk results...");
          result = await service.mergeChunkResults(chunkResults);
        }
        if (options.courseName) {
          result.courseName = options.courseName;
        }
        console.log("Analysis complete:", {
          courseName: result.courseName,
          assignments: result.assignments?.length || 0,
          materials: result.materials?.length || 0
        });
        return {
          success: true,
          data: result
        };
      } catch (error) {
        console.error("Analysis failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Analysis failed"
        };
      }
    }
  );
}
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
function getCoursesPath() {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "courses.json");
}
function ensureDirectory() {
  const path = getCoursesPath();
  const dir = join(path, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
function loadCourses() {
  try {
    const path = getCoursesPath();
    if (existsSync(path)) {
      const data = readFileSync(path, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load courses:", e);
  }
  return [];
}
function saveCourses(courses) {
  try {
    ensureDirectory();
    const path = getCoursesPath();
    writeFileSync(path, JSON.stringify(courses, null, 2));
  } catch (e) {
    console.error("Failed to save courses:", e);
  }
}
function createCourse(courseData) {
  const courses = loadCourses();
  const newCourse = {
    ...courseData,
    id: `course_${generateId()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    // Ensure assignments have IDs
    assignments: (courseData.assignments || []).map((a) => ({
      ...a,
      id: a.id || `assign_${generateId()}`,
      isCompleted: a.isCompleted || false
    })),
    // Ensure materials have IDs
    materials: (courseData.materials || []).map((m) => ({
      ...m,
      id: m.id || `mat_${generateId()}`
    })),
    // Ensure prep tips have IDs
    prepTips: (courseData.prepTips || []).map((p) => ({
      ...p,
      id: p.id || `tip_${generateId()}`
    }))
  };
  courses.push(newCourse);
  saveCourses(courses);
  return newCourse;
}
function updateCourse(id, updates) {
  const courses = loadCourses();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;
  courses[index] = {
    ...courses[index],
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveCourses(courses);
  return courses[index];
}
function deleteCourse(id) {
  const courses = loadCourses();
  const filtered = courses.filter((c) => c.id !== id);
  if (filtered.length === courses.length) return false;
  saveCourses(filtered);
  return true;
}
function getCourse(id) {
  const courses = loadCourses();
  return courses.find((c) => c.id === id) || null;
}
function getCoursesBySemester(semesterId) {
  const courses = loadCourses();
  return courses.filter((c) => c.semesterId === semesterId);
}
function updateAssignment(courseId, assignmentId, updates) {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const assignmentIndex = course.assignments.findIndex((a) => a.id === assignmentId);
  if (assignmentIndex === -1) return null;
  course.assignments[assignmentIndex] = {
    ...course.assignments[assignmentIndex],
    ...updates
  };
  course.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveCourses(courses);
  return course.assignments[assignmentIndex];
}
function addAssignment(courseId, assignment) {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const newAssignment = {
    ...assignment,
    id: `assign_${generateId()}`,
    isCompleted: assignment.isCompleted || false
  };
  course.assignments.push(newAssignment);
  course.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveCourses(courses);
  return newAssignment;
}
function deleteAssignment(courseId, assignmentId) {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return false;
  const initialLength = course.assignments.length;
  course.assignments = course.assignments.filter((a) => a.id !== assignmentId);
  if (course.assignments.length === initialLength) return false;
  course.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  saveCourses(courses);
  return true;
}
function exportToJSON() {
  const courses = loadCourses();
  return JSON.stringify(courses, null, 2);
}
function exportToCSV() {
  const courses = loadCourses();
  const rows = [];
  rows.push("Course,Assignment,Type,Due Date,Weight,Completed,Grade");
  for (const course of courses) {
    for (const assignment of course.assignments) {
      rows.push([
        `"${course.name.replace(/"/g, '""')}"`,
        `"${assignment.title.replace(/"/g, '""')}"`,
        assignment.type,
        assignment.dueDate || assignment.dueDateRaw || "",
        assignment.weight?.toString() || "",
        assignment.isCompleted ? "Yes" : "No",
        assignment.gradeReceived?.toString() || ""
      ].join(","));
    }
  }
  return rows.join("\n");
}
function getExportData() {
  return {
    courses: loadCourses(),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function registerStoreHandlers() {
  ipcMain.handle("store:getCourses", async () => {
    return loadCourses();
  });
  ipcMain.handle("store:getCoursesBySemester", async (_event, semesterId) => {
    return getCoursesBySemester(semesterId);
  });
  ipcMain.handle("store:getCourse", async (_event, id) => {
    return getCourse(id);
  });
  ipcMain.handle("store:createCourse", async (_event, courseData) => {
    try {
      const course = createCourse(courseData);
      return { success: true, course };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create course"
      };
    }
  });
  ipcMain.handle("store:updateCourse", async (_event, id, updates) => {
    try {
      const course = updateCourse(id, updates);
      if (!course) {
        return { success: false, error: "Course not found" };
      }
      return { success: true, course };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update course"
      };
    }
  });
  ipcMain.handle("store:deleteCourse", async (_event, id) => {
    const success = deleteCourse(id);
    return { success };
  });
  ipcMain.handle(
    "store:updateAssignment",
    async (_event, courseId, assignmentId, updates) => {
      try {
        const assignment = updateAssignment(courseId, assignmentId, updates);
        if (!assignment) {
          return { success: false, error: "Assignment not found" };
        }
        return { success: true, assignment };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to update assignment"
        };
      }
    }
  );
  ipcMain.handle(
    "store:addAssignment",
    async (_event, courseId, assignment) => {
      try {
        const newAssignment = addAssignment(courseId, assignment);
        if (!newAssignment) {
          return { success: false, error: "Course not found" };
        }
        return { success: true, assignment: newAssignment };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add assignment"
        };
      }
    }
  );
  ipcMain.handle("store:deleteAssignment", async (_event, courseId, assignmentId) => {
    const success = deleteAssignment(courseId, assignmentId);
    return { success };
  });
  ipcMain.handle("store:exportJSON", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      defaultPath: "syllabus-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    try {
      const json = exportToJSON();
      writeFileSync(result.filePath, json);
      return { success: true, path: result.filePath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed"
      };
    }
  });
  ipcMain.handle("store:exportCSV", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      defaultPath: "syllabus-export.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }]
    });
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    try {
      const csv = exportToCSV();
      writeFileSync(result.filePath, csv);
      return { success: true, path: result.filePath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed"
      };
    }
  });
  ipcMain.handle("store:getExportData", async () => {
    return getExportData();
  });
  ipcMain.handle("store:savePDF", async (event, pdfData) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(win, {
      defaultPath: "syllabus-report.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    try {
      writeFileSync(result.filePath, Buffer.from(pdfData));
      return { success: true, path: result.filePath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed"
      };
    }
  });
}
function registerAllHandlers() {
  registerFileHandlers();
  registerLLMHandlers();
  registerStoreHandlers();
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = dirname(__filename$1);
function getStorePath() {
  const userDataPath = app.getPath("userData");
  return join(userDataPath, "window-state.json");
}
function loadWindowBounds() {
  try {
    const path = getStorePath();
    if (existsSync(path)) {
      const data = readFileSync(path, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load window bounds:", e);
  }
  return { width: 1200, height: 800 };
}
function saveWindowBoundsToFile(bounds) {
  try {
    const path = getStorePath();
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(bounds, null, 2));
  } catch (e) {
    console.error("Failed to save window bounds:", e);
  }
}
let mainWindow = null;
function createWindow() {
  const { width, height, x, y } = loadWindowBounds();
  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname$1, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#1e1e1e" : "#ffffff",
    show: false
    // Don't show until ready
  });
  mainWindow.on("resize", saveWindowBounds);
  mainWindow.on("move", saveWindowBounds);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname$1, "../dist/index.html"));
  }
}
function saveWindowBounds() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  saveWindowBoundsToFile(bounds);
}
app.whenReady().then(() => {
  registerAllHandlers();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
nativeTheme.on("updated", () => {
  mainWindow?.webContents.send("theme-changed", nativeTheme.shouldUseDarkColors);
});

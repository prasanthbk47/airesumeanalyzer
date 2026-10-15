
"use strict";

const $ = (id) => document.getElementById(id);

const resumeInput = $("resumeText");
const jobTitleInput = $("jobTitle");
const jobDescriptionInput = $("jobDescription");
const fileInput = $("resumeFile");
const analyzeButton = $("analyzeBtn");
const messageBox = $("message");

let latestReport = null;

const SKILLS = [
  "JavaScript", "TypeScript", "HTML", "CSS", "React", "Angular",
  "Vue", "Node.js", "Express", "Python", "Java", "C++", "C#",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Firebase", "REST API",
  "Git", "GitHub", "Docker", "AWS", "Azure", "Linux",
  "Machine Learning", "Deep Learning", "Data Analysis", "Excel",
  "Power BI", "Tableau", "Communication", "Teamwork", "Leadership",
  "Problem Solving", "Project Management", "Agile", "Figma",
  "UI/UX", "Testing", "Cybersecurity", "Networking", "Data Structures",
  "Algorithms", "Artificial Intelligence", "Prompt Engineering",
  "SEO", "Marketing", "Sales", "Customer Service"
];

function showMessage(message, success = false) {
  messageBox.textContent = message;
  messageBox.className = success ? "message success" : "message";
  messageBox.hidden = false;
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
}

function updateCharacterCount() {
  $("resumeCount").textContent =
    `${resumeInput.value.length.toLocaleString()} characters`;
}

resumeInput.addEventListener("input", updateCharacterCount);

$("sampleBtn").addEventListener("click", () => {
  resumeInput.value = `PRIYA SHARMA
Frontend Developer

SUMMARY
Frontend developer with experience building responsive web applications.

TECHNICAL SKILLS
HTML, CSS, JavaScript, React, Git, GitHub, REST API, Firebase, SQL.

PROJECTS
Built a responsive e-commerce dashboard using React and JavaScript.
Connected applications to REST APIs and Firebase.
Used Git and GitHub for version control and collaboration.

EXPERIENCE
Frontend Developer Intern
Worked with a development team to improve website usability,
fix bugs, test features and optimize mobile layouts.

EDUCATION
Bachelor's degree in Computer Science.

SOFT SKILLS
Communication, teamwork, problem solving and time management.`;

  jobTitleInput.value = "Frontend Developer";

  jobDescriptionInput.value = `We are looking for a Frontend Developer to build responsive web applications.

REQUIRED SKILLS
HTML, CSS, JavaScript, React, REST API, Git, GitHub and responsive design.

RESPONSIBILITIES
Develop reusable UI components.
Integrate REST APIs and work with backend developers.
Debug and test web applications.
Optimize performance and accessibility.
Collaborate with designers and developers.

PREFERRED SKILLS
TypeScript, Node.js, Firebase, SQL and Agile development.

QUALIFICATIONS
Strong problem-solving, communication and teamwork skills.`;

  updateCharacterCount();
  clearMessage();
  showMessage("Sample resume and job description loaded.", true);
  $("results").hidden = true;
});

async function readPdf(file) {
  if (!window.pdfjsLib) {
    throw new Error(
      "The PDF reader library did not load. Check your internet connection, then refresh the page."
    );
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await window.pdfjsLib.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }

  return pages.join("\n");
}

async function readDocx(file) {
  if (!window.mammoth) {
    throw new Error(
      "The DOCX reader library did not load. Check your internet connection, then refresh the page."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

fileInput.addEventListener("change", async () => {
  clearMessage();

  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Please choose a file smaller than 5 MB.");
    fileInput.value = "";
    return;
  }

  const extension = file.name.split(".").pop().toLowerCase();
  $("fileName").textContent = `Reading ${file.name}...`;

  try {
    let text;

    if (extension === "txt") {
      text = await file.text();
    } else if (extension === "pdf") {
      text = await readPdf(file);
    } else if (extension === "docx") {
      text = await readDocx(file);
    } else {
      throw new Error("Unsupported file type. Please use PDF, DOCX or TXT.");
    }

    if (!text.trim()) {
      throw new Error(
        "No readable text was found. If this is a scanned PDF, run OCR on it first or paste the resume text manually."
      );
    }

    resumeInput.value = text;
    updateCharacterCount();
    $("fileName").textContent = `Loaded: ${file.name}`;
    showMessage("Resume text extracted successfully.", true);
  } catch (error) {
    $("fileName").textContent = "Could not read this file.";
    showMessage(error.message || "Unable to read the selected file.");
  }
});

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function findSkills(text) {
  const source = normalize(text);
  const found = [];

  for (const skill of SKILLS) {
    const escaped = escapeRegExp(normalize(skill));
    const pattern = new RegExp(
      `(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`,
      "i"
    );

    if (pattern.test(source)) {
      found.push(skill);
    }
  }

  return found;
}

function uniqueWords(text) {
  return normalize(text)
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function calculateTextSimilarity(resume, job) {
  const stopWords = new Set([
    "the", "and", "for", "with", "you", "your", "are", "our",
    "this", "that", "will", "from", "have", "has", "was", "were",
    "their", "they", "them", "who", "what", "when", "where",
    "how", "all", "can", "able", "ability", "work", "working",
    "job", "role", "skills", "skill", "experience", "required",
    "preferred", "using", "use", "about", "into", "per", "not",
    "but", "also", "such", "any", "more", "strong", "good"
  ]);

  const resumeWords = new Set(
    uniqueWords(resume).filter(word => !stopWords.has(word))
  );

  const jobWords = new Set(
    uniqueWords(job).filter(word => !stopWords.has(word))
  );

  if (jobWords.size === 0) return 0;

  let matches = 0;
  for (const word of jobWords) {
    if (resumeWords.has(word)) matches++;
  }

  return matches / jobWords.size;
}

function makeRecommendations(missing, resume, score) {
  const recommendations = [];

  if (missing.length) {
    recommendations.push(
      `If you genuinely have these skills, add relevant examples of: ${missing.slice(0, 6).join(", ")}.`
    );
  } else {
    recommendations.push(
      "Your resume mentions the recognized skills found in the job description. Add concrete examples of how you used them."
    );
  }

  if (!/\b(project|projects)\b/i.test(resume)) {
    recommendations.push(
      "Add a projects section with the problem, technologies used and measurable results."
    );
  }

  if (!/\b(intern|experience|employment|work history)\b/i.test(resume)) {
    recommendations.push(
      "Include relevant work experience, internships, volunteering or practical training."
    );
  }

  if (!/\b(achieved|improved|increased|reduced|built|developed|created|delivered)\b/i.test(resume)) {
    recommendations.push(
      "Strengthen bullet points with action verbs and measurable achievements wherever possible."
    );
  }

  if (score < 50) {
    recommendations.push(
      "Tailor your summary and experience to the actual responsibilities in the target job description."
    );
  } else {
    recommendations.push(
      "Review the job requirements and make sure your strongest relevant experience appears near the top."
    );
  }

  recommendations.push(
    "Never add a skill or qualification you do not actually possess."
  );

  return recommendations;
}

function renderChips(elementId, skills, missing = false) {
  const container = $(elementId);
  container.replaceChildren();

  if (!skills.length) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = missing
      ? "No additional recognized skills were identified."
      : "No recognized matching skills found yet.";
    container.appendChild(note);
    return;
  }

  for (const skill of skills) {
    const chip = document.createElement("span");
    chip.className = missing ? "chip missing" : "chip";
    chip.textContent = skill;
    container.appendChild(chip);
  }
}

function analyzeResume() {
  clearMessage();

  const resume = resumeInput.value.trim();
  const title = jobTitleInput.value.trim();
  const job = jobDescriptionInput.value.trim();

  if (resume.length < 30) {
    showMessage("Please paste a complete resume or upload a readable resume file.");
    resumeInput.focus();
    return;
  }

  if (!title) {
    showMessage("Please enter the target job title.");
    jobTitleInput.focus();
    return;
  }

  if (job.length < 30) {
    showMessage("Please enter a more detailed job description.");
    jobDescriptionInput.focus();
    return;
  }

  const resumeSkills = findSkills(resume);
  const jobSkills = findSkills(`${title}\n${job}`);

  const matched = jobSkills.filter(skill => resumeSkills.includes(skill));
  const missing = jobSkills.filter(skill => !resumeSkills.includes(skill));

  const skillCoverage = jobSkills.length
    ? matched.length / jobSkills.length
    : 0;

  const textSimilarity = calculateTextSimilarity(resume, `${title} ${job}`);

  // Transparent heuristic score, not a machine-learning prediction.
  let score;
  if (jobSkills.length > 0) {
    score = Math.round((skillCoverage * 0.75 + textSimilarity * 0.25) * 100);
  } else {
    score = Math.round(textSimilarity * 100);
  }

  score = Math.max(0, Math.min(100, score));

  const recommendations = makeRecommendations(missing, resume, score);

  latestReport = {
    title,
    score,
    matched,
    missing,
    recommendations,
    date: new Date().toLocaleString()
  };

  $("scoreValue").textContent = `${score}%`;
  $("scoreRing").style.setProperty("--score", `${score}%`);
  $("matchedCount").textContent = matched.length;
  $("missingCount").textContent = missing.length;

  $("resultHeadline").textContent =
    score >= 75 ? "Strong keyword alignment" :
    score >= 50 ? "Some relevant alignment" :
    "Room to improve your alignment";

  $("resultSummary").textContent =
    `Your resume has an estimated ${score}% keyword-based match for ${title}. ` +
    `${matched.length} recognized skill(s) matched and ${missing.length} recognized skill(s) were not found.`;

  renderChips("matchedSkills", matched);
  renderChips("missingSkills", missing, true);

  const list = $("recommendations");
  list.replaceChildren();

  for (const recommendation of recommendations) {
    const item = document.createElement("li");
    item.textContent = recommendation;
    list.appendChild(item);
  }

  $("results").hidden = false;
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage("Analysis complete. Review the report below.", true);
}

analyzeButton.addEventListener("click", analyzeResume);

$("downloadBtn").addEventListener("click", () => {
  if (!latestReport) {
    showMessage("Analyze a resume before downloading a report.");
    return;
  }

  const report = [
    "TALENTLENS AI — RESUME MATCH REPORT",
    `Generated: ${latestReport.date}`,
    `Target role: ${latestReport.title}`,
    `Estimated keyword match: ${latestReport.score}%`,
    "",
    `MATCHED SKILLS (${latestReport.matched.length})`,
    ...(latestReport.matched.length ? latestReport.matched : ["None found"]),
    "",
    `SKILLS NOT FOUND (${latestReport.missing.length})`,
    ...(latestReport.missing.length ? latestReport.missing : ["None identified"]),
    "",
    "RECOMMENDATIONS",
    ...latestReport.recommendations.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Note: This report uses keyword-based heuristics. It is not a hiring prediction."
  ].join("\n");

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "TalentLens-Resume-Report.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

updateCharacterCount();
console.log("TalentLens AI loaded successfully.");

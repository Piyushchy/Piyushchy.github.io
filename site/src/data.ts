/**
 * ALL personal content lives in this file.
 * Edit text, links and projects here; no component changes needed.
 *
 * Empty-string fields (email, linkedin, repo, demo, resume) are hidden
 * automatically until you fill them in.
 */

export const profile = {
  name: "Piyush Chaudhary",
  shortName: "Piyush",
  role: "Final-year Computer Engineering student & software developer",
  headline: "I build things, then write down what broke.",
  heroSub:
    "Final-year computer engineering student at K.J. Somaiya. Internships at Mazagon Dock and SBI Global IT Centre. Document processing, cloud apps, and a few things that talk to real hardware.",
  intro:
    "Final-year B.Tech Computer Engineering student at K.J. Somaiya College of Engineering. I've interned at Mazagon Dock and I'm currently an intern at SBI Global IT Centre, building a production pipeline that pulls tables out of scanned telecom audit PDFs.",
  location: "", // e.g. "Mumbai, India" (optional)
  links: {
    github: "https://github.com/Piyushchy",
    linkedin: "", // paste your LinkedIn profile URL
    email: "piyush.chaudhary@somaiya.edu",
    resume: "", // e.g. "/resume.pdf" after adding the file to /public
  },
  siteUrl: "https://piyushchy.github.io",
  description:
    "Portfolio of Piyush Chaudhary, a Computer Engineering student and software developer building document-processing, cloud and mobile projects.",
};

export type Project = {
  id: string;
  index: string;
  title: string;
  kind: string;
  summary: string;
  problem: string;
  built: string[];
  decisions: string[];
  stack: string[];
  status: string;
  repo: string; // GitHub URL (hidden when empty)
  demo: string; // live demo URL (hidden when empty)
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: "table-extractor",
    index: "01",
    title: "Scanned-PDF Table Extractor",
    kind: "Internship · SBI Global IT Centre",
    summary:
      "A hybrid computer-vision and vision-language-model pipeline that reads tables from scanned telecom audit PDFs and writes them to structured Excel sheets.",
    problem:
      "Audit reports arrive as scanned, skewed, noisy PDFs. The tables inside them have merged cells, multi-level headers and rows that continue across pages, so off-the-shelf OCR returns text but loses the structure.",
    built: [
      "Page rendering with PyMuPDF and OpenCV morphology to detect bordered boxes and grid lines.",
      "Per-cell reading with a vision-language model, with guards that reject implausible or hallucinated cell text.",
      "A fast pre-scan that locates key header fields and the conclusion-table page range before the heavy per-page pass.",
      "Excel output with openpyxl, including merged-cell handling and multi-page table continuation.",
    ],
    decisions: [
      "Tried three architectures on the same documents (Table Transformer + OpenCV + EasyOCR, a pure VLM approach, Docling + EasyOCR) before settling on the hybrid.",
      "Capped column splicing after it turned an 11-column grid into 24 phantom columns and fed the VLM sliver crops.",
      "Switched to lazy page generators after eager rendering exhausted RAM.",
      "Generated synthetic scanned PDFs with noise and skew to test against.",
    ],
    stack: ["Python", "PyMuPDF", "OpenCV", "Vision-language models", "openpyxl", "Google Colab", "LaTeX"],
    status: "In active development. Documented in a 16-page technical report.",
    repo: "",
    demo: "",
    featured: true,
  },
  {
    id: "mouseshare",
    index: "02",
    title: "MouseShare",
    kind: "Personal project",
    summary:
      "Use a Windows PC's mouse and keyboard to control an Android phone, with a Python app on the PC and a Kotlin app on the phone.",
    problem:
      "Existing options add noticeable input lag. The goal is to get latency low enough that the phone feels like it has a real attached mouse and keyboard.",
    built: [
      "Windows desktop app in Python that captures input.",
      "Android app in Kotlin that receives and acts on it.",
    ],
    decisions: [
      "Currently comparing transports for latency, including presenting the PC as a real HID keyboard and mouse and running over WiFi.",
    ],
    stack: ["Python", "Kotlin", "Android"],
    status: "Working prototype. Latency optimization in progress.",
    repo: "",
    demo: "",
    featured: true,
  },
  {
    id: "rnn-lstm",
    index: "03",
    title: "RNN vs LSTM Text Classification",
    kind: "NLP coursework",
    summary:
      "A PyTorch notebook that trains and compares a plain RNN and an LSTM on text classification.",
    problem: "Compare how the two recurrent architectures behave on the same classification task.",
    built: ["Runnable Google Colab notebook cross-checked against the lab's written requirements."],
    decisions: [],
    stack: ["Python", "PyTorch", "Google Colab"],
    status: "Coursework, Semester VII.",
    repo: "",
    demo: "",
  },
  {
    id: "cloud-native-aws",
    index: "04",
    title: "Cloud-Native App on AWS",
    kind: "Cloud computing coursework",
    summary:
      "Containerized a Node.js app and deployed it on AWS: ECR, ECS Fargate behind an Application Load Balancer, with RDS MySQL, a CodePipeline CI/CD flow and an SNS alarm.",
    problem: "Move an app from a local container to a managed, load-balanced, monitored deployment.",
    built: [
      "Docker image pushed to ECR and run on ECS Fargate behind an ALB.",
      "RDS MySQL reached through a bastion host over Session Manager.",
    ],
    decisions: [],
    stack: ["Docker", "AWS ECR", "ECS Fargate", "ALB", "RDS MySQL", "CodePipeline", "SNS"],
    status: "Coursework, sandbox AWS account.",
    repo: "",
    demo: "",
  },
];

export const skillGroups: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["Python", "Kotlin", "LaTeX"] },
  {
    label: "Computer vision & document AI",
    items: ["OpenCV", "PyMuPDF", "EasyOCR", "Table Transformer", "Docling", "Vision-language models", "Pillow"],
  },
  { label: "Machine learning", items: ["PyTorch", "RNN / LSTM", "Google Colab"] },
  {
    label: "Cloud & infrastructure",
    items: ["Docker", "AWS ECR", "ECS Fargate", "ALB", "RDS MySQL", "EC2", "CodePipeline", "SNS"],
  },
  { label: "Data & output", items: ["openpyxl", "Excel automation"] },
  { label: "Mobile", items: ["Android (Kotlin)"] },
];

export const timeline: { when: string; title: string; org: string; note: string }[] = [
  {
    when: "Now",
    title: "Intern",
    org: "State Bank of India, Global IT Centre",
    note: "Building a production pipeline to extract structured tables from scanned telecom audit PDFs.",
  },
  {
    when: "Internship",
    title: "Intern",
    org: "Mazagon Dock Shipbuilders Limited",
    note: "",
  },
  {
    when: "4th year",
    title: "B.Tech, Computer Engineering",
    org: "K.J. Somaiya College of Engineering",
    note: "Coursework across NLP, cloud computing, AR/VR, and network and information security.",
  },
];

export const learning = {
  label: "Currently learning",
  text: "Blender into Unreal Engine 5, plus a longer AI/ML and NLP track. Especially interested in making 2D art read as 3D (toon shading, parallax, HD-2D).",
};

export const about = [
  "I'm a final-year computer engineering student at K.J. Somaiya College of Engineering. I like building a thing all the way through, from a rough first version to one that holds up on real input.",
  "Lately that has meant two internships, Mazagon Dock and SBI Global IT Centre (where I'm building a document-extraction pipeline), plus a tool that shares a PC's mouse and keyboard with an Android phone, an RNN vs LSTM comparison, and a containerized app on AWS.",
  "I keep notes on what went wrong in each project, because that's where most of what I've learned came from. Outside code, I'm learning 3D to make an anime project.",
];

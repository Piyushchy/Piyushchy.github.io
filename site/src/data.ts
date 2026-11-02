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
    "Final-year computer engineering student at K.J. Somaiya. Three internships, at State Bank of India (twice) and Mazagon Dock. Document processing, cloud apps, and a few things that talk to real hardware.",
  intro:
    "Final-year B.Tech Computer Engineering student at K.J. Somaiya College of Engineering. I've done three internships, two at State Bank of India and one at Mazagon Dock. The latest, in SBI's Analytics Department, produced a pipeline that pulls tables out of scanned telecom audit PDFs.",
  location: "", // e.g. "Mumbai, India" (optional)
  links: {
    github: "https://github.com/Piyushchy",
    linkedin: "", // paste your LinkedIn profile URL
    email: "piyush.chaudhary@somaiya.edu",
    resume: "/resume/", // built by resume/build.py
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
  embed?: string; // path of a self-contained demo that can run inside the card
};

export const projects: Project[] = [
  {
    id: "table-extractor",
    index: "01",
    title: "Scanned-PDF Table Extractor",
    kind: "Internship · SBI Analytics Department",
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
    status: "Built during the 2026 internship. Documented in a 16-page technical report.",
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
      "I could not find an existing tool that did this well, and the options I tried add noticeable input lag. The goal is latency low enough that the phone feels like it has a real attached mouse and keyboard.",
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
    id: "namestorage",
    index: "03",
    title: "namestorage",
    kind: "Personal project · self-hosted cloud drive",
    summary:
      "A self-hosted personal cloud drive. A static web app signs the user in with Google, then moves files directly between the browser and my Ubuntu laptop over an encrypted WebRTC data channel. The laptop sits behind carrier-grade NAT (CGNAT) with no open port, and no third-party server stores or relays a single file.",
    problem:
      "A home connection behind CGNAT cannot accept inbound connections, so a server at home is unreachable and port forwarding is impossible. Commercial drives avoid that by hosting your data themselves. The goal was a free drive on hardware I own: no VPS, no card, no port exposed at home.",
    built: [
      "Connectivity behind CGNAT: the laptop agent only ever makes outbound connections, so no inbound port or router change is needed. Browser and agent then negotiate a direct peer-to-peer session with ICE, using Google's public STUN server (stun.l.google.com:19302) to learn each side's public address and traverse both NATs.",
      "Public endpoint without a VPS: the signaling server runs on the laptop (127.0.0.1:8765) and is published with Tailscale Funnel as a TLS wss:// endpoint on a stable ts.net hostname. No port forwarding, no static IP. It carries only session-setup messages (SDP offers and answers), never file data.",
      "Authentication: Google Sign-In ID tokens (OIDC JWTs) are verified server-side for signature, issuer, audience, expiry and email_verified, then checked against an email allow-list. The agent repeats the check independently, so compromising one component is not enough.",
      "Session security: single-use HMAC tickets that expire after 120 seconds, are rejected on replay and are bound to the browser's DTLS certificate fingerprint, so a stolen ticket is useless from another peer. The signaling server also enforces origin validation, per-IP rate limiting (10 per minute) and message size caps.",
      "Transfer and storage: files stream over a DTLS-encrypted data channel in 16 KB chunks with backpressure (the sender pauses when more than 1 MB is buffered). Every path is resolved with realpath and confined to one root folder, symlinks are hidden, and uploads go to a temporary file and are renamed into place without overwriting.",
      "Static front end on GitHub Pages: Google sign-in, sortable file list, upload, delete, dark mode and a phone layout.",
      "Operations: a one-command installer and a namestorage CLI (setup wizard, allow-list changes, health check, update, secret rotation, Funnel setup). Services run under systemd with ProtectSystem=strict, ProtectHome and NoNewPrivileges.",
      "79 automated tests (pytest), including an end-to-end WebRTC session on localhost.",
    ],
    decisions: [
      "Chose peer-to-peer WebRTC over relaying files through a server: no storage cost, no size limit, and no third party sees file contents. The trade-off is that symmetric NAT or strict CGNAT can block the direct path. A TURN relay is the documented fix and is not built yet.",
      "Chose Tailscale Funnel over a VPS or port forwarding because it is free, needs no card and works behind CGNAT.",
      "Applied the same authentication on both the signaling server and the agent, each with its own allow-list (defence in depth).",
      "Planned each feature as a numbered GitHub issue and shipped it as a small commit that closes it.",
      "Wrote the limits down: the signaling server is trusted, the laptop must be online, transfers do not resume, and real Google tokens, real browsers and real NAT traversal are outside the automated tests.",
    ],
    stack: ["Python", "WebRTC", "WebSockets", "JavaScript", "HTML", "CSS", "systemd", "Tailscale", "Linux", "pytest"],
    status: "Working and documented. Runs on my own laptop, so it is live while the laptop is on.",
    repo: "https://github.com/Piyushchy/namestorage",
    demo: "https://piyushchy.is-a.dev/namestorage/",
    featured: true,
  },
  {
    id: "tangled-path",
    index: "04",
    title: "The Tangled Path",
    kind: "Hackathon · 1st runner up",
    summary:
      "A choice-based anti-drug game. You guide a character named Raj through childhood, his teens, adulthood and old age, and each decision changes who he becomes and how the story ends.",
    problem:
      "Anti-drug messaging is easy to ignore when it is only a lecture. The idea was to let people make the choices themselves and see the consequences play out over a whole life.",
    built: [
      "Four life stages (ages 6, 15, 25 and 70), with choices that carry forward into a good or a bad ending.",
      "A built-in story teller and a full-screen mode that players can switch on and off.",
      "A homepage with the game, an AI counseling page and an about page.",
      "The repository also holds folders for a forum, mini-games, a VR game and a pledge certificate.",
    ],
    decisions: ["Team of four, with me as team leader and front-end developer."],
    stack: ["HTML", "CSS", "JavaScript"],
    status: "1st runner up. Live on Vercel.",
    repo: "https://github.com/Piyushchy/Choices-an-Anti-Drug-Adventure",
    demo: "https://sudo-choices.vercel.app/",
    featured: true,
  },
  {
    id: "gif-tool",
    index: "05",
    title: "GIF Crop & Overlay",
    kind: "Personal project",
    summary:
      "Cut a GIF out in any shape, or lay one GIF over another and control it frame by frame. It runs entirely in the browser, so nothing is uploaded.",
    problem:
      "I could not find an existing tool that crops a GIF to a freehand shape or overlays one GIF on another with frame-level control, so I built one.",
    built: [
      "Freehand and polygon cropping, with an option to trim the canvas down to the shape.",
      "Overlay mode: drag and scale one GIF over another, with two frame tracks you can slide against each other.",
      "Per-frame controls: blank a frame, skip it, or hold the last frame until both GIFs end together.",
      "My own GIF decoder and encoder (LZW and a median-cut palette) rather than a library.",
    ],
    decisions: [],
    stack: ["JavaScript", "HTML", "Canvas"],
    status: "Working. Try it below.",
    repo: "",
    demo: "/gif-tool/",
    embed: "/gif-tool/index.html?theme=dark",
  },
  {
    id: "cloud-native-aws",
    index: "06",
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
  {
    id: "rnn-lstm",
    index: "07",
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
];

export const skillGroups: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["Python", "Java", "Kotlin", "LaTeX"] },
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
  { label: "Web", items: ["React.js", "HTML", "CSS", "JavaScript", "Canvas", "WebRTC", "WebSockets"] },
  { label: "Systems & tooling", items: ["Linux", "Command Line (CLI)", "SSH", "systemd", "Tailscale", "pytest"] },
];

export const timeline: { when: string; title: string; org: string; note: string }[] = [
  {
    when: "May – Jul 2026",
    title: "Summer Intern",
    org: "State Bank of India, Analytics Department",
    note: "Project: image to structured dataset conversion and predictive model building. Built a pipeline that extracts tables from scanned telecom audit PDFs.",
  },
  {
    when: "Jun 2025",
    title: "Industrial Training Intern",
    org: "Mazagon Dock Shipbuilders Limited, CIT Department",
    note: "",
  },
  {
    when: "Jun 2024",
    title: "Summer Intern",
    org: "State Bank of India, Business Intelligence Department",
    note: "Project: Dashboard Access Management Tool.",
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
  "Lately that has meant three internships (two at State Bank of India, one at Mazagon Dock), including a document-extraction pipeline at SBI, plus a tool that shares a PC's mouse and keyboard with an Android phone, a GIF crop and overlay tool, a personal web drive that serves files from my own laptop over WebRTC, an RNN vs LSTM comparison, a containerized app on AWS, and an anti-drug game that placed 1st runner up at a hackathon.",
  "I keep notes on what went wrong in each project, because that's where most of what I've learned came from. Outside code, I'm learning 3D to make an anime project.",
];

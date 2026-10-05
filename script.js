const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const send = document.getElementById("send");
const empty = document.getElementById("empty");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

// Minimal Markdown: code blocks, headings, lists, paragraphs
function renderText(text) {
  const out = [];
  let list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const h = line.match(/^#{1,4}\s+(.*)/);
    const ul = line.match(/^\s*[-*]\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);

    if (h) { closeList(); out.push(`<h3>${inline(h[1])}</h3>`); }
    else if (ul || ol) {
      const tag = ul ? "ul" : "ol";
      if (list !== tag) { closeList(); out.push(`<${tag}>`); list = tag; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
    } else if (line.trim() === "") { closeList(); }
    else { closeList(); out.push(`<p>${inline(line)}</p>`); }
  }
  closeList();
  return out.join("");
}

function renderMarkdown(md) {
  // split gives: text, lang, code, text, lang, code, ...
  const parts = md.split(/```(\w*)\n?([\s\S]*?)```/g);
  let html = "";
  for (let i = 0; i < parts.length; i += 3) {
    html += renderText(parts[i] || "");
    if (i + 2 < parts.length) {
      const lang = parts[i + 1] || "code";
      html += `<div class="code"><div class="code-bar"><span>${esc(lang)}</span>` +
        `<button class="copy" type="button">Copy</button></div>` +
        `<pre><code>${esc(parts[i + 2].replace(/\n$/, ""))}</code></pre></div>`;
    }
  }
  return html;
}

function addMessage(kind, html) {
  if (empty) empty.remove();
  const el = document.createElement("div");
  el.className = `msg ${kind}`;
  el.innerHTML = html;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

async function ask(question) {
  addMessage("user", esc(question));
  const pending = addMessage("bot", '<span class="typing"><i></i><i></i><i></i></span>');
  send.disabled = true;

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    pending.innerHTML = renderMarkdown(data.answer);
  } catch (err) {
    pending.classList.add("error");
    pending.textContent = `Could not get an answer: ${err.message}`;
  }

  send.disabled = false;
  chat.scrollTop = chat.scrollHeight;
  input.focus();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q || send.disabled) return;
  input.value = "";
  input.style.height = "auto";
  ask(q);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
});
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => ask(chip.textContent))
);

chat.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("copy")) return;
  const code = e.target.closest(".code").querySelector("code").textContent;
  await navigator.clipboard.writeText(code);
  e.target.textContent = "Copied";
  setTimeout(() => (e.target.textContent = "Copy"), 1500);
});

const buttons = [...document.querySelectorAll(".character")];
const source = document.getElementById("sourceText");
const counter = document.getElementById("counter");
const customBox = document.getElementById("customBox");
const customStyle = document.getElementById("customStyle");
const rewrite = document.getElementById("rewrite");
const status = document.getElementById("status");
const resultPanel = document.getElementById("resultPanel");
const result = document.getElementById("result");
let selected = "tony";

buttons.forEach(button => button.addEventListener("click", () => {
  buttons.forEach(item => item.classList.remove("selected"));
  button.classList.add("selected");
  selected = button.dataset.character;
  customBox.classList.toggle("hidden", selected !== "custom");
}));
source.addEventListener("input", () => counter.textContent = `${source.value.length} / 3000`);

rewrite.addEventListener("click", async () => {
  const text = source.value.trim();
  if (!text) { status.textContent = "Сначала напиши текст."; return; }
  if (selected === "custom" && !customStyle.value.trim()) {
    status.textContent = "Опиши стиль своего персонажа."; return;
  }
  rewrite.disabled = true;
  rewrite.textContent = "Переписываю...";
  status.textContent = "";
  try {
    const response = await fetch("/api/rewrite", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({text, profile:selected, customStyle:customStyle.value.trim()})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Ошибка сервера: HTTP ${response.status}`);
    if (!data.result) throw new Error("Сервер не вернул готовый текст.");
    result.textContent = data.result;
    resultPanel.classList.remove("hidden");
    status.textContent = "";
  } catch (error) {
    status.textContent = error.message || "Не удалось связаться с ИИ.";
  } finally {
    rewrite.disabled = false;
    rewrite.textContent = "✦ Переписать";
  }
});
document.getElementById("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.textContent);
    document.getElementById("copy").textContent = "Скопировано!";
    setTimeout(() => document.getElementById("copy").textContent = "Скопировать текст", 1500);
  } catch { status.textContent = "Не удалось скопировать. Выдели текст вручную."; }
});
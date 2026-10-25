"use strict";
const demoBank = {
  schemaVersion: 1, name: "Đáp án demo", sourceForm: { platform: "microsoft_forms", formId: "local-demo" },
  answers: [
    { questionId: "q1", question: "Thủ đô Việt Nam là gì?", type: "single_choice", options: ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"], answer: ["Hà Nội"] },
    { questionId: "q2", question: "Chọn các số nguyên tố", type: "multiple_choice", options: ["2", "3", "4"], answer: ["2", "3"] },
    { questionId: "q3", question: "Điền kết quả: 2 + 2 = ?", type: "short_text", answer: "4" }
  ]
};
document.getElementById("downloadAnswers").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(demoBank, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "demo-answers.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.getElementById("openPanel").addEventListener("click", () => {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT }).catch((error) => { document.getElementById("demoStatus").textContent = `Bấm biểu tượng extension để mở bảng bên. ${error.message}`; });
});
document.getElementById("resetDemo").addEventListener("click", () => { location.reload(); });
document.getElementById("demoForm").addEventListener("submit", (event) => event.preventDefault());

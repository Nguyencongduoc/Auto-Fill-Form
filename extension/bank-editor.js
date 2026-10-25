(function () {
  "use strict";
  const C = AutoFillCore;
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  class BankEditor {
    constructor(root) {
      this.root = root; this.draft = null; this.dirty = false;
      this.name = document.getElementById("editorName");
      this.scope = document.getElementById("editorScope");
      this.formId = document.getElementById("editorFormId");
      this.error = document.getElementById("editorError");
      this.list = document.getElementById("editorQuestions");
      this.search = document.getElementById("editorSearch");
      this.name.addEventListener("input", () => this.changed());
      this.formId.addEventListener("input", () => this.changed());
      this.scope.addEventListener("change", () => { this.formId.hidden = this.scope.value !== "bound"; this.changed(); });
      this.search.addEventListener("input", () => this.filter());
      document.getElementById("editorAdd").addEventListener("click", () => {
        this.draft.rows.push({ enabled: true, open: true, record: { questionId: `q-${crypto.randomUUID()}`, question: "", type: "single_choice", options: ["", ""], answer: [] } });
        this.changed(); this.render(); this.list.lastElementChild?.scrollIntoView({ block: "nearest" });
      });
      document.getElementById("editorCancel").addEventListener("click", () => this.root.dispatchEvent(new CustomEvent("cancel-bank")));
      const submit = (asCopy) => {
        try {
          this.clearError();
          const bank = this.read();
          this.root.dispatchEvent(new CustomEvent("save-bank", { detail: { bank, id: asCopy ? null : this.draft.id, expectedVersion: asCopy ? null : this.draft.version } }));
        } catch (error) { this.showError(error.message); }
      };
      document.getElementById("editorSave").addEventListener("click", () => submit(false));
      document.getElementById("editorSaveCopy").addEventListener("click", () => submit(true));
    }
    open(bank, { id = null, version = null, formId = "", fromPreview = false } = {}) {
      const data = JSON.parse(JSON.stringify(bank));
      this.draft = { id, version, meta: data, rows: data.answers.map((record) => ({ record, enabled: this.hasAnswer(record), open: false })) };
      this.name.value = data.name;
      this.scope.value = data.sourceForm ? "bound" : "generic";
      this.formId.value = data.sourceForm?.formId || formId;
      this.formId.hidden = this.scope.value !== "bound";
      this.search.value = ""; this.dirty = false; this.clearError();
      document.getElementById("editorTitle").textContent = id ? "Chỉnh bộ đáp án" : "Tạo bộ đáp án mới";
      document.getElementById("editorSaveCopy").hidden = !id;
      document.getElementById("editorHint").textContent = fromPreview
        ? "Bản mới chỉ gồm câu đang hiển thị trên form. Câu chưa có đáp án chưa được bật lưu; có thể điền bổ sung ở đây."
        : "Bật Lưu câu cho những câu muốn đưa vào bộ. Chỉnh nội dung, lựa chọn và đáp án ngay bên dưới.";
      this.root.hidden = false; this.render(); this.name.focus();
    }
    close() { this.root.hidden = true; this.draft = null; this.dirty = false; }
    changed(row) {
      this.dirty = true;
      if (row) { delete row.record.sourceNumber; delete row.record.sourcePage; }
      this.updateCount();
    }
    hasAnswer(record) {
      try { C.desiredAnswer({ ...record, supported: true }, record.answer); return true; } catch { return false; }
    }
    updateCount() {
      if (!this.draft) return;
      const rows = this.draft.rows;
      document.getElementById("editorCount").textContent = `${rows.filter((row) => row.enabled).length}/${rows.length} câu bật lưu${this.dirty ? " · Chưa lưu" : ""}`;
    }
    clearError() { this.error.hidden = true; this.error.textContent = ""; this.list.querySelectorAll(".invalid-question").forEach((node) => node.classList.remove("invalid-question")); }
    showError(message) {
      this.error.hidden = false; this.error.textContent = message;
      const index = /Câu (\d+)/u.exec(message);
      if (index) {
        const enabled = this.draft.rows.filter((row) => row.enabled);
        const row = enabled[Number(index[1]) - 1];
        if (row?.card) { row.card.hidden = false; row.card.open = true; row.card.classList.add("invalid-question"); row.card.scrollIntoView({ block: "nearest" }); }
      }
    }
    setBusy(busy) { this.root.querySelectorAll("input, select, textarea, button").forEach((node) => { node.disabled = busy; }); }
    read() {
      if (!this.draft) throw new Error("Chưa mở bộ đáp án để soạn.");
      const bank = { ...this.draft.meta, name: this.name.value, answers: this.draft.rows.filter((row) => row.enabled).map((row) => row.record) };
      if (this.scope.value === "bound") bank.sourceForm = { platform: "microsoft_forms", formId: this.formId.value.trim() };
      else delete bank.sourceForm;
      delete bank._instructions;
      if (!bank.answers.length) throw new Error("Bật Lưu câu cho ít nhất một câu có đáp án trước khi lưu bộ.");
      return C.validateBank(bank);
    }
    filter() {
      const query = C.normalize(this.search.value);
      for (const row of this.draft?.rows || []) row.card.hidden = !C.normalize(row.record.question).includes(query);
    }
    renderAnswer(row, index, area) {
      area.replaceChildren();
      const record = row.record;
      const change = (answer) => {
        record.answer = answer; row.enabled = this.hasAnswer(record); row.include.checked = row.enabled; this.changed(row);
      };
      if (record.type === "short_text") {
        const input = element("input"); input.type = "text"; input.value = typeof record.answer === "string" ? record.answer : "";
        input.setAttribute("aria-label", `Đáp án biên soạn câu ${index + 1}`);
        input.addEventListener("input", () => change(input.value)); area.append(input);
      } else if (record.type === "single_choice") {
        const select = element("select"); select.setAttribute("aria-label", `Đáp án biên soạn câu ${index + 1}`);
        const empty = element("option", "", "— Chọn đáp án đúng —"); empty.value = ""; select.append(empty);
        record.options.forEach((text, i) => { const option = element("option", "", text || `(Lựa chọn ${i + 1} chưa có nội dung)`); option.value = String(i); select.append(option); });
        const selected = Array.isArray(record.answer) ? record.options.indexOf(record.answer[0]) : -1;
        select.value = selected < 0 ? "" : String(selected);
        select.addEventListener("change", () => change(select.value === "" ? [] : [record.options[Number(select.value)]])); area.append(select);
      } else {
        record.options.forEach((text) => {
          const label = element("label", "option"), input = element("input"); input.type = "checkbox"; input.checked = Array.isArray(record.answer) && record.answer.includes(text);
          input.addEventListener("change", () => { const values = new Set(Array.isArray(record.answer) ? record.answer : []); input.checked ? values.add(text) : values.delete(text); change([...values]); });
          label.append(input, element("span", "", text || "Lựa chọn chưa có nội dung")); area.append(label);
        });
      }
    }
    render() {
      this.list.replaceChildren();
      this.draft.rows.forEach((row, index) => {
        const record = row.record;
        const card = element("details", "edit-question"); card.dataset.index = String(index); card.open = row.open; row.card = card;
        card.addEventListener("toggle", () => { row.open = card.open; });
        const summary = element("summary", "", `${index + 1}. ${record.question || "Câu hỏi mới"}`); card.append(summary);
        const body = element("div", "edit-question-body");
        const includeLabel = element("label", "overwrite"), include = element("input"); include.type = "checkbox"; include.checked = row.enabled;
        include.setAttribute("aria-label", `Lưu câu ${index + 1}`); row.include = include;
        include.addEventListener("change", () => { row.enabled = include.checked; this.changed(); }); includeLabel.append(include, element("span", "", "Lưu câu này")); body.append(includeLabel);
        const questionLabel = element("label", "editor-label", "Nội dung câu hỏi"), question = element("textarea"); question.rows = 2; question.value = record.question; question.setAttribute("aria-label", `Nội dung câu ${index + 1}`);
        question.addEventListener("input", () => { record.question = question.value; summary.textContent = `${index + 1}. ${question.value || "Câu hỏi mới"}`; this.changed(row); }); questionLabel.append(question); body.append(questionLabel);
        const typeLabel = element("label", "editor-label", "Loại câu"), type = element("select"); type.setAttribute("aria-label", `Loại câu ${index + 1}`);
        for (const [value, label] of [["single_choice", "Một đáp án"], ["multiple_choice", "Nhiều đáp án"], ["short_text", "Văn bản ngắn"]]) { const option = element("option", "", label); option.value = value; type.append(option); }
        type.value = record.type; type.addEventListener("change", () => {
          const old = record.type; record.type = type.value;
          if (record.type === "short_text") { delete record.options; record.answer = ""; }
          else { if (old === "short_text") { record.options = ["", ""]; record.answer = []; } else if (record.type === "single_choice") record.answer = record.answer.slice(0, 1); }
          row.enabled = this.hasAnswer(record); row.open = true; this.changed(row); this.render();
        }); typeLabel.append(type); body.append(typeLabel);
        const answerArea = element("div", "editor-answer");
        if (record.type !== "short_text") {
          body.append(element("p", "editor-label", "Các lựa chọn"));
          record.options.forEach((value, optionIndex) => {
            const line = element("div", "edit-option"), input = element("input"); input.value = value; input.setAttribute("aria-label", `Lựa chọn ${optionIndex + 1} câu ${index + 1}`);
            input.addEventListener("input", () => { const previous = record.options[optionIndex]; record.options[optionIndex] = input.value; record.answer = record.answer.map((answer) => answer === previous ? input.value : answer); this.changed(row); });
            input.addEventListener("change", () => this.renderAnswer(row, index, answerArea));
            const remove = element("button", "small", "×"); remove.type = "button"; remove.setAttribute("aria-label", `Xóa lựa chọn ${optionIndex + 1} câu ${index + 1}`);
            remove.addEventListener("click", () => { record.options.splice(optionIndex, 1); record.answer = record.answer.filter((answer) => record.options.includes(answer)); row.open = true; this.changed(row); this.render(); });
            line.append(input, remove); body.append(line);
          });
          const add = element("button", "small", "+ Thêm lựa chọn"); add.addEventListener("click", () => { record.options.push(""); row.open = true; this.changed(row); this.render(); }); body.append(add);
        }
        body.append(element("p", "editor-label", "Đáp án")); this.renderAnswer(row, index, answerArea); body.append(answerArea);
        const removeQuestion = element("button", "link danger", "Xóa câu khỏi bản soạn");
        removeQuestion.addEventListener("click", () => { this.draft.rows.splice(index, 1); this.changed(); this.render(); }); body.append(removeQuestion);
        card.append(body); this.list.append(card);
      });
      this.updateCount(); this.filter();
    }
  }
  globalThis.BankEditor = BankEditor;
})();

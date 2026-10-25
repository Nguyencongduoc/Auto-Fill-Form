(function () {
  "use strict";
  const C = globalThis.AutoFillCore;
  const HOSTS = ["forms.cloud.microsoft", "forms.office.com"];
  const clean = (s) => String(s ?? "").replace(/\s+/gu, " ").trim();
  const visible = (element) => element instanceof Element && !element.closest('[hidden], [aria-hidden="true"]') && getComputedStyle(element).display !== "none" && getComputedStyle(element).visibility !== "hidden" && element.getClientRects().length > 0;
  const isDemo = () => typeof chrome !== "undefined" && chrome.runtime?.id && location.href.split(/[?#]/u)[0] === chrome.runtime.getURL("demo.html");

  function titleText(element) {
    if (!element) return "";
    const rich = element.querySelector(".text-format-content");
    if (rich) return clean(rich.textContent);
    const copy = element.cloneNode(true);
    copy.querySelectorAll('[data-automation-id="questionOrdinal"], [data-automation-id="requiredStar"], [role="note"], [role="log"], [aria-hidden="true"], [id^="QuestionInfo_"], button').forEach((node) => node.remove());
    return clean(copy.textContent);
  }
  function optionLabel(node) {
    const aria = node.getAttribute("aria-label");
    if (aria) return clean(aria);
    const labelled = (node.getAttribute("aria-labelledby") || "").split(/\s+/u).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
    if (labelled.length) return clean(labelled.map((el) => el.textContent).join(" "));
    const label = node.labels?.[0] || node.closest("label");
    if (label) {
      const rich = label.querySelector(".text-format-content");
      if (rich) return clean(rich.textContent);
      const copy = label.cloneNode(true);
      copy.querySelectorAll("input, svg, [aria-hidden=true]").forEach((el) => el.remove());
      return clean(copy.textContent);
    }
    return clean(node.textContent);
  }
  const checked = (node) => node instanceof HTMLInputElement ? node.checked : node.getAttribute("aria-checked") === "true";
  function valueOf(ref) {
    if (ref.data.type === "short_text") return ref.controls[0].value;
    return ref.controls.flatMap((el, i) => checked(el) ? [ref.data.options[i]] : []);
  }

  function inspect() {
    if (!isDemo() && (location.protocol !== "https:" || !HOSTS.includes(location.hostname) || !/\/pages\/responsepage\.aspx\/?$/iu.test(location.pathname))) {
      throw new Error("Hãy mở trang trả lời Microsoft Forms trực tiếp trong tab (ResponsePage.aspx), đăng nhập nếu cần rồi bấm biểu tượng extension.");
    }
    const containers = [...document.querySelectorAll('[data-automation-id="questionItem"], .office-form-question')].filter(visible);
    if (!containers.length) throw new Error("Chưa thấy câu hỏi. Form có thể chưa tải xong, đã đóng, cần đăng nhập hoặc cấu trúc này chưa được hỗ trợ.");
    const refs = containers.map((root, index) => {
      const titleNode = root.querySelector('[data-automation-id="questionTitle"], .office-form-question-title, legend, [role="heading"]');
      const question = titleText(titleNode);
      const platformQuestionId = root.querySelector('[id^="QuestionId_"]')?.id || (root.id?.startsWith("QuestionId_") ? root.id : "");
      const nativeChoices = [...root.querySelectorAll('input[type="radio"], input[type="checkbox"]')].filter((node) => !node.closest('[hidden], [aria-hidden="true"]'));
      const ariaChoices = [...root.querySelectorAll('[role="radio"], [role="checkbox"]')].filter(visible);
      const controls = nativeChoices.length ? nativeChoices : ariaChoices;
      const textInputs = [...root.querySelectorAll('input:not([type]), input[type="text"], input[type="email"], input[type="number"], input[type="tel"], input[type="url"], input[type="search"]')].filter(visible);
      const unsupportedControl = root.querySelector('select, textarea, input[type="file"], input[type="date"], [role="combobox"], [role="slider"], [role="grid"], [data-automation-id="rating"]');
      const kind = (node) => node instanceof HTMLInputElement ? node.type : node.getAttribute("role");
      let type = "unsupported", selectedControls = controls, reason = "Loại trường này chưa được hỗ trợ (chỉ Choice và Text ngắn).";
      if (!unsupportedControl && controls.length >= 2 && textInputs.length === 0) {
        if (controls.every((node) => kind(node) === "radio")) type = "single_choice";
        if (controls.every((node) => kind(node) === "checkbox")) type = "multiple_choice";
      } else if (!unsupportedControl && !controls.length && textInputs.length === 1) {
        type = "short_text"; selectedControls = textInputs;
      }
      const options = type === "short_text" ? [] : selectedControls.map(optionLabel);
      if (!question) { type = "unsupported"; reason = "Không đọc được nội dung câu hỏi."; }
      if (selectedControls.some((node) => node.disabled || node.readOnly || node.getAttribute("aria-disabled") === "true")) { type = "unsupported"; reason = "Trường đang khóa hoặc chỉ đọc."; }
      if ((type === "single_choice" || type === "multiple_choice") && (options.some((s) => !s) || new Set(options.map(C.normalize)).size !== options.length)) { type = "unsupported"; reason = "Nhãn lựa chọn trống hoặc trùng nhau."; }
      const data = {
        id: `${index}:${platformQuestionId || "question"}`, platformQuestionId, index,
        question: question || `Câu ${index + 1}`, type, options, supported: type !== "unsupported", reason: type === "unsupported" ? reason : "",
        required: Boolean(root.querySelector('[data-automation-id="requiredStar"], [aria-required="true"], [required]'))
      };
      const ref = { root, controls: selectedControls, data };
      data.signature = C.signature(data);
      data.current = data.supported ? valueOf(ref) : null;
      return ref;
    });
    const params = new URLSearchParams(location.search);
    const formId = isDemo() ? "local-demo" : [...params].find(([key]) => key.toLowerCase() === "id")?.[1] || "";
    const title = titleText(document.querySelector('[data-automation-id="formTitle"]')) || document.title || "Microsoft Forms";
    const questions = refs.map((ref) => ref.data);
    const fingerprint = JSON.stringify([location.href, title, questions.map((q) => [q.id, q.signature, q.supported])]);
    return { refs, title, formId, fingerprint, url: location.href, questions, demo: Boolean(isDemo()) };
  }

  function events(node) {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }
  async function setValue(ref, answer) {
    const desired = C.desiredAnswer(ref.data, answer, true);
    if (ref.data.type === "short_text") {
      const node = ref.controls[0];
      if (node.maxLength >= 0 && desired.length > node.maxLength) throw new Error(`Đáp án vượt giới hạn ${node.maxLength} ký tự.`);
      node.focus({ preventScroll: true });
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, desired);
      events(node); node.blur();
      if (!node.validity.valid) throw new Error(node.validationMessage || "Giá trị không hợp lệ với trường.");
    } else {
      const wanted = new Set(desired.map(C.normalize));
      if (ref.data.type === "single_choice" && desired.length === 0) {
        for (const node of ref.controls.filter(checked)) {
          if (!(node instanceof HTMLInputElement)) throw new Error("Không thể bỏ chọn radio tùy biến; hãy xóa lựa chọn thủ công.");
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set.call(node, false);
          events(node);
          node.dispatchEvent(new Event("click", { bubbles: true }));
        }
      } else {
        for (let i = 0; i < ref.controls.length; i++) {
          const node = ref.controls[i];
          const shouldCheck = wanted.has(C.normalize(ref.data.options[i]));
          if (checked(node) !== shouldCheck && (ref.data.type === "multiple_choice" || shouldCheck)) node.click();
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (!ref.root.isConnected || !C.sameState(valueOf(ref), desired)) throw new Error("Form chưa nhận đúng giá trị. Hãy kiểm tra lại trên trang.");
    const invalid = ref.root.querySelector('[aria-invalid="true"]');
    if (invalid) throw new Error("Form báo dữ liệu câu này không hợp lệ.");
    return desired;
  }
  globalThis.AutoFillAdapter = { inspect, valueOf, setValue, isDemo };
})();

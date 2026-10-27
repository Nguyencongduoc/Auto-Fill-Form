(function () {
  "use strict";
  const C = globalThis.AutoFillCore, P = globalThis.AutoFillPlatform;
  const clean = value => String(value ?? "").replace(/\s+/gu, " ").trim();
  const visible = node => node instanceof Element && !node.closest('[hidden], [aria-hidden="true"]') && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden" && node.getClientRects().length > 0;
  const locked = node => node.matches(":disabled") || node.readOnly || node.getAttribute("aria-disabled") === "true";
  function text(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll('.answernumber, .accesshide, .sr-only, .visually-hidden, .specificfeedback, .feedback, .correctness, .icon, script, style, input, button, [aria-hidden="true"]').forEach(el => el.remove());
    copy.querySelectorAll('br').forEach(el => el.replaceWith(" "));
    copy.querySelectorAll('p, div, li, tr').forEach(el => el.append(" "));
    return clean(copy.textContent);
  }
  function label(control, root) {
    const linked = (control.getAttribute("aria-labelledby") || "").split(/\s+/u).filter(Boolean).map(id => document.getElementById(id)).filter(el => el && root.contains(el));
    if (linked.length) return clean(linked.map(text).join(" "));
    const own = [...(control.labels || [])].find(el => root.contains(el));
    if (own) return text(own);
    const row = control.closest('.r0, .r1');
    const region = row?.querySelector('[data-region="answer-label"], .flex-fill');
    return text(region) || clean(control.getAttribute("aria-label"));
  }
  function valueOf(ref) {
    return ref.data.type === "short_text" ? ref.controls[0].value : ref.controls.flatMap((node, i) => node.checked ? [ref.data.options[i]] : []);
  }
  function quizId(url) {
    const direct = url.searchParams.get("cmid");
    if (/^\d+$/u.test(direct || "")) return direct;
    const hidden = document.querySelector('#responseform input[name="cmid"]')?.value;
    if (/^\d+$/u.test(hidden || "")) return hidden;
    // Use the quiz breadcrumb, never a course id or a neighbouring quiz link.
    const links = [...document.querySelectorAll('.breadcrumb a[href], nav[aria-label="breadcrumb"] a[href], .navbar .breadcrumb-item a[href]')];
    for (const a of links.reverse()) {
      try { const link = new URL(a.href); if (link.origin === url.origin && link.pathname === "/mod/quiz/view.php" && /^\d+$/u.test(link.searchParams.get("id") || "")) return link.searchParams.get("id"); } catch { /* Ignore malformed breadcrumb links. */ }
    }
    return "";
  }
  function inspect() {
    const target = P.identify(location.href);
    if (target.platform !== "moodle" || !target.supported) throw new Error(target.reason);
    const form = document.querySelector('form#responseform, form[action*="/mod/quiz/processattempt.php"]');
    if (!form) throw new Error("Chưa thấy lượt làm bài LMS đang hoạt động. Đăng nhập, mở câu hỏi và quét lại; trang có thể đã hết hạn hoặc chỉ xem kết quả.");
    const containers = [...form.querySelectorAll('.que')].filter(visible);
    if (!containers.length) throw new Error("Chưa thấy câu hỏi Moodle trong trang hiện tại. Đợi trang tải xong rồi quét lại.");
    const refs = containers.map((root, index) => {
      const question = text(root.querySelector('.qtext'));
      const area = root.querySelector('.formulation');
      const choices = [...(area?.querySelectorAll('.answer input[type="radio"], .answer input[type="checkbox"]') || [])].filter(node => !node.closest('.qtype_multichoice_clearchoice, [hidden], [aria-hidden="true"]') && node.value !== "-1");
      const inputs = [...(area?.querySelectorAll('.answer input[type="text"], .answer input:not([type])') || [])];
      let type = "unsupported", controls = choices, reason = "Loại câu Moodle này chưa hỗ trợ: chỉ trắc nghiệm, Đúng/Sai và câu trả lời ngắn.";
      if ((root.classList.contains('multichoice') || root.classList.contains('truefalse')) && choices.length >= 2 && !area.querySelector('select, textarea, input[type="file"]')) {
        if (choices.every(node => node.type === "radio" && node.name) && new Set(choices.map(node => node.name)).size === 1) type = "single_choice";
        else if (choices.every(node => node.type === "checkbox")) type = "multiple_choice";
      } else if (root.classList.contains('shortanswer') && inputs.length === 1 && !choices.length) { type = "short_text"; controls = inputs; }
      const isBoolean = root.classList.contains('truefalse') && type === "single_choice" && controls.length === 2 && new Set(controls.map(node => node.value)).size === 2 && controls.every(node => ["0", "1"].includes(node.value));
      const options = type === "short_text" ? [] : controls.map(node => isBoolean ? node.value === "1" ? "True" : "False" : label(node, root));
      if (!question) { type = "unsupported"; reason = "Không đọc được nội dung câu hỏi hoặc câu chỉ có hình."; }
      if (controls.some(locked)) { type = "unsupported"; reason = "Câu đang khóa hoặc chỉ đọc; extension không sửa câu đã đóng."; }
      if (type !== "short_text" && type !== "unsupported" && (options.some(option => !option) || new Set(options.map(C.normalize)).size !== options.length)) { type = "unsupported"; reason = "Lựa chọn là hình, không có nhãn chữ hoặc nhãn trùng nhau; hãy chọn trực tiếp trên LMS."; }
      const platformQuestionId = root.id ? `moodle:${root.id}` : "";
      const data = { id: `${index}:${platformQuestionId || 'moodle-question'}`, platformQuestionId, index, question: question || `Câu ${index + 1}`, type, options, supported: type !== "unsupported", reason: type === "unsupported" ? reason : "", required: Boolean(area?.querySelector('[required], [aria-required="true"]')) };
      const ref = { root, controls, data };
      data.signature = C.signature(data); data.current = data.supported ? valueOf(ref) : null;
      return ref;
    });
    const formId = P.lmsFormId(target.url, quizId(target.url));
    if (!formId) throw new Error("Không xác định được quiz/lượt làm bài. Hãy mở link quiz đầy đủ trên LMS HUST rồi thử lại.");
    const title = text(document.querySelector('.page-header-headings h1, #page-header h1, h1')) || document.title || "LMS HUST Quiz";
    const questions = refs.map(ref => ref.data);
    const fingerprint = JSON.stringify([location.href, formId, title, refs.map(ref => [ref.data.id, ref.data.signature, ref.data.supported, ref.controls.map(node => [node.id, node.name, node.getAttribute('value')]), [...ref.root.querySelectorAll('.qtext img, .answer img')].map(node => [node.getAttribute('src'), node.alt])])]);
    return { platform: "moodle", refs, title, formId, fingerprint, url: location.href, questions, demo: false };
  }
  function events(node) { node.dispatchEvent(new Event("input", { bubbles: true })); node.dispatchEvent(new Event("change", { bubbles: true })); }
  async function setValue(ref, answer) {
    if (!ref.root.isConnected || ref.controls.some(locked)) throw new Error("Câu đã đổi hoặc bị khóa. Quét lại lượt làm bài.");
    const desired = C.desiredAnswer(ref.data, answer, true);
    if (ref.data.type === "short_text") {
      const node = ref.controls[0];
      if (node.maxLength >= 0 && desired.length > node.maxLength) throw new Error(`Đáp án vượt giới hạn ${node.maxLength} ký tự.`);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(node, desired); events(node);
      if (!node.validity.valid && desired !== "") throw new Error(node.validationMessage || "Giá trị không hợp lệ.");
    } else if (ref.data.type === "single_choice" && desired.length === 0) {
      // Moodle uses a hidden -1 radio to represent a cleared multichoice response.
      const clear = [...ref.root.querySelectorAll('.qtype_multichoice_clearchoice input[type="radio"]')].find(node => node.value === "-1" && node.name === ref.controls[0].name && !locked(node));
      if (clear) { clear.click(); events(clear); }
      else for (const node of ref.controls.filter(node => node.checked)) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set.call(node, false); events(node); }
    } else {
      const wanted = new Set(desired.map(C.normalize));
      for (let i = 0; i < ref.controls.length; i++) {
        const node = ref.controls[i], shouldCheck = wanted.has(C.normalize(ref.data.options[i]));
        if (node.checked !== shouldCheck && (ref.data.type === "multiple_choice" || shouldCheck)) { node.click(); events(node); }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 150));
    if (!ref.root.isConnected || ref.controls.some(locked) || !C.sameState(valueOf(ref), desired)) throw new Error("LMS chưa nhận đúng giá trị. Hãy kiểm tra câu hỏi trên trang.");
    return desired;
  }
  globalThis.AutoFillMoodleAdapter = { inspect, valueOf, setValue, isDemo: () => false };
})();

(function () {
  "use strict";
  const F = globalThis.AutoFillLmsFlow;
  const norm = value => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/gu, "d").replace(/\s+/gu, " ").trim().toLowerCase();
  const visible = node => !node.closest('[hidden], [aria-hidden="true"]') && getComputedStyle(node).display !== "none" && getComputedStyle(node).visibility !== "hidden" && node.getClientRects().length > 0;
  const label = node => norm([node.textContent, node.getAttribute("value"), node.getAttribute("aria-label"), node.title, ...[...node.querySelectorAll("img[alt]")].map(img => img.alt)].filter(Boolean).join(" "));
  const finish = node => /finish|submit|endtest|ket thuc|nop bai|hoan thanh/u.test(label(node)) || /finish|submitall|check/iu.test(node.name || node.getAttribute("data-action") || "");
  function inspect() {
    const { attempt, url } = F.context(location.href);
    const form = document.querySelector("form#responseform");
    if (!form) throw new Error("Không thấy form lượt làm bài đang hoạt động.");
    const pageRaw = form.querySelector('input[name="thispage"]')?.value ?? url.searchParams.get("page") ?? "0";
    if (!/^\d+$/u.test(pageRaw)) throw new Error("Không xác định được trang hiện tại của quiz.");
    const page = Number(pageRaw), nextRaw = form.querySelector('input[name="nextpage"]')?.value;
    const base = { attempt, page, pageKey: `${attempt}:${page}`, kind: "blocked", reason: "Không tìm thấy nút Next page rõ ràng. Kiểm tra trang LMS rồi tiếp tục thủ công." };
    const candidates = [...document.querySelectorAll('#mod_quiz-next-nav, .mod_quiz-next-nav, #responseform [name="next"], a[rel="next"], [data-action="next-page"]')].filter(visible);
    let control = null;
    if (nextRaw === "-1") { base.kind = "last"; base.reason = "Đã đến trang cuối. Bạn tự kiểm tra và kết thúc/nộp bài."; }
    else {
      const valid = candidates.filter(node => {
        if (finish(node) || node.matches(":disabled") || node.getAttribute("aria-disabled") === "true") return false;
        if (node instanceof HTMLAnchorElement) {
          try { const target = F.context(node.href); return target.attempt === attempt && Number(target.url.searchParams.get("page")) === page + 1 && target.url.searchParams.has("page"); } catch { return false; }
        }
        if (!(node instanceof HTMLInputElement || node instanceof HTMLButtonElement) || node.form !== form) return false;
        if (!/^(?:submit|button)$/u.test(node.type)) return false;
        const action = new URL(node.getAttribute("formaction") || form.action, location.href);
        if (action.origin !== location.origin || !["/mod/quiz/processattempt.php", "/mod/quiz/attempt.php"].includes(action.pathname)) return false;
        return nextRaw != null ? /^\d+$/u.test(nextRaw) && Number(nextRaw) === page + 1 : /next page|trang tiep|trang sau/u.test(label(node));
      });
      if (valid.length === 1) { control = valid[0]; base.kind = "next"; base.nextPage = page + 1; base.reason = "Trang kế tiếp"; }
      else if (!valid.length && candidates.some(finish)) { base.kind = "last"; base.reason = "Đã đến bước kết thúc. Bạn tự kiểm tra và nộp bài."; }
      else if (valid.length > 1) base.reason = "Có nhiều nút chuyển trang; chưa xác định được nút Next duy nhất.";
    }
    const key = JSON.stringify([attempt, page, nextRaw, base.kind, control?.id, control?.getAttribute("href"), control?.getAttribute("formaction"), control?.name, control ? label(control) : ""]);
    return { data: { ...base, key }, control };
  }
  function next(expectedKey) {
    const found = inspect();
    if (found.data.kind !== "next") return found.data;
    if (found.data.key !== expectedKey) throw new Error("Nút Next hoặc trang đích đã đổi. Chưa chuyển trang; hãy kiểm tra rồi tiếp tục.");
    found.control.click();
    return found.data;
  }
  globalThis.AutoFillLmsNavigation = { inspect, next };
})();

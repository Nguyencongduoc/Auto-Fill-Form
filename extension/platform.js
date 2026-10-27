(function (root) {
  "use strict";
  const MS_HOSTS = ["forms.cloud.microsoft", "forms.office.com"];
  const LMS_HOST = "lms.hust.edu.vn";
  function identify(value) {
    let url;
    try { url = new URL(value); } catch { return { platform: "", supported: false, reason: "Mở Microsoft Forms hoặc bài quiz LMS HUST, rồi bấm biểu tượng extension trên tab đó." }; }
    if (url.protocol !== "https:") return { platform: "", supported: false, reason: "Chỉ hỗ trợ trang HTTPS của Microsoft Forms và LMS HUST." };
    if (url.hostname === LMS_HOST) {
      const supported = url.pathname === "/mod/quiz/attempt.php";
      const reason = url.pathname === "/mod/quiz/review.php"
        ? "Đây là trang xem lại kết quả LMS, chỉ đọc. Mở lượt làm bài đang diễn ra (attempt.php) để điền."
        : url.pathname === "/mod/quiz/view.php"
          ? "Đây là trang giới thiệu quiz. Bạn tự bấm Bắt đầu làm bài hoặc Tiếp tục lần làm bài, rồi mở extension trong trang câu hỏi."
          : "Đăng nhập LMS HUST và mở lượt làm quiz đang diễn ra (mod/quiz/attempt.php), rồi bấm biểu tượng extension.";
      return { platform: "moodle", supported, reason, url };
    }
    if (MS_HOSTS.includes(url.hostname)) {
      return { platform: "microsoft_forms", supported: /\/pages\/responsepage\.aspx\/?$/iu.test(url.pathname), url,
        reason: /\/pages\/responsedetailpage\.aspx\/?$/iu.test(url.pathname)
          ? "Đây là trang chi tiết kết quả (chỉ đọc). Hãy mở link trả lời của form — ResponsePage.aspx — rồi bấm biểu tượng extension và quét lại."
          : "Hãy mở trang trả lời Microsoft Forms, đăng nhập nếu cần và bấm biểu tượng extension trên tab đó." };
    }
    return { platform: "", supported: false, reason: "Hỗ trợ Microsoft Forms và lms.hust.edu.vn. Hãy mở trang trả lời hoặc lượt làm quiz." };
  }
  function lmsFormId(url, quizId = "") {
    const id = String(quizId || url.searchParams.get("cmid") || "");
    if (/^\d+$/u.test(id)) return `moodle:hust:quiz:${id}`;
    const attempt = url.searchParams.get("attempt") || "";
    return /^\d+$/u.test(attempt) ? `moodle:hust:attempt:${attempt}` : "";
  }
  const api = { identify, lmsFormId, LMS_HOST };
  root.AutoFillPlatform = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

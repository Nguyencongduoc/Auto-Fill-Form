(function (root) {
  "use strict";
  const C = root.AutoFillCore || (typeof require === "function" ? require("./core.js") : null);
  const NONE = "@none", BUNDLED = "@bundled", MAX_BANKS = 50, MAX_BYTES = 8 * 1024 * 1024;
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function error(message) { throw new Error(message); }
  function checkSize(library) {
    if (new TextEncoder().encode(JSON.stringify(library)).length > MAX_BYTES) error("Thư viện vượt 8 MB. Hãy xuất rồi xóa các bộ không còn dùng trước khi lưu thêm.");
    return library;
  }
  function validate(raw) {
    if (!raw || raw.schemaVersion !== 1 || !Number.isInteger(raw.revision) || raw.revision < 0 || !Array.isArray(raw.banks) || raw.banks.length > MAX_BANKS) error("Thư viện đáp án lưu trên máy không đúng định dạng. Dữ liệu gốc được giữ nguyên.");
    const ids = new Set();
    const banks = raw.banks.map((entry) => {
      if (!entry || typeof entry.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/u.test(entry.id) || ids.has(entry.id) || !Number.isInteger(entry.version) || entry.version < 1 || typeof entry.updatedAt !== "string") error("Một bản ghi trong thư viện không hợp lệ. Dữ liệu gốc được giữ nguyên.");
      ids.add(entry.id);
      return { id: entry.id, version: entry.version, updatedAt: entry.updatedAt, bank: C.validateBank(entry.bank) };
    });
    const selections = Object.fromEntries(Object.entries(raw.selections || {}).filter(([key, id]) => key.length > 0 && key.length <= 1000 && (ids.has(id) || id === NONE || id === BUNDLED)));
    return checkSize({ schemaVersion: 1, revision: raw.revision, banks, selections, lastSelectedId: ids.has(raw.lastSelectedId) ? raw.lastSelectedId : null });
  }
  function initialize(raw, legacy) {
    if (raw != null) return { library: validate(raw), migrated: false, warning: "" };
    const library = { schemaVersion: 1, revision: 0, banks: [], selections: {}, lastSelectedId: null };
    let warning = "";
    if (legacy) {
      try {
        const bank = C.validateBank(legacy);
        library.banks.push({ id: "legacy-import", version: 1, updatedAt: new Date().toISOString(), bank });
        library.lastSelectedId = "legacy-import";
        if (bank.sourceForm) library.selections = { [bank.sourceForm.formId]: "legacy-import" };
      } catch { warning = "Bộ đáp án cũ không hợp lệ nên chưa đưa vào thư viện. Bản gốc vẫn được giữ trên máy."; }
    }
    return { library, migrated: true, warning };
  }
  function compatible(bank, formId) { return Boolean(bank) && (!formId || !bank.sourceForm || bank.sourceForm.formId === formId); }
  function resolve(library, formId, bundled) {
    const byId = (id) => library.banks.find((entry) => entry.id === id);
    const explicit = formId && Object.hasOwn(library.selections, formId) ? library.selections[formId] : null;
    if (explicit === NONE) return { id: NONE, bank: null, reason: "Chưa chọn bộ đáp án cho form này." };
    if (explicit === BUNDLED && compatible(bundled, formId)) return { id: BUNDLED, bank: bundled, reason: "Bộ tích hợp đã chọn cho form này." };
    const chosen = byId(explicit);
    if (chosen && compatible(chosen.bank, formId)) return { id: chosen.id, bank: chosen.bank, reason: "Đã nhớ lựa chọn cho form này." };
    const bound = formId ? library.banks.filter((entry) => entry.bank.sourceForm?.formId === formId) : [];
    if (bound.length === 1) return { id: bound[0].id, bank: bound[0].bank, reason: "Bộ đáp án liên kết với form này." };
    if (bound.length > 1) return { id: NONE, bank: null, reason: "Có nhiều bộ dành cho form này. Hãy chọn bộ muốn dùng." };
    if (formId && bundled?.sourceForm?.formId === formId) return { id: BUNDLED, bank: bundled, reason: "Bộ Quy chế tích hợp sẵn." };
    if (!formId) {
      const last = byId(library.lastSelectedId);
      if (last) return { id: last.id, bank: last.bank, reason: "Bộ mở gần nhất; quét form để xác định phạm vi." };
    }
    return { id: NONE, bank: null, reason: "Chọn bộ trong thư viện hoặc nhập JSON cho form này." };
  }
  function mutate(input, change, { now = new Date().toISOString(), newId = "" , bundledFormId = "" } = {}) {
    const library = validate(input);
    const target = library.banks.find((entry) => entry.id === change.id);
    if (change.op === "save") {
      const bank = C.validateBank(change.bank);
      if (change.id && !target) error("Bộ này đã bị xóa ở bảng bên khác. Hãy lưu thành bộ mới.");
      if (target && target.version !== change.expectedVersion) error("Bộ đáp án đã được sửa ở bảng bên khác. Hãy đóng bản soạn, mở lại bộ mới nhất rồi sửa; bản đang soạn vẫn được giữ.");
      if (!target && library.banks.length >= MAX_BANKS) error(`Thư viện đã đủ ${MAX_BANKS} bộ. Hãy xuất rồi xóa một bộ không dùng.`);
      if (!target && (!/^[a-zA-Z0-9_-]{1,100}$/u.test(newId) || library.banks.some((entry) => entry.id === newId))) error("Không tạo được ID bộ đáp án mới.");
      const entry = { id: target ? target.id : newId, version: target ? target.version + 1 : 1, updatedAt: now, bank };
      library.banks = target ? library.banks.map((item) => item.id === target.id ? entry : item) : [...library.banks, entry];
      library.lastSelectedId = entry.id;
      if (change.formId && compatible(bank, change.formId)) library.selections = { ...library.selections, [change.formId]: entry.id };
      library.revision++;
      return { library: checkSize(library), id: entry.id };
    }
    if (change.op === "delete") {
      if (!target) error("Bộ đáp án này đã được xóa.");
      if (target.version !== change.expectedVersion) error("Bộ đáp án đã thay đổi ở bảng bên khác. Hãy chọn lại rồi xóa.");
      library.banks = library.banks.filter((entry) => entry.id !== change.id);
      library.selections = Object.fromEntries(Object.entries(library.selections).filter(([, id]) => id !== change.id));
      if (library.lastSelectedId === change.id) library.lastSelectedId = null;
    } else if (change.op === "select") {
      if (change.id !== NONE && change.id !== BUNDLED && !target) error("Bộ đáp án không còn trong thư viện.");
      if (target && !compatible(target.bank, change.formId)) error("Bộ đáp án thuộc form khác. Sửa liên kết của bộ hoặc chọn đúng form trước khi áp dụng.");
      if (change.id === BUNDLED && change.formId && change.formId !== bundledFormId) error("Bộ Quy chế tích hợp chỉ áp dụng cho form Quy chế.");
      if (change.formId) library.selections = { ...library.selections, [change.formId]: change.id };
      if (target) library.lastSelectedId = target.id;
    } else error("Thao tác thư viện không được hỗ trợ.");
    library.revision++;
    return { library: checkSize(library), id: change.id };
  }
  function parseText(value) {
    const source = String(value).replace(/^\uFEFF/u, "");
    if (!source.trim()) error("Chưa có nội dung JSON. Chọn file hoặc dán nội dung trước khi nhập.");
    if (new TextEncoder().encode(source).length > 2 * 1024 * 1024) error("File JSON vượt 2 MB. Hãy tách thành các bộ nhỏ hơn.");
    let raw;
    try { raw = JSON.parse(source); } catch (cause) {
      const position = /position (\d+)/iu.exec(cause.message);
      const line = position ? source.slice(0, Number(position[1])).split("\n").length : null;
      error(`JSON chưa đúng cú pháp${line ? ` ở gần dòng ${line}` : ""}. Kiểm tra dấu phẩy, dấu ngoặc và dấu nháy kép; có thể bắt đầu từ “Xuất mẫu JSON”.`);
    }
    return C.validateBank(raw);
  }
  function equivalent(library, bank) { return library.banks.find((entry) => JSON.stringify(entry.bank) === JSON.stringify(bank)); }
  const api = { NONE, BUNDLED, MAX_BANKS, MAX_BYTES, validate, initialize, compatible, resolve, mutate, parseText, equivalent, copy };
  root.AutoFillLibrary = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

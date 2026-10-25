

# Auto Fill Form

Extension Chrome **v0.3.0** hỗ trợ điền Microsoft Forms từ đáp án JSON của người dùng. Có thư viện nhiều bộ, trình chỉnh sửa và ghi nhớ bộ đã chọn cho từng form. Không cần build, Node.js, tài khoản AI hoặc máy chủ để sử dụng.

Bộ **200 đáp án Quy chế 2026.1** tiếp tục được tích hợp và tự chọn trên đúng form cũ. **Nhập PDF trực tiếp chưa có**, được giữ trong [lộ trình](./ROADMAP.md).

## Cài và cập nhật

1. Giải nén `auto-fill-form-0.3.0.zip`.
2. Mở `chrome://extensions`, bật **Developer mode**.
3. Bấm **Load unpacked**, chọn thư mục chứa trực tiếp `manifest.json`, `background.js`, `panel.html`, `library.js` và `data/`.
4. Nếu dùng mã nguồn tại máy, chọn `D:\D\Auto Fill Form\extension`.
5. Ghim tiện ích. Mở trang trả lời Microsoft Forms, tự đăng nhập nếu cần, đợi câu hỏi hiện rồi bấm biểu tượng tiện ích.

Dùng **Load unpacked**, không cần Pack extension hoặc `.crx`. Giữ nguyên thư mục đã nạp. Chrome tối thiểu 116. ZIP đặt manifest ngay tại gốc để tránh lỗi **Manifest file is missing or unreadable**.

**Cập nhật bản cũ:** thay file trong chính thư mục đã nạp, bấm **Reload** trên thẻ tiện ích và tải lại tab form. Cách này giữ ID tiện ích và dữ liệu. Nạp từ đường dẫn khác có thể tạo ID khác; hãy xuất JSON ở bản cũ rồi nhập vào bản mới. Gỡ tiện ích sẽ xóa dữ liệu lưu của tiện ích đó.

## Dùng bộ JSON riêng

1. Mở trang trả lời `ResponsePage.aspx` trên `forms.cloud.microsoft` hoặc `forms.office.com`, bấm biểu tượng tiện ích và **Quét form** nếu chưa tự quét.
2. Chọn file hoặc dán JSON. Bộ hợp lệ được lưu vào thư viện; nhập lại bộ giống hệt sẽ dùng mục đã có.
3. Chọn bộ muốn áp dụng; lựa chọn được nhớ riêng theo ID form.
4. Kiểm tra câu khớp, đáp án và câu được chọn. Có thể sửa đáp án ngay trong bản xem trước.
5. Bấm **Điền các câu đã chọn**. Extension đọc lại từng giá trị trước khi báo thành công. Bạn kiểm tra và tự nộp bài.

Ghép bằng nội dung câu hỏi, loại câu và tập lựa chọn; không dựa vào thứ tự hoặc chữ A/B/C/D. Bộ có `sourceForm` chỉ áp dụng khi ID form khớp. Bộ dùng chung cần được chọn rõ trên form mới. Câu trùng/mơ hồ hoặc lựa chọn đã đổi được báo để duyệt.

Trường đã có câu trả lời được giữ mặc định. Muốn thay, bật ghi đè rồi chọn lại câu. **Hoàn tác** khôi phục lần điền gần nhất và giữ trường được sửa tiếp sau đó. Tải lại/đóng tab sẽ mất bản hoàn tác. Microsoft Forms có thể đã lưu bản nháp khi giá trị thay đổi.

## Tạo, sửa và quản lý

- **Tạo bộ mới:** đặt tên, chọn dùng chung hoặc liên kết ID form; thêm nội dung câu, loại câu, lựa chọn và đáp án.
- **Lưu thành bộ mới từ các câu trên form:** đưa các câu hỗ trợ đang hiển thị và đáp án xem trước vào trình soạn. Chỉ câu bật **Lưu câu** được đưa vào bộ; câu chưa có đáp án ban đầu không được bật. Luôn tạo bộ mới, không cắt bớt bộ nguồn.
- **Chỉnh bộ này:** sửa bộ riêng và lưu. Bộ tích hợp có nút **Sao chép & chỉnh** để tạo bản riêng.
- **Lưu thành bộ mới:** giữ bản soạn dưới ID mới. Nếu bộ gốc đã được sửa ở bảng bên khác, thao tác lưu báo xung đột và giữ bản soạn.
- **Xuất JSON:** sao lưu bộ đã lưu hoặc chuyển máy. Đáp án chỉ sửa ở bản xem trước chưa nằm trong file này; cần lưu thành bộ trước khi xuất.
- **Xóa:** có xác nhận trong bảng bên; chỉ xóa bộ đang chọn và các liên kết của bộ. Bộ Quy chế đi kèm vẫn được giữ.

Đáp án xem trước được giữ qua lần quét cùng tài liệu trong phiên bảng bên; cần lưu thành bộ để giữ lâu dài. Đóng bảng bên sẽ mất bản soạn chưa lưu. Đổi bộ có xác nhận nếu có đáp án xem trước chưa lưu.

Giới hạn: **50 bộ riêng**, tổng thư viện **8 MB**, file nhập **2 MB**, **1–500 câu/bộ**. Dữ liệu lưu trong `chrome.storage.local`, không đồng bộ giữa máy. Khi cập nhật cùng ID, bộ JSON đơn của phiên bản cũ tự chuyển vào thư viện sau khi lưu thành công; dữ liệu cũ lỗi vẫn được giữ.

## JSON theo mẫu

```json
{
  "schemaVersion": 1,
  "name": "Đáp án của tôi",
  "sourceForm": { "platform": "microsoft_forms", "formId": "ID_FORM" },
  "answers": [
    {
      "questionId": "q1",
      "question": "Thủ đô Việt Nam là gì?",
      "type": "single_choice",
      "options": ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"],
      "answer": ["Hà Nội"]
    }
  ]
}
```

| Loại câu | Kiểu answer | Quy tắc |
| --- | --- | --- |
| single_choice | Mảng chuỗi | Đúng một phần tử thuộc options |
| multiple_choice | Mảng chuỗi | Một hoặc nhiều phần tử thuộc options, không trùng |
| short_text | Chuỗi không trống | Không cần options |

`questionId` duy nhất trong mỗi bộ, không cần giống ID Microsoft. `sourceForm` tùy chọn; bỏ trường này để dùng chung. ID form là giá trị tham số `id` trong link trả lời, không phải toàn bộ URL. `platformQuestionId` có thể được xuất nếu đọc được để phân biệt một số câu trùng.

**Xuất mẫu JSON** lấy cấu trúc từ form hiện tại. Điền các answer rỗng và xóa bản ghi chưa có đáp án trước khi nhập lại. Hoặc chọn đáp án trong bảng bên rồi **Lưu thành bộ mới từ các câu trên form**.

## Thử nhanh

Mở bảng bên → **Thử tính năng bằng bản demo** → **Quét form** → nhập [demo-answers.json](./examples/demo-answers.json) → **Điền 3 câu** → **Hoàn tác**. Kết quả: Hà Nội; 2 và 3; văn bản “4”. Câu dropdown được báo chưa hỗ trợ.

Với form Quy chế cũ, bấm **Mở form Quy chế 2026.1**, tự đăng nhập và mở tiện ích. Bộ 200 câu tự chọn khi ID khớp; không cần nhập JSON. Họ tên/MSSV do người dùng tự điền.

Nguồn tích hợp: PDF `KIỂM TRA QUY CHẾ KỲ 2026.1.pdf` 89 trang. [Danh sách đáp án](./data/ANSWERS.md) · [Đối chiếu nguồn](./data/answer-source-audit.json) · [Thay đổi đáp án](./data/ANSWER_CHANGES.md). PDF gốc và khóa truy cập kết quả không nằm trong gói cài.

## Phạm vi và lỗi thường gặp

Hỗ trợ Choice một/nhiều đáp án và Text ngắn trên trang trả lời Microsoft Forms. Dropdown, Other có ô nhập, Text dài, Rating, Date, Ranking, Likert, File upload và Net Promoter Score chưa được hỗ trợ. Với nhiều phần, tự chuyển phần rồi quét lại; chưa cam kết phân nhánh phức tạp hoặc form nhúng.

| Tình huống | Xử lý |
| --- | --- |
| Thiếu manifest | Chọn thư mục chứa trực tiếp manifest.json sau giải nén |
| Link ResponseDetailPage.aspx | Trang kết quả chỉ đọc; cần link trả lời ResponsePage.aspx từ chủ form |
| Thiếu quyền/kết nối | Bấm biểu tượng ngay trên tab form; cập nhật xong tải lại tab |
| Không thấy câu | Đợi tải, đăng nhập, kiểm tra form còn nhận trả lời |
| JSON lỗi | Thông báo chỉ ra trường/câu sai; kiểm tra kiểu, đáp án trống và lựa chọn |
| Không khớp | Kiểm tra đúng bộ/ID form, xuất mẫu để đối chiếu nội dung, loại câu, lựa chọn |
| Nhiều bộ liên kết cùng form | Chọn bộ trong thư viện |
| Bản soạn xung đột | Lưu thành bộ mới hoặc mở lại bản mới nhất |
| Form thay đổi sau quét | Quét lại trước khi điền |

Đã kiểm thử Chrome với fixture cục bộ gồm hai hostname Microsoft và 200 câu xáo trộn. Link form cũ yêu cầu đăng nhập trong phiên thử; link mới mở được nhưng là trang kết quả với 221 ô nhập bị khóa. **Chưa xác nhận điền trên trang trả lời Microsoft thật.**

## Phát triển

JavaScript thuần, Manifest V3, không có bước build. Quyền: activeTab, scripting, storage, sidePanel. Extension không gọi AI, không tự nộp form và không gửi JSON tới máy chủ ngoài; Microsoft có thể tự lưu giá trị trên form.

| File trong extension/ | Trách nhiệm |
| --- | --- |
| core.js | Kiểm tra schema, ghép và chẩn đoán câu không khớp |
| library.js | Thư viện, chuyển dữ liệu cũ, liên kết form, phiên bản |
| background.js | Lưu tuần tự để tránh ghi đè giữa các bảng bên |
| bank-editor.js | Soạn và kiểm tra bộ đáp án |
| adapter.js, content.js | Quét, điền, xác minh, hoàn tác |
| panel.html/.css/.js | Thư viện, xem trước và điều khiển |
| bundled.js, data/ | Bộ tích hợp và nguồn |

Node.js 20+ dùng cho phát triển:

```sh
npm test
npm run test:browser
npm run test:json
npm run package
node tests/package-smoke.cjs
```

Kiểm thử trình duyệt cần Playwright cài riêng và Chrome hỗ trợ CDP Extensions.loadUnpacked/Extensions.triggerAction. Có thể đặt CHROME_PATH. Script dùng profile riêng, fixture giả; kết quả trong test-results/. Lệnh package trên Windows tạo thư mục và ZIP trong release/, manifest tại gốc.

[Báo cáo triển khai 0.3.0](./IMPLEMENTATION_REPORT.md) · [Thiết kế ban đầu](./REPORT.md) · [Đánh giá khả thi trước triển khai](./FEASIBILITY_REPORT.md) · [Lộ trình](./ROADMAP.md).

Dự án chưa chọn giấy phép phân phối mã nguồn.

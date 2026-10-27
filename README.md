

# Auto Fill Form

Extension Chrome **v0.5.0** hỗ trợ điền **Microsoft Forms và LMS HUST (Moodle)** từ JSON. LMS có thêm luồng tự quét → điền → Next page, dừng chờ khi thiếu đáp án. Không cần build, Node.js, tài khoản AI hoặc máy chủ để sử dụng.

Bộ **200 đáp án Quy chế 2026.1** vẫn tích hợp cho đúng form cũ. Có thêm nút **Nạp đáp án CNPM · 351 câu** dùng bộ đã trích từ PDF. **Nhập PDF trực tiếp chưa có**, được giữ trong [lộ trình](./ROADMAP.md).

## Cài và cập nhật

1. Giải nén `auto-fill-form-0.5.0.zip`.
2. Mở `chrome://extensions`, bật **Developer mode**.
3. Bấm **Load unpacked**, chọn thư mục chứa trực tiếp `manifest.json`, `background.js`, `panel.html`, `library.js` và `data/`.
4. Nếu dùng mã nguồn tại máy, chọn `D:\D\Auto Fill Form\extension`.
5. Ghim tiện ích. Mở trang trả lời Microsoft Forms hoặc lượt làm quiz LMS HUST, tự đăng nhập nếu cần, đợi câu hỏi hiện rồi bấm biểu tượng tiện ích.

Dùng **Load unpacked**, không cần Pack extension hoặc `.crx`. Giữ nguyên thư mục đã nạp. Chrome tối thiểu 116. ZIP đặt manifest ngay tại gốc để tránh lỗi **Manifest file is missing or unreadable**.

**Cập nhật bản cũ:** thay file trong chính thư mục đã nạp, bấm **Reload** trên thẻ tiện ích và tải lại tab form. Cách này giữ ID tiện ích và dữ liệu. Nạp từ đường dẫn khác có thể tạo ID khác; hãy xuất JSON ở bản cũ rồi nhập vào bản mới. Gỡ tiện ích sẽ xóa dữ liệu lưu của tiện ích đó.

## Dùng ngay trên LMS HUST

1. Mở quiz hoặc bấm **Mở quiz LMS HUST** trong bảng bên. Link đã cung cấp: `https://lms.hust.edu.vn/mod/quiz/view.php?id=49373`.
2. Tự đăng nhập, bấm **Bắt đầu làm bài / Tiếp tục lần làm bài** để vào trang câu hỏi `mod/quiz/attempt.php`.
3. Bấm biểu tượng extension trên tab LMS; bảng bên tự quét câu đang hiển thị.
4. Bấm **Nạp đáp án CNPM · 351 câu** hoặc nhập JSON riêng. Không cần tải JSON hay sửa mã nếu dùng bộ CNPM đi kèm.
5. Xem các câu khớp, chọn câu cần điền rồi bấm **Điền**. Có **Hoàn tác**; câu đã trả lời được giữ mặc định.
6. Muốn chạy liên tục, bấm **Bắt đầu tự chạy** trong mục **Tự chạy quiz LMS**. Muốn điền thủ công từng trang, tiếp tục dùng nút Điền như cũ.

Hỗ trợ trắc nghiệm một/nhiều đáp án, Đúng/Sai và trả lời ngắn. Không dùng nhãn a/b/c/d để ghép. Loại Đúng/Sai chuẩn Moodle được chuẩn hóa True/False theo giá trị điều khiển, dùng được khi giao diện đổi ngôn ngữ. Lựa chọn chỉ bằng hình, ghép đôi, kéo thả, Cloze, bài luận và câu số có đơn vị chưa hỗ trợ.

`view.php` là trang giới thiệu, `review.php` chỉ xem kết quả; tiện ích hướng dẫn mở lượt làm bài. LMS có thể tự lưu khi thay đổi đáp án. Tự chạy chỉ bấm Next để chuyển trang, dừng trước nút kết thúc/nộp bài. Link thật dẫn tới màn hình đăng nhập trong phiên kiểm thử; chưa xác nhận điền sau đăng nhập HUST. Xem [chi tiết triển khai và kiểm thử](./LMS_HUST.md).

## Tự chạy LMS: thiếu đáp án thì chờ

1. Chọn bộ JSON/CNPM, mở lượt làm bài và bấm **Bắt đầu tự chạy**.
2. Extension quét trang, điền và kiểm tra các câu tìm thấy đáp án. Câu đã trả lời được giữ mặc định; tùy chọn ghi đè được lấy tại lúc bắt đầu/tiếp tục.
3. Nếu còn câu thiếu/mơ hồ, dừng ở trang đó. Nhập/chọn đáp án trong bảng bên; khi các câu đã đủ đáp án, bấm **Tiếp tục**.
4. Câu thuộc loại chưa hỗ trợ cần trả lời trực tiếp trên LMS rồi đánh dấu xác nhận trong bảng bên. Với câu hỗ trợ được điền trực tiếp trên LMS, quét lại để nút Tiếp tục nhận trạng thái mới.
5. Khi cả trang đã được xử lý, extension bấm đúng Next page/icon chuyển tiếp, đợi trang mới tải rồi lặp lại. Trang cuối được điền nhưng không bấm Finish/Kết thúc/Nộp bài.

Có **Tạm dừng** và **Dừng**. Phiên gắn với tab/lượt làm bài; vẫn tiếp tục khi đóng bảng bên, và khôi phục trạng thái chờ khi mở lại. Đóng tab/Chrome kết thúc phiên. Nếu Next không chuyển sau 15 giây, phiên tạm dừng để bạn kiểm tra, không bấm lặp tự động. Thay đổi tab đích/lượt làm hoặc lỗi xác minh cũng dừng để kiểm tra.

Đáp án bổ sung chỉ dùng cho trang hiện tại trong phiên chạy; chưa tự ghi vào bộ JSON. Muốn giữ lâu dài, lưu/chỉnh bộ riêng. Bản nhập đang soạn chưa bấm Tiếp tục vẫn theo vòng đời bản xem trước của bảng bên. Hoàn tác chỉ có trên tài liệu/trang hiện tại; không hoàn tác những trang đã chuyển.

Quyền mới đã được người dùng phê duyệt: truy cập thường trực **chỉ `https://lms.hust.edu.vn/*`**, cần để đọc trang mới sau POST/redirect của Next. Microsoft Forms vẫn dùng activeTab; luồng tự chạy không áp dụng cho Forms. Khi cập nhật, nếu Chrome tắt tiện ích để chờ xác nhận quyền mới, mở chrome://extensions và xác nhận/bật lại.

## Dùng bộ JSON riêng

1. Mở trang trả lời Microsoft Forms hoặc `attempt.php` trên `lms.hust.edu.vn`, bấm biểu tượng tiện ích và **Quét form** nếu chưa tự quét.
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

Bộ gắn quiz LMS dùng `"sourceForm": {"platform":"moodle","formId":"moodle:hust:quiz:49373"}`. Xuất mẫu hoặc lưu từ bản xem trước trên LMS sẽ tự điền cấu trúc này. Nếu không đọc được ID quiz, liên kết theo `moodle:hust:attempt:123`; khi đổi lượt cần chọn lại bộ. JSON dùng chung phiên bản cũ tiếp tục nhập được.

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
| platform.js, moodle-adapter.js | Nhận diện URL, đọc/điền các câu Moodle của LMS HUST |
| panel.html/.css/.js | Thư viện, xem trước và điều khiển |
| bundled.js, data/ | Bộ tích hợp và nguồn |

Node.js 20+ dùng cho phát triển:

```sh
npm test
npm run test:browser
npm run test:json
npm run test:lms
npm run test:auto
npm run package
node tests/package-smoke.cjs
```

Kiểm thử trình duyệt cần Playwright cài riêng và Chrome hỗ trợ CDP Extensions.loadUnpacked/Extensions.triggerAction. Có thể đặt CHROME_PATH. Script dùng profile riêng, fixture giả; kết quả trong test-results/. Lệnh package trên Windows tạo thư mục và ZIP trong release/, manifest tại gốc.

[Báo cáo triển khai 0.3.0](./IMPLEMENTATION_REPORT.md) · [Thiết kế ban đầu](./REPORT.md) · [Đánh giá khả thi trước triển khai](./FEASIBILITY_REPORT.md) · [Lộ trình](./ROADMAP.md).

Dự án chưa chọn giấy phép phân phối mã nguồn.

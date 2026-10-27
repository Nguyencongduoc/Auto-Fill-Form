# Auto Fill Form 0.5.0 — Tự chạy LMS HUST

Ngày hoàn thiện: 28/10/2026. Nhánh: `feat/hust-lms-autofill`, được người dùng duyệt trước khi tạo nhánh và sửa mã.

## Dùng ngay

1. Giải nén `auto-fill-form-0.5.0.zip` và Load unpacked trong chrome://extensions, hoặc nạp thư mục `extension` của dự án.
2. Mở `https://lms.hust.edu.vn/mod/quiz/view.php?id=49373`, tự đăng nhập và vào **Bắt đầu làm bài / Tiếp tục lần làm bài**.
3. Khi các câu hỏi hiện trên trang `attempt.php`, bấm biểu tượng Auto Fill Form trên tab đó. Bản mới dùng quyền LMS HUST thường trực đã được người dùng phê duyệt để tiếp tục đọc sau Next.
4. Bấm **Nạp đáp án CNPM · 351 câu** hoặc nhập JSON riêng. Kiểm tra số câu khớp, lựa chọn và những câu đã có đáp án.
5. Bấm **Bắt đầu tự chạy**: quét → điền và xác minh → Next page → quét trang kế tiếp.
6. Câu thiếu/mơ hồ: phiên dừng ở trang đó, đưa câu cần bổ sung vào bảng bên. Nhập đủ đáp án rồi bấm **Tiếp tục**. Trang cuối được điền, bạn tự kiểm tra và nộp bài.

Có **Tạm dừng** và **Dừng**. Nếu có loại câu chưa hỗ trợ, trả lời trực tiếp trên LMS rồi bật xác nhận trong bảng bên để tiếp tục. Nếu nhập một câu hỗ trợ trực tiếp trên LMS, quét lại để bảng bên nhận giá trị đó. Câu đã trả lời được giữ mặc định; tùy chọn ghi đè chỉ được lấy khi bắt đầu/tiếp tục.

Phiên chạy gắn với tab và ID lượt làm, tiếp tục khi bảng bên đóng. Trạng thái nằm trong chrome.storage.session để khôi phục khi worker ngủ/mở lại bảng bên; đóng Chrome hoặc tab sẽ kết thúc phiên. Đáp án bổ sung không tự ghi vào JSON bền vững. Bạn có thể lưu/chỉnh bộ riêng bằng công cụ có sẵn.

Không cần build, Node.js, tài khoản AI, khóa API hoặc máy chủ. Bộ 351 câu đi kèm gói cài; không cần chọn lại file nếu dùng nút CNPM. Nút này chỉ nhập/chọn bộ trong thư viện sau khi người dùng bấm, không tự áp dụng bộ CNPM cho mọi quiz.

Để giữ dữ liệu cũ, thay các file trong cùng thư mục đã nạp, Reload tiện ích và tải lại tab LMS/Forms. Nếu nạp từ thư mục mới, Chrome có thể cấp ID khác; hãy xuất JSON từ bản cũ trước khi gỡ.

## Phạm vi đã triển khai

| Trường hợp | Hành vi |
| --- | --- |
| Trắc nghiệm một đáp án | Đọc radio, loại nhãn a/b/c/d khỏi nội dung ghép, bỏ radio ẩn “Clear my choice” |
| Trắc nghiệm nhiều đáp án | Đọc checkbox trong vùng trả lời, bỏ input hidden và cờ đánh dấu câu |
| Đúng/Sai chuẩn Moodle | Chuẩn hóa True/False theo giá trị 1/0; vẫn chọn đúng điều khiển khi nhãn hiển thị Đúng/Sai |
| Trả lời ngắn | Đọc/điền một input văn bản, phát input/change, kiểm tra giới hạn độ dài |
| Câu đã trả lời | Giữ mặc định; chỉ thay khi bật ghi đè và chọn câu |
| Câu thay đổi sau quét | Chặn hoặc bỏ qua để giữ sửa đổi mới của người dùng |
| Hoàn tác | Khôi phục lần điền gần nhất, giữ các trường đã sửa sau đó; hỗ trợ radio ẩn giá trị -1 của Moodle |
| Quiz nhiều trang | Tự bấm đúng Next của cùng lượt làm sau khi cả trang đã được xử lý; không bấm Finish/Check/nộp bài |
| Thư viện | Dùng chung bộ JSON cũ; lưu được bộ gắn riêng quiz/lượt làm |
| Trang giới thiệu/kết quả | Thông báo mở attempt.php; không chèn bộ điền vào view.php/review.php |

Đọc DOM Moodle 3.x dùng label/for và Moodle 4.x dùng aria-labelledby/data-region. Quyền mới `https://lms.hust.edu.vn/*` cho phép đọc/sửa nội dung trên LMS HUST, đã được người dùng phê duyệt riêng sau khi thử nghiệm activeTab không đủ qua Next/redirect. Không thêm tên miền khác; Microsoft Forms giữ activeTab. Không đổi đăng nhập hoặc yêu cầu mật khẩu. Nếu Chrome tắt extension sau cập nhật quyền, xác nhận/bật lại trong chrome://extensions.

## Quy tắc chuyển trang

- Chỉ chạy khi người dùng bấm Bắt đầu/Tiếp tục, trên attempt.php có ID lượt làm hợp lệ; không tự bắt đầu/nộp bài.
- Điền và đọc lại giá trị trước Next. Thiếu/mơ hồ, lỗi xác minh hoặc sửa sau quét sẽ dừng chờ kiểm tra.
- Nút Next chuẩn Moodle được kiểm tra form đích, hidden thispage/nextpage và trang tăng đúng một bước. Icon/link chỉ được đi tới attempt.php của cùng lượt và trang kế tiếp.
- Moodle dùng cùng tên nút next cho nút kết thúc ở trang cuối. nextpage=-1 hoặc nhãn Finish/Kết thúc/Nộp bài được nhận diện để dừng, không click.
- Lưu trạng thái trước khi click; đợi trang mới tải, không phát lại Next trên cùng trang. Sau 15 giây không chuyển/tải xong thì tạm dừng, chờ người dùng kiểm tra và Tiếp tục.
- Khi tạm dừng trong lúc Next đã gửi, trang đó vẫn có thể tải xong; không điền/chuyển thêm trang cho đến khi người dùng tiếp tục. Đổi lượt/quiz hoặc quay lại trang đã xử lý sẽ dừng để tránh lặp.
- Hoàn tác chỉ áp dụng trên tài liệu/trang hiện tại, không kéo lại các trang đã chuyển. Mỗi lệnh điền được giới hạn tối đa 20 câu để phản hồi Dừng nhanh hơn.

Chưa hỗ trợ lựa chọn chỉ có hình hoặc nhãn trùng, ghép đôi, kéo thả, Cloze, bài luận/rich text, câu số kèm đơn vị, iframe hoặc trang không theo cấu trúc Moodle đã nhận diện. Câu có hình với lựa chọn chữ cần người dùng tự đối chiếu đúng hình trước khi điền.

## Nhận diện quiz và JSON

Ưu tiên ID cmid trong URL/field hoặc link quiz trong breadcrumb để tạo khóa `moodle:hust:quiz:49373`. Khóa này dùng lại giữa các trang và lượt làm của cùng quiz. Nếu không đọc được quiz ID, dùng `moodle:hust:attempt:123`, chỉ ổn định trong lượt đó.

Ví dụ liên kết:

```json
"sourceForm": {
  "platform": "moodle",
  "formId": "moodle:hust:quiz:49373"
}
```

Xuất mẫu hoặc lưu bản xem trước trên LMS tự tạo đúng platform và formId. ID có namespace để tránh nhầm với Microsoft Forms. Bộ JSON không có sourceForm dùng chung; phải chọn rõ trên quiz mới. Bộ gắn quiz khác bị vô hiệu hóa trong danh sách.

Bộ CNPM đi kèm giữ nguyên 351 câu đã xuất: 321 câu một đáp án, 30 câu nhiều đáp án. Đã gộp 83 lượt lặp từ 450 lượt câu trong PDF; 16 lượt hình/thiếu đáp án/loại câu không rõ không có trong file chạy. Không bổ sung đáp án suy đoán cho các trường hợp đó.

## Kiểm thử và giới hạn xác nhận

- 41 unit test: schema cũ/mới, liên kết, thư viện, bộ 200 câu, URL/platform/ID quiz và kế hoạch tự chạy.
- 10 bước trình duyệt Moodle: quyền activeTab, nhãn mới/cũ, radio/checkbox/Đúng-Sai/trả lời ngắn, phát sự kiện, hoàn tác, ghi đè, sửa sau quét, thay cấu trúc, trang kế tiếp, lưu bộ gắn quiz, trang chỉ đọc và nút CNPM.
- Bộ CNPM được thử với 14 câu hỗn hợp, gồm câu một/nhiều đáp án và Đúng/Sai, lựa chọn đảo thứ tự; toàn bộ giá trị được đọc lại và đối chiếu đáp án.
- Hồi quy Microsoft Forms và thư viện JSON dùng các script hiện có. Kết quả cụ thể nằm trong `test-results/`.
- Test tự chạy dùng biểu mẫu Next gửi POST thật tới máy chủ fixture cục bộ, sau đó chuyển hướng sang trang mới. Kiểm tra đóng bảng bên khi chạy, khôi phục lúc chờ, nhập đáp án rồi tiếp tục, Dừng/Tạm dừng, xác nhận câu chưa hỗ trợ, timeout, icon Next và chặn Microsoft Forms. Không gọi máy chủ HUST thật.
- Kiểm thử ZIP giải nén chính gói phát hành, đối chiếu từng file chạy với mã nguồn, nạp Chrome và kiểm tra nạp bộ CNPM 351 câu.

Các bài test dùng profile Chrome riêng và dữ liệu giả trả tại hostname HUST; không thay đổi hoặc nộp bài trên máy chủ LMS thật. Test thủ công cũ không bấm Next; test tự chạy có Next/POST lưu trang và không có click Finish hoặc POST nextpage=-1. Ảnh QA: `test-results/auto-waiting.png`. Kết quả tự chạy: `test-results/lms-auto-summary.json`.

Link quiz thật đã được mở trong trình duyệt kiểm thử và dẫn tới màn hình **Log in to the site | LMS HUST**; không có câu hỏi ở phiên đó. Vì vậy chưa xác nhận điền trên HUST sau đăng nhập. Bản cài chạy trực tiếp trên Chrome, nhưng tương thích giao diện tài khoản thực tế vẫn cần kiểm tra khi người dùng mở lượt làm bài.

LMS có thể tự lưu giá trị sau input/change. Xác minh của tiện ích là đọc lại DOM, không phải xác nhận máy chủ đã lưu hoặc chấm đúng. Hoàn tác mất khi tải lại/đóng tab và không bảo đảm thu hồi bản nháp máy chủ đã nhận. Đồng hồ quiz thuộc LMS, không được tiện ích điều khiển.

## Thay đổi mã

`platform.js` nhận diện URL; `moodle-adapter.js` đọc/điền quiz. `lms-flow.js` lập kế hoạch và chặn câu thiếu; `lms-navigation.js` kiểm tra Next/trang cuối; `lms-runner.js` chạy trong service worker và lưu trạng thái theo tab; `auto-panel.js` điều khiển Bắt đầu/Tiếp tục/Tạm dừng/Dừng. `content.js` kiểm tra snapshot và hủy các hành động còn lại khi dừng. Không thêm phụ thuộc chạy.

Chạy kiểm thử: `npm test`, `npm run test:lms`, `npm run test:auto`, `npm run test:browser`, `npm run test:json`. Đóng gói: `npm run package`; kiểm tra gói: `node tests/package-smoke.cjs`.

## Nguồn kỹ thuật

Đối chiếu cấu trúc với renderer chính thức Moodle: [Multichoice](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/multichoice/renderer.php), [True/False](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/truefalse/renderer.php), [Short answer](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/shortanswer/renderer.php). Đây là cơ sở tạo fixture, không phải xác nhận phiên bản Moodle đang chạy trên tài khoản HUST của người dùng.

Đối chiếu hidden thispage/nextpage và nút Next/Finish trong [renderer quiz chính thức](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/mod/quiz/classes/output/renderer.php).

# Auto Fill Form

Tiện ích Chrome **v0.5.0** hỗ trợ điền **Microsoft Forms** và **quiz LMS HUST** từ JSON. Có thư viện nhiều bộ, trình soạn, nhập/xuất và liên kết theo form/quiz. Không cần build, máy chủ hay tài khoản AI để sử dụng.

Trên LMS, chế độ **Tự chạy quiz LMS** thực hiện **quét → điền → kiểm tra → Next page**. Thiếu hoặc mơ hồ đáp án thì dừng chờ bạn bổ sung, rồi tiếp tục. Tiện ích giữ bước kết thúc/nộp bài cho bạn tự thực hiện.

| Nền tảng | Trang hỗ trợ | Cách điền |
| --- | --- | --- |
| Microsoft Forms | ResponsePage.aspx trên forms.cloud.microsoft, forms.office.com | Xem trước, chọn câu và bấm Điền |
| LMS HUST | mod/quiz/attempt.php trên lms.hust.edu.vn | Điền từng trang hoặc bật tự chạy |

**Kiểm chứng v0.5.0:** 41 unit test, 45 bước kiểm thử trình duyệt và kiểm tra ZIP đạt trên Chrome 155 với fixture cục bộ. **Chưa xác nhận điền trên Microsoft Forms/HUST thật sau đăng nhập.** Xem [cách tái hiện](./docs/DEVELOPMENT.md).

## Cài trên Chrome

Yêu cầu sử dụng: **Chrome 116+**. Kiểm thử trình duyệt có yêu cầu riêng.

1. Tải mã nguồn bằng **Code → Download ZIP** trên GitHub rồi giải nén, hoặc clone repository và chọn phiên bản muốn dùng.
2. Mở `chrome://extensions`, bật **Developer mode / Chế độ dành cho nhà phát triển**.
3. Chọn **Load unpacked / Tải tiện ích đã giải nén**.
4. Chọn thư mục **extension** bên trong mã nguồn. Thư mục được chọn phải chứa trực tiếp `manifest.json`.
5. Ghim Auto Fill Form; mở tab câu hỏi rồi bấm biểu tượng tiện ích.

Nếu dùng **auto-fill-form-0.5.0.zip** do script đóng gói tạo ra, chọn **chính thư mục vừa giải nén** vì manifest đã ở gốc. `release/` là đầu ra tại máy, không theo dõi trong Git; ZIP mã nguồn tải từ GitHub không tự tạo gói cài này.

Không cần Pack extension hoặc CRX. Giữ nguyên thư mục đã nạp để Chrome tiếp tục đọc các file. Hướng dẫn ngắn: [INSTALL.txt](./INSTALL.txt).

### Cập nhật và giữ dữ liệu

Xuất JSON riêng để sao lưu, dừng phiên tự chạy, cập nhật file trong **cùng thư mục đã nạp**, bấm **Reload** trên thẻ tiện ích và tải lại tab câu hỏi.

Nạp từ đường dẫn khác có thể tạo ID khác; cần nhập lại JSON đã xuất. Gỡ tiện ích sẽ xóa dữ liệu lưu của tiện ích đó. Nếu Chrome tắt tiện ích sau cập nhật quyền LMS, xác nhận/bật lại trong `chrome://extensions`.

## LMS HUST: tự chạy và chờ đáp án

1. Đăng nhập LMS, mở quiz và chọn **Bắt đầu làm bài / Tiếp tục lần làm bài** để vào `attempt.php` có câu hỏi.
2. Bấm biểu tượng extension, chọn bộ JSON hoặc **Nạp đáp án CNPM · 351 câu**.
3. Kiểm tra bộ và tùy chọn ghi đè, rồi bấm **Bắt đầu tự chạy**.
4. Câu thiếu/mơ hồ: nhập hoặc chọn đáp án trong bảng bên, bổ sung đủ rồi bấm **Tiếp tục**.
5. Có **Tạm dừng/Dừng**. Trang cuối được điền nhưng không bấm Finish/Kết thúc/Nộp bài.

Câu chưa hỗ trợ cần trả lời trực tiếp trên LMS và bật xác nhận trong bảng bên. Nếu bạn điền một câu hỗ trợ trực tiếp trên LMS, quét lại để bảng bên nhận giá trị mới. Đáp án bổ sung không tự ghi vào JSON; lưu/chỉnh bộ riêng nếu muốn dùng lâu dài.

Phiên gắn với **tab và lượt làm bài**. Đóng bảng bên hoặc chuyển sang tab khác không dừng phiên ở tab ban đầu. Điều hướng chính tab đang chạy sang lượt/quiz khác sẽ làm phiên tạm dừng. Đóng tab/Chrome kết thúc phiên. Next chưa chuyển/tải xong sau 15 giây sẽ tạm dừng, không tự bấm lặp.

Vẫn có thể điền thủ công từng trang bằng **Điền các câu đã chọn**. Chi tiết: [LMS_HUST.md](./LMS_HUST.md).

## Microsoft Forms

Mở link trả lời ResponsePage.aspx → bấm biểu tượng extension → chọn/nhập JSON → kiểm tra câu khớp → **Điền các câu đã chọn**. Tiện ích đọc lại giá trị trước khi báo kết quả; bạn tự kiểm tra và nộp bài.

Tự chuyển phần và quét lại nếu form có nhiều phần. Workflow tự Next chỉ áp dụng LMS. ResponseDetailPage.aspx là trang kết quả chỉ đọc.

## Bộ đáp án và thư viện

| Bộ đi kèm | Số câu | Cách dùng |
| --- | --- | --- |
| Quy chế 2026.1 | 200 | Tự chọn trên đúng ID form đã cấu hình |
| Công nghệ phần mềm, quiz LMS kỳ 20242 VN | 351 | Bấm Nạp đáp án CNPM, rồi chọn trên quiz muốn áp dụng |

CNPM gồm 321 câu một đáp án và 30 câu nhiều đáp án. Dữ liệu đã gộp câu lặp; các lượt chỉ có đáp án bằng hình, thiếu phản hồi đúng hoặc không rõ loại chọn một/nhiều không nằm trong file chạy. Hãy kiểm tra kết quả ghép vì quiz hiện tại có thể khác tài liệu.

- **Tạo bộ mới / Chỉnh bộ này:** soạn nội dung, loại câu, lựa chọn và đáp án; bộ tích hợp Quy chế được sao chép khi chỉnh.
- **Lưu thành bộ mới từ các câu trên form:** tạo bộ mới từ các câu hỗ trợ đang hiển thị, chỉ lưu câu được bật; không cắt bớt bộ nguồn.
- **Xuất bộ JSON:** sao lưu bộ đã lưu. Đáp án chỉ sửa ở bản xem trước chưa nằm trong file xuất cho đến khi lưu thành bộ.
- **Xóa bộ này:** xác nhận rồi xóa bộ riêng và liên kết của nó; file đã xuất và bộ tích hợp được giữ.

Giới hạn: **50 bộ riêng, tổng thư viện 8 MB; file nhập 2 MB; 1–500 câu/bộ**. Mỗi form/quiz nhớ lựa chọn riêng. Bộ gắn form/quiz khác bị chặn; bộ dùng chung phải chọn rõ trên form mới. Dữ liệu đơn của phiên bản cũ được chuyển sang thư viện khi cập nhật cùng ID tiện ích.

Mẫu demo: [demo-answers.json](./examples/demo-answers.json). Định dạng và ví dụ ba loại câu: [JSON_FORMAT.md](./docs/JSON_FORMAT.md).

## Giữ đáp án cũ và hoàn tác

Câu đã có trả lời được giữ mặc định. Muốn thay, bật **Cho phép ghi đè câu đã có đáp án** và chọn lại câu; tự chạy lấy tùy chọn này lúc bắt đầu/tiếp tục. Ghép theo nội dung, loại câu và tập lựa chọn, không dùng thứ tự hoặc A/B/C/D làm đáp án.

**Hoàn tác** chỉ giữ lần điền gần nhất trên tài liệu/trang hiện tại, bảo toàn sửa đổi người dùng thực hiện sau đó. Tải lại/đóng tab làm mất bản này; không hoàn tác các trang đã chuyển. Website có thể đã tự lưu thay đổi ở máy chủ.

Hỗ trợ Choice một/nhiều đáp án và Text ngắn trên Forms; multichoice, truefalse và shortanswer trên LMS. Chưa hỗ trợ lựa chọn chỉ bằng hình/nhãn trùng, dropdown, kéo thả, ghép đôi, Cloze, bài luận, tải file và các loại câu nâng cao khác. Câu có hình với lựa chọn chữ cần tự đối chiếu hình. **Chưa nhập PDF trực tiếp hoặc dùng AI tự giải.**

## Quyền và dữ liệu

| Quyền/nơi lưu | Mục đích |
| --- | --- |
| activeTab, scripting | Đọc/điền tab được chọn; Forms dùng quyền tạm thời khi bấm biểu tượng |
| storage, sidePanel | Lưu thư viện, hiển thị bảng điều khiển |
| https://lms.hust.edu.vn/* | Quyền thường trực trên LMS để tiếp tục sau Next/redirect |
| chrome.storage.local | Bộ JSON và lựa chọn theo form/quiz; không đồng bộ giữa máy |
| chrome.storage.session | Trạng thái tự chạy trong phiên Chrome, câu chờ và đáp án đã gửi Tiếp tục |

Không gọi API AI hoặc gửi JSON tới dịch vụ trung gian. Điền có thể kích hoạt tự lưu; Next của LMS gửi biểu mẫu trang tới LMS như thao tác thông thường. Xác minh DOM không đồng nghĩa máy chủ đã lưu hoặc chấm đúng.

## Xử lý lỗi nhanh

| Hiện tượng | Cách xử lý |
| --- | --- |
| Thiếu manifest | Chọn thư mục chứa trực tiếp manifest.json, không chọn thư mục bọc |
| Không đọc được trang | Đăng nhập, đợi câu hỏi hiện, tải lại tab sau cập nhật; với Forms, bấm biểu tượng trên đúng tab |
| LMS ở view.php/review.php | Vào lượt làm bài attempt.php |
| Không khớp câu | Kiểm tra bộ, liên kết, loại câu và lựa chọn; xuất mẫu từ trang để đối chiếu |
| JSON lỗi | Sửa câu/trường được báo; answer không trống và thuộc options |
| Tiếp tục bị khóa | Bổ sung đủ câu thiếu; xác nhận các câu chưa hỗ trợ sau khi xử lý trên LMS |
| Next chờ quá 15 giây | Kiểm tra trang/kết nối rồi Tiếp tục |
| Bộ bị sửa ở bảng bên khác | Mở bản mới nhất hoặc lưu bản soạn thành bộ mới; tự chạy chờ xác nhận lại |

## Tài liệu và phát triển

- [LMS và tự chạy](./LMS_HUST.md)
- [Định dạng JSON](./docs/JSON_FORMAT.md)
- [Phát triển, kiểm thử và đóng gói](./docs/DEVELOPMENT.md)
- [Kiến trúc](./REPORT.md)
- [Lịch sử phiên bản](./CHANGELOG.md) · [Lộ trình](./ROADMAP.md)
- [Nguồn Quy chế](./data/ANSWERS.md) · [Đối chiếu](./data/answer-source-audit.json)

JavaScript thuần, Manifest V3; mã chạy trực tiếp từ extension/. Node.js chỉ cần cho kiểm thử/đóng gói. Bắt đầu với `npm test`; xem tài liệu phát triển để thiết lập Playwright và Chrome.

Dự án chưa có file LICENSE công bố điều khoản phân phối mã nguồn.

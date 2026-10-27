# Kiến trúc Auto Fill Form v0.5.0

Tài liệu mô tả mã nguồn hiện tại; cách dùng xem [README](./README.md), lịch sử xem [CHANGELOG](./CHANGELOG.md).

## Phạm vi

Đọc câu trên Microsoft Forms hoặc lượt quiz LMS HUST, ghép JSON, điền và đọc lại giá trị. LMS có tự Next và chờ bổ sung; người dùng tự nộp bài. Mã JavaScript thuần, Manifest V3, không cần build. Chưa có API AI hoặc bộ nhập PDF tổng quát trong tiện ích.

## Thành phần

| File trong extension/ | Trách nhiệm |
| --- | --- |
| core.js | Schema, chuẩn hóa/ghép, xuất cấu trúc mẫu |
| library.js | Nhiều bộ, chuyển dữ liệu cũ, giới hạn, liên kết và phiên bản |
| background.js | Ghi thư viện tuần tự và mở bảng bên |
| platform.js | Nhận diện hostname/loại trang |
| adapter.js | Đọc/điền Microsoft Forms và demo |
| moodle-adapter.js | Đọc/điền multichoice, truefalse, shortanswer |
| content.js | Snapshot, khóa tác vụ, xác minh, hủy và hoàn tác |
| lms-flow.js | Kế hoạch hành động và câu chặn của một trang |
| lms-navigation.js | Next, trang cuối và kiểm tra đích |
| lms-runner.js | Phiên theo tab trong worker, điều hướng, pause/resume/stop |
| panel.*, auto-panel.js | Thư viện, bản xem trước, điều khiển chạy |
| bank-editor.js | Bản soạn, kiểm tra, lưu/sao chép |
| bundled.js, data/ | Liên kết form Quy chế và đáp án đi kèm |

## Quét, ghép và điền

1. Kiểm tra URL trước khi chèn script: Forms chỉ ResponsePage, LMS chỉ attempt.php. Trang giới thiệu/kết quả có hướng dẫn mở đúng trang.
2. Adapter đọc câu hiện trên trang, loại, lựa chọn, ID và giá trị. Loại chưa hỗ trợ được báo riêng.
3. Core ghép nội dung, loại và tập lựa chọn. Không dùng A/B/C/D hoặc số thứ tự làm đáp án. Câu trùng cần ID đủ rõ hoặc người dùng duyệt. document_ocr có đối chiếu tài liệu với ràng buộc số, toán tử và từ phủ định.
4. Mỗi lần điền gắn với tab, documentToken, scanToken, fingerprint và chữ ký câu. Cấu trúc đổi hoặc sửa sau quét sẽ chặn/bỏ qua hành động tương ứng.
5. Adapter đọc lại giá trị sau thao tác DOM. Hoàn tác giữ trước/sau của lần điền gần nhất và không ghi đè sửa đổi mới.

## Thư viện

Schema file nhập là phiên bản 1. Thư viện nội bộ bổ sung UUID, version, updatedAt, selections, revision. Worker tuần tự hóa ghi và từ chối sửa/xóa bằng version cũ; giao diện giữ bản soạn khi xung đột.

chrome.storage.local lưu thư viện/lựa chọn; chrome.storage.session lưu phiên tự chạy; content script giữ snapshot và hoàn tác của tài liệu. Khóa answerBank cũ chỉ xóa sau khi thư viện mới lưu thành công. Schema/giới hạn: [JSON_FORMAT.md](./docs/JSON_FORMAT.md).

## Tự chạy LMS

Worker quét, lấy bộ đã chọn, lập kế hoạch và điền từng nhóm tối đa 20 câu để dễ dừng. Còn câu chặn thì lưu trạng thái waiting và snapshot để bảng bên bổ sung. Đủ cả trang thì kiểm tra mới nhất, lưu navigating trước click Next và đợi đích tải.

Chuyển trạng thái được tuần tự hóa, có revision để tránh phản hồi cũ đè mới. Phiên gắn tab/attempt, không phụ thuộc bảng bên còn mở. Tạm dừng/Dừng hủy hành động còn lại; Next đã gửi vẫn có thể hoàn tất. Trạng thái lưu cho phép tiếp tục khi worker được đánh thức.

Next phải tăng đúng một bước trong cùng lượt; trang cuối không click. Thiếu/mơ hồ, lỗi xác minh, bộ JSON đổi, quay lại trang cũ, rời lượt hoặc quá 15 giây đợi điều hướng sẽ chuyển sang chờ/tạm dừng. Bắt đầu/Tiếp tục là thao tác chủ động từ giao diện.

## Kiểm chứng và nguồn đối chiếu

Mốc v0.5.0 đạt 41 unit test và 45 bước trình duyệt bằng profile riêng/fixture trên Chrome 155. ZIP được giải nén, đối chiếu file chạy và nạp thử. [DEVELOPMENT.md](./docs/DEVELOPMENT.md) mô tả lệnh và giới hạn bằng chứng.

Chưa xác nhận điền sau đăng nhập trên Forms/HUST thật. Fixture không đại diện mọi theme/phiên bản/loại câu. DOM nhận giá trị không chứng minh máy chủ lưu/chấm đúng; tự lưu và đồng hồ thuộc website đích.

Đối chiếu renderer chính thức Moodle: [Multichoice](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/multichoice/renderer.php), [True/False](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/truefalse/renderer.php), [Short answer](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/question/type/shortanswer/renderer.php), [Quiz navigation](https://github.com/moodle/moodle/blob/MOODLE_405_STABLE/mod/quiz/classes/output/renderer.php).

[Đánh giá khả thi](./FEASIBILITY_REPORT.md) và [mốc JSON 0.3.0](./IMPLEMENTATION_REPORT.md) là tài liệu lịch sử. Hướng mở rộng nằm trong [ROADMAP](./ROADMAP.md).

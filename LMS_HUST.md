# Hướng dẫn LMS HUST — v0.5.0

Tự chạy chỉ áp dụng cho **https://lms.hust.edu.vn/mod/quiz/attempt.php** có ID lượt làm hợp lệ. Microsoft Forms dùng luồng điền thủ công.

## Bắt đầu

1. Đăng nhập bằng trình duyệt của bạn, mở quiz và chọn Bắt đầu làm bài/Tiếp tục lần làm bài.
2. Đợi câu hỏi hiện trong attempt.php, bấm biểu tượng Auto Fill Form.
3. Chọn bộ JSON hoặc **Nạp đáp án CNPM · 351 câu**. Nút Mở quiz LMS HUST mở quiz mẫu đã cấu hình; bạn có thể mở quiz khác bằng link của mình.
4. Kiểm tra bộ và ghi đè, bấm **Bắt đầu tự chạy**.

Mỗi trang được quét, điền và đọc lại giá trị. Khi cả trang đã được xử lý, tiện ích bấm Next rồi đợi trang mới. Trang cuối được điền nhưng không bấm kết thúc/nộp bài. Vẫn có thể dùng Quét form, Điền các câu đã chọn và Hoàn tác để điền thủ công từng trang.

## Khi thiếu đáp án

Tiện ích điền câu đã biết rồi dừng ở câu thiếu/mơ hồ. Nhập/chọn đáp án trong bảng bên; **Tiếp tục** chỉ bật khi các câu chờ đã có đáp án hợp lệ.

- Một/nhiều đáp án: chọn nội dung lựa chọn, không nhập A/B/C/D thay thế.
- Trả lời ngắn: nhập chuỗi không trống.
- Câu hỗ trợ được điền trực tiếp trên LMS: Quét form lại để bảng bên nhận giá trị mới.
- Loại chưa hỗ trợ: xử lý trên LMS, bật **Tôi đã xử lý các câu chưa hỗ trợ trực tiếp trên LMS**, rồi Tiếp tục. Tiện ích không xác minh được đáp án của loại này.

Đáp án đã bấm Tiếp tục chỉ dùng cho trang hiện tại trong phiên, không tự thêm vào JSON. Lưu/chỉnh bộ riêng nếu muốn dùng lại. Bản đang nhập chưa bấm Tiếp tục có thể mất khi đóng bảng bên.

## Điều khiển và trạng thái

| Trạng thái | Ý nghĩa / thao tác |
| --- | --- |
| Chưa chạy | Chọn bộ, Bắt đầu tự chạy |
| Đang chạy | Quét/điền/xác minh; có Tạm dừng và Dừng |
| Đang chuyển trang | Next đã được chuẩn bị/gửi, đang chờ trang đích |
| Chờ bổ sung | Nhập đủ đáp án/xử lý câu chưa hỗ trợ, rồi Tiếp tục |
| Tạm dừng | Kiểm tra lỗi/trang/đáp án, Tiếp tục hoặc Dừng |
| Đã dừng | Phiên kết thúc; có thể bắt đầu mới từ trang hiện tại |
| Trang cuối | Hoàn tất phần điền; bạn tự kết thúc/nộp bài |

Phiên gắn với tab và ID lượt làm. Đóng bảng bên/chuyển tab khác không dừng phiên ở tab ban đầu. Mở lại bảng bên trên tab đó để xem tiến độ. Đóng tab/Chrome kết thúc phiên; thư viện JSON vẫn lưu.

Tạm dừng/Dừng sau khi Next đã gửi không hủy được lần tải đang diễn ra, nhưng ngăn các hành động tiếp theo. Hoàn tác chỉ có trên tài liệu/trang hiện tại, không khôi phục trang đã chuyển.

## Giữ đáp án cũ và chuyển trang

Câu đã trả lời hợp lệ được giữ mặc định. Muốn thay bằng JSON, bật ghi đè trước khi bắt đầu/tiếp tục. Sửa đáp án trong bản xem trước là lựa chọn bổ sung có chủ ý cho trang đó.

Trước Next, tiện ích kiểm tra lại câu và giá trị. Nút chuẩn Moodle được kiểm tra form đích, thispage/nextpage và trang tăng đúng một bước. Icon/link phải tới trang kế tiếp của cùng lượt. nextpage=-1 hoặc nhãn Finish/Kết thúc/Nộp bài được nhận diện để dừng.

Không chuyển/tải xong sau **15 giây**: tạm dừng, không bấm lặp. Đổi lượt/quiz trên chính tab chạy, quay lại trang đã xử lý, lỗi xác minh hoặc bộ JSON thay đổi cũng yêu cầu kiểm tra trước khi tiếp tục.

## Loại câu và liên kết JSON

Hỗ trợ multichoice một/nhiều đáp án, truefalse và shortanswer. Loại truefalse chuẩn được chuẩn hóa thành True/False theo giá trị điều khiển, kể cả khi trang hiển thị Đúng/Sai. Nhãn a/b/c/d được loại khỏi khóa ghép.

Chưa hỗ trợ lựa chọn chỉ bằng hình/nhãn trùng, ghép đôi, kéo thả, Cloze, bài luận/rich text, câu số có đơn vị và form nhúng. Câu có hình với lựa chọn chữ cần tự đối chiếu hình.

Bộ dùng chung bỏ sourceForm và được chọn rõ trên quiz mới. Bộ gắn quiz dùng sourceForm như sau:

```json
{
  "platform": "moodle",
  "formId": "moodle:hust:quiz:49373"
}
```

Đây là giá trị của trường sourceForm, không phải toàn bộ file nhập. Tiện ích ưu tiên cmid/breadcrumb của quiz; nếu không thấy, dùng moodle:hust:attempt:123, chỉ ổn định trong lượt đó. Xuất mẫu/lưu bản xem trước tự tạo liên kết. Xem [JSON_FORMAT.md](./docs/JSON_FORMAT.md).

## Quyền, dữ liệu và giới hạn kiểm chứng

Quyền thường trực **https://lms.hust.edu.vn/** cho phép đọc/sửa nội dung trên LMS để tiếp tục sau Next/redirect; không mở rộng sang tên miền khác. Phạm vi khai báo trong manifest là `https://lms.hust.edu.vn/*`. Forms giữ activeTab. Nếu Chrome tắt tiện ích sau cập nhật quyền, xác nhận/bật lại trong chrome://extensions.

Trạng thái chạy nằm trong chrome.storage.session để khôi phục khi worker được đánh thức. Bộ JSON nằm trong chrome.storage.local. Không gọi AI/trung gian. LMS có thể tự lưu sau input/change; Next gửi biểu mẫu trang. Xác minh DOM không xác nhận máy chủ lưu/chấm đúng. Đồng hồ quiz do LMS điều khiển.

Đã có 10 bước kiểm thử điền Moodle và 8 bước tự chạy bằng fixture; không có click Finish trong kiểm thử. Link HUST thật chỉ dẫn tới màn hình đăng nhập trong phiên thử, nên **chưa xác nhận điền sau đăng nhập**. Cách chạy và bằng chứng: [DEVELOPMENT.md](./docs/DEVELOPMENT.md).

[README](./README.md) · [Kiến trúc](./REPORT.md) · [Lịch sử](./CHANGELOG.md)

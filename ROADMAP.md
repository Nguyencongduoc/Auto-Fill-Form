# Lộ trình

Phạm vi hiện tại: **v0.5.0**. Các mục tương lai chưa có thời hạn cam kết.

## Đã có

- Forms: quét, ghép JSON, xem trước, điền/xác minh và hoàn tác.
- Thư viện nhiều bộ, nhập/dán/xuất JSON, trình soạn, sao chép/xóa, liên kết theo form/quiz.
- Chuyển dữ liệu cũ, ghi tuần tự và phát hiện bản soạn xung đột.
- LMS HUST: multichoice một/nhiều đáp án, truefalse, shortanswer; giữ bộ theo quiz/lượt.
- Tự chạy riêng LMS: quét/điền/Next, chờ bổ sung, tiếp tục/tạm dừng/dừng, dừng trước nộp bài.
- Bộ 200 đáp án Quy chế và nút nạp 351 đáp án CNPM.
- Unit/browser fixture và kiểm tra ZIP nạp trực tiếp vào Chrome.

## Ưu tiên kiểm chứng tiếp

1. Xác nhận luồng sau đăng nhập trên form/quiz thật được phép thử.
2. Kiểm tra thêm theme Moodle, ngôn ngữ, icon Next, tự lưu và mạng chậm.
3. Mở rộng fixture khi câu đổi cấu trúc hoặc có phân nhánh; công bố tổ hợp giao diện đã xác nhận.

## PDF đáp án — để ngỏ

Chưa nhập PDF trực tiếp trong extension. Script PDF của dự án phục vụ bố cục đã kiểm tra, không phải bộ nhập mọi tài liệu.

Luồng dự kiến: chọn PDF → lớp chữ/OCR → nhận diện câu/lựa chọn/dấu đáp án → người dùng duyệt/sửa → ghép với form/quiz → lưu thư viện JSON.

Cần giải quyết bố cục đa dạng, ảnh mờ, dấu chọn, câu nhiều đáp án và tài liệu chỉ ghi “Câu 1: A”. Số, dấu so sánh, từ phủ định cần đối chiếu; câu mơ hồ phải đưa ra duyệt. Bắt đầu với một số bố cục công bố hỗ trợ, không cam kết mọi PDF/website.

## Các hướng khác

- Thêm loại câu theo từng adapter có fixture và khả năng xác minh rõ.
- Nhập CSV, sao lưu thư viện thuận tiện hơn, adapter nền tảng khác.
- AI đề xuất tùy chọn có bước duyệt và thông tin dữ liệu gửi đi; chưa có trong bản hiện tại.

[README](./README.md) · [Lịch sử](./CHANGELOG.md) · [Kiến trúc](./REPORT.md)

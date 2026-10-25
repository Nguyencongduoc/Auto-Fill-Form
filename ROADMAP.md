# Lộ trình phát triển

## Hiện có trong v0.2.2

- Điền Microsoft Forms từ bộ 200 đáp án Quy chế 2026.1 đã tích hợp.
- Nạp/xuất JSON theo mẫu, nhập đáp án trực tiếp, xem trước và hoàn tác.
- Ghép bằng nội dung câu hỏi/lựa chọn; không phụ thuộc số thứ tự.

## Để ngỏ: nhập PDF đáp án cho form khác

**Trạng thái: ý tưởng cho tương lai, chưa triển khai trong extension.** Người dùng đã yêu cầu giữ mở hướng phát triển này, không xây trong đợt cập nhật đáp án hiện tại.

Luồng sản phẩm dự kiến:

1. Chọn PDF có đáp án và chọn form Microsoft Forms đang mở.
2. Đọc lớp chữ; dùng OCR nếu PDF chỉ chứa ảnh.
3. Nhận dạng câu hỏi, lựa chọn và cách đánh dấu đáp án: tick, radio đã chọn, tô màu hoặc bảng đáp án.
4. Hiển thị kết quả trích xuất để người dùng sửa, xác nhận và xử lý các câu mơ hồ.
5. Ghép với câu hỏi/lựa chọn trên form, lưu thành bộ đáp án riêng rồi dùng luồng điền hiện tại.

Các điểm cần giải quyết khi triển khai:

- PDF có nhiều bố cục, dấu chọn và chất lượng ảnh khác nhau; không thể giả định một bộ phân tích dùng đúng cho mọi tài liệu.
- PDF chỉ có “Câu 1: A” mà thiếu nội dung câu hỏi/lựa chọn cần thêm bước ánh xạ thủ công; thứ tự có thể khác form.
- Kiểm tra các số, dấu so sánh, từ phủ định và đáp án nhiều lựa chọn trước khi cho điền.
- Cho người dùng quản lý nhiều bộ đáp án, xác định form áp dụng và đổi/xóa nguồn.
- Công bố định dạng và bố cục đã kiểm chứng. Cần adapter riêng để mở rộng sang Google Forms hoặc nền tảng khác.

Điều kiện hoàn thành tính năng tương lai: người dùng tự nhập PDF, duyệt và lưu bộ đáp án trong giao diện; không cần sửa mã nguồn hay đóng gói lại extension. Chưa ấn định thời gian thực hiện.

## Các hướng mở rộng khác

- Hỗ trợ thêm loại control và form nhiều phần/phân nhánh.
- Nhập CSV, nhiều hồ sơ đáp án và adapter cho nền tảng khác.
- AI đề xuất đáp án như một nguồn tùy chọn, có bước duyệt trước khi điền.

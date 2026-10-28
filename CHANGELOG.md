# Lịch sử phiên bản

Các mốc dưới mô tả tính năng trong mã nguồn. ZIP cài đặt được tạo tại máy bằng script đóng gói; không mặc định có GitHub Release tương ứng.

## 0.5.0

- Tự chạy riêng quiz LMS HUST: quét → điền → xác minh → Next page; dừng trước kết thúc/nộp bài.
- Chờ bổ sung khi thiếu/mơ hồ, xác nhận câu chưa hỗ trợ đã xử lý trên trang; tiếp tục, tạm dừng và dừng.
- Phiên theo tab/lượt làm, lưu trạng thái trong phiên Chrome; kiểm tra đích Next, trang cuối, thay đổi bộ đáp án và timeout 15 giây.
- Quyền thường trực trên https://lms.hust.edu.vn/* để tiếp tục sau điều hướng; Forms giữ activeTab.
- Thêm kiểm thử tự chạy và xác minh gói ZIP thực tế.
- Hoàn thiện README, hướng dẫn cài/cập nhật, JSON, LMS, kiến trúc và kiểm thử; đưa tài liệu mới vào gói cài.

## 0.4.0

- Adapter LMS HUST/Moodle cho multichoice một/nhiều đáp án, truefalse và shortanswer.
- Nhận diện trang làm bài, liên kết bộ theo quiz/lượt, điền/xác minh/hoàn tác trên trang hiện tại.
- Bộ CNPM kỳ 20242 VN gồm 351 câu và nút nạp vào thư viện.
- Workflow tự Next chưa có ở mốc này.

## 0.3.0

- Hoàn thiện nhập file/dán JSON, thư viện nhiều bộ, trình soạn, sao chép/xóa, xuất và lựa chọn theo form.
- Giới hạn thư viện, chuyển dữ liệu cũ và kiểm soát xung đột khi nhiều bảng bên cùng sửa.
- Giữ bộ Quy chế tích hợp; chưa triển khai nhập PDF bất kỳ.
- Chi tiết lịch sử: [báo cáo 0.3.0](./IMPLEMENTATION_REPORT.md).

## Các mốc trước 0.3.0

- Quét/điền Microsoft Forms, ghép theo nội dung và lựa chọn, xem trước, xác minh và hoàn tác.
- Tích hợp và cập nhật bộ Quy chế 2026.1, cải thiện đối chiếu dữ liệu tài liệu.
- Chuẩn bị gói nạp trực tiếp với manifest.json ở gốc.
- Lưu vết dữ liệu: [nguồn đáp án](./data/ANSWERS.md), [thay đổi đáp án](./data/ANSWER_CHANGES.md). Đánh giá PDF/JSON ban đầu: [báo cáo khả thi](./FEASIBILITY_REPORT.md).

[README](./README.md) · [Lộ trình](./ROADMAP.md) · [Kiểm thử](./docs/DEVELOPMENT.md)

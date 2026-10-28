# Báo cáo triển khai Auto Fill Form v0.3.0

**Tài liệu lịch sử:** ghi nhận mốc JSON v0.3.0, không đại diện toàn bộ tính năng/kiểm thử hiện tại. Bản v0.5.0 có thêm LMS và tự Next; xem [README](./README.md), [kiến trúc](./REPORT.md) và [lịch sử phiên bản](./CHANGELOG.md).

Ngày: 26/10/2026. Nhánh: `feat/json-answer-workflow`, đã được người dùng phê duyệt trước khi chuyển nhánh. Phạm vi: hoàn thiện luồng JSON để người dùng tự cung cấp bộ đáp án cho Microsoft Forms.

## Kết quả

Bản 0.3.0 cho phép người dùng nhập JSON, lưu nhiều bộ độc lập, tạo/sửa đáp án trong giao diện và dùng lại trên form phù hợp mà không sửa mã nguồn hoặc đóng gói lại tiện ích. Bộ 200 đáp án Quy chế 2026.1 vẫn đi kèm. PDF bất kỳ được giữ trong lộ trình, chưa triển khai bộ nhập PDF trực tiếp.

| Hạng mục | Hành vi đã triển khai |
| --- | --- |
| Nhập JSON | Chọn file hoặc dán; kiểm tra cú pháp/schema, báo câu/trường sai; nhận UTF-8 BOM; không thay dữ liệu nếu lỗi |
| Thư viện | Tối đa 50 bộ riêng, tổng 8 MB; mỗi file nhập tối đa 2 MB, mỗi bộ 1–500 câu |
| Chọn theo form | Nhớ lựa chọn theo ID; bộ liên kết sai form bị chặn; bộ dùng chung cần chọn trên form mới |
| Trình soạn | Đổi tên/phạm vi, thêm/xóa câu và lựa chọn, đổi loại câu, chọn đáp án; lỗi mở đúng câu cần sửa |
| Lưu bản xem trước | Tạo bộ mới từ câu hỗ trợ đang hiển thị; chỉ lưu câu được bật; không ghi đè bộ nguồn nhiều trang |
| Xuất/xóa | Xuất bộ đã lưu thành JSON; xác nhận xóa đúng ID/phiên bản đã chọn, giữ các bộ khác và bộ tích hợp |
| Dữ liệu cũ | Chuyển khóa answerBank cũ sang answerLibrary sau khi lưu thành công; dữ liệu lỗi vẫn được giữ |
| Nhiều bảng bên | Worker xử lý ghi tuần tự, kiểm tra phiên bản trước sửa/xóa; xung đột giữ bản soạn và cho lưu thành bộ mới |
| Điền/hoàn tác | Giữ luồng xem trước, chọn câu, ghi đè có chủ ý, xác minh giá trị và hoàn tác; không tự nộp |
| Đóng gói | Manifest tại gốc ZIP, đầy đủ mã thư viện/trình soạn và tài liệu; nạp trực tiếp bằng Load unpacked |

## Kiến trúc và dữ liệu

`library.js` quản lý schema thư viện, chuyển dữ liệu, lựa chọn theo form và kiểm tra phiên bản. `background.js` là nơi ghi dữ liệu tuần tự. `bank-editor.js` giữ bản soạn; chỉ lưu sau khi schema hợp lệ. `panel.js` điều phối thư viện, bản xem trước và adapter điền hiện có.

Định dạng bộ đáp án vẫn là schemaVersion 1 để dùng lại JSON cũ. Thư viện nội bộ bổ sung ID, version, updatedAt và selections. Bản ghi mới dùng UUID; sửa bộ tăng version. Ghi từ bản soạn cũ bị từ chối nếu phiên bản đã đổi.

Giữ bốn quyền hiện có: activeTab, scripting, storage, sidePanel. Không thêm máy chủ hoặc dịch vụ AI; đáp án được lưu tại máy. Microsoft Forms có thể tự lưu bản nháp khi các trường thay đổi.

## Kiểm thử và bằng chứng

Môi trường: Chrome 155 trên Windows, profile kiểm thử riêng. Các URL trả lời trong test đều được chuyển tới dữ liệu giả tại máy; không ghi/nộp dữ liệu trên form thật.

| Nhóm | Kết quả | Phạm vi |
| --- | --- | --- |
| Unit test | 32 đạt | Schema, ghép, 200 câu, dữ liệu cũ, liên kết, xung đột, giới hạn 50 bộ/8 MB, JSON lỗi |
| Hồi quy trình duyệt | 15 bước đạt | Nạp MV3, native/ARIA, điền/xác minh/hoàn tác, dữ liệu thay đổi, phân nhánh fixture, bộ 200 câu xáo trộn |
| Luồng JSON trình duyệt | 12 bước đạt | Chuyển dữ liệu cũ, sửa/xuất, nhiều bộ/hai hostname, lưu bản xem trước, lỗi JSON, xung đột/sao chép, xóa, sai form, tạo mới, tải lại, trang kết quả |
| Gói phát hành | Đạt | Giải nén chính ZIP phát hành, manifest tại gốc, từng file chạy khớp mã nguồn, Chrome nạp được và bộ tích hợp đủ 200 câu |

Kết quả chạy ghi tại `test-results/browser-summary.json`, `json-workflow-summary.json`, `package-summary.json`. Ảnh `json-editor.png` được kiểm tra ở chiều rộng 410 px; không tràn ngang. JSON xuất được đối chiếu lại với schema và dữ liệu đã lưu.

Kiểm thử xuất JSON thực hiện tải file bằng Chrome vào thư mục kiểm thử riêng, kiểm tra không có lỗi tải xuống, tên file và toàn bộ nội dung sau khi đọc lại. Cấu hình đường dẫn tải dùng riêng trong bài test; sản phẩm sử dụng cơ chế tải xuống thông thường của Chrome.

## Kiểm tra link người dùng cung cấp

Link mới mở được nhưng dẫn tới `ResponseDetailPage.aspx`, là trang kết quả khảo sát. Toàn bộ 221 ô nhập bị vô hiệu hóa và không có nút gửi; không phù hợp để kiểm thử điền. Extension có thông báo riêng, hướng người dùng tới link trả lời `ResponsePage.aspx`. Không sao chép khóa truy cập kết quả vào mã nguồn hoặc gói phát hành.

Link form kiểm tra trước yêu cầu đăng nhập trong trình duyệt kiểm thử. Vì vậy chưa xác nhận điền trên trang trả lời Microsoft thật; cần link trả lời có thể truy cập để hoàn tất kiểm thử đó. Kết quả fixture chứng minh luồng phần mềm đã chạy nhưng không thay thế xác nhận mọi cấu trúc Microsoft Forms thực tế.

## Cài và sử dụng

Giải nén `release/auto-fill-form-0.3.0.zip` → mở chrome://extensions → Developer mode → Load unpacked → chọn thư mục chứa trực tiếp manifest.json. Hoặc nạp `extension/` trong dự án. Không cần build.

Muốn giữ dữ liệu khi cập nhật, thay file trong cùng thư mục đã nạp rồi Reload tiện ích và tải lại tab form. Nạp từ đường dẫn khác có thể đổi ID; xuất JSON ở bản cũ để nhập lại. Không gỡ bản cũ trước khi sao lưu bộ đáp án riêng.

## Giới hạn và việc tiếp theo

Hiện hỗ trợ Choice một/nhiều đáp án và Text ngắn trên trang trả lời của forms.cloud.microsoft và forms.office.com. Chưa hỗ trợ Google Forms, PDF/CSV trực tiếp, AI tự giải, các loại câu mở rộng hoặc tự chuyển trang. Form nhiều phần cần người dùng chuyển phần và quét lại; phân nhánh phức tạp cần kiểm chứng thêm.

Bản xem trước/bản soạn chưa lưu chỉ ở phiên bảng bên; bộ đã lưu nằm trong chrome.storage.local, không đồng bộ giữa thiết bị. Hoàn tác chỉ giữ lần điền gần nhất trong tài liệu hiện tại và không bảo đảm thu hồi bản nháp Microsoft đã lưu.

Bước phát triển tiếp theo: kiểm thử thêm trang trả lời Microsoft thật; sau đó mở rộng loại câu. Nhập PDF sẽ dùng thư viện/trình soạn hiện có làm bước duyệt, triển khai theo các bố cục đã công bố hỗ trợ.

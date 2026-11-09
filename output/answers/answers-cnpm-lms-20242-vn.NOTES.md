# Ghi chú bộ đáp án Công nghệ phần mềm 20242

File chạy: answers-cnpm-lms-20242-vn.json.

Đã đọc 254 trang: 450 lượt câu hỏi, gồm 60 lượt cần OCR. File có 351 câu riêng (321 một đáp án, 30 nhiều đáp án); gộp 83 lượt lặp. 16 lượt không đưa vào file chạy, liệt kê bên dưới.

## Cách dùng

Trong Auto Fill Form 0.4.0: mở trang trả lời Microsoft Forms hoặc lượt làm quiz LMS HUST (attempt.php) → bấm biểu tượng extension → Nhập file JSON vào thư viện hoặc Nạp đáp án CNPM · 351 câu → xem trước rồi điền. Đây là bộ dùng chung; cần chọn bộ trên quiz mới. Bản 0.4.0 có sẵn file này nên không cần tải lại nếu dùng nút CNPM.

Tài liệu nguồn xuất từ LMS HUST; extension 0.4.0 hỗ trợ cả Microsoft Forms và lms.hust.edu.vn. Cần quiz có cùng nội dung câu/lựa chọn và loại một/nhiều đáp án. Các câu có hình nhưng lựa chọn là chữ cần tự đối chiếu hình trước khi điền. File giữ đáp án theo phản hồi của PDF, không tự sửa đáp án theo kiến thức ngoài tài liệu.

Đã kiểm tra schema, nhập vào thư viện và đối chiếu đủ 351/351 câu khi đảo thứ tự lựa chọn. Bản 0.4.0 điền và xác minh được 14 câu hỗn hợp từ bộ này trên fixture Moodle. Link quiz thật được cung cấp dẫn tới màn hình đăng nhập trong phiên thử; chưa xác nhận điền sau đăng nhập HUST.

Chế độ document_ocr dùng bộ ghép tài liệu hiện có để dung sai dấu/khoảng trắng; số, dấu so sánh và từ phủ định vẫn được kiểm tra. Câu mơ hồ cần duyệt trong bảng bên. Không dùng số thứ tự hoặc A/B/C/D để suy ra đáp án.

## Các lượt câu cần xử lý riêng

- Trang 91, mã nguồn 174: Biểu đồ nào giúp mô hình hoá nghiệp vụ của hệ thống?
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Biểu đồ ca sử dụng; Biểu đồ hoạt động; Biểu đồ máy trạng thái

- Trang 98, mã nguồn 184: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): {\it The director or his secretary are allowed to make an appointment, but nobydy else - Chỉ giám đốc và thư ký của anh ta là có thểđược phép đặt hẹn ngoài ra không có người nào khác có thể}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 101, mã nguồn 188: Đâu là phát biểu đúng về nút quyết định trong biểu đồ hoạt động UML2?
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Giúp phân nhánh các luồng sự kiện tuỳ theo một giá trị cụ thể của các ràng buộc tại nút quyết định; Một nút quyết định cũng chính là một nút hoạt động của biểu đồ hoạt động tại đó có điều kiện cần phải kiểm chứng

- Trang 108, mã nguồn 198: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): {\it A mother cooks dinner together with her daughter. In the course of that, the mother always has to mix the cocktail - Một người mẹ nấu bữa tối cùng với con gái, trong quá trình thực hiện điều đó, người mẹ luôn luôn là người thực hiện việc pha chế cốc-tai}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 109, mã nguồn 199: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): Một giáo viên thực hiện cuộc phỏng vấn cùng với sinh viên của mình, trong quá trình thực hiện điều đó, người giáo viên luôn luôn là người phải cho điểm sinh viên.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 110, mã nguồn 200: Trong các lựa chọn dưới đây, đâu là một ví dụ cụ thể về ca sử dụng trong hệ thống quản lý thư viện ?
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Mượn sách; Trả sách

- Trang 112, mã nguồn 203: Đâu là phát biểu đúng về nút quyết định trong biểu đồ hoạt động UML2?
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Giúp phân nhánh các luồng sự kiện tuỳ theo một giá trị cụ thể của các ràng buộc tại nút quyết định; Một nút quyết định cũng chính là một nút hoạt động của biểu đồ hoạt động tại đó có điều kiện cần phải kiểm chứng

- Trang 118, mã nguồn 215: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): {\it A mother cooks dinner together with her daughter. In the course of that, the mother always has to mix the cocktail - Một người mẹ nấu bữa tối cùng với con gái, trong quá trình thực hiện điều đó, người mẹ luôn luôn là người thực hiện việc pha chế cốc-tai}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 119, mã nguồn 216: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): {\it A teacher is conducting the interview with her student, in the course of that the teacher always has to grade the student - Một giáo viên thực hiện cuộc phỏng vấn cùng với sinh viên của mình, trong quá trình thực hiện điều đó, người giáo viên luôn luôn là người phải cho điểm sinh viên}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 121, mã nguồn 219: Hãy mô hình hoá tình huống sau đây bằng biểu đồ UML usecase (2.0): {\it The director or his secretary are allowed to make an appointment, but nobydy else - Chỉ giám đốc và thư ký của anh ta là có thểđược phép đặt hẹn ngoài ra không có người nào khác có thể}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 123, mã nguồn 221: Lựa chọn các kết hợp có thể có của các actor có thể thực hiện use case B. Lưu ý: ký hiệu thể hiện toán tử logic {\bf or} và ký hiệu thể hiện toán tử logic {\bf and}.
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 155, mã nguồn 272: Giả sử bạn cần thiết kế một hệ thống quản lý tệp tin đơn giản. Hai thành phần chính cần quản lý trong thiết kế là các tập tin và thư mục. Thư mục có thể chứa 0 hoặc nhiều tập tin hoặc thư mục con khác. Các thư mục và tệp tin cần được xử lý một cách thống nhất, ví dụ: cả hai đều có tên và cung cấp các thao tác để truyền nội dung vào (streamIn) và ra (streamOut) cũng như liệt kê các phần tử con (listChildren). Lựa chọn nào là thiết kế phù hơp với mô tả trên?
  Lý do: Lựa chọn/đáp án là hình; không có đủ nhãn văn bản để điền tin cậy.

- Trang 170, mã nguồn 299: Check-list của tái cấu trúc mã nguồn KHÔNG bao gồm yêu cầu nào?
  Lý do: PDF không hiển thị đáp án đúng.

- Trang 179, mã nguồn 317: Check-list của tái cấu trúc mã nguồn KHÔNG bao gồm yêu cầu nào?
  Lý do: PDF không hiển thị đáp án đúng.

- Trang 202, mã nguồn 353: Với bài toán xét kết quả của sinh viên với hai điểm thi là toán và vật lý. Sinh viên chỉ vượt qua kì thi nếu: Cảđiểm toán và điểm vật lý >= 70 (xét theo thang điểm 100) và điểm trung bình của toán và vật lý >= 80. Các miền tương đương được xác định bởi giới hạn của các đường
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Toán = 100; Toán = 70; Lý = 100; Lý = 70; (Toán + Lý)/2 = 80

- Trang 235, mã nguồn 418: Biểu đồ nào giúp mô hình hoá nghiệp vụ của hệ thống?
  Lý do: PDF ghi Select one nhưng phản hồi liệt kê nhiều đáp án; cần xác nhận loại câu trên form. Phản hồi: Biểu đồ ca sử dụng; Biểu đồ hoạt động; Biểu đồ máy trạng thái


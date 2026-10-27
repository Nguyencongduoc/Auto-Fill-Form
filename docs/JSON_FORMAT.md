# Định dạng bộ đáp án JSON

Áp dụng cho Auto Fill Form v0.5.0, **schemaVersion: 1**. File dùng UTF-8, có thể có BOM; không có comment hoặc dấu phẩy thừa. Tiện ích nhận file hoặc nội dung dán, kiểm tra trước khi thay dữ liệu.

## Mẫu đầy đủ

Mẫu dưới dùng chung, chưa liên kết với form/quiz cụ thể:

```json
{
  "schemaVersion": 1,
  "name": "Bộ đáp án mẫu",
  "answers": [
    {
      "questionId": "q1",
      "question": "Thủ đô Việt Nam là gì?",
      "type": "single_choice",
      "options": ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"],
      "answer": ["Hà Nội"]
    },
    {
      "questionId": "q2",
      "question": "Chọn các số nguyên tố",
      "type": "multiple_choice",
      "options": ["2", "3", "4"],
      "answer": ["2", "3"]
    },
    {
      "questionId": "q3",
      "question": "Điền kết quả: 2 + 2 = ?",
      "type": "short_text",
      "answer": "4"
    }
  ]
}
```

[File demo](../examples/demo-answers.json) có cùng ba loại câu và được liên kết với trang demo của tiện ích. Để áp dụng bộ này cho trang khác, bỏ sourceForm hoặc tạo đúng liên kết mới.

## Trường và giới hạn

| Trường | Quy tắc |
| --- | --- |
| schemaVersion | Số 1 |
| name | Chuỗi không trống, tối đa 200 ký tự |
| answers | 1–500 bản ghi |
| questionId | Chuỗi không trống, tối đa 300 ký tự, duy nhất trong bộ |
| question | Nội dung câu, không trống, tối đa 20.000 ký tự |
| type | single_choice, multiple_choice hoặc short_text |
| options | Bắt buộc cho câu chọn: 2–200 chuỗi không trống, mỗi chuỗi tối đa 10.000 ký tự, không trùng sau chuẩn hóa |
| answer — single_choice | Mảng đúng một nội dung thuộc options |
| answer — multiple_choice | Mảng không trống, nội dung thuộc options, không lặp |
| answer — short_text | Chuỗi không trống, tối đa 20.000 ký tự; số phải viết dạng chuỗi |

File nhập tối đa **2 MB**; thư viện tối đa **50 bộ riêng / tổng 8 MB**. Tên trường và giá trị type phân biệt chữ hoa/thường. Tiện ích chuẩn hóa lựa chọn khi kiểm tra, nhưng nên chép nguyên nội dung trên trang.

questionId là khóa bản ghi trong file, **không phải số thứ tự để ghép với câu đang làm**. Ghép dùng nội dung, loại câu và tập lựa chọn; thứ tự câu/lựa chọn có thể đổi. Không dùng `["A"]` thay cho nội dung đáp án trừ khi lựa chọn trên trang thực sự là “A”.

## Liên kết với form/quiz

Bỏ sourceForm để tạo bộ dùng chung; người dùng chọn rõ bộ trên mỗi form/quiz mới. Có sourceForm thì tiện ích chặn áp dụng sai nền tảng/ID. Các ví dụ dưới chỉ là **giá trị của sourceForm**, cần đặt trong đối tượng bộ đầy đủ.

Microsoft Forms: formId là tham số id của link trả lời, không phải toàn bộ URL:

```json
{
  "platform": "microsoft_forms",
  "formId": "ID_FORM_CUA_BAN"
}
```

LMS HUST: ưu tiên ID quiz từ cmid/breadcrumb; không lấy số thứ tự câu:

```json
{
  "platform": "moodle",
  "formId": "moodle:hust:quiz:49373"
}
```

Nếu không nhận được ID quiz, bộ xuất có thể dùng moodle:hust:attempt:123, chỉ áp dụng cho lượt làm đó. ID sau quiz:/attempt: phải là số. Cách ít nhầm nhất là **xuất mẫu từ đúng trang đang làm**, hoàn thiện rồi nhập lại.

## Trường tùy chọn

| Trường | Ý nghĩa |
| --- | --- |
| answers[].platformQuestionId | ID câu trên nền tảng, chuỗi tối đa 300 ký tự; giúp phân biệt nội dung trùng khi ID khớp, có thể đổi giữa các lượt |
| answers[].sourceNumber, sourcePage | Số nguyên 1–1000 để tra tài liệu; không làm khóa ghép |
| matching | Nếu dùng, chỉ nhận document_ocr; bật đối chiếu gần đúng cho câu chọn, giữ ràng buộc số/toán tử/từ phủ định |
| formKey | Chuỗi tối đa 500 ký tự, metadata; không thay sourceForm |

Mặc định ghép chuẩn hóa chữ hoa/thường, khoảng trắng và Unicode, vẫn giữ dấu. Chỉ bật document_ocr khi dữ liệu cần đối chiếu tài liệu; kiểm tra kỹ các câu gần giống. Trường không thuộc schema bị loại khi kiểm tra/lưu/xuất, không nên dùng để lưu ghi chú quan trọng.

## Tạo bộ từ trang đang mở

1. Quét trang, xuất mẫu JSON hoặc dùng trình soạn trong bảng bên.
2. Điền answer; xóa các bản ghi chưa có đáp án trước khi nhập. Mẫu trống chỉ là bản soạn, chưa hợp lệ để nhập.
3. Nhập bộ, kiểm tra trạng thái ghép và xem trước.
4. Lưu/xuất bộ để dùng lại. Sửa ở bản xem trước hoặc bổ sung khi tự chạy chưa tự cập nhật bộ nguồn.

Với quiz nhiều trang, mẫu chỉ có câu hiện trên trang đang quét. Gộp các trang và đặt questionId duy nhất nếu muốn tạo bộ đầy đủ. True/False Moodle chuẩn được biểu diễn single_choice với lựa chọn True/False; ưu tiên mẫu xuất để biết giá trị chuẩn.

PDF bất kỳ chưa được nhập trực tiếp. Cần chuyển dữ liệu sang JSON và duyệt lại trước khi sử dụng; xem [lộ trình PDF](../ROADMAP.md).

[README](../README.md) · [LMS HUST](../LMS_HUST.md) · [Phát triển](./DEVELOPMENT.md)

# Báo cáo đánh giá khả thi: nhập đáp án PDF hoặc JSON để hỗ trợ điền form

**Tài liệu lịch sử:** đánh giá trước triển khai JSON, trên mã v0.2.2. JSON đã triển khai từ v0.3.0; bản v0.5.0 còn có LMS và tự Next. Phạm vi hiện tại xem [README](./README.md), [kiến trúc](./REPORT.md) và [lịch sử phiên bản](./CHANGELOG.md). Các giới hạn và kết quả thử ở phần dưới thuộc thời điểm đánh giá.

**Dự án:** Auto Fill Form  
**Ngày đánh giá:** 26/10/2026  
**Phiên bản được xem xét:** 0.2.2  
**Cơ sở:** mã nguồn hiện tại, kết quả kiểm thử của dự án và tài liệu kỹ thuật chính thức.

## 1. Kết luận và đề xuất

**Cả hai hướng đều khả thi. Nên lấy JSON làm chức năng chính và phát triển nhập PDF theo từng dạng tài liệu ở giai đoạn sau.**

| Phương án | Đánh giá | Quyết định đề xuất |
| --- | --- | --- |
| Người dùng nhập JSON đúng mẫu rồi điền Microsoft Forms | Khả thi cao; luồng cốt lõi đã có trong phiên bản hiện tại | Ưu tiên hoàn thiện thành tính năng sử dụng độc lập |
| Người dùng nhập PDF có câu hỏi, lựa chọn và đáp án rõ ràng | Khả thi, nhưng cần thêm bộ đọc tài liệu và giao diện duyệt | Giữ trong lộ trình; bắt đầu với một số bố cục được công bố hỗ trợ |
| Nhập mọi PDF và tự điền mọi website form | Phạm vi quá rộng để cam kết hoạt động đúng cho mọi trường hợp | Chia thành các định dạng PDF và nền tảng form cụ thể |

Với nhu cầu đơn giản là **“người dùng có file đáp án JSON, tải lên extension và được hỗ trợ điền form”**, dự án hoàn toàn có thể đáp ứng. Không cần tích hợp cứng đáp án mới vào mã nguồn hoặc đóng gói lại extension mỗi lần đổi bộ đáp án.

Tuy nhiên, JSON giải quyết **dữ liệu đầu vào**. Khả năng đọc và điền website được quyết định bởi **adapter của nền tảng form**. Có JSON hợp lệ không tự làm extension tương thích với một website mới.

## 2. Phiên bản hiện tại đã làm được gì?

Kiểm tra mã nguồn cho thấy các thành phần cần thiết cho hướng JSON đã tồn tại:

| Thành phần | Tình trạng và bằng chứng |
| --- | --- |
| Chọn file JSON hoặc dán JSON | Đã có trong `extension/panel.html` và `extension/panel.js` |
| Kiểm tra cấu trúc và dữ liệu | `validateBank()` trong `extension/core.js`: phiên bản schema, ID trùng, loại câu hỏi, lựa chọn và đáp án |
| Ghép câu hỏi với đáp án | Đã có; JSON thông thường ghép theo nội dung, loại câu và tập lựa chọn sau chuẩn hóa |
| Bỏ qua câu thiếu hoặc mơ hồ | Đã có; không tự lấy bản ghi đầu tiên khi có xung đột |
| Xem trước, chọn câu và điền | Đã có trong bảng bên và `extension/content.js` |
| Đọc lại giá trị, bảo vệ câu đã trả lời và hoàn tác | Đã có; việc hoàn tác phụ thuộc tài liệu/trường còn hiệu lực |
| Lưu và xuất bộ JSON đã nhập | Đã có; hiện lưu một bộ nhập riêng gần nhất, bên cạnh bộ tích hợp |
| Nhập PDF ngay trong extension | Chưa có. Các script xử lý PDF trong dự án là công cụ phát triển cho bố cục đã khảo sát |

Phạm vi website hiện tại là trang trả lời `ResponsePage.aspx` trên `forms.cloud.microsoft` và `forms.office.com`. Adapter nhận diện câu một lựa chọn, nhiều lựa chọn và văn bản ngắn. Dropdown, tải tệp, câu hỏi lưới, Text dài và nhiều loại control khác chưa được hỗ trợ.

Chrome cho phép content script đọc và thay đổi DOM, làm nền tảng cho cơ chế quét và điền. Quyền `activeTab` được cấp tạm thời khi người dùng kích hoạt extension; vì vậy luồng sử dụng cần thao tác bấm biểu tượng trên tab form. [Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab).

Trong lần đánh giá này, **19 kiểm thử logic đạt**. Log tích hợp tại thời điểm đó ghi nhận **15 kiểm tra trình duyệt đạt**, gồm nhập JSON và điền 200 câu đã đảo thứ tự trên dữ liệu mô phỏng. Log đóng gói xác nhận ZIP 0.2.2 nạp được vào Chrome và có đủ 200 đáp án. Đây là bằng chứng về các luồng đã kiểm tra; chưa chứng minh tương thích với mọi form Microsoft thực tế. Log là đầu ra cục bộ, không có trong Git/gói cài và có thể được ghi đè khi chạy lại. Cách tạo log hiện tại: [hướng dẫn kiểm thử](./docs/DEVELOPMENT.md).

## 3. Vì sao nhập PDF khả thi nhưng phức tạp hơn?

PDF là tài liệu trình bày, không có một cấu trúc đáp án thống nhất. Một file có thể lưu chữ và hình vẽ; file khác chỉ chứa ảnh chụp. Đáp án có thể được thể hiện bằng radio đã chọn, dấu tick, tô màu, chữ in đậm hoặc bảng “Câu — Đáp án”. Mỗi dạng đòi hỏi cách nhận diện khác nhau.

| Loại tài liệu | Mức khả thi | Điều kiện để hoạt động tin cậy |
| --- | --- | --- |
| PDF có lớp chữ, đầy đủ câu hỏi/lựa chọn, đánh dấu đáp án rõ | Cao với bố cục đã khảo sát | Đọc đúng thứ tự và nhận diện đúng dấu chọn |
| PDF quét/chụp rõ, bố cục tương đối nhất quán | Trung bình | OCR, đọc dấu chọn, kiểm tra lại chữ/số và bước duyệt |
| PDF nhiều bố cục, nhiều cột, chữ nhỏ, ảnh mờ hoặc đáp án viết tay | Khó hơn đáng kể | Bộ phân tích bổ sung, dữ liệu kiểm thử đa dạng và sửa thủ công |
| PDF chỉ ghi “1: A, 2: C”, không có nội dung câu hỏi | Chưa đủ thông tin để tự ghép khi thứ tự form khác | Cần đề gốc, ID tương ứng hoặc người dùng ánh xạ thủ công |
| PDF không chỉ ra đáp án hoặc đánh dấu không rõ | Không đủ căn cứ để xác định đáp án từ file | Người dùng phải bổ sung/xác nhận thông tin |

Dự án đã xử lý được hai tài liệu mẫu bằng công cụ phát triển: một nguồn dạng ảnh cần OCR và một bản in PDF có lớp chữ/trạng thái radio vector. Điều này cho thấy hướng PDF có cơ sở thực tế. Nhưng một quy trình được viết theo hai bố cục mẫu chưa phải tính năng người dùng có thể tự nhập mọi PDF.

Về công cụ, PDF.js có thể phân tích và dựng trang PDF. Tesseract.js có thể OCR ảnh trong trình duyệt, nhưng chính dự án này nêu rõ không hỗ trợ đầu vào PDF trực tiếp. Với PDF ảnh, cần bước chuyển trang thành ảnh trước khi OCR. [PDF.js](https://mozilla.github.io/pdf.js/), [Tesseract.js — Project Scope](https://github.com/naptha/tesseract.js#project-scope).

Nhận dạng được chữ vẫn chưa đủ: hệ thống còn phải tách câu hỏi/lựa chọn, xác định dấu đáp án và ghép đúng với form. Các lỗi nhỏ như `≥` thành `>`, mất từ “không”, hoặc sai số thập phân có thể làm thay đổi ý nghĩa. Do đó, **bước duyệt kết quả PDF là phần cần thiết của sản phẩm**.

Nếu triển khai OCR trong extension, còn phải đóng gói thư viện/worker, mô hình ngôn ngữ và cấu hình WebAssembly phù hợp với Manifest V3. CSP hiện tại của dự án chưa cấu hình cho luồng OCR WebAssembly. Đây là hạng mục kỹ thuật cần bổ sung, không phải chỉ thêm nút chọn PDF. [Chrome — Content Security Policy](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy).

## 4. Phương án JSON nên hoạt động thế nào?

### Luồng sử dụng đề xuất

1. Người dùng mở một Microsoft Forms thuộc phạm vi hỗ trợ và bấm biểu tượng extension.
2. Extension quét câu hỏi và cho **Xuất mẫu JSON** nếu người dùng chưa có bộ đáp án.
3. Người dùng điền đáp án vào mẫu hoặc chọn một file JSON có sẵn.
4. Extension kiểm tra file, hiển thị số câu khớp, câu thiếu và câu cần duyệt.
5. Người dùng chọn các câu cần điền, kiểm tra kết quả và tự nộp form.

Luồng này đã có phần lớn trong phiên bản hiện tại. Bước hoàn thiện sản phẩm nên tập trung vào trải nghiệm dùng bộ đáp án riêng, thông báo lỗi dễ hiểu và kiểm thử trên nhiều form thật.

### JSON cần chứa nội dung, không chỉ số thứ tự

Ví dụ hợp lệ với schema hiện tại:

```json
{
  "schemaVersion": 1,
  "name": "Đáp án Địa lý",
  "answers": [
    {
      "questionId": "q1",
      "question": "Thủ đô Việt Nam là gì?",
      "type": "single_choice",
      "options": ["Hà Nội", "Huế", "Đà Nẵng"],
      "answer": ["Hà Nội"]
    }
  ]
}
```

| Loại câu | Giá trị `type` | Kiểu `answer` |
| --- | --- | --- |
| Một lựa chọn | `single_choice` | Mảng có đúng một đáp án bằng nội dung lựa chọn |
| Nhiều lựa chọn | `multiple_choice` | Mảng các nội dung lựa chọn cần chọn |
| Văn bản ngắn | `short_text` | Chuỗi văn bản |

Với câu lựa chọn, `options` phải chứa đầy đủ lựa chọn và không trùng nội dung sau chuẩn hóa. Mẫu đã xuất có `answer` trống cần được điền trước khi nhập lại; có thể xóa bản ghi chưa có đáp án.

Không nên dùng duy nhất dữ liệu như `{"1":"A","2":"C"}`. Khi form xáo trộn câu hoặc lựa chọn, cùng số/chữ có thể chỉ một đáp án khác. Việc dùng nội dung giúp giữ đúng ánh xạ khi thứ tự hiển thị thay đổi.

`questionId` là ID trong bộ đáp án, không mặc nhiên là ID trên Microsoft Forms. `sourceForm` là trường tùy chọn để ràng buộc bộ đáp án với một form cụ thể; nếu khai báo thì ID phải khớp. Bỏ ràng buộc này cho phép dùng bộ dữ liệu chung, nhưng câu hỏi và lựa chọn vẫn phải phù hợp.

### Giới hạn và hành vi hiện tại cần giữ rõ

- File JSON tối đa **2 MB**; mỗi bộ từ **1 đến 500 câu** theo giới hạn mã nguồn hiện tại.
- JSON thông thường yêu cầu khớp nội dung câu hỏi, loại trường và tập lựa chọn sau chuẩn hóa khoảng trắng, chữ hoa/thường và Unicode. Thay đổi nội dung thực chất có thể cần cập nhật bộ đáp án.
- Chế độ đối chiếu linh hoạt hơn dành cho dữ liệu tài liệu là cơ chế riêng; không nên mặc định coi mọi câu gần giống là cùng một câu.
- File hợp lệ chỉ chứng minh đáp án nhất quán với schema và lựa chọn, không chứng minh đáp án đúng về kiến thức.
- Chế độ JSON hiện xử lý tại máy, không cần API AI. Người dùng đăng nhập form bằng phiên trình duyệt của mình.

## 5. Nên phát triển gì tiếp theo?

### Ưu tiên 1 — Hoàn thiện hướng JSON

Giữ Microsoft Forms làm nền tảng đầu tiên. Tách rõ trong giao diện hai nguồn: **bộ đáp án tích hợp** và **bộ người dùng nhập**, hiển thị nguồn đang áp dụng và form liên kết. Cơ chế lựa chọn nguồn đã có trong mã, nhưng giao diện nên làm rõ hơn khi dùng nhiều form.

Các cải tiến có giá trị tiếp theo:

- Quản lý nhiều bộ đáp án, đặt tên và chọn bộ dùng cho từng form. Hiện chỉ lưu một bộ nhập riêng gần nhất.
- Trình soạn bộ đáp án để người dùng sửa và lưu/xuất mà ít phải chỉnh cú pháp JSON. Hiện nhập trực tiếp trong bảng bên chưa thay thế hoàn toàn chức năng quản lý bộ đáp án.
- Báo lỗi theo câu/trường, giải thích rõ vì sao chưa khớp và hướng dẫn sửa bằng mẫu xuất từ form.
- Kiểm thử trên nhiều Microsoft Forms thật, gồm đảo thứ tự, câu trùng, trường đã trả lời và các trạng thái đăng nhập.

**Tiêu chí hoàn thành:** người dùng tải một JSON hợp lệ cho form khác thuộc phạm vi hỗ trợ, xem trước và điền được mà không cần sửa mã nguồn, nhờ nhà phát triển nhúng đáp án hoặc cài lại extension.

### Ưu tiên 2 — Nhập PDF theo phạm vi có kiểm soát

Bắt đầu với PDF có lớp chữ và một vài bố cục rõ ràng. Sau đó mới mở rộng PDF ảnh/OCR. Trong cả hai trường hợp, kết quả sau duyệt nên được lưu về cùng schema JSON để tái sử dụng toàn bộ luồng ghép và điền hiện có.

```text
JSON người dùng ───────────────────────────┐
                                         ├→ Bộ đáp án chuẩn → Ghép câu → Adapter → Form
PDF → Đọc chữ/OCR → Nhận dạng → Người duyệt┘
```

**Tiêu chí hoàn thành:** người dùng tự chọn PDF, sửa/xác nhận kết quả trích xuất và lưu bộ đáp án ngay trong extension. Những bố cục chưa được kiểm chứng phải được báo rõ, không tự diễn giải thành đáp án chắc chắn.

### Ưu tiên 3 — Mở rộng nền tảng form

Google Forms hoặc website nội bộ cần adapter riêng để đọc câu hỏi, thao tác control và xác minh giá trị. Nên mở rộng từng nền tảng sau khi có bộ form mẫu và kiểm thử tương ứng; đây là công việc độc lập với việc nhận JSON hay PDF.

## 6. Đánh giá công sức và rủi ro

Đánh giá sau là so sánh tương đối cho dự án hiện tại, không phải cam kết thời gian hoặc báo giá.

| Hạng mục | Công sức bổ sung | Điểm cần kiểm chứng |
| --- | --- | --- |
| Dùng JSON theo schema hiện tại | Thấp; phần cốt lõi đã có | Khả năng tương thích trên các form thật |
| Hoàn thiện quản lý bộ JSON và giao diện tạo đáp án | Thấp đến trung bình | Trải nghiệm người dùng không quen JSON |
| Nhập PDF chữ theo bố cục được hỗ trợ | Trung bình | Thứ tự đọc, tách câu và nhận diện dấu đáp án |
| Nhập PDF ảnh với OCR và nhiều cách đánh dấu | Cao | Chất lượng ảnh, ngôn ngữ, ký hiệu và thời gian xử lý |
| Hỗ trợ thêm nền tảng form | Trung bình đến cao cho từng nền tảng | Cấu trúc DOM, control tùy biến và thay đổi giao diện |

Rủi ro lớn nhất của hướng JSON là **điền sai trường hoặc dùng sai bộ dữ liệu**. Có thể giảm bằng xem trước, ràng buộc form, kiểm tra cấu trúc và đọc lại giá trị — phần lớn đã có. Hướng PDF bổ sung một lớp rủi ro trước đó: **trích xuất sai câu hoặc sai đáp án**. Vì vậy, JSON là nền tảng phù hợp để ổn định sản phẩm trước khi mở rộng đầu vào.

## 7. Quyết định đề xuất cho dự án

Chọn mục tiêu sản phẩm gần nhất là **“Extension hỗ trợ điền Microsoft Forms bằng JSON do người dùng cung cấp.”** Chức năng này khả thi và đã có nền tảng thực thi trong bản 0.2.2. Việc tiếp theo là hoàn thiện trải nghiệm và kiểm chứng tương thích, không cần xây lại từ đầu.

Giữ **PDF → trích xuất → duyệt → JSON** trong [lộ trình tương lai](./ROADMAP.md). PDF không phải hướng bất khả thi; nên triển khai từng nhóm tài liệu thay vì cam kết nhận mọi PDF và điền mọi form.

Báo cáo này đánh giá và đề xuất phạm vi; không bổ sung tính năng mới hoặc thay đổi phiên bản extension.

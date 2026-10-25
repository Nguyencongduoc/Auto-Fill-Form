# Auto Fill Form

Extension Chrome **v0.2.2**, tích hợp sẵn **200 đáp án Quy chế 2026.1** theo PDF mới người dùng cung cấp ngày 26/10/2026, gắn với đúng form đã gửi. Mở form → bấm biểu tượng extension → tự quét và nạp đáp án → **Điền các câu đã chọn**. Không cần nhập JSON, cài Node.js, tài khoản AI hoặc chạy build để dùng bộ đáp án này.

**Cập nhật 0.2.2:** thay nguồn bằng PDF mới 89 trang, đọc trực tiếp chữ và trạng thái lựa chọn. Đối chiếu đủ 200 câu theo nội dung; một lựa chọn đáp án thay đổi so với nguồn cũ. Xem [chi tiết thay đổi](./data/ANSWER_CHANGES.md).

Bản này cũng sửa việc hai lượt tự quét cùng một trạng thái làm vô hiệu bản xem trước của nhau. Khi cấu trúc hoặc giá trị trên form thay đổi, vẫn cần bản quét mới.

**Sửa lỗi đóng gói 0.2.1:** ZIP đặt `manifest.json` ngay tại gốc. Sau khi giải nén, chọn chính thư mục vừa giải nén để Load unpacked; không còn thư mục bọc lồng nhau.

Tên miền Microsoft xác nhận là **`forms.cloud.microsoft`**, có chữ **s** sau “form”; đây là địa chỉ mục tiêu của dự án khi áp dụng yêu cầu `form.cloud.microsoft`. [Nguồn Microsoft](https://learn.microsoft.com/en-us/microsoft-365-apps/privacy/web-cookies#forms).

**Trạng thái hiện tại:** đã có bản extension nạp được vào Chrome, bộ đáp án đi kèm và form demo. Nguồn hiện tại được trích xuất trực tiếp từ chữ và trạng thái radio vector trong PDF mới, không cần OCR. Đã kiểm tra 200 câu, mỗi câu có bốn lựa chọn và một đáp án đánh dấu; đối chiếu với bộ trước và xem trực quan trang có đáp án thay đổi. Đã kiểm thử bằng fixture cục bộ trên Chrome; form thật yêu cầu đăng nhập trong trình duyệt kiểm thử nên chưa xác nhận trực tiếp trên phiên đó. Extension điền theo bộ đáp án, chưa dùng AI tự giải.

## Cài ngay trên Chrome

1. Nếu dùng file ZIP trong `release/`, giải nén trước. Nếu đang ở thư mục dự án, dùng luôn thư mục `extension`.
2. Mở `chrome://extensions` trên Chrome.
3. Bật **Developer mode / Chế độ dành cho nhà phát triển** ở góc trên bên phải.
4. Bấm **Load unpacked / Tải tiện ích đã giải nén**.
5. Nếu dùng mã nguồn tại máy, chọn **`D:\D\Auto Fill Form\extension`**. Nếu dùng ZIP bản 0.2.2, chọn **chính thư mục vừa giải nén**. Thư mục được chọn phải chứa trực tiếp `manifest.json`, `background.js`, `panel.html` và `data/`.
6. Trong menu tiện ích của Chrome, ghim **Auto Fill Form — Microsoft Forms** lên thanh công cụ.
7. Mở form Microsoft Forms, đăng nhập nếu được yêu cầu, đợi câu hỏi hiển thị rồi bấm biểu tượng extension.
8. Bảng bên **tự quét và tự chọn bộ Quy chế 2026.1** cho đúng form. Kiểm tra số câu khớp rồi bấm **Điền các câu đã chọn**. Nếu trang còn đang tải, đợi câu hỏi xuất hiện rồi bấm **Quét form**.

**Đã cài bản trước:** nếu bạn nạp từ đúng thư mục `D:\D\Auto Fill Form\extension`, bấm **Reload** trên thẻ tiện ích rồi tải lại tab form. Nếu đang dùng một thư mục bản cũ khác, gỡ bản cũ và nạp thư mục vừa giải nén của bản **0.2.2** để tránh mở nhầm hai phiên bản.

## Dùng ngay với form Quy chế 2026.1

1. Mở form đã gửi; có thể dùng nút **Mở form Quy chế 2026.1** trong bảng bên.
2. Tự đăng nhập Microsoft nếu được yêu cầu và đợi câu hỏi hiển thị.
3. Bấm biểu tượng extension. Bộ **200 câu có sẵn** được nạp tự động; không cần dùng nút Chọn file JSON.
4. Bấm **Điền các câu đã chọn**. Các câu đã có câu trả lời được giữ nguyên mặc định.
5. Tự nhập họ tên, mã sinh viên và thông tin cá nhân nếu form yêu cầu; kiểm tra lại rồi tự nộp bài.

Đáp án chỉ tự áp dụng khi ID form khớp. Việc ghép dựa trên nội dung câu hỏi và lựa chọn, không dựa vào số thứ tự; form xáo trộn thứ tự vẫn dùng cùng bộ đáp án. Câu mơ hồ hoặc thay đổi số/điều kiện so với tài liệu sẽ được bỏ qua để bạn xem lại.

Nguồn tích hợp mới: `KIỂM TRA QUY CHẾ KỲ 2026.1.pdf` (89 trang). [Danh sách 200 đáp án và trang nguồn](./data/ANSWERS.md) · [Thông tin kiểm tra nguồn](./data/answer-source-audit.json) · [Thay đổi so với bộ cũ](./data/ANSWER_CHANGES.md). File dữ liệu chạy cùng extension nằm tại [quy-che-2026.1.json](./extension/data/quy-che-2026.1.json). PDF gốc và ảnh trung gian không được đưa vào gói cài đặt.

## Có dùng PDF đáp án của form bất kỳ được không?

**Chưa nhập PDF trực tiếp trong extension.** Hiện công cụ hỗ trợ Microsoft Forms với bộ đáp án tích hợp, JSON theo mẫu, hoặc nhập đáp án trực tiếp. Bạn có thể dùng một form Microsoft Forms khác nếu có JSON phù hợp với nội dung câu hỏi và lựa chọn; các nền tảng form khác cần adapter riêng.

Nhập PDF đáp án, nhận dạng chữ/dấu chọn, duyệt kết quả và gắn với form là tính năng **để ngỏ cho tương lai**, chưa triển khai trong bản này. Xem [lộ trình phát triển](./ROADMAP.md). Các script trích xuất PDF trong mã nguồn là công cụ phát triển dành cho bố cục đã kiểm tra, không phải bộ nhập PDF tổng quát dành cho người dùng.

Chrome tối thiểu: **116**. Dùng **Load unpacked**, không phải **Pack extension**; không cần tạo file `.crx`. Đừng di chuyển hoặc xóa thư mục extension sau khi nạp. [Hướng dẫn Chrome chính thức](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).

## Thử nhanh bằng demo

1. Mở bảng bên của extension và bấm **Thử tính năng bằng bản demo**.
2. Bấm **Quét form**: sẽ thấy 4 câu; 3 câu hỗ trợ, 1 câu dropdown để minh họa trường bị bỏ qua.
3. Nạp [examples/demo-answers.json](./examples/demo-answers.json), hoặc trên trang demo bấm **Tải đáp án demo** rồi chọn file vừa tải trong bảng bên.
4. Bấm **Điền 3 câu đã chọn**. Kết quả: Hà Nội; 2 và 3; văn bản “4”.
5. Bấm **Hoàn tác** để khôi phục trạng thái trước khi điền.

Bạn cũng có thể chọn/nhập đáp án trực tiếp trên từng câu trong bảng bên, không cần file JSON.

## Tài liệu

- [Báo cáo ý tưởng và thiết kế kỹ thuật](./REPORT.md): so sánh hướng sản phẩm, phạm vi MVP, kiến trúc, dữ liệu, rủi ro, lộ trình và tiêu chí nghiệm thu.
- README này: giới thiệu dự án và định hướng phát triển.

## Mục tiêu

- Giảm thao tác điền đáp án lặp lại cho form luyện tập, kiểm thử và bài kiểm tra cho phép công cụ hỗ trợ.
- Ghép câu hỏi bằng nội dung và lựa chọn, kể cả khi thứ tự thay đổi.
- Cho người dùng xem trước, chọn câu cần điền, kiểm tra kết quả và hoàn tác.
- Mở rộng thêm AI đề xuất đáp án sau khi luồng điền theo bộ đáp án ổn định.

## Phạm vi bản v0.2.2

| Hạng mục | Phạm vi |
| --- | --- |
| Trình duyệt | Chrome, Manifest V3 |
| Nền tảng mục tiêu | Trang trả lời `ResponsePage.aspx` trên `forms.cloud.microsoft` và `forms.office.com`; một trang không phân nhánh; cần xác nhận thêm trên form thật |
| Loại câu hỏi | Choice một đáp án, Choice nhiều đáp án, Text ngắn |
| Nguồn đáp án | Có sẵn 200 câu Quy chế 2026.1; có thể nạp JSON hoặc nhập/chọn trực tiếp cho form khác |
| Giao diện | Bảng bên với danh sách câu hỏi và đáp án xem trước |
| Dữ liệu | Lưu trên máy trong chế độ MVP; có chức năng xóa |
| Thao tác cuối | Người dùng tự kiểm tra và nộp bài trên form |

CSV, AI, tự chuyển trang, Google Forms và nhập PDF trực tiếp trong extension chưa được triển khai. PDF Quy chế đã được xử lý trước và đóng gói thành JSON; không cần chạy OCR khi sử dụng. Các biến thể dropdown, Other có ô nhập, Text dài, Rating/Date/Ranking/Likert/File upload/Net Promoter Score chưa thuộc phạm vi hỗ trợ. Trên form nhiều phần, có thể tự chuyển phần và quét lại từng phần; luồng phân nhánh chưa được xác nhận tương thích.

### Phạm vi Microsoft Forms

- Nhận diện HTTPS + hostname chính xác `forms.cloud.microsoft`, sau đó xác nhận trang trả lời; không thao tác trên trang tạo/sửa form hoặc kết quả.
- Người dùng mở đường dẫn trả lời trực tiếp trong tab trình duyệt và tự đăng nhập nếu cần. Form nhúng trong Teams/SharePoint chưa thuộc MVP.
- Mã nguồn cho phép trang trả lời trên cả `forms.cloud.microsoft` và `forms.office.com`; kiểm thử tự động luồng chèn script dùng fixture trên hostname đầu tiên. Chưa xác nhận địa chỉ số ít `form.cloud.microsoft` có chuyển hướng hay không.
- Adapter ghép theo nội dung câu hỏi và lựa chọn; không phụ thuộc thứ tự hiển thị hoặc nhãn A/B/C/D.
- Nếu phân nhánh làm đổi các câu đang hiển thị, hủy phần kế hoạch bị ảnh hưởng và yêu cầu quét lại; không báo câu ẩn là câu thiếu đáp án.

Microsoft Forms hỗ trợ nhiều loại câu hỏi và phân nhánh; phạm vi trên là lựa chọn triển khai của dự án. Xem [loại câu hỏi](https://support.microsoft.com/en-us/forms/create-a-quiz-with-microsoft-forms) và [phân nhánh](https://support.microsoft.com/en-us/forms/use-branching-logic-in-your-form).

## Dùng với các form khác hoặc bộ đáp án riêng

1. Mở trang trả lời Microsoft Forms tại `forms.cloud.microsoft`, đăng nhập nếu cần, rồi bấm biểu tượng extension để kích hoạt trên tab hiện tại.
2. Chọn **Quét form** trong bảng bên.
3. Chọn **Xuất mẫu JSON**, điền các trường `answer` trong file, xóa những bản ghi chưa có đáp án rồi nạp lại. Có thể dùng bộ JSON sẵn có hoặc chọn/nhập trực tiếp trong bảng bên.
4. Xem trước các câu đã khớp; xử lý câu thiếu hoặc mơ hồ.
5. Chọn câu cần điền và bấm **Điền các câu đã chọn**.
6. Kiểm tra kết quả; dùng **Hoàn tác lần điền** nếu cần.

Mặc định chỉ điền câu trống. Để thay câu đã trả lời, bật **Cho phép ghi đè câu đã có đáp án**, rồi chọn câu cần điền. Sau mỗi lần điền hoặc hoàn tác, quét lại nếu muốn điền tiếp.

Hoàn tác chỉ lưu lần điền gần nhất trong bộ nhớ của trang; đóng bảng bên vẫn có thể quét lại để nối với bản hoàn tác, nhưng tải lại/đóng tab sẽ mất bản này. Trường được sửa tiếp sau khi điền sẽ được giữ nguyên. Form có thể lưu bản nháp trên hệ thống Microsoft khi giá trị thay đổi.

## Định dạng bộ đáp án

Ví dụ tối thiểu cho phiên bản dữ liệu hiện tại:

```json
{
  "schemaVersion": 1,
  "name": "Địa lý cơ bản",
  "formKey": "demo-geography-v1",
  "answers": [
    {
      "questionId": "q1",
      "question": "Thủ đô Việt Nam là gì?",
      "type": "single_choice",
      "options": ["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh"],
      "answer": ["Hà Nội"]
    }
  ]
}
```

| `type` | Kiểu `answer` | Ràng buộc |
| --- | --- | --- |
| `single_choice` | Mảng chuỗi | Đúng một phần tử, tồn tại duy nhất trong `options` |
| `multiple_choice` | Mảng chuỗi | Ít nhất một phần tử; không trùng; mỗi phần tử tồn tại duy nhất trong `options` |
| `short_text` | Chuỗi | Không cần `options`; giữ nội dung dùng để điền |

`questionId` là ID duy nhất trong bộ đáp án; `formKey` là định danh do dự án quản lý. Các giá trị này không tự động trùng với ID của Microsoft Forms. Khi chưa có liên kết ID ổn định, hệ thống ghép bằng nội dung câu hỏi, loại trường và tập lựa chọn. Không dùng thứ tự câu hoặc nhãn A/B/C/D làm khóa duy nhất.

File xuất mẫu có thêm `platformQuestionId` nếu đọc được và `sourceForm.formId` để tránh dùng nhầm bộ đáp án sang form khác. Khi có `sourceForm`, form ID phải khớp mới tự ghép. Các `answer` trong mẫu ban đầu là `[]` hoặc `""`; cần điền trước khi nhập lại. File demo chỉ khớp form demo, không dùng cho form thật.

Xem [mô tả schema và thuật toán ghép](./REPORT.md#7-cách-ghép-câu-hỏi-với-đáp-án) trong báo cáo để biết đầy đủ quy tắc.

## Mã nguồn hiện tại

- **JavaScript thuần:** không phụ thuộc thư viện và không cần bước build.
- **Side panel:** nhập file, xem trước và thao tác điền.
- **Service worker:** điều phối tác vụ, thông điệp và phiên theo tab.
- **Content script + adapter Microsoft Forms:** đọc các nhóm `questionItem`, nhãn `questionTitle`, Choice native/ARIA và input văn bản; điền và đọc lại giá trị. Cấu trúc form thật có thể khác fixture và cần điều chỉnh adapter.
- **`chrome.storage.local`:** lưu một bộ đáp án gần nhất; có nút xóa và xuất.
- **`extension/data/quy-che-2026.1.json`:** bộ 200 câu có sẵn; `bundled.js` liên kết form đích. Nút xóa bộ nhập riêng không xóa dữ liệu đi kèm này.
- **Ghép tài liệu OCR:** chuẩn hóa dấu, khoảng trắng và cách trình bày; giữ ràng buộc về con số, dấu so sánh và từ phủ định. Chỉ ghép khi đáp án có một lựa chọn tương ứng, đủ lựa chọn hỗ trợ và không có ứng viên gần ngang nhau.
- **Bộ nhớ content script:** kế hoạch theo tài liệu, khóa tác vụ và bản hoàn tác; không phụ thuộc việc worker có tiếp tục chạy hay không.
- **Node test runner / Playwright:** kiểm thử logic và tích hợp Chrome.

Quyền khai báo: `activeTab`, `scripting`, `storage`, `sidePanel`. Không xin quyền đọc mọi website, không gọi API AI và không tự bấm nút nộp. Xem [tài liệu activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), [Side Panel](https://developer.chrome.com/docs/extensions/reference/api/sidePanel) và [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage).

Luồng MVP chèn script sau khi người dùng bấm biểu tượng extension và kiểm tra nền tảng, dùng quyền tạm thời của `activeTab`. Khi điều hướng qua đăng nhập hoặc sang hostname khác, cần xác nhận lại quyền tab và quét mới trước khi điền.

## Cấu trúc thư mục mã nguồn

Trong ZIP phát hành, các file bên trong `extension/` ở cấu trúc dưới đây được đặt thẳng tại gốc. Thư mục giải nén chính là thư mục chọn khi Load unpacked.

```text
Auto Fill Form/
├── README.md
├── REPORT.md                   # Thiết kế và định hướng
├── extension/                  # Chọn thư mục này khi Load unpacked
│   ├── manifest.json
│   ├── background.js
│   ├── core.js                 # Kiểm tra JSON, ghép đáp án
│   ├── bundled.js              # Form và bộ đáp án mặc định
│   ├── data/quy-che-2026.1.json # 200 đáp án đi kèm
│   ├── adapter.js              # Đọc/điền Microsoft Forms
│   ├── content.js              # Phiên quét, điền, hoàn tác
│   ├── panel.html / .css / .js  # Bảng điều khiển
│   └── demo.html / .css / .js   # Form thử cục bộ
├── examples/demo-answers.json
├── data/                       # Danh sách đáp án và kiểm tra nguồn
├── tests/                      # Unit và browser integration
├── scripts/package.cjs         # Tạo bản ZIP
└── package.json                # Chỉ phục vụ phát triển/kiểm thử
```

## Phát triển và kiểm thử

Sử dụng extension không cần các lệnh dưới đây. Để chạy kiểm thử logic, dùng Node.js 20+:

```sh
npm test
npm run package
```

`npm run package` trên Windows tạo thư mục và ZIP trong `release/`. Khi sửa mã, bấm **Reload** trên thẻ extension tại `chrome://extensions`, tải lại tab form rồi mở bảng bên và quét lại.

Kiểm thử trình duyệt dùng Playwright được cài riêng trong môi trường phát triển (`npm install --no-save playwright` nếu chưa có), cùng Chrome mới hỗ trợ CDP `Extensions.loadUnpacked` / `Extensions.triggerAction`. Chạy `npm run test:browser`; có thể đặt `CHROME_PATH` nếu Chrome nằm ngoài đường dẫn mặc định. Script mở profile kiểm thử riêng, không sửa profile Chrome cá nhân, và dọn profile kiểm thử sau khi chạy. Các cờ phục vụ kiểm thử chỉ được đặt cho tiến trình Chrome riêng này, không cần dùng khi cài extension bình thường.

Kiểm thử logic bao gồm bộ 200 câu, đáp án số/dấu so sánh đã rà soát, xáo trộn thứ tự và chặn dùng sai form. Kiểm thử trình duyệt có luồng tự nạp đáp án mà không nhập JSON, điền 200 câu và giữ trống các trường thông tin cá nhân. Fixture Microsoft Forms được chặn và trả nội dung local; kết quả không thay thế kiểm thử form Microsoft thật sau đăng nhập. Kết quả cụ thể ở `test-results/browser-summary.json` sau khi chạy test.

## Xử lý nhanh khi có lỗi

| Hiện tượng | Cách xử lý |
| --- | --- |
| Chrome báo thiếu manifest | Chọn thư mục chứa trực tiếp `manifest.json`: thư mục vừa giải nén của ZIP 0.2.2, hoặc `extension` nếu dùng mã nguồn |
| Chưa có quyền đọc tab | Trở lại tab form và bấm biểu tượng extension, rồi Quét form |
| Không thấy câu hỏi | Đợi trang tải, đăng nhập nếu cần; kiểm tra đang ở trang trả lời `ResponsePage.aspx` |
| JSON không nhập được | Kiểm tra thông báo câu lỗi; `answer` phải đúng kiểu, không trống và nằm trong `options` |
| 0 câu khớp | Xuất mẫu từ chính form này; kiểm tra `sourceForm`, nội dung và loại câu hỏi |
| Câu đã có đáp án không được chọn | Bật ghi đè và bấm Chọn câu có đáp án, hoặc chọn từng câu |
| Form thay đổi / bản xem trước cũ | Quét lại; kế hoạch cũ được chặn để tránh điền nhầm |
| Sau cập nhật không kết nối được | Reload extension, tải lại tab form rồi bấm biểu tượng extension |

## Lộ trình

- [x] Khởi tạo extension Manifest V3 và bảng bên, không cần build.
- [x] Tạo schema JSON, chức năng nhập, lưu, xuất và xóa bộ đáp án.
- [x] Xây bộ ghép câu hỏi, xử lý câu trùng và lựa chọn đảo thứ tự.
- [x] Thêm điền có chọn lọc, xác minh, báo lỗi và hoàn tác.
- [x] Thêm form demo, bộ đáp án và kiểm thử tự động trên Chrome.
- [x] Tích hợp 200 đáp án từ PDF, gắn với form Quy chế 2026.1 và tự nạp/tự quét khi mở bảng bên.
- [ ] Khảo sát thêm form Microsoft thật sau đăng nhập.
- [ ] Kiểm thử Choice/Text trên Microsoft Forms thực tế, giao diện tiếng Việt/Anh và phiên đăng nhập nếu có.
- [ ] Kiểm tra dừng tác vụ khi gặp trang tạo form, form đóng, thiếu quyền hoặc câu hỏi thay đổi do phân nhánh.
- [ ] Bổ sung AI, CSV và adapter mới sau MVP.

Thiết kế ban đầu và định hướng mở rộng nằm trong [báo cáo](./REPORT.md). README phản ánh bản mã nguồn hiện tại.

## Nguyên tắc triển khai

- Câu thiếu hoặc mơ hồ được bỏ qua và báo rõ.
- Kết quả điền phải được đọc lại từ form trước khi báo thành công.
- Mỗi lần điền gắn với đúng tab, tài liệu và phiên quét; kiểm tra lại nếu DOM thay đổi.
- Chế độ JSON local không gửi nội dung form tới dịch vụ ngoài.
- Khi có AI, người dùng xem dữ liệu sẽ gửi và duyệt đề xuất trước khi điền; khóa nhà cung cấp được giữ ở backend.
- Form có thể tự lưu bản nháp khi giá trị thay đổi; hoàn tác giao diện không bảo đảm thu hồi dữ liệu đã lưu trên hệ thống form.

## Đóng góp và giấy phép

Khi báo lỗi hoặc đề xuất adapter, cung cấp form mẫu được phép chia sẻ, loại câu hỏi, kết quả mong đợi và cách tái hiện. Dùng dữ liệu giả cho bộ fixture.

Dự án chưa chọn giấy phép. Cần thêm file `LICENSE` trước khi công bố điều kiện sử dụng và phân phối mã nguồn.
#   A u t o - F i l l - F o r m  
 
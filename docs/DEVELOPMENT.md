# Phát triển, kiểm thử và đóng gói

Mã nguồn v0.5.0 là JavaScript thuần, Chrome Manifest V3. Nạp trực tiếp thư mục extension/; không cần npm install hay build để sử dụng. [README](../README.md) dành cho người dùng, [REPORT](../REPORT.md) mô tả kiến trúc.

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| extension/ | Mã tiện ích, manifest, giao diện, adapter, hai bộ đáp án |
| examples/ | File JSON demo |
| data/ | Nguồn và đối chiếu bộ Quy chế |
| scripts/ | Đóng gói và công cụ chuyển dữ liệu theo bố cục PDF riêng |
| tests/ | Unit test, trình duyệt và fixture Moodle |
| docs/ | Định dạng JSON và hướng dẫn phát triển |
| release/, test-results/, tmp/ | Đầu ra cục bộ, không theo dõi trong Git |

Gói cài đặt được làm phẳng từ extension/ nên không có thư mục extension/ ở gốc. Gói này kèm tài liệu, nhưng mã kiểm thử/script phát triển cần dùng từ repository.

## Môi trường kiểm thử

Đã chạy bằng **Node.js 24.20.0**, Playwright từ runtime của môi trường phát triển và **Chrome 155.0.8059.86** trên Windows. package.json chưa pin dependency/lockfile cho Playwright; phiên bản khác cần kiểm tra lại.

- Unit và đóng gói dùng module Node tích hợp; không cần dependency npm.
- Kiểm thử trình duyệt cần Node resolve được module playwright. Có thể cài riêng bằng `npm install --no-save --package-lock=false playwright`, hoặc đặt NODE_PATH tới node_modules có sẵn.
- CHROME_PATH trỏ tới chrome.exe nếu khác mặc định `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- Browser test dùng CDP Extensions.loadUnpacked và cờ --enable-unsafe-extension-debugging; Chrome dùng để kiểm thử phải hỗ trợ API này. Đây không phải yêu cầu người dùng bật khi nạp thủ công.
- Đóng ZIP và package smoke hiện gọi PowerShell Compress-Archive/Expand-Archive, phục vụ Windows. Script package trên hệ khác chỉ chuẩn bị thư mục, chưa tạo ZIP.

Ví dụ PowerShell khi dùng Chrome ở đường dẫn khác:

```powershell
$env:CHROME_PATH = 'C:\DuongDan\Chrome\Application\chrome.exe'
npm test
npm run test:browser
npm run test:json
npm run test:lms
npm run test:auto
npm run package
node tests/package-smoke.cjs
```

Chạy trong thư mục repository. Nếu PowerShell chặn npm.ps1 theo chính sách máy, dùng npm.cmd cho các lệnh npm trên.

## Phạm vi kiểm tra

| Lệnh | Mốc đạt v0.5.0 | Nội dung |
| --- | --- | --- |
| npm test | 41 test | Schema/ghép, bộ đi kèm, thư viện, nền tảng và kế hoạch tự chạy |
| npm run test:browser | 15 bước | Forms fixture: quét/điền/xác minh/bảo vệ/hoàn tác |
| npm run test:json | 12 bước | Nhập/soạn/lưu/xuất, liên kết, xung đột và migration |
| npm run test:lms | 10 bước | Moodle fixture: loại câu, bảo vệ/ghi đè, hoàn tác và phạm vi URL |
| npm run test:auto | 8 bước | Next, thiếu đáp án/tiếp tục, câu chưa hỗ trợ, pause/stop, trang cuối và timeout |
| node tests/package-smoke.cjs | Gói nạp được | Giải nén ZIP thực tế, so sánh byte mã chạy, manifest gốc, Chrome và bộ 200/351 câu |

Tổng kiểm thử trình duyệt là **45 bước**. Profile kiểm thử riêng; các request Forms/HUST trong fixture được chặn và trả dữ liệu cục bộ, không điền/nộp quiz thật. Output và ảnh nằm trong test-results/; chỉ được tạo sau khi chạy test.

**Chưa xác nhận điền sau đăng nhập trên Microsoft Forms/HUST thật.** Fixture không chứng minh tương thích mọi theme, cấu hình hay máy chủ lưu/chấm đúng. Đăng nhập, đồng hồ, quyền truy cập và hành vi tự lưu thuộc website đích.

## Đóng gói

```powershell
npm run package
node tests/package-smoke.cjs
```

Tạo release/auto-fill-form-0.5.0/ và ZIP cùng tên. manifest.json phải ở gốc ZIP, cùng mã chạy, data/, examples/ và tài liệu. Chọn thư mục vừa giải nén khi Load unpacked. Không đổi thành phần mở rộng CRX; Chrome nạp thư mục.

release/ không có trong Git. Cần tự tạo gói từ checkout muốn phát hành; Download ZIP của GitHub chỉ tải mã nguồn. Chưa có workflow tự động phát hành hoặc ký CRX.

Sau khi sửa, kiểm tra phiên bản trong package.json, manifest và nhãn giao diện nếu phát hành phiên bản mới. Chạy các test phù hợp với phần đã sửa, kiểm tra ZIP sau sửa đóng gói. Tài liệu có liên kết tương đối phải dùng được cả repository lẫn gói cài.

## Dữ liệu và giới hạn phát triển

Không commit profile Chrome, session đăng nhập, token truy cập, file PDF gốc riêng tư hoặc đầu ra chuyển đổi chưa được duyệt. Hai bộ JSON đã tích hợp thuộc mã nguồn hiện tại; công cụ PDF không phải chức năng nhập PDF tổng quát trong tiện ích.

Không thêm thao tác Finish/Submit vào tự chạy. Thay đổi adapter cần fixture cho DOM mới, kiểm tra giữ đáp án cũ, xác minh giá trị và hoàn tác. Quyền hiện tại xem [README](../README.md); thay đổi quyền cần được ghi rõ trong hướng dẫn cập nhật.

[JSON](./JSON_FORMAT.md) · [LMS](../LMS_HUST.md) · [Lịch sử](../CHANGELOG.md)

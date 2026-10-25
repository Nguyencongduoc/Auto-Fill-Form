"""Package reviewed OCR data. Corrections below are transcriptions of source pixels."""
import hashlib
import json
from pathlib import Path

records=json.loads(Path('tmp/pdfs/refined.json').read_text(encoding='utf-8'))
answer_corrections={
    5:'Đăng ký trực tuyến trên hệ thống quản lý đào tạo (eHUST/QLĐT) theo các đợt thông báo',
    20:'Chi trả định kỳ theo từng tháng dựa trên số tháng thực học',
    28:'3(3-0-0-6)',
    38:'CPA ≥ 3,2',
    56:'GPA ≥ 2,5 và ĐRL ≥ 65',
    79:'GPA ≥ 3,6 và ĐRL ≥ 90',
    89:'Xúc phạm nhân phẩm nhà giáo/người học; Xuyên tạc nội dung giáo dục; Gian lận trong học tập/thi; Hút thuốc, uống rượu bia, gây rối trật tự',
    94:'4(2-4-0-8)',
    116:'ĐRL ≥ 80 điểm',
    124:'CPA ≥ 2,00',
    145:'GPA ≥ 2,0',
    164:'ĐRL ≥ 70 điểm',
    177:'Áp dụng cho toàn bộ sinh viên các khóa đối với chứng chỉ cấp từ ngày quy định có hiệu lực; nếu mức mới khác cũ thì áp dụng mức cao hơn',
    190:'Chứng chỉ IELTS Academic 6.0 trở lên (hoặc TOEFL iBT tương đương)',
    193:'Bắt buộc phải đăng ký tốt nghiệp đồng thời trong cùng một đợt cho cả hai CTĐT',
    200:'CPA ≥ 2,5 (từ loại khá trở lên) và không bị cảnh báo học tập'
}
answers=[]
for rec in records:
    selected=rec['selectedIndices'][0]
    options=rec['options'][:]
    if rec['number'] in [12,38,56,79,82,116,124,145,164,200]:
        options=[value.replace(' > ', ' ≥ ') for value in options]
    if rec['number'] in [106,136,156]: options[3]='Bậc 5'
    if rec['number']==126: options[3]='Có giá trị vô thời hạn'
    if rec['number']==28: options[0]='2(2-0-0-4)'
    if rec['number']==125: options[1]='4(2-4-0-8)'
    if rec['number'] in answer_corrections:options[selected]=answer_corrections[rec['number']]
    question=rec['question'].replace('VỊ trí','Vị trí').replace('(sửa đối), điếm','(sửa đổi), điểm').replace('TCHP. không?','TCHP không?').replace('làgì?','là gì?').replace('GenAl','GenAI').replace('¡CTSV','iCTSV')
    if rec['number']==173:question=question.replace('GPA > 3.2, ĐRL > 80','GPA ≥ 3.2, ĐRL ≥ 80')
    answers.append({'questionId':f"quy-che-{rec['number']:03d}",'question':question,'type':'single_choice','options':options,'answer':[options[selected]],'sourceNumber':rec['number'],'sourcePage':rec['page']})

bank={'schemaVersion':1,'name':'Đáp án Quy chế 2026.1 (PDF)','matching':'document_ocr','sourceForm':{'platform':'microsoft_forms','formId':'n7jxBugHT0a0COwbRXA_MYHyGUaEfhNNu2j97QvQaYlUOUxLS1VGWEJOVURPM0pUWTRJWks3S0pBRy4u'},'answers':answers}
out=Path('extension/data');out.mkdir(parents=True,exist_ok=True)
(out/'quy-che-2026.1.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
audit=Path('data');audit.mkdir(exist_ok=True)
source=Path(r'C:\Users\Admin\Downloads\ĐÁP ÁN QUY CHẾ 2026.1.docx.pdf')
metadata={'document':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pages':52,'screenshots':102,'answers':len(answers),'sourceQuestionNumbers':list(range(1,201)),'method':'Local Vietnamese OCR + selected radio geometry; isolated-option OCR; visual review of all 200 selected option crops; corrected transcription of operators and OCR artifacts.','selectedAnswerCorrections':{str(k):v for k,v in answer_corrections.items()},'realFormVerified':False}
(audit/'answer-source-audit.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(audit/'ANSWERS.md').write_text('# Đáp án đã tích hợp\n\n200 câu theo lựa chọn được đánh dấu trong PDF do người dùng cung cấp. Số câu dưới đây là số trong tài liệu, không dùng làm khóa điền trên form.\n\n'+ '\n'.join(f"- **{a['sourceNumber']}.** {a['question']}\n  - Đáp án: {a['answer'][0]} (PDF trang {a['sourcePage']})" for a in answers)+'\n',encoding='utf-8')
print(f"Built {len(answers)} bundled answers")

/* Locally authored fixture reflecting Moodle 3.x label and 4.x aria-labelledby markup. */
const baseBank = {
 schemaVersion:1,name:'LMS integration fixture',answers:[
  {questionId:'a',question:'Pha đầu tiên trong vòng đời phát triển phần mềm là gì ?',type:'single_choice',options:['Phân tích (analysis).','Phát triển (implemention).','Lập kế hoạch (planning).','Triển khai (deployment).'],answer:['Lập kế hoạch (planning).']},
  {questionId:'b',question:'Chọn các số nguyên tố',type:'multiple_choice',options:['2','3','4'],answer:['2','3']},
  {questionId:'c',question:'Một biểu đồ hoạt động chỉ có thể có 1 nút bắt đầu và 1 nút kết thúc',type:'single_choice',options:['True','False'],answer:['False']},
  {questionId:'d',question:'Điền kết quả: 2 + 2 = ?',type:'short_text',answer:'4'},
  {questionId:'e',question:'Thông điệp ngắn',type:'short_text',answer:'Xin chào'}
 ]};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function fixture({quiz='49373',page=0,usage='991',locked=false,legacy=false,questions=baseBank.answers,unsupported=true}={}){
 let html=`<!doctype html><html lang="vi"><meta charset="utf-8"><title>Quiz HUST fixture</title><style>body{font:16px Arial}.que{margin:20px;padding:12px;border:1px solid #ccc}.answer>div{display:flex;gap:6px;margin:7px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.qtext p{margin:0} img{width:15px;height:15px}</style><nav aria-label="breadcrumb"><ol class="breadcrumb"><li><a href="/course/view.php?id=123">Khóa học</a></li><li><a href="/mod/quiz/view.php?id=${quiz}">Quiz fixture</a></li></ol></nav><header id="page-header"><h1>Quiz HUST fixture</h1></header><form id="responseform" action="/mod/quiz/processattempt.php" method="post"><input type="hidden" name="attempt" value="991"><input type="hidden" name="sesskey" value="LOCAL_TEST_ONLY">`;
 questions.forEach((q,i)=>{
  const slot=i+1+page*20,prefix=`q${usage}:${slot}_`,boolean=q.options?.join(',')==='True,False';
  html+=`<div class="que ${q.type==='short_text'?'shortanswer':boolean?'truefalse':'multichoice'}" id="question-${usage}-${slot}"><div class="info"><h3>Question ${slot}</h3><input type="checkbox" name="flag-${slot}" aria-label="Đánh dấu câu"></div><div class="content"><div class="formulation"><input type="hidden" name="${prefix}:sequencecheck" value="1"><div class="qtext"><p>${esc(q.question)}</p></div><div class="ablock"><div class="prompt">${q.type==='multiple_choice'?'Select one or more:':'Select one:'}</div><div class="answer">`;
  if(q.type==='short_text')html+=`<label for="${prefix}answer">Answer:</label><input type="text" name="${prefix}answer" id="${prefix}answer" maxlength="100" ${locked?'disabled':''}>`;
  else [...q.options].reverse().forEach((option,j)=>{
   const field=q.type==='multiple_choice'?`choice${j}`:'answer',id=`${prefix}answer${j}`,value=boolean?(option==='True'?'1':'0'):q.type==='multiple_choice'?'1':j;
   const label=boolean?(option==='True'?'Đúng':'Sai'):option;
   html+=`<div class="r${j%2}">${q.type==='multiple_choice'?`<input type="hidden" name="${prefix}${field}" value="0">`:''}<input type="${q.type==='multiple_choice'?'checkbox':'radio'}" name="${prefix}${field}" id="${id}" value="${value}" ${legacy||boolean?'':`aria-labelledby="${id}_label"`} ${locked?'disabled':''}>`;
   html+=legacy||boolean?`<label for="${id}">${boolean?'':`<span class="answernumber">${String.fromCharCode(97+j)}. </span>`}${esc(label)}</label>`:`<div data-region="answer-label" id="${id}_label"><span class="answernumber">${String.fromCharCode(97+j)}. </span><div class="flex-fill ms-1">${esc(label)}</div><span class="accesshide">Feedback hidden</span></div>`;
   html+='</div>';
  });
  html+='</div>';
  if(q.type==='single_choice'&&!boolean)html+=`<div class="qtype_multichoice_clearchoice"><input type="radio" class="sr-only" aria-hidden="true" id="${prefix}clear" name="${prefix}answer" value="-1" checked><label for="${prefix}clear">Clear my choice</label></div>`;
  html+='</div></div><div class="outcome"><div class="rightanswer">Ignored feedback, not a choice</div></div></div></div>';
 });
 if(unsupported)html+='<div class="que match" id="question-991-900"><div class="formulation"><div class="qtext">Ghép đôi</div><div class="answer"><select><option>Chọn</option></select></div></div></div><div class="que multichoice" id="question-991-901"><div class="formulation"><div class="qtext">Lựa chọn chỉ có hình</div><div class="answer"><label><input type="radio" name="images" value="1"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></label><label><input type="radio" name="images" value="2"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></label></div></div></div>';
 return html+'<button name="next" type="submit">Next page</button><button name="finishattempt" type="submit">Finish attempt</button></form></html>';
}
module.exports={fixture,baseBank};

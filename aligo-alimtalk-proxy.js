/*
 * ============================================================================
 *  알리고(Aligo) 카카오 알림톡 프록시 서버
 * ============================================================================
 *
 *  대시보드(브라우저)와 알리고 사이에서 API 키를 안전하게 보관하며 발송을
 *  대신 해주는 작은 중계 프로그램입니다. 학원 PC에서 실행해두면 됩니다.
 *
 *  ── 사용 준비 (한 번만) ─────────────────────────────────────────────
 *  1. Node.js 설치: https://nodejs.org 에서 LTS 버전 다운로드 → 설치
 *  2. 알리고 스마트문자(https://smartsms.aligo.in) → 카카오 알림톡 신청:
 *     - 카카오 비즈니스 채널 연동 + 발신프로필(senderKey) 발급
 *     - API 키 발급 (발송 서버 IP에는 "학원 PC의 공인 IP"를 등록:
 *       네이버에 "내 IP" 검색하면 나오는 숫자)
 *     - 알림톡 템플릿 등록 → 승인 (아래 TEMPLATES의 문구 참고)
 *  3. 아래 [설정] 칸에 발급받은 값들을 채워넣고 파일 저장
 *
 *  ── 실행 방법 ───────────────────────────────────────────────────────
 *  이 파일이 있는 폴더에서:  node aligo-alimtalk-proxy.js
 *  (창을 닫으면 발송이 안 되니, 발송할 때는 켜두세요)
 *
 *  ── 대시보드 연결 ───────────────────────────────────────────────────
 *  대시보드 관리자 탭 → "알림톡 프록시 URL"에 입력:  http://localhost:8787
 *
 *  ※ 알림톡 템플릿은 카카오 심사를 통과한 문구 그대로만 발송할 수 있습니다.
 *    알리고 콘솔에서 템플릿을 만들어 승인받은 뒤, 아래 TEMPLATES의
 *    tplCode(승인받은 템플릿 코드)와 build(승인받은 문구와 똑같은 형식)를
 *    맞춰주세요.
 * ============================================================================
 */

/* ─────────────────────────── [설정] 여기를 채우세요 ─────────────────────── */
const CONFIG = {
  APIKEY: "여기에_알리고_API키",          // 알리고에서 발급받은 API Key
  USERID: "여기에_알리고_아이디",         // 알리고 로그인 아이디
  SENDERKEY: "여기에_발신프로필_키",      // 카카오 발신프로필(senderKey)
  SENDER: "01000000000",                  // 알리고에 등록한 발신번호 (숫자만)
  PORT: 8787,                             // 프록시 포트 (대시보드 URL과 맞출 것)
};

// 대시보드가 보내는 templateCode → 알리고 승인 템플릿 매핑.
// tplCode는 알리고 콘솔의 승인된 템플릿 코드(예: "TX_1234")로 바꾸고,
// build()가 만드는 문구는 승인받은 템플릿 문구와 정확히 같은 형식이어야 합니다.
const TEMPLATES = {
  payment_reminder: {
    tplCode: "여기에_승인템플릿코드",
    subject: "수강료 안내",
    build: (v) => `안녕하세요. ${v.academyName}입니다.
${v.date} 기준으로 수강료가 아직 결제되지 않아 안내드립니다.
확인 후 결제 부탁드립니다.

이미 결제하셨다면 이 안내는 무시해 주세요.
궁금하신 점은 학원으로 문의해 주세요.`,
  },
  // 결제 예정 안내: 결제일이 다가온(오늘·내일) 학생 학부모에게 미리 안내.
  // 학생 이름·결제일이 사람마다 다르게 들어가는 개인화 발송.
  payment_upcoming: {
    tplCode: "여기에_승인템플릿코드",
    subject: "수강료 결제 예정 안내",
    build: (v) => `안녕하세요. ${v.academyName}입니다.
${v.studentName} 학생의 수강료 결제일(${v.dueDate})이 다가와 미리 안내드립니다.
기한 내 결제 부탁드립니다.

이미 결제하셨다면 이 안내는 무시해 주세요.
궁금하신 점은 학원으로 문의해 주세요.`,
  },
  // 데일리 리포트: 하루치 출결·수업 진도·숙제·시험 결과 + 최근 숙제 이행률
  daily_report: {
    tplCode: "여기에_승인템플릿코드",
    subject: "데일리 리포트",
    build: (v) => `안녕하세요? ${v.studentName} 학부모님.
${v.academyName} ${v.date} 데일리 리포트입니다.

■ 출결: ${v.attendance}
■ 수업 진도: ${v.lesson}
■ 숙제: ${v.homework}
■ 시험: ${v.test}
■ 최근 숙제 이행률: ${v.hwRate}

궁금하신 점은 학원으로 문의해 주세요.`,
  },
  report: {
    tplCode: "여기에_승인템플릿코드",
    subject: "Weekly Report",
    // 강조표기형 템플릿: 강조 제목(emtitle)도 승인받은 값과 똑같아야 합니다.
    emtitle: "Weekly Report",
    build: (v) => `안녕하세요? ${v.studentName} 학부모님.
${v.academyName}에서 ${v.studentName} 학생의 주간 학습리포트를 보내드립니다.

■ 반: ${v.className}
■ 기간: ${v.rangeStart} ~ ${v.rangeEnd}
■ 출석률: ${v.attendanceRate}
■ 숙제 제출률: ${v.homeworkRate}
■ 단어/문법시험: ${v.testResults || "시험 없음"}
■ 최근 시험 점수: ${v.recentScore}
■ 강사 코멘트: ${v.comment || "-"}

궁금하신 점은 학원으로 문의해 주세요.`,
  },
  // 먼슬리 리포트: 강조표기형 + "상세 리포트 보기" 웹링크 버튼.
  // 버튼 링크(reportUrl)에는 리포트 내용이 담긴 열람 전용 주소가 들어간다.
  monthly_report: {
    tplCode: "여기에_승인템플릿코드",
    subject: "Monthly Report",
    emtitle: "Monthly Report",
    button: { name: "상세 리포트 보기" },
    build: (v) => `안녕하세요? ${v.studentName} 학부모님.
${v.academyName}에서 ${v.month} 월간 학습리포트를 보내드립니다.

■ 반: ${v.className}
■ 출석률: ${v.attendanceRate}
■ 숙제 제출률: ${v.homeworkRate}
■ 단어/문법시험: ${v.testResults || "시험 없음"}

아래 버튼을 누르면 상세 리포트를 확인할 수 있습니다.
궁금하신 점은 학원으로 문의해 주세요.`,
  },
  notice: {
    tplCode: "여기에_승인템플릿코드",
    subject: "수업·일정 안내",
    build: (v) => `안녕하세요. ${v.academyName}입니다.
재원생 학부모님께 학원 수업·일정 관련 안내 말씀드립니다.

■ 안내: ${v.title}
■ 내용: ${v.content}
■ 안내일: ${v.date}

본 안내는 수신 동의하신 재원생 학부모님께 발송됩니다.
궁금하신 점은 학원으로 문의해 주세요.`,
  },
};
/* ────────────────────────────── 설정 끝 ─────────────────────────────────── */

/* 같은 폴더에 aligo-config.json 파일이 있으면 그 값을 우선 사용합니다.
   → 프로그램 파일(이 파일)을 새 버전으로 교체해도 설정 파일만 그대로 두면
     API 키나 템플릿 코드를 다시 입력할 필요가 없습니다. */
let configFileLoaded = false;
try {
  const fs0 = require("fs");
  const path0 = require("path");
  const fileCfg = JSON.parse(fs0.readFileSync(path0.join(__dirname, "aligo-config.json"), "utf8"));
  ["APIKEY", "USERID", "SENDERKEY", "SENDER"].forEach((k) => {
    if (fileCfg[k] && !String(fileCfg[k]).startsWith("여기에")) CONFIG[k] = String(fileCfg[k]).trim();
  });
  const tplMap = { TPL_PAYMENT: "payment_reminder", TPL_UPCOMING: "payment_upcoming", TPL_DAILY: "daily_report", TPL_REPORT: "report", TPL_MONTHLY: "monthly_report", TPL_NOTICE: "notice" };
  Object.keys(tplMap).forEach((k) => {
    if (fileCfg[k] && !String(fileCfg[k]).startsWith("여기에")) TEMPLATES[tplMap[k]].tplCode = String(fileCfg[k]).trim();
  });
  configFileLoaded = true;
} catch (e) { /* 설정 파일이 없으면 이 파일 안의 CONFIG 값을 그대로 사용 */ }

const http = require("http");
const https = require("https");
const { URLSearchParams } = require("url");

function postForm(host, path, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request(
      { host, path, method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("알리고 응답 해석 실패: " + data.slice(0, 200))); }
        });
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

async function createToken() {
  const r = await postForm("kakaoapi.aligo.in", "/akv10/token/create/30/s", {
    apikey: CONFIG.APIKEY,
    userid: CONFIG.USERID,
  });
  if (String(r.code) !== "0" || !r.token) throw new Error("토큰 발급 실패: " + (r.message || JSON.stringify(r)));
  return r.token;
}

async function sendAlimtalk(receivers, templateCode, variables) {
  const tpl = TEMPLATES[templateCode];
  if (!tpl) throw new Error("알 수 없는 템플릿: " + templateCode);
  const token = await createToken();
  // 한 요청에 여러 명 발송 (receiver_1, message_1, receiver_2, ...)
  // 받는 사람은 "01012345678" 같은 번호 문자열, 또는 사람마다 다른 문구가 필요할 때
  // { phone, variables } 형태 둘 다 지원한다 (예: 결제 예정 안내의 학생 이름·결제일).
  const params = {
    apikey: CONFIG.APIKEY,
    userid: CONFIG.USERID,
    token,
    senderkey: CONFIG.SENDERKEY,
    tpl_code: tpl.tplCode,
    sender: CONFIG.SENDER,
  };
  receivers.slice(0, 100).forEach((r, i) => {
    const n = i + 1;
    const phone = typeof r === "object" && r !== null ? r.phone : r;
    const vars = typeof r === "object" && r !== null
      ? Object.assign({}, variables || {}, r.variables || {})
      : (variables || {});
    params["receiver_" + n] = String(phone).replace(/[^0-9]/g, "");
    params["subject_" + n] = tpl.subject;
    params["message_" + n] = tpl.build(vars);
    if (tpl.emtitle) params["emtitle_" + n] = tpl.emtitle;
    // 템플릿에 웹링크 버튼이 등록된 경우, 승인된 버튼 이름과 함께 링크를 전달
    if (tpl.button) {
      params["button_" + n] = JSON.stringify({
        button: [{
          name: tpl.button.name,
          linkType: "WL",
          linkTypeName: "웹링크",
          linkMo: vars.reportUrl || "",
          linkPc: vars.reportUrl || "",
        }],
      });
    }
  });
  const r = await postForm("kakaoapi.aligo.in", "/akv10/alimtalk/send/", params);
  if (String(r.code) !== "0") throw new Error("발송 실패: " + (r.message || JSON.stringify(r)));
  return r;
}

const server = http.createServer((req, res) => {
  // 대시보드(다른 주소)에서 호출할 수 있도록 CORS 허용
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method !== "POST") { res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }); res.end("알림톡 프록시 동작 중입니다. 대시보드에서 발송 버튼을 눌러주세요."); return; }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      const { to, templateCode, variables } = JSON.parse(body || "{}");
      const receivers = (Array.isArray(to) ? to : [to]).filter(Boolean);
      if (!receivers.length) throw new Error("받는 사람 번호가 없습니다");
      const result = await sendAlimtalk(receivers, templateCode, variables);
      console.log(`[발송 완료] ${templateCode} → ${receivers.length}명`);
      res.end(JSON.stringify({ success: true, result }));
    } catch (e) {
      console.error("[발송 실패]", e.message);
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
});

server.listen(CONFIG.PORT, () => {
  console.log("─".repeat(50));
  console.log("알리고 알림톡 프록시가 실행되었습니다.");
  if (configFileLoaded) console.log("설정 파일(aligo-config.json)을 불러왔습니다.");
  console.log(`대시보드 관리자 탭의 알림톡 프록시 URL에 입력: http://localhost:${CONFIG.PORT}`);
  console.log("이 창을 닫으면 발송이 중단됩니다.");
  console.log("─".repeat(50));
});

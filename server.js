const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// 미들웨어 설정
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// MySQL 연결 설정
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1q2w3e4r", // MySQL 비밀번호
  database: "plastic_usage", // 데이터베이스 이름
});

// MySQL 연결 확인
db.connect((err) => {
  if (err) {
    console.error("MySQL 연결 실패:", err.message);
    process.exit(1); // 연결 실패 시 서버 종료
  }
  console.log("MySQL 연결 성공!");
});

// 플라스틱 데이터 저장 API
app.post("/save", (req, res) => {
  const { date, smallCount, mediumCount, largeCount, totalWeight } = req.body;

  // 요청 데이터 디버깅
  console.log("요청 데이터:", req.body);

  // 데이터 유효성 검사
  if (
    !date ||
    smallCount == null ||
    mediumCount == null ||
    largeCount == null ||
    totalWeight == null
  ) {
    console.error("유효하지 않은 요청 데이터:", req.body);
    return res.status(400).send("필수 데이터가 누락되었습니다.");
  }

  // SQL 쿼리와 값 디버깅
  const sql = `
    INSERT INTO plastic_data (id, date, small_count, medium_count, large_count, total_weight)
    VALUES (NULL, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    small_count = VALUES(small_count),
    medium_count = VALUES(medium_count),
    large_count = VALUES(large_count),
    total_weight = VALUES(total_weight)
  `;
  console.log("SQL 쿼리:", sql);
  console.log("SQL 값:", [
    date,
    smallCount,
    mediumCount,
    largeCount,
    totalWeight,
  ]);

  // 데이터 삽입
  db.query(
    sql,
    [date, smallCount, mediumCount, largeCount, totalWeight],
    (err, result) => {
      if (err) {
        console.error("데이터 저장 실패:", err.message);
        return res.status(500).send("데이터 저장 실패");
      }
      console.log("데이터 저장 성공:", result);
      res.send("데이터 저장 성공");
    }
  );
});

// 기본 경로 '/'에 대해 calendar.html 반환
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "public", "calendar.html");
  console.log("calendar.html 반환:", filePath);
  res.sendFile(filePath);
});

// 404 핸들링 (없는 API 요청에 대한 처리)
app.use((req, res) => {
  console.warn("요청된 경로를 찾을 수 없습니다:", req.url);
  res.status(404).send("요청된 경로를 찾을 수 없습니다.");
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

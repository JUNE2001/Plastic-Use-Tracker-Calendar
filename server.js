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

  // 데이터 삭제 후 삽입
  const deleteSql = `DELETE FROM plastic_data WHERE date = ?`;
  const insertSql = `
    INSERT INTO plastic_data (date, small_count, medium_count, large_count, total_weight)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(deleteSql, [date], (deleteErr, deleteResult) => {
    if (deleteErr) {
      console.error("데이터 삭제 실패:", deleteErr.message);
      return res.status(500).send("데이터 삭제에 실패했습니다.");
    }

    console.log("기존 데이터 삭제 성공:", deleteResult.affectedRows);

    // 새 데이터 삽입
    db.query(
      insertSql,
      [date, smallCount, mediumCount, largeCount, totalWeight],
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error("데이터 삽입 실패:", insertErr.message);
          return res.status(500).send("데이터 저장에 실패했습니다.");
        }

        console.log("데이터 저장 성공:", insertResult);
        res.send("데이터 저장 성공");
      }
    );
  });
});

// 특정 날짜의 데이터를 조회하는 API
app.get("/data", (req, res) => {
  const { date } = req.query;

  if (!date) {
    console.warn("날짜가 제공되지 않았습니다.");
    return res.status(400).send("날짜가 제공되지 않았습니다.");
  }

  const sql = `
    SELECT small_count, medium_count, large_count, total_weight
    FROM plastic_data
    WHERE date = ?
  `;

  console.log("데이터 조회 SQL:", sql, "날짜:", date);

  db.query(sql, [date], (err, results) => {
    if (err) {
      console.error("데이터 조회 실패:", err.message);
      return res.status(500).send("데이터 조회에 실패했습니다.");
    }

    if (results.length > 0) {
      console.log("조회된 데이터:", results[0]);
      res.json(results[0]); // 데이터가 있을 경우 반환
    } else {
      console.log("해당 날짜의 데이터가 없습니다.");
      res.status(404).send("해당 날짜의 데이터가 없습니다."); // 404 반환
    }
  });
});

// 기본 경로 '/'에 대해 calendar.html 반환
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "public", "calendar.html");
  console.log("calendar.html 반환:", filePath);
  res.sendFile(filePath);
});

// 월별 데이터 조회 API
app.get("/monthly-data", (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).send("연도와 월이 제공되지 않았습니다.");
  }

  // 해당 월의 모든 데이터 조회
  const sql = `
    SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date, total_weight
    FROM plastic_data
    WHERE YEAR(date) = ? AND MONTH(date) = ?
  `;

  db.query(sql, [year, month], (err, results) => {
    if (err) {
      console.error("월별 데이터 조회 실패:", err.message);
      return res.status(500).send("월별 데이터를 조회하는 데 실패했습니다.");
    }

    res.json(results); // 조회된 데이터를 반환
  });
});

app.get("/monthly-comparison-data", (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: "연도와 월이 필요합니다." });
  }

  const currentMonthQuery = `
    SELECT SUM(total_weight) AS currentTotal
    FROM plastic_data
    WHERE YEAR(date) = ? AND MONTH(date) = ?
  `;
  const previousMonthQuery = `
    SELECT SUM(total_weight) AS previousTotal
    FROM plastic_data
    WHERE YEAR(date) = ? AND MONTH(date) = ?
  `;

  db.query(currentMonthQuery, [year, month], (err, currentResults) => {
    if (err) {
      console.error("현재 월 데이터 조회 실패:", err.message);
      return res.status(500).json({ error: "데이터 조회 실패" });
    }

    const previousYear = month === 1 ? year - 1 : year;
    const previousMonth = month === 1 ? 12 : month - 1;

    db.query(
      previousMonthQuery,
      [previousYear, previousMonth],
      (err, previousResults) => {
        if (err) {
          console.error("이전 월 데이터 조회 실패:", err.message);
          return res.status(500).json({ error: "데이터 조회 실패" });
        }

        const currentTotal = currentResults[0]?.currentTotal || 0;
        const previousTotal = previousResults[0]?.previousTotal || 0;

        res.json({ currentTotal, previousTotal });
      }
    );
  });
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

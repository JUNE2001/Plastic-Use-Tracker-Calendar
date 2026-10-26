const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

// 미들웨어 설정
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// SQLite 데이터베이스 연결
const sqlite = new DatabaseSync("plastic_usage.db");
const db = {
  run(sql, params, callback) {
    if (typeof params === "function") {
      callback = params;
      params = [];
    }
    try {
      sqlite.prepare(sql).run(...(params || []));
      callback?.(null);
    } catch (err) {
      callback?.(err);
    }
  },
  get(sql, params, callback) {
    try {
      callback(null, sqlite.prepare(sql).get(...(params || [])));
    } catch (err) {
      callback(err);
    }
  },
  all(sql, params, callback) {
    try {
      callback(null, sqlite.prepare(sql).all(...(params || [])));
    } catch (err) {
      callback(err);
    }
  },
};
console.log("SQLite 연결 성공!");

// 테이블 초기화
const initTableSql = `
  CREATE TABLE IF NOT EXISTS plastic_data (
    date TEXT PRIMARY KEY,
    small_count INTEGER NOT NULL,
    medium_count INTEGER NOT NULL,
    large_count INTEGER NOT NULL,
    total_weight REAL NOT NULL
  )
`;

db.run(initTableSql, (err) => {
  if (err) {
    console.error("테이블 초기화 실패:", err.message);
    process.exit(1);
  }
  console.log("테이블 초기화 성공!");
});

// 플라스틱 데이터 저장 API
app.post("/save", (req, res) => {
  const { date, smallCount, mediumCount, largeCount, totalWeight } = req.body;

  console.log("요청 데이터:", req.body);

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

  // 날짜를 파싱하지 않고 그대로 사용
  const formattedDate = date;

  const deleteSql = `DELETE FROM plastic_data WHERE date = ?`;
  const insertSql = `
    INSERT INTO plastic_data (date, small_count, medium_count, large_count, total_weight)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(deleteSql, [formattedDate], (deleteErr) => {
    if (deleteErr) {
      console.error("데이터 삭제 실패:", deleteErr.message);
      return res.status(500).send("데이터 삭제 실패");
    }

    db.run(
      insertSql,
      [formattedDate, smallCount, mediumCount, largeCount, totalWeight],
      (insertErr) => {
        if (insertErr) {
          console.error("데이터 삽입 실패:", insertErr.message);
          return res.status(500).send("데이터 저장 실패");
        }

        console.log("데이터 저장 성공");
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

  // 날짜를 항상 YYYY-MM-DD 형식으로 변환
  const formattedDate = new Date(date).toISOString().split("T")[0];

  const sql = `
    SELECT small_count, medium_count, large_count, total_weight
    FROM plastic_data
    WHERE date = ?
  `;

  db.get(sql, [formattedDate], (err, row) => {
    if (err) {
      console.error("데이터 조회 실패:", err.message);
      return res.status(500).send("데이터 조회 실패");
    }

    if (row) {
      console.log("조회된 데이터:", row);
      res.json(row);
    } else {
      console.log("해당 날짜의 데이터가 없습니다.");
      res.status(404).send("해당 날짜의 데이터가 없습니다.");
    }
  });
});

// 월별 데이터 조회 API
app.get("/monthly-data", (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).send("연도와 월이 제공되지 않았습니다.");
  }

  const sql = `
    SELECT date, total_weight
    FROM plastic_data
    WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `;

  db.all(sql, [year, month.padStart(2, "0")], (err, rows) => {
    if (err) {
      console.error("월별 데이터 조회 실패:", err.message);
      return res.status(500).send("월별 데이터 조회 실패");
    }

    res.json(rows);
  });
});

// 월 비교 API
app.get("/monthly-comparison-data", (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).send("연도와 월이 필요합니다.");
  }

  const currentSql = `
    SELECT SUM(total_weight) AS currentTotal
    FROM plastic_data
    WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `;
  const previousSql = `
    SELECT SUM(total_weight) AS previousTotal
    FROM plastic_data
    WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
  `;

  const previousMonth =
    month === "01" ? "12" : String(month - 1).padStart(2, "0");
  const previousYear = month === "01" ? year - 1 : year;

  db.get(
    currentSql,
    [year, month.padStart(2, "0")],
    (currentErr, currentRow) => {
      if (currentErr) {
        console.error("현재 월 데이터 조회 실패:", currentErr.message);
        return res.status(500).send("현재 월 데이터 조회 실패");
      }

      db.get(previousSql, [previousYear, previousMonth], (prevErr, prevRow) => {
        if (prevErr) {
          console.error("이전 월 데이터 조회 실패:", prevErr.message);
          return res.status(500).send("이전 월 데이터 조회 실패");
        }

        const currentTotal = currentRow?.currentTotal || 0;
        const previousTotal = prevRow?.previousTotal || 0;

        res.json({ currentTotal, previousTotal });
      });
    }
  );
});

// 기본 경로 '/'에 대해 calendar.html 반환
app.get("/", (req, res) => {
  const filePath = path.join(__dirname, "public", "calendar.html");
  res.sendFile(filePath);
});

// 서버 실행
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

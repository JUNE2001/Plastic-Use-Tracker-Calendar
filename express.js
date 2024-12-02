const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());

// MySQL 연결
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1q2w3e4r",
  database: "plastic_usage",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL 연결 실패:", err);
    return;
  }
  console.log("MySQL에 연결되었습니다.");
});

// 플라스틱 데이터 저장 API
app.post("/api/savePlasticData", (req, res) => {
  const { date, small, medium, large, totalWeight } = req.body;

  const query =
    "INSERT INTO plastic_data (date, small, medium, large, totalWeight) VALUES (?, ?, ?, ?, ?) " +
    "ON DUPLICATE KEY UPDATE small = ?, medium = ?, large = ?, totalWeight = ?";

  const values = [
    date,
    small,
    medium,
    large,
    totalWeight,
    small,
    medium,
    large,
    totalWeight,
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error("데이터 삽입 실패:", err);
      res.status(500).send("데이터 저장에 실패했습니다.");
      return;
    }
    res.send("데이터가 성공적으로 저장되었습니다.");
  });
});

// 서버 시작
app.listen(3000, () => {
  console.log("서버가 3000번 포트에서 실행 중입니다.");
});

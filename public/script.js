document.addEventListener("DOMContentLoaded", function () {
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  const calendarTable = document.querySelector("#calendar-table tbody");
  const monthYearDisplay = document.getElementById("month-year");
  const selectedDateSpan = document.getElementById("selected-date");
  const modal = document.getElementById("date-modal");
  const modalYearSelect = document.getElementById("modal-year-select");
  const modalMonthSelect = document.getElementById("modal-month-select");
  const applySelectionBtn = document.getElementById("apply-selection");
  const closeModal = document.querySelector(".close");
  const saveButton = document.getElementById("save-plastic-data");

  const plasticCounts = {
    small: { count: 0, weight: 0.5 },
    medium: { count: 0, weight: 1.0 },
    large: { count: 0, weight: 2.0 },
  };

  // 총 무게 표시 업데이트 함수
  function updateTotalWeight() {
    const totalWeight =
      plasticCounts.small.count * plasticCounts.small.weight +
      plasticCounts.medium.count * plasticCounts.medium.weight +
      plasticCounts.large.count * plasticCounts.large.weight;

    document.getElementById(
      "usage-plastic"
    ).textContent = `${totalWeight.toFixed(1)} kg`;
  }

  // 플라스틱 카운트 업데이트 함수
  function updatePlasticCount(type, operation) {
    if (operation === "increment") {
      plasticCounts[type].count++;
    } else if (operation === "decrement" && plasticCounts[type].count > 0) {
      plasticCounts[type].count--;
    }

    // UI에 개수 업데이트
    document.getElementById(`${type}-count`).textContent =
      plasticCounts[type].count;

    // 총 무게 업데이트
    updateTotalWeight();
  }

  // 저장 버튼 클릭 이벤트 추가
  saveButton.addEventListener("click", function () {
    const selectedDate = selectedDateSpan.textContent;

    if (selectedDate === "없음") {
      alert("날짜를 선택해주세요!");
      return;
    }

    const formattedDate = selectedDate
      .replace(/\s+/g, "")
      .replace("년", "-")
      .replace("월", "-")
      .replace("일", "")
      .trim();

    const plasticData = {
      date: formattedDate,
      smallCount: plasticCounts.small.count,
      mediumCount: plasticCounts.medium.count,
      largeCount: plasticCounts.large.count,
      totalWeight: (
        plasticCounts.small.count * plasticCounts.small.weight +
        plasticCounts.medium.count * plasticCounts.medium.weight +
        plasticCounts.large.count * plasticCounts.large.weight
      ).toFixed(1),
    };

    fetch("http://127.0.0.1:3000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plasticData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("데이터 저장에 실패했습니다.");
        }
        return response.text();
      })
      .then(() => {
        // 월별 데이터 갱신 및 비교 데이터 갱신
        updateMonthlyPlasticTotal(currentYear, currentMonth);
        displayMonthlyComparison(currentYear, currentMonth);

        // 새로고침으로 캘린더 업데이트
        window.location.reload();
      })
      .catch((error) => {
        console.error("에러 발생:", error.message);
      });
  });

  function updateCalendarCell(date, totalWeight) {
    const [year, month, day] = date.split("-").map((num) => parseInt(num, 10));
    const cells = calendarTable.querySelectorAll("td");

    cells.forEach((cell) => {
      if (
        parseInt(cell.textContent.trim()) === day &&
        monthYearDisplay.textContent.trim() === `${year}년 ${month}월`
      ) {
        // 기존 무게 정보를 제거
        const existingWeightDiv = cell.querySelector("div");
        if (existingWeightDiv) {
          existingWeightDiv.remove();
        }

        // 새로운 무게 정보 추가
        const weightDiv = document.createElement("div");
        weightDiv.textContent = `${totalWeight}kg`;

        // div 스타일은 CSS에서 처리하므로 추가 스타일 지정 불필요
        cell.appendChild(weightDiv);
      }
    });
  }

  // 증감 버튼 이벤트 추가
  document.querySelectorAll(".increment").forEach((button) => {
    button.addEventListener("click", function () {
      const type = button.getAttribute("data-target");
      updatePlasticCount(type, "increment");
    });
  });

  document.querySelectorAll(".decrement").forEach((button) => {
    button.addEventListener("click", function () {
      const type = button.getAttribute("data-target");
      updatePlasticCount(type, "decrement");
    });
  });

  // 선택된 날짜 변경 시 초기화
  function resetPlasticData() {
    Object.keys(plasticCounts).forEach((type) => {
      plasticCounts[type].count = 0;
      document.getElementById(`${type}-count`).textContent = 0;
    });
    updateTotalWeight();
  }

  // 캘린더 셀 클릭 이벤트
  function addDateClickEvent(cell, date, year, month) {
    cell.addEventListener("click", function () {
      const selectedDate = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(date).padStart(2, "0")}`;
      selectedDateSpan.textContent = `${year}년 ${month + 1}월 ${date}일`;

      // 선택한 날짜로 DB 데이터 요청
      fetch(`http://127.0.0.1:3000/data?date=${selectedDate}`)
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              console.warn(`데이터가 없습니다: ${selectedDate}`);
              return null; // 데이터가 없는 경우 null 반환
            }
            throw new Error("데이터를 불러오는 데 실패했습니다.");
          }
          return response.json();
        })
        .then((data) => {
          if (data) {
            // DB에서 반환된 데이터가 있으면 화면에 표시
            plasticCounts.small.count = data.small_count || 0;
            plasticCounts.medium.count = data.medium_count || 0;
            plasticCounts.large.count = data.large_count || 0;

            document.getElementById("small-count").textContent =
              plasticCounts.small.count;
            document.getElementById("medium-count").textContent =
              plasticCounts.medium.count;
            document.getElementById("large-count").textContent =
              plasticCounts.large.count;

            updateTotalWeight();
          } else {
            // 데이터가 없으면 초기화
            console.log("데이터가 없으므로 초기화합니다.");
            resetPlasticData();
          }
        })
        .catch((error) => {
          console.error("에러 발생:", error.message);
          alert("데이터를 불러오는 데 문제가 발생했습니다.");
        });
    });
  }

  // 이번 달 총 사용량 업데이트 함수
  function updateMonthlyPlasticTotal(year, month) {
    fetch(`http://127.0.0.1:3000/monthly-data?year=${year}&month=${month + 1}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("월별 데이터를 불러오는 데 실패했습니다.");
        }
        return response.json();
      })
      .then((data) => {
        const totalMonthlyWeight = data.reduce(
          (sum, item) => sum + item.total_weight,
          0
        );

        // 이번 달 총 사용량 업데이트
        document.querySelector(
          "#total-monthly-plastic"
        ).textContent = `${totalMonthlyWeight.toFixed(1)} kg`;
      })
      .catch((error) => {
        console.error("에러 발생:", error.message);
        document.querySelector("#total-monthly-plastic").textContent = "없음";
      });
  }

  // 캘린더 렌더링 함수
  async function renderCalendar(month, year) {
    calendarTable.innerHTML = ""; // 기존 캘린더 초기화
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthlyData = await fetchMonthlyData(year, month);
    const dataMap = {};
    monthlyData.forEach((item) => {
      dataMap[item.date] = item.total_weight;
    });

    let date = 1;
    let row = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("td");
      row.appendChild(emptyCell);
    }

    while (date <= daysInMonth) {
      if (row.children.length === 7) {
        calendarTable.appendChild(row);
        row = document.createElement("tr");
      }

      const cell = document.createElement("td");
      cell.textContent = date;

      const formattedDate = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(date).padStart(2, "0")}`;
      if (dataMap[formattedDate]) {
        const weightDiv = document.createElement("div");
        weightDiv.textContent = `${dataMap[formattedDate]}kg`;
        weightDiv.classList.add("calendar-weight");
        cell.appendChild(weightDiv);
      }

      addDateClickEvent(cell, date, year, month);
      row.appendChild(cell);
      date++;
    }

    if (row.children.length > 0) {
      calendarTable.appendChild(row);
    }

    monthYearDisplay.textContent = `${year}년 ${monthNames[month]}`;

    // 월별 비교 데이터 업데이트
    await displayMonthlyComparison(year, month); // **비교 결과 갱신**
  }

  // 연도 및 월 선택 모달 열기
  monthYearDisplay.addEventListener("click", function () {
    modal.style.display = "block";
    modalYearSelect.value = currentYear;
    modalMonthSelect.value = currentMonth;
  });

  // 모달 닫기
  closeModal.addEventListener("click", function () {
    modal.style.display = "none";
  });

  // 모달에서 연도와 월 선택 후 적용
  applySelectionBtn.addEventListener("click", async function () {
    currentYear = parseInt(modalYearSelect.value);
    currentMonth = parseInt(modalMonthSelect.value);

    console.log("선택된 달:", currentYear, currentMonth); // 디버깅 로그

    await renderCalendar(currentMonth, currentYear); // 캘린더 및 비교 데이터 갱신
    modal.style.display = "none";
  });

  // 초기화: 연도 및 월 선택 옵션 채우기
  function populateYearOptions() {
    for (let i = currentYear - 50; i <= currentYear + 50; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.textContent = i + "년";
      modalYearSelect.appendChild(option);
    }
  }

  function populateMonthOptions() {
    monthNames.forEach((month, index) => {
      let option = document.createElement("option");
      option.value = index;
      option.textContent = month;
      modalMonthSelect.appendChild(option);
    });
  }

  // 서버에서 월별 데이터 조회
  function fetchMonthlyData(year, month) {
    return fetch(
      `http://127.0.0.1:3000/monthly-data?year=${year}&month=${month + 1}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("월별 데이터를 불러오는 데 실패했습니다.");
        }
        return response.json();
      })
      .catch((error) => {
        console.error("에러 발생:", error);
        return [];
      });
  }

  // 캘린더 렌더링 함수
  async function renderCalendar(month, year) {
    calendarTable.innerHTML = ""; // 기존 캘린더 초기화
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthlyData = await fetchMonthlyData(year, month);
    const dataMap = {};
    monthlyData.forEach((item) => {
      dataMap[item.date] = item.total_weight;
    });

    let date = 1;
    let row = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("td");
      row.appendChild(emptyCell);
    }

    while (date <= daysInMonth) {
      if (row.children.length === 7) {
        calendarTable.appendChild(row);
        row = document.createElement("tr");
      }

      const cell = document.createElement("td");
      cell.textContent = date;

      const formattedDate = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(date).padStart(2, "0")}`;
      if (dataMap[formattedDate]) {
        const weightDiv = document.createElement("div");
        weightDiv.textContent = `${dataMap[formattedDate]}kg`;
        weightDiv.classList.add("calendar-weight");
        cell.appendChild(weightDiv);
      }

      addDateClickEvent(cell, date, year, month);
      row.appendChild(cell);
      date++;
    }

    if (row.children.length > 0) {
      calendarTable.appendChild(row);
    }

    monthYearDisplay.textContent = `${year}년 ${monthNames[month]}`;

    // 월별 총 사용량 및 비교 데이터 갱신
    await updateMonthlyPlasticTotal(year, month);
    await displayMonthlyComparison(year, month);
  }

  async function fetchMonthlyComparison(year, month) {
    console.log(`비교 데이터 요청: year=${year}, month=${month + 1}`);
    try {
      const response = await fetch(
        `http://127.0.0.1:3000/monthly-comparison-data?year=${year}&month=${
          month + 1
        }`
      );

      if (!response.ok) {
        console.error("응답 오류:", response.status, response.statusText);
        throw new Error("비교 데이터를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      console.log("비교 데이터:", data);

      const currentTotal = data.currentTotal || 0;
      const previousTotal = data.previousTotal || 0;

      let changePercentage = 0;
      if (previousTotal !== 0) {
        changePercentage =
          ((currentTotal - previousTotal) / previousTotal) * 100;
      }

      return { currentTotal, previousTotal, changePercentage };
    } catch (error) {
      console.error("에러 발생:", error.message);
      return { currentTotal: 0, previousTotal: 0, changePercentage: 0 };
    }
  }

  async function displayMonthlyComparison(year, month) {
    const { currentTotal, previousTotal, changePercentage } =
      await fetchMonthlyComparison(year, month);

    document.getElementById("current-total").textContent =
      currentTotal.toFixed(1);
    document.getElementById("previous-total").textContent =
      previousTotal.toFixed(1);
    document.getElementById("change-percentage").textContent =
      changePercentage.toFixed(1);

    const comparisonStatus = document.getElementById("comparison-status");
    if (changePercentage > 0) {
      comparisonStatus.textContent = "사용량이 증가했습니다.";
      comparisonStatus.style.color = "red";
    } else if (changePercentage < 0) {
      comparisonStatus.textContent = "사용량이 감소했습니다.";
      comparisonStatus.style.color = "green";
    } else {
      comparisonStatus.textContent = "사용량 변화가 없습니다.";
      comparisonStatus.style.color = "black";
    }

    console.log("비교 결과 업데이트 완료");
  }

  displayMonthlyComparison(currentYear, currentMonth);

  populateYearOptions();
  populateMonthOptions();

  // 초기 캘린더 렌더링
  renderCalendar(currentMonth, currentYear);
});

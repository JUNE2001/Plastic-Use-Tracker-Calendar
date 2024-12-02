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

    // 날짜 형식 정리: 띄워쓰기 제거 후 ISO 형식으로 변환
    const formattedDate = selectedDate
      .replace(/\s+/g, "") // 모든 공백 제거
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

    console.log("전송 데이터:", plasticData);

    fetch("http://127.0.0.1:3000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plasticData),
    })
      .then((response) => {
        if (response.ok) {
          alert("데이터가 성공적으로 저장되었습니다!");
        } else {
          response.text().then((text) => {
            console.error("응답 오류:", text);
            alert("데이터 저장에 실패했습니다.");
          });
        }
      })
      .catch((error) => {
        console.error("에러 발생:", error);
        alert("서버와 통신 중 문제가 발생했습니다.");
      });
  });

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
      selectedDateSpan.textContent = `${year}년 ${month + 1}월 ${date}일`;
      resetPlasticData();
    });
  }

  // 캘린더 렌더링 함수
  function renderCalendar(month, year) {
    calendarTable.innerHTML = ""; // 기존 캘린더 초기화
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날짜 계산

    let date = 1;
    let row = document.createElement("tr");

    // 첫 주 빈 칸 채우기
    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("td");
      row.appendChild(emptyCell);
    }

    // 날짜 채우기
    while (date <= daysInMonth) {
      if (row.children.length === 7) {
        calendarTable.appendChild(row);
        row = document.createElement("tr");
      }

      const cell = document.createElement("td");
      cell.textContent = date;

      addDateClickEvent(cell, date, year, month);

      row.appendChild(cell);
      date++;
    }

    if (row.children.length > 0) {
      calendarTable.appendChild(row);
    }

    monthYearDisplay.textContent = `${year}년 ${monthNames[month]}`;
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
  applySelectionBtn.addEventListener("click", function () {
    currentYear = parseInt(modalYearSelect.value);
    currentMonth = parseInt(modalMonthSelect.value);
    renderCalendar(currentMonth, currentYear);
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

  // 초기화 실행
  populateYearOptions();
  populateMonthOptions();
  renderCalendar(currentMonth, currentYear);
});

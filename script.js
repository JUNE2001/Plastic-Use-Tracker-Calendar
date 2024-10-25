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
  const selectedDateSpan = document.getElementById("selected-date"); // 선택된 날짜를 표시할 요소
  const modal = document.getElementById("date-modal");
  const modalYearSelect = document.getElementById("modal-year-select");
  const modalMonthSelect = document.getElementById("modal-month-select");
  const applySelectionBtn = document.getElementById("apply-selection");
  const closeModal = document.querySelector(".close");

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
        // 한 주가 끝나면 새 줄로
        calendarTable.appendChild(row);
        row = document.createElement("tr");
      }

      const cell = document.createElement("td");
      const currentDate = date; // 현재 날짜를 캡처하여 클로저로 사용
      cell.textContent = currentDate;

      // 날짜 클릭 시 해당 날짜를 플라스틱 사용량 아래에 표시
      cell.addEventListener("click", function () {
        selectedDateSpan.textContent = `${year}년 ${
          month + 1
        }월 ${currentDate}일`; // 선택된 날짜 표시
      });

      row.appendChild(cell);
      date++;
    }

    // 남은 날짜 렌더링 후 마지막 주 추가
    if (row.children.length > 0) {
      calendarTable.appendChild(row);
    }

    // 월과 연도 표시
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
  renderCalendar(currentMonth, currentYear); // 페이지 로드 시 현재 달 렌더링
});

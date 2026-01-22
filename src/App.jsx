import React, { useState, useEffect } from "react";

const PRINCIPAL_PER_PAYMENT = 1_490_000;
const PENALTY_PER_DAY = 60_000;
const MAX_PAYMENTS = 36;

// To‘langan to‘lovlar va ularning haqiqiy penya + kechikish kunlari
const PAID_PAYMENTS = {
  9: {
    paid: true,
    penaltyAccumulated: 180_000, // 3 kun × 60 000
    actualDaysLate: 3, // ← bu qator qo‘shildi: haqiqiy kechikish kunlari
  },
  // Misol uchun boshqa to‘lovlar:
  // 5: { paid: true, penaltyAccumulated: 120_000, actualDaysLate: 2 },
};

const generateDueDatesUpTo = (targetDate) => {
  const dues = [];
  let year = 2025;
  let monthIndex = 4; // May

  while (dues.length < MAX_PAYMENTS + 5) {
    const dueDate = new Date(year, monthIndex, 6);
    if (dueDate > targetDate) break;

    const monthName = dueDate.toLocaleDateString("uz-UZ", { month: "long" });
    const order = dues.length + 1;

    dues.push({
      order,
      month: `${order}-to‘lov (6-${monthName})`,
      date: dueDate,
      dueDateStr: dueDate.toLocaleDateString("uz-UZ"),
    });

    monthIndex++;
    if (monthIndex > 11) {
      monthIndex = 0;
      year++;
    }
  }
  return dues.slice(0, MAX_PAYMENTS);
};

function App() {
  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const [selectedDate, setSelectedDate] = useState(formattedToday);
  const [payments, setPayments] = useState([]);
  const [totalPrincipal, setTotalPrincipal] = useState(0);
  const [totalPenalty, setTotalPenalty] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const calculateDebt = () => {
      const calcDate = new Date(selectedDate + "T00:00:00");
      const dueDates = generateDueDatesUpTo(calcDate);

      let principalSum = 0;
      let penaltySum = 0;

      const paymentDetails = dueDates.map((due) => {
        const order = due.order;
        const paymentInfo = PAID_PAYMENTS[order] || { paid: false };

        // Hozirgi kechikish kunlari (faqat to‘lanmaganlar uchun ishlatiladi)
        const daysLateRaw = calcDate - due.date;
        let currentDaysLate = Math.max(
          0,
          Math.floor(daysLateRaw / (1000 * 60 * 60 * 24)),
        );

        let displayedDaysLate = currentDaysLate; // ekranda ko‘rsatiladigan kunlar
        let penalty = 0;
        let isPaid = paymentInfo.paid;

        if (isPaid) {
          // To‘langan to‘lov: penya va kechikish kunlari muzlatiladi
          penalty = paymentInfo.penaltyAccumulated || 0;
          displayedDaysLate = paymentInfo.actualDaysLate || 0; // ← muzlatilgan qiymat
        } else {
          // To‘lanmagan: penya va kunlar davom etadi
          penalty = currentDaysLate * PENALTY_PER_DAY;
          displayedDaysLate = currentDaysLate;
        }

        // Asosiy qarz faqat to‘lanmagan to‘lovlarga qo‘shiladi
        if (!isPaid) {
          principalSum += PRINCIPAL_PER_PAYMENT;
          penaltySum += penalty;
        }

        return {
          month: due.month,
          dueDateStr: due.dueDateStr,
          principal: PRINCIPAL_PER_PAYMENT,
          daysLate: displayedDaysLate,
          penalty,
          isLate: displayedDaysLate > 0 && !isPaid,
          isPaid,
        };
      });

      setPayments(paymentDetails);
      setTotalPrincipal(principalSum);
      setTotalPenalty(penaltySum);
      setTotalDebt(principalSum + penaltySum);

      if (dueDates.length === MAX_PAYMENTS) {
        const maxDate = new Date(2025, 4 + MAX_PAYMENTS - 1, 6);
        const maxMonthYear = maxDate.toLocaleDateString("uz-UZ", {
          month: "long",
          year: "numeric",
        });
        setWarning(
          `Eslatma: Faqat dastlabki 36 oy ko‘rsatilmoqda (2025-maydan ${maxMonthYear}gacha).`,
        );
      } else {
        setWarning("");
      }
    };

    calculateDebt();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const formatNumber = (num) => new Intl.NumberFormat("uz-UZ").format(num);
  const formatSum = (sum) => formatNumber(sum) + " so‘m";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-start justify-center p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl mx-auto overflow-y-auto max-h-screen">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">
          Qarz Hisoblagich
        </h1>

        <div className="mb-8 text-center">
          <label
            htmlFor="date"
            className="block text-lg font-medium text-gray-700 mb-3"
          >
            Hisob sanasini tanlang:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-full max-w-md mx-auto px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200"
          />
        </div>

        {warning && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg text-center text-sm sm:text-base">
            {warning}
          </div>
        )}

        <div className="space-y-6 mb-10">
          {payments.map((payment, index) => (
            <div
              key={index}
              className={`p-5 sm:p-6 rounded-xl border-2 relative ${
                payment.isPaid
                  ? "bg-blue-50 border-blue-300"
                  : payment.isLate
                    ? "bg-red-50 border-red-300"
                    : "bg-green-50 border-green-300"
              }`}
            >
              {payment.isPaid && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  TO‘LANGAN
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {payment.month}
                </h3>
                {payment.isPaid ? (
                  <span className="text-4xl font-bold text-blue-600">✓</span>
                ) : payment.isLate ? (
                  <span className="text-4xl font-bold text-red-600">✕</span>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-green-600">
                    ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-base sm:text-lg">
                <p>
                  <span className="font-semibold">To‘lov sanasi:</span>{" "}
                  <span className="block sm:inline mt-1 sm:mt-0">
                    {payment.dueDateStr}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Oylik to‘lov:</span>{" "}
                  <span className="block sm:inline mt-1 sm:mt-0">
                    {formatSum(payment.principal)}
                    {payment.isPaid && " (to‘langan ✅)"}
                  </span>
                </p>
                <p>
                  <span className="font-semibold">Kechikkan kunlar:</span>{" "}
                  <strong className="block sm:inline mt-1 sm:mt-0">
                    {formatNumber(payment.daysLate)} kun
                  </strong>
                </p>
                <p>
                  <span className="font-semibold">Penya:</span>{" "}
                  <span
                    className={`block sm:inline mt-1 sm:mt-0 ${
                      !payment.isPaid && payment.isLate
                        ? "text-red-600 font-bold"
                        : ""
                    }`}
                  >
                    {formatSum(payment.penalty)}
                    {payment.isPaid && " (to'langan ✅)"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 text-white p-6 sm:p-8 rounded-2xl space-y-4 text-lg sm:text-xl">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <span className="font-semibold">Umumiy oylik to‘lovlar:</span>
            <span className="font-bold text-right">
              {formatSum(totalPrincipal)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <span className="font-semibold">Umumiy penya:</span>
            <span className="font-bold text-red-400 text-right">
              {formatSum(totalPenalty)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between text-2xl sm:text-3xl font-bold pt-4 border-t-2 border-gray-600 gap-3">
            <span>JAMI QARZ:</span>
            <span className="text-yellow-300 text-right">
              {formatSum(totalDebt)}
            </span>
          </div>
        </div>

        <p className="text-center text-gray-600 mt-6 text-xs sm:text-sm">
          Hisob kunlik (60 000 so‘m/kun). To‘langan to‘lovlar uchun penya va
          kechikish kunlari to‘lov kuni holatida qotib qoladi.
        </p>
      </div>
    </div>
  );
}

export default App;

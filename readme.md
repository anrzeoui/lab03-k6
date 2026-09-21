# Lab 03 — Чанарын сценарио → SLO → k6 Threshold

## Оюутны мэдээлэл

- Нэр: Anar
- Оюутны код: [Өөрийн кодоо бич]
- k6 version: v2.2.0

## 1. Зорилго

Энэ лабораторийн ажлаар performance, reliability, availability чанарын сценариог SLO болгон томьёолж, k6 threshold ашиглан автоматаар шалгав. Туршилтыг зөвхөн өөрийн локал `http://localhost:3000` сервер дээр хийсэн.

## 2. Локал API

| Endpoint | Тайлбар |
|---|---|
| `/cart/add` | Хурдан endpoint |
| `/report` | 200–400 ms орчим сааталтай endpoint |
| `/pay` | Ойролцоогоор 5% алдаа үүсгэдэг endpoint |

## 3. Чанарын сценарио

### 3.1 Performance

| Хэсэг | Тайлбар |
|---|---|
| Тойм | Сагсанд бүтээгдэхүүн нэмэх үйлдлийн хурдыг шалгана |
| Системийн төлөв | Сервер хэвийн ажиллаж байна |
| Орчны төлөв | 20 VU тогтмол ачаалалтай |
| Гадаад өдөөлт | `/cart/add` endpoint руу хүсэлт илгээнэ |
| Шаардлагатай хариу | Сервер HTTP 200 хариу буцаана |
| Хэмжүүр | `/cart/add` хүсэлтийн p95 latency |

### 3.2 Reliability

| Хэсэг | Тайлбар |
|---|---|
| Тойм | Төлбөрийн endpoint-ийн найдвартай байдлыг шалгана |
| Системийн төлөв | Сервер хэвийн ажиллаж байна |
| Орчны төлөв | 20 VU тогтмол ачаалалтай |
| Гадаад өдөөлт | `/pay` endpoint руу төлбөрийн хүсэлт илгээнэ |
| Шаардлагатай хариу | Хүсэлтүүдийн ихэнх нь амжилттай боловсруулагдана |
| Хэмжүүр | `/pay` error rate |

### 3.3 Availability

| Хэсэг | Тайлбар |
|---|---|
| Тойм | Сервер зогсоод дахин асах үеийн хүртээмжийг шалгана |
| Системийн төлөв | Сервер эхэндээ хэвийн ажиллаж байна |
| Орчны төлөв | 20 VU, 2 минут |
| Гадаад өдөөлт | Серверийг 10 секунд зогсоож дахин асаана |
| Шаардлагатай хариу | Сервер дахин ассаны дараа хүсэлтүүд хэвийн үргэлжилнэ |
| Хэмжүүр | Амжилттай хүсэлтийн хувь болон сэргэх хугацаа |

## 4. Baseline

`/cart/add` endpoint дээр 20 VU, 1 минутын baseline тест хийсэн.

| Metric | Result |
|---|---:|
| p90 | 5.54 ms |
| p95 | 7.03 ms |
| Error Rate | 0.00% |
| Requests | 1200 |

Baseline p95 = **7.03 ms**.

## 5. SLO

| Scenario | SLI | Босго | Цонх / нөхцөл |
|---|---|---|---|
| Performance | `/cart/add` latency | p95 < 15 ms | 20 VU, 1 минут |
| Reliability | `/pay` error rate | < 8% | 20 VU, 1 минут |
| Availability | Амжилттай хүсэлтийн хувь | > 90% | 2 минут, 10 секунд outage |
| Report performance | `/report` latency | p95 < 500 ms | 20 VU, 1 минут |

### Босго сонгосон үндэслэл

- `/cart/add` baseline p95 = 7.03 ms байсан тул `p95 < 15 ms` гэж сонгосон.
- `/pay` endpoint нь зориудаар ойролцоогоор 5% алдаа үүсгэдэг тул `error rate < 8%` гэж сонгосон.
- Availability SLO-г `> 90%` гэж сонгосон.
- `/report`-ийн эхний хэмжилтээр p95 = 456.84 ms гарсан тул бодит хэмжилтэд тулгуурлан `p95 < 500 ms` гэж сонгосон.

## 6. Error Budget

Availability SLO = 90%, тэгэхээр error budget = 10%.

2 минут = 120 секунд.

`120 × 0.10 = 12 секунд`

Иймээс хугацаагаар тооцсон error budget нь **12 секунд**.

## 7. PASS Test

20 VU, 1 минутын `slo-test.js` туршилтын үр дүн:

| Threshold | Result | Төлөв |
|---|---:|---|
| Checks > 90% | 98.62% | PASS |
| Cart p95 < 15 ms | 4.60 ms | PASS |
| Report p95 < 500 ms | 397.77 ms | PASS |
| Pay error rate < 8% | 4.13% | PASS |

Нэмэлт үзүүлэлт:

- Total requests: **2754**
- Throughput: **44.94 req/s**

Бүх threshold амжилттай PASS болсон.

## 8. Chaos Test

20 VU, 2 минутын тестийн дунд серверийг 10 секунд зогсоож дахин асаасан.

| Metric | Result |
|---|---:|
| Availability / Checks | 73.48% |
| Successful checks | 4290 |
| Total checks | 5838 |
| Failed checks | 1548 |
| HTTP failure rate | 26.51% |
| Pay error rate | 29.18% |
| Cart p95 | 4.61 ms |
| Report p95 | 392.85 ms |
| Total requests | 5838 |

### Availability тооцоо

`4290 / 5838 × 100 = 73.48%`

Бодит availability = **73.48%**, харин SLO = **> 90%** байсан тул Availability threshold FAIL болсон.

Хүсэлтээр тооцсон failure хувь:

`100% - 73.48% = 26.52%`

Энэ нь зөвшөөрсөн 10%-ийн error budget-ээс их тул error budget хэтэрсэн.

Сервер унтарсан үед хүсэлтүүд `connection refused` алдаатай маш хурдан буцдаг. Харин хэвийн үед `/report` 200–400 ms орчим хүлээлгэдэг. Иймээс хугацаагаар тооцсон 12 секундийн error budget болон хүсэлтээр тооцсон failure хувь ижил биш гарсан.

Мөн `/pay` error rate **29.18%** болж Reliability SLO `< 8%`-ийг зөрчсөн. Сервер бүхэлдээ унтарсан үед `/pay` хүсэлтүүд мөн унадаг тул нэг crash нь Availability болон Reliability SLO-г зэрэг зөрчсөн.

## 9. Зориуд FAIL болгосон тест

Threshold ажиллаж байгааг шалгахын тулд `/report` endpoint-ийн босгыг зориудаар:

`p(95) < 100 ms`

гэж тохируулсан.

| Threshold | Result | Төлөв |
|---|---:|---|
| Checks > 90% | 97.83% | PASS |
| Cart p95 < 15 ms | 3.48 ms | PASS |
| Report p95 < 100 ms | 393.78 ms | FAIL |
| Pay error rate < 8% | 6.50% | PASS |

Нэмэлт үзүүлэлт:

- Total requests: **2766**
- Throughput: **45.21 req/s**
- k6 exit code: **99**

`/report` p95 = 393.78 ms байсан тул `p(95)<100` threshold зориудаар зөрчигдөж тест FAIL болсон. Non-zero exit code нь CI pipeline-д threshold failure-ийг автоматаар илрүүлэхэд ашиглагдана.

## 10. Results Files

```text
results/baseline.txt
results/pass.txt
results/chaos.txt
results/fail.txt
```

## 11. Project Structure

```text
lab3/
├── server.js
├── baseline.js
├── slo-test.js
├── slo-test-fail.js
├── README.md
├── package.json
├── package-lock.json
├── .gitignore
└── results/
    ├── baseline.txt
    ├── pass.txt
    ├── chaos.txt
    └── fail.txt
```

## 12. Дүгнэлт

Энэ лабораторийн ажлаар quality scenario-г SLO болон k6 threshold болгон хувиргах үйл явцыг туршсан. Performance baseline тестээр `/cart/add` endpoint-ийн p95 latency 7.03 ms гарсан. Үүнд үндэслэн Performance SLO-г p95 < 15 ms гэж сонгосон. PASS тестээр cart, report, reliability болон availability threshold-ууд бүгд амжилттай хангагдсан. Chaos test-ийн үед серверийг 10 секунд зогсооход availability 73.48% болж SLO зөрчигдсөн. Мөн `/pay` error rate 29.18% болж Reliability threshold давхар FAIL болсон. Хугацаагаар тооцсон 12 секундийн error budget нь хүсэлтээр тооцсон failure хувьтай ижил биш байгааг туршилтаар харсан. Зориудын FAIL тестээр `/report` p95 393.78 ms гарч `p(95)<100` босгыг зөрчсөн бөгөөд k6 exit code 99 буцаасан. Ингэснээр Scenario → SLO → Threshold → Chaos → Fail test гэсэн холбоог практик туршилтаар баталгаажуулсан.

## 13. Ашигласан технологи
- **Node.js + Express** — локал API сервер үүсгэхэд ашигласан.
- **Grafana k6** — performance, reliability, availability болон threshold тест хийхэд ашигласан.
- **JavaScript** — сервер болон k6 тестийн скрипт бичихэд ашигласан.
- **Git / GitHub** — source code, commit history болон үр дүнгийн файлуудыг хадгалахад ашигласан.
- **Ubuntu Linux** — лабораторийн ажлын үндсэн орчин.
- **ChatGPT 6 Astra (OpenAI)** — лабораторийн ажлын дараалал төлөвлөх, гарсан үр дүнг тайлбарлах болон README тайлангийн бүтэц, найруулгыг боловсруулахад туслах хэрэгсэл болгон ашигласан.

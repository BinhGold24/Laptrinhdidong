# MyLife

Ứng dụng quản lý lịch trình cá nhân xây dựng bằng React Native và Expo. Giao diện tiếng Việt lấy cảm hứng từ phong cách lịch nhẹ nhàng, trực quan của CalendarCute.

## Chạy ứng dụng

```bash
npm install
npx expo run:android
# hoặc trên macOS
npx expo run:ios
```

Ứng dụng tích hợp quảng cáo native nên cần development build; Expo Go không hỗ trợ AdMob. Sau khi đã build và cài ứng dụng, có thể dùng `npm start` để chạy Metro.

```bash
npm start
```

Android dùng App ID và mã đơn vị quảng cáo của MyLife trong bản phát hành; khi phát triển vẫn dùng mã thử nghiệm của Google. iOS hiện tiếp tục dùng mã thử nghiệm vì chưa có App ID và mã đơn vị quảng cáo iOS.

## MockAPI

Ứng dụng dùng endpoint `https://6ae09edfbe3bc8fead979650.mockapi.io/api/v1/events`. Tài nguyên `events` cần cho phép các phương thức `GET`, `POST`, `PUT` và `DELETE`.

Mỗi lịch trình có các trường:

```json
{
  "title": "Họp nhóm dự án",
  "date": "2026-10-28",
  "time": "09:00",
  "endTime": "10:00",
  "category": "work",
  "note": "Chuẩn bị nội dung",
  "completed": false
}
```

Các giá trị `category`: `work`, `personal`, `health`, `other`. Tài nguyên có thể để trống; người dùng tạo lịch trình đầu tiên ngay trong ứng dụng.

## Chức năng

- Xem lịch theo tuần hoặc tháng, chọn ngày và quay về hôm nay.
- Tạo, chỉnh sửa, xóa và đánh dấu hoàn thành lịch trình.
- Nhận thông báo có chuông trên thiết bị đã tạo lịch vào giờ bắt đầu và giờ kết thúc (nếu đã chọn giờ kết thúc); cần cấp quyền thông báo cho ứng dụng.
- Hiển thị banner ở cuối màn hình và interstitial khi chuyển trang; interstitial chỉ hiện tối đa một lần mỗi 3 phút. Bản Android phát hành dùng mã AdMob thật, còn bản phát triển và iOS dùng mã thử nghiệm.
- Firebase Analytics trên Android ghi lượt xem tab và các thao tác tạo, sửa, xóa, hoàn thành hoặc mở lại lịch; không gửi tên hay ghi chú lịch trình.
- Phân loại hoạt động, thêm ghi chú và theo dõi thống kê cơ bản.
- Báo lỗi kết nối/lưu dữ liệu và cho phép tải lại từ MockAPI.

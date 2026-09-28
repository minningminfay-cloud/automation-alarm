# Alarm & Maintenance Management System

ระบบ Web Application สำหรับสนับสนุนงาน Automation และงานบำรุงรักษาเครื่องจักรในโรงงาน โดยใช้ข้อมูล Machine, Alarm และ Maintenance เพื่อช่วยให้ผู้ใช้งานสามารถติดตามสถานะเครื่องจักร จัดการ Alarm และบันทึกงานบำรุงรักษาได้อย่างเป็นระบบ

## Project Overview

ระบบนี้พัฒนาขึ้นเพื่อใช้ในการจัดการข้อมูลและสนับสนุนงานบำรุงรักษาเครื่องจักรในโรงงาน โดยมีระบบ Authentication และกำหนดสิทธิ์การใช้งานตามบทบาทของผู้ใช้

ระบบรองรับ 3 บทบาท:

* **Admin** – จัดการข้อมูล Machine, Alarm และ Maintenance
* **Technician** – ดูข้อมูลเครื่องจักร บันทึกและแก้ไข Maintenance และเปลี่ยนสถานะ Alarm
* **Viewer** – ดูข้อมูลภายในระบบแบบ Read-only

## Main Features

### 1. Authentication & Role Management

* Login / Logout
* Authentication ด้วย Supabase
* รองรับ Admin, Technician และ Viewer
* กำหนดสิทธิ์การเข้าถึงตาม Role
* Viewer สามารถดูข้อมูลได้โดยไม่สามารถแก้ไขข้อมูล

### 2. Machine Management

Admin สามารถจัดการข้อมูลเครื่องจักรได้ เช่น

* Machine ID
* Machine Name
* Machine Type
* Location
* Machine Status

สถานะเครื่องจักร:

* Running
* Stop
* Alarm
* Maintenance

รองรับ:

* เพิ่ม Machine
* แก้ไข Machine
* ลบ Machine
* ค้นหา Machine
* กรองข้อมูล Machine

### 3. Alarm Management

จัดการข้อมูล Alarm ของเครื่องจักร เช่น

* Machine
* Alarm Code
* Description
* Alarm Date
* Cause
* Status

สถานะ Alarm:

* Open
* In Progress
* Closed

ความสามารถเพิ่มเติม:

* เพิ่ม / แก้ไข / ลบ Alarm สำหรับ Admin
* Technician สามารถเปลี่ยนสถานะ Alarm
* Viewer สามารถดูข้อมูล Alarm ได้
* ค้นหาและกรอง Alarm
* Filter ตาม Machine
* Filter ตาม Status
* Filter ตาม Alarm Code
* Filter ตามวันที่
* ตรวจสอบ Alarm Code ซ้ำ

### 4. Maintenance Management

จัดการข้อมูลการบำรุงรักษา เช่น

* Machine
* Maintenance Type
* Problem
* Action Taken
* Technician
* Start Date
* End Date
* Status

สถานะ Maintenance:

* Pending
* In Progress
* Waiting Part
* Completed

ความสามารถเพิ่มเติม:

* Admin สามารถเพิ่ม แก้ไข และลบข้อมูล
* Technician สามารถบันทึกและแก้ไข Maintenance
* Viewer สามารถดูข้อมูลได้
* ระบุ Technician ที่รับผิดชอบ
* กำหนดวันที่เริ่ม Maintenance
* กำหนดวันที่สิ้นสุด Maintenance
* ตรวจสอบไม่ให้ End Date ก่อน Start Date
* รองรับสถานะ Waiting Part

### 5. Search & Filter

ระบบรองรับการค้นหาและกรองข้อมูลหลายเงื่อนไข เช่น

* Machine
* Status
* Alarm Code
* Technician
* Date

มีการใช้ Filter ในหน้า Machine, Alarm และ Maintenance เพื่อช่วยให้ค้นหาข้อมูลได้สะดวกขึ้น

### 6. Dashboard

Dashboard แสดงข้อมูลสรุปของระบบ เช่น

* Total Machines
* Running Machines
* Stop Machines
* Alarm Machines
* Maintenance Machines
* Total Alarms
* Total Maintenance

นอกจากนี้ยังมีกราฟแสดงจำนวน Alarm แยกตามสถานะ:

* Open
* In Progress
* Closed

ช่วยให้ผู้ใช้งานเห็นภาพรวมของสถานะเครื่องจักร Alarm และงาน Maintenance ได้ง่ายขึ้น

### 7. Input Validation

ระบบมีการตรวจสอบข้อมูลก่อนบันทึก เช่น

* ตรวจสอบ Required Fields
* ตรวจสอบ Machine ID ซ้ำ
* ตรวจสอบ Alarm Code ซ้ำ
* ตรวจสอบ End Date ไม่ให้ก่อน Start Date
* ตรวจสอบข้อมูลที่จำเป็นก่อนบันทึก
* แสดงข้อความแจ้งเตือนเมื่อข้อมูลไม่ถูกต้อง

## Bonus Features / Change Requests

ระบบมีการพัฒนาความสามารถเพิ่มเติมจาก Requirement หลัก ได้แก่

### Viewer Role

เพิ่ม Role **Viewer** สำหรับผู้ใช้งานที่ต้องการดูข้อมูลภายในระบบแบบ Read-only

### Alarm Count Chart

เพิ่มกราฟแสดงจำนวน Alarm แยกตามสถานะบน Dashboard

### Waiting Part

เพิ่มสถานะ **Waiting Part** สำหรับ Maintenance ที่อยู่ระหว่างรออะไหล่

### Maintenance End Date

เพิ่มข้อมูลวันที่สิ้นสุดของ Maintenance เพื่อให้สามารถบันทึกช่วงเวลาการบำรุงรักษาได้

### Technician Information

เพิ่มข้อมูล Technician ที่รับผิดชอบงาน Maintenance

### Date Filter

เพิ่มการกรองข้อมูลตามวันที่ในส่วนของ Alarm และ Maintenance

### Additional Validation

เพิ่ม Validation เพื่อป้องกันข้อมูลผิดพลาด เช่น ข้อมูลซ้ำและวันที่ไม่ถูกต้อง

## Technology Stack

* **Next.js 16**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Supabase**
* **PostgreSQL**
* **Recharts**
* **GitHub**
* **GitHub Actions**
* **Vercel**
* **AI-assisted Development**

## Database Structure

ระบบใช้ Supabase PostgreSQL เป็นฐานข้อมูลหลัก โดยมีตารางสำคัญดังนี้

### profiles

เก็บข้อมูลผู้ใช้งานและ Role

* id
* full_name
* role
* created_at

Role ที่รองรับ:

* admin
* technician
* viewer

### machines

เก็บข้อมูลเครื่องจักร

* id
* machine_id
* name
* type
* location
* status
* created_at
* updated_at

### alarms

เก็บข้อมูล Alarm

* id
* machine_id
* alarm_code
* description
* alarm_datetime
* cause
* status
* created_at

### maintenance_records

เก็บข้อมูลการบำรุงรักษา

* id
* machine_id
* maintenance_type
* problem
* action_taken
* technician_id
* maintenance_date
* end_date
* status
* created_at

### Database Relationships

* `alarms.machine_id` → `machines.id`
* `maintenance_records.machine_id` → `machines.id`
* `maintenance_records.technician_id` → `profiles.id`

## Project Structure

```text
automation-alarm/

├── app/
│   ├── alarms/
│   ├── dashboard/
│   ├── maintenance/
│   ├── machines/
│   └── page.tsx
│
├── lib/
│   └── supabase/
│
├── public/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/minningminfay-cloud/automation-alarm.git

cd automation-alarm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> ไม่ควรนำค่าจริงของ Environment Variables หรือ Secret ไปเผยแพร่ใน GitHub

### 4. Run Development Server

```bash
npm run dev
```

เปิด Browser ไปที่:

```text
http://localhost:3000
```

### 5. Build Project

```bash
npm run build
```

## GitHub Actions

โปรเจกต์มีการใช้ GitHub Actions สำหรับตรวจสอบโปรเจกต์เมื่อมีการ Push หรือ Pull Request

Workflow ทำงานในขั้นตอนหลักดังนี้:

1. Checkout source code
2. Setup Node.js
3. Install dependencies
4. Configure required environment variables
5. Build Next.js project

Workflow file:

```text
.github/workflows/ci.yml
```

GitHub Actions ใช้สำหรับตรวจสอบว่าโปรเจกต์สามารถติดตั้ง Dependencies และ Build ได้สำเร็จ

## Deployment

โปรเจกต์ถูก Deploy ด้วย Vercel

### Production URL

https://automation-alarm.vercel.app/

สามารถเปิด URL ดังกล่าวเพื่อใช้งาน Web Application ได้

## GitHub Repository

https://github.com/minningminfay-cloud/automation-alarm

## AI Usage

ในการพัฒนาโปรเจกต์นี้มีการใช้ AI เป็นเครื่องมือช่วยในการวิเคราะห์ ออกแบบ และพัฒนาระบบ เช่น

* วิเคราะห์ Requirements จากโจทย์
* ออกแบบโครงสร้างระบบ
* ออกแบบ Database และ Relationships
* ช่วยเขียนและปรับปรุง Source Code
* ออกแบบ UI/UX
* ช่วยเขียน SQL สำหรับ Supabase
* วิเคราะห์และแก้ไข Error
* ช่วยตรวจสอบ Validation
* ช่วยตรวจสอบ GitHub Actions
* ช่วยตรวจสอบ Deployment
* ช่วยปรับปรุงโครงสร้างและความถูกต้องของโค้ด
* ช่วยพัฒนา Feature เพิ่มเติมตาม Change Request

AI ถูกใช้เป็นเครื่องมือช่วยในการวิเคราะห์และพัฒนา โดยผู้พัฒนาเป็นผู้ตรวจสอบ ทดสอบ และปรับแก้ผลลัพธ์ก่อนนำไปใช้งานจริง

## Development

โปรเจกต์มีการพัฒนาและบันทึกการเปลี่ยนแปลงผ่าน Git โดยใช้ Commit History เพื่อแสดงลำดับการพัฒนาระบบในแต่ละขั้นตอน

ตัวอย่างการพัฒนา Feature:

* Initial Alarm & Maintenance Management System
* GitHub Actions CI
* Supabase Environment Configuration
* Maintenance Waiting Part
* Maintenance End Date
* Alarm Count Chart
* Viewer Role
* Alarm Date Picker

## Future Improvements

ความสามารถเพิ่มเติมที่สามารถพัฒนาได้ในอนาคต ได้แก่

* Machine History
* Audit Log
* Export CSV / Excel
* Notification
* Advanced Filter
* Responsive UI improvements
* Dark Mode

## Authors

**นางสาววรรณนิภา ศักดิ์พรหม**

**นางสาวแพรวพรรณ ภูมิผิว**

**นางสาวโชติกา พุ่มอ่ำ**

Computer Engineering Student

Rajamangala University of Technology Phra Nakhon
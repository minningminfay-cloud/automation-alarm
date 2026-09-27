# Alarm & Maintenance Management System

ระบบ Web Application สำหรับสนับสนุนงาน Automation และการบำรุงรักษาเครื่องจักรในโรงงาน โดยใช้ข้อมูล Machine, Alarm และ Maintenance เพื่อช่วยให้ผู้ใช้งานสามารถติดตามสถานะเครื่องจักรและจัดการงานบำรุงรักษาได้อย่างเป็นระบบ

## Project Overview

ระบบนี้พัฒนาขึ้นเพื่อใช้ในการจัดการข้อมูลและสนับสนุนงานบำรุงรักษาเครื่องจักรในโรงงาน โดยมีระบบ Login และกำหนดสิทธิ์การใช้งานตามบทบาทของผู้ใช้

ระบบรองรับ 2 บทบาทหลัก:

* **Admin** – จัดการข้อมูล Machine, Alarm และ Maintenance
* **Technician** – ดูข้อมูลเครื่องจักร บันทึกและแก้ไข Maintenance และเปลี่ยนสถานะ Alarm

## Main Features

### 1. Authentication & Role Management

* Login / Logout
* Authentication ด้วย Supabase
* รองรับ Admin และ Technician
* กำหนดสิทธิ์การเข้าถึงแต่ละส่วนของระบบตาม Role

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

รองรับการเพิ่ม แก้ไข ลบ และค้นหาข้อมูล Machine

### 3. Alarm Management

จัดการข้อมูล Alarm ของเครื่องจักร เช่น

* Machine
* Alarm Code
* Description
* Date / Time
* Cause
* Status

สถานะ Alarm:

* Open
* In Progress
* Closed

รองรับการค้นหาและกรองข้อมูล Alarm

### 4. Maintenance Management

จัดการข้อมูลการบำรุงรักษา เช่น

* Machine
* Maintenance Type
* Problem
* Action Taken
* Technician
* Date
* Status

สถานะ Maintenance:

* Pending
* In Progress
* Completed

### 5. Search & Filter

ระบบรองรับการค้นหาและกรองข้อมูลตามเงื่อนไขต่าง ๆ เช่น

* Machine
* Status
* Alarm Code
* Technician
* Date

### 6. Dashboard

Dashboard แสดงข้อมูลสรุปของระบบ เช่น

* Total Machines
* Running Machines
* Stop Machines
* Alarm Machines
* Maintenance Machines
* Total Alarms
* Total Maintenance

ช่วยให้สามารถดูภาพรวมของสถานะเครื่องจักรและงานบำรุงรักษาได้ง่ายขึ้น

### 7. Input Validation

ระบบมีการตรวจสอบข้อมูลก่อนบันทึก เช่น

* ตรวจสอบ Required Fields
* ตรวจสอบ Machine ID ซ้ำ
* ตรวจสอบ Alarm Code ซ้ำ
* แสดงข้อความแจ้งเตือนเมื่อข้อมูลไม่ถูกต้อง

## Technology Stack

* **Next.js 16**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Supabase**
* **PostgreSQL**
* **GitHub**
* **GitHub Actions**
* **Vercel**
* **AI-assisted Development**

## Database Structure

ระบบใช้ Supabase PostgreSQL เป็นฐานข้อมูลหลัก โดยมีตารางสำคัญดังนี้

### profiles

เก็บข้อมูลผู้ใช้งานและ Role

* id
* email
* role
* created_at

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
* date
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

Workflow จะทำงานดังนี้:

1. Checkout source code
2. Setup Node.js
3. Install dependencies
4. Build Next.js project

Workflow file:

```text
.github/workflows/ci.yml
```

## Deployment

โปรเจกต์ถูก Deploy ด้วย Vercel

### Production URL

https://automation-alarm.vercel.app/

สามารถเปิดระบบผ่าน URL ดังกล่าวเพื่อใช้งาน Web Application ได้

## GitHub Repository

https://github.com/minningminfay-cloud/automation-alarm

## AI Usage

ในการพัฒนาโปรเจกต์นี้มีการใช้ AI เป็นเครื่องมือช่วยในการพัฒนา โดยใช้ในหลายขั้นตอน เช่น

* วิเคราะห์ Requirements จากโจทย์
* ออกแบบโครงสร้างระบบ
* ออกแบบ Database และ Relationships
* ช่วยเขียนและปรับปรุง Source Code
* ออกแบบ UI/UX
* ช่วยเขียน SQL สำหรับ Supabase
* วิเคราะห์และแก้ไข Error
* ตรวจสอบ Validation
* ช่วยตรวจสอบ GitHub Actions และ Deployment
* ช่วยปรับปรุงโครงสร้างและความถูกต้องของโค้ด

AI ถูกใช้เป็นเครื่องมือช่วยในการวิเคราะห์และพัฒนา โดยผู้พัฒนาเป็นผู้ตรวจสอบ ทดสอบ และปรับแก้ผลลัพธ์ก่อนนำไปใช้งาน

## Development

โปรเจกต์มีการพัฒนาและบันทึกการเปลี่ยนแปลงผ่าน Git โดยมี Commit History เพื่อแสดงลำดับการพัฒนาระบบในแต่ละขั้นตอน

## Author

**นางสาววรรณนิภา ศักดิ์พรหม**
**นางสาวแพรวพรรณ ภูมิผิว**
**นางสาวโชติกา พุ่มอ่ำ**

Computer Engineering Student

Rajamangala University of Technology Phra Nakhon
